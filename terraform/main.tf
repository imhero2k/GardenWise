locals {
  name                  = "${var.project_name}-${var.environment}"
  api_gateway_on        = var.api_lambda_enabled || var.api_lambda_arn != null
  api_lambda_arn        = var.api_lambda_enabled ? aws_lambda_function.api[0].invoke_arn : var.api_lambda_arn
  rds_database_url      = var.rds_enabled ? "postgresql://${var.rds_master_username}:${urlencode(random_password.rds[0].result)}@${aws_db_instance.postgres[0].address}:5432/${var.rds_database_name}?sslmode=require" : null
  api_database_url      = var.api_database_url_override != null ? var.api_database_url_override : local.rds_database_url
  private_subnet_ids    = var.rds_enabled ? aws_subnet.private[*].id : []
  lambda_security_group = var.rds_enabled && var.api_lambda_enabled ? aws_security_group.lambda[0].id : null
}

resource "aws_vpc" "main" {
  count                = var.rds_enabled ? 1 : 0
  cidr_block           = "10.42.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
}

data "aws_availability_zones" "available" {
  count = var.rds_enabled ? 1 : 0
  state = "available"
  filter {
    name   = "opt-in-status"
    values = ["opt-in-not-required"]
  }
}

resource "aws_internet_gateway" "main" {
  count  = var.rds_enabled ? 1 : 0
  vpc_id = aws_vpc.main[0].id
}

resource "aws_subnet" "public" {
  count                   = var.rds_enabled ? 2 : 0
  vpc_id                  = aws_vpc.main[0].id
  cidr_block              = "10.42.${count.index}.0/24"
  availability_zone       = data.aws_availability_zones.available[0].names[count.index]
  map_public_ip_on_launch = true
}

resource "aws_subnet" "private" {
  count             = var.rds_enabled ? 2 : 0
  vpc_id            = aws_vpc.main[0].id
  cidr_block        = "10.42.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available[0].names[count.index]
}

resource "aws_route_table" "public" {
  count  = var.rds_enabled ? 1 : 0
  vpc_id = aws_vpc.main[0].id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main[0].id
  }
}

resource "aws_route_table_association" "public" {
  count          = var.rds_enabled ? 2 : 0
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public[0].id
}

resource "aws_eip" "nat" {
  count  = var.rds_enabled ? 1 : 0
  domain = "vpc"
}

resource "aws_nat_gateway" "main" {
  count         = var.rds_enabled ? 1 : 0
  allocation_id = aws_eip.nat[0].id
  subnet_id     = aws_subnet.public[0].id
  depends_on    = [aws_internet_gateway.main]
}

resource "aws_route_table" "private" {
  count  = var.rds_enabled ? 1 : 0
  vpc_id = aws_vpc.main[0].id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[0].id
  }
}

resource "aws_route_table_association" "private" {
  count          = var.rds_enabled ? 2 : 0
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[0].id
}

