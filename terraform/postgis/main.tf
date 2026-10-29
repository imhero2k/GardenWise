data "aws_vpc" "existing" { id = var.vpc_id }
data "aws_subnet" "loader" { id = var.public_subnet_id }
data "aws_security_group" "backend" { id = var.backend_security_group_id }
data "aws_availability_zones" "available" {
  state = "available"
  filter {
    name   = "opt-in-status"
    values = ["opt-in-not-required"]
  }
}

resource "aws_subnet" "database" {
  count                   = 2
  vpc_id                  = var.vpc_id
  cidr_block              = var.database_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = false
  tags                    = { Name = "${var.name}-private-${count.index + 1}" }
}

# Only the automatic VPC-local route: no IGW or NAT default route.
resource "aws_route_table" "database" {
  vpc_id = var.vpc_id
  tags   = { Name = "${var.name}-isolated" }
}
resource "aws_route_table_association" "database" {
  count          = 2
  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.database.id
}
resource "aws_db_subnet_group" "database" {
  name       = "${var.name}-private"
  subnet_ids = aws_subnet.database[*].id
}

resource "aws_security_group" "database" {
  name_prefix = "${var.name}-rds-"
  description = "PostgreSQL from backend tasks and temporary loader only"
  vpc_id      = var.vpc_id
}
resource "aws_vpc_security_group_ingress_rule" "backend" {
  security_group_id            = aws_security_group.database.id
  referenced_security_group_id = var.backend_security_group_id
  ip_protocol                  = "tcp"
  from_port                    = 5432
  to_port                      = 5432
  lifecycle {
    precondition {
      condition     = data.aws_security_group.backend.vpc_id == var.vpc_id
      error_message = "Backend security group must be in the existing VPC."
    }
  }
}
resource "aws_security_group" "loader" {
  count       = var.create_loader ? 1 : 0
  name_prefix = "${var.name}-loader-"
  description = "SSM access; no inbound rules or SSH"
  vpc_id      = var.vpc_id
  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }
}
resource "aws_vpc_security_group_ingress_rule" "loader" {
  count                        = var.create_loader ? 1 : 0
  security_group_id            = aws_security_group.database.id
  referenced_security_group_id = aws_security_group.loader[0].id
  ip_protocol                  = "tcp"
  from_port                    = 5432
  to_port                      = 5432
}

resource "random_password" "admin" {
  length  = 32
  special = false
}
resource "aws_db_instance" "database" {
  identifier                 = var.name
  engine                     = "postgres"
  engine_version             = var.postgres_major_version
  instance_class             = var.db_instance_class
  allocated_storage          = 20
  storage_type               = "gp3"
  storage_encrypted          = true
  db_name                    = "gardenwise"
  username                   = "gardenwise_admin"
  password                   = random_password.admin.result
  port                       = 5432
  publicly_accessible        = false
  multi_az                   = false
  db_subnet_group_name       = aws_db_subnet_group.database.name
  vpc_security_group_ids     = [aws_security_group.database.id]
  backup_retention_period    = 7
  auto_minor_version_upgrade = true
  deletion_protection        = var.deletion_protection
  skip_final_snapshot        = var.skip_final_snapshot
  final_snapshot_identifier  = var.skip_final_snapshot ? null : var.final_snapshot_identifier
  copy_tags_to_snapshot      = true
  depends_on                 = [aws_route_table_association.database]
}

locals {
  create_loader_role = var.create_loader && var.loader_instance_profile_name == null
}
resource "aws_iam_role" "loader" {
  count       = local.create_loader_role ? 1 : 0
  name_prefix = "${var.name}-loader-"
  assume_role_policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [{ Effect = "Allow", Action = "sts:AssumeRole", Principal = { Service = "ec2.amazonaws.com" } }]
  })
}
resource "aws_iam_role_policy_attachment" "loader_ssm" {
  count      = local.create_loader_role ? 1 : 0
  role       = aws_iam_role.loader[0].name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}
resource "aws_iam_instance_profile" "loader" {
  count       = local.create_loader_role ? 1 : 0
  name_prefix = "${var.name}-loader-"
  role        = aws_iam_role.loader[0].name
}
data "aws_ssm_parameter" "al2023" {
  count = var.create_loader ? 1 : 0
  name  = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"
}
resource "aws_instance" "loader" {
  count                       = var.create_loader ? 1 : 0
  ami                         = data.aws_ssm_parameter.al2023[0].value
  instance_type               = var.loader_instance_type
  subnet_id                   = var.public_subnet_id
  associate_public_ip_address = true
  vpc_security_group_ids      = [aws_security_group.loader[0].id]
  iam_instance_profile        = local.create_loader_role ? aws_iam_instance_profile.loader[0].name : var.loader_instance_profile_name
  user_data_replace_on_change = true
  user_data_base64 = base64gzip(templatefile("${path.module}/loader/bootstrap.sh.tftpl", {
    files = { for name in ["schema.sql", "init_db.py", "load_repo_data.py", "copy_from_existing.py"] : name => filebase64("${path.module}/loader/${name}") }
  }))
  metadata_options {
    http_tokens = "required"
  }
  root_block_device {
    volume_size           = 12
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = true
  }
  tags = { Name = "${var.name}-temporary-loader" }
  lifecycle {
    precondition {
      condition     = data.aws_subnet.loader.vpc_id == var.vpc_id
      error_message = "The loader subnet must be in the existing ECS VPC."
    }
  }
  depends_on = [aws_iam_role_policy_attachment.loader_ssm]
}