resource "aws_security_group" "lambda" {
  count  = var.rds_enabled && var.api_lambda_enabled ? 1 : 0
  name   = "${local.name}-lambda"
  vpc_id = aws_vpc.main[0].id
  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "rds" {
  count  = var.rds_enabled ? 1 : 0
  name   = "${local.name}-rds"
  vpc_id = aws_vpc.main[0].id
  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_vpc_security_group_ingress_rule" "rds_lambda" {
  count                        = var.rds_enabled && var.api_lambda_enabled ? 1 : 0
  security_group_id            = aws_security_group.rds[0].id
  referenced_security_group_id = aws_security_group.lambda[0].id
  from_port                    = 5432
  to_port                      = 5432
  ip_protocol                  = "tcp"
}

resource "aws_vpc_security_group_ingress_rule" "rds_cidr" {
  for_each = var.rds_enabled ? toset(var.rds_ingress_cidr_blocks) : toset([])

  security_group_id = aws_security_group.rds[0].id
  cidr_ipv4         = each.value
  from_port         = 5432
  to_port           = 5432
  ip_protocol       = "tcp"
}

resource "random_password" "rds" {
  count   = var.rds_enabled ? 1 : 0
  length  = 32
  special = false
}

resource "aws_db_subnet_group" "postgres" {
  count      = var.rds_enabled ? 1 : 0
  name       = "${local.name}-postgres"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_db_instance" "postgres" {
  count                   = var.rds_enabled ? 1 : 0
  identifier              = "${local.name}-postgres"
  engine                  = "postgres"
  engine_version          = "16.4"
  instance_class          = var.rds_instance_class
  allocated_storage       = var.rds_allocated_storage
  storage_type            = "gp3"
  storage_encrypted       = true
  db_name                 = var.rds_database_name
  username                = var.rds_master_username
  password                = random_password.rds[0].result
  port                    = 5432
  db_subnet_group_name    = aws_db_subnet_group.postgres[0].name
  vpc_security_group_ids  = [aws_security_group.rds[0].id]
  publicly_accessible     = false
  skip_final_snapshot     = true
  backup_retention_period = 7
}

resource "terraform_data" "api_lambda_build" {
  count = var.api_lambda_enabled ? 1 : 0

  triggers_replace = [
    filesha256("${path.module}/main.tf"),
    filesha256("${path.module}/../package.json"),
    filesha256("${path.module}/../package-lock.json"),
    sha256(join("", [
      for file in fileset("${path.module}/../server", "**") : filesha256("${path.module}/../server/${file}")
    ])),
  ]

  provisioner "local-exec" {
    working_dir = path.module
    command     = <<-EOT
      set -eu
      rm -rf ../lambda-build
      mkdir -p ../lambda-build
      cp -R ../server ../lambda-build/server
      cp ../package.json ../package-lock.json ../lambda-build/
      cd ../lambda-build
      node -e 'const fs=require("fs");const p=JSON.parse(fs.readFileSync("package.json"));const d=p.dependencies;p.dependencies={"@aws-sdk/client-dynamodb":d["@aws-sdk/client-dynamodb"],"@aws-sdk/lib-dynamodb":d["@aws-sdk/lib-dynamodb"],"@vendia/serverless-express":d["@vendia/serverless-express"],cors:d.cors,express:d.express,"firebase-admin":d["firebase-admin"],pg:d.pg};delete p.devDependencies;fs.writeFileSync("package.json",JSON.stringify(p))'
      npm install --omit=dev --ignore-scripts --package-lock=false
      rm -f package.json package-lock.json
    EOT
  }
}

data "archive_file" "api_lambda" {
  count       = var.api_lambda_enabled ? 1 : 0
  type        = "zip"
  source_dir  = "${path.module}/../lambda-build"
  output_path = "${path.module}/../lambda-build/api.zip"
  depends_on  = [terraform_data.api_lambda_build]
}

resource "aws_iam_role" "api_lambda" {
  count = var.api_lambda_enabled ? 1 : 0
  name  = "${local.name}-api-lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "api_lambda_logs" {
  count      = var.api_lambda_enabled ? 1 : 0
  role       = aws_iam_role.api_lambda[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "api_lambda_dynamodb" {
  count = var.api_lambda_enabled ? 1 : 0
  name  = "${local.name}-api-dynamodb"
  role  = aws_iam_role.api_lambda[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
      ]
      Resource = aws_dynamodb_table.planner_layout.arn
    }]
  })
}

resource "aws_lambda_function" "api" {
  count = var.api_lambda_enabled ? 1 : 0

  function_name    = "${local.name}-api"
  role             = aws_iam_role.api_lambda[0].arn
  handler          = "server/lambda.handler"
  runtime          = "nodejs24.x"
  filename         = data.archive_file.api_lambda[0].output_path
  source_code_hash = data.archive_file.api_lambda[0].output_base64sha256
  timeout          = 30
  memory_size      = 1024

  environment {
    variables = {
      AWS_REGION                    = var.aws_region
      DATABASE_URL                  = local.api_database_url
      DATABASE_SSL                  = var.api_database_ssl
      DYNAMODB_PLANNER_LAYOUT_TABLE = aws_dynamodb_table.planner_layout.name
    }
  }

  dynamic "vpc_config" {
    for_each = var.rds_enabled ? [1] : []
    content {
      subnet_ids         = local.private_subnet_ids
      security_group_ids = [local.lambda_security_group]
    }
  }
}

resource "aws_apigatewayv2_api" "api" {
  count         = local.api_gateway_on ? 1 : 0
  name          = "${local.name}-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_headers = ["authorization", "content-type"]
    allow_methods = ["GET", "POST", "PUT", "OPTIONS"]
    allow_origins = var.api_cors_origins
  }
}

resource "aws_apigatewayv2_integration" "api_lambda" {
  count                  = local.api_gateway_on ? 1 : 0
  api_id                 = aws_apigatewayv2_api.api[0].id
  integration_type       = "AWS_PROXY"
  integration_uri        = local.api_lambda_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "api_default" {
  count     = local.api_gateway_on ? 1 : 0
  api_id    = aws_apigatewayv2_api.api[0].id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.api_lambda[0].id}"
}

resource "aws_apigatewayv2_stage" "api_default" {
  count       = local.api_gateway_on ? 1 : 0
  api_id      = aws_apigatewayv2_api.api[0].id
  name        = "$default"
  auto_deploy = true
}

resource "aws_lambda_permission" "api_gateway" {
  count         = var.api_lambda_enabled ? 1 : 0
  statement_id  = "AllowExecutionFromApiGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api[0].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api[0].execution_arn}/*/*"
}

resource "aws_dynamodb_table" "planner_layout" {
  name         = "${local.name}-planner-layout"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"
  range_key    = "layoutId"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "layoutId"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }
}

resource "aws_ecr_repository" "weedscan" {
  name                 = "${local.name}-weedscan"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_iam_role" "weedscan_lambda" {
  count = var.lambda_image_uri == null ? 0 : 1
  name  = "${local.name}-weedscan-lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "weedscan_logs" {
  count      = var.lambda_image_uri == null ? 0 : 1
  role       = aws_iam_role.weedscan_lambda[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "weedscan_ecr_read_only" {
  count      = var.lambda_image_uri == null ? 0 : 1
  role       = aws_iam_role.weedscan_lambda[0].name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

resource "aws_lambda_function" "weedscan" {
  count = var.lambda_image_uri == null ? 0 : 1

  function_name = "${local.name}-weedscan"
  role          = aws_iam_role.weedscan_lambda[0].arn
  package_type  = "Image"
  image_uri     = var.lambda_image_uri
  timeout       = 60
  memory_size   = 2048

  environment {
    variables = {
      DYNAMODB_PLANNER_LAYOUT_TABLE = aws_dynamodb_table.planner_layout.name
      AWS_REGION                    = var.aws_region
    }
  }
}

resource "aws_apigatewayv2_api" "weedscan" {
  count         = var.lambda_image_uri == null ? 0 : 1
  name          = "${local.name}-weedscan-api"
  protocol_type = "HTTP"
  cors_configuration {
    allow_headers = ["content-type"]
    allow_methods = ["POST", "OPTIONS"]
    allow_origins = var.api_cors_origins
  }
}

resource "aws_apigatewayv2_integration" "weedscan" {
  count                  = var.lambda_image_uri == null ? 0 : 1
  api_id                 = aws_apigatewayv2_api.weedscan[0].id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.weedscan[0].invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "weedscan" {
  count     = var.lambda_image_uri == null ? 0 : 1
  api_id    = aws_apigatewayv2_api.weedscan[0].id
  route_key = "POST /testing/predict"
  target    = "integrations/${aws_apigatewayv2_integration.weedscan[0].id}"
}

resource "aws_apigatewayv2_stage" "weedscan" {
  count       = var.lambda_image_uri == null ? 0 : 1
  api_id      = aws_apigatewayv2_api.weedscan[0].id
  name        = "$default"
  auto_deploy = true
}

resource "aws_lambda_permission" "weedscan_api_gateway" {
  count         = var.lambda_image_uri == null ? 0 : 1
  statement_id  = "AllowExecutionFromWeedscanApiGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.weedscan[0].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.weedscan[0].execution_arn}/*/*"
}