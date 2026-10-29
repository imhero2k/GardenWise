data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_vpc" "main" {
  cidr_block           = "10.42.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags                 = { Name = "${var.project_name}-vpc" }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${var.project_name}-igw" }
}

resource "aws_subnet" "public" {
  count = 2

  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.42.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  tags                    = { Name = "${var.project_name}-public-${count.index + 1}" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = { Name = "${var.project_name}-public-rt" }
}

resource "aws_route_table_association" "public" {
  count = 2

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Public ALB: port 80 is open to browsers (lab only; use HTTPS in production).
resource "aws_security_group" "alb" {
  name_prefix = "${var.project_name}-alb-"
  description = "Public HTTP traffic to ALB"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP from internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ECS tasks get public IPs to pull GHCR images without a NAT gateway, but
# inbound traffic to frontend/backend is restricted to the ALB security group.
resource "aws_security_group" "frontend" {
  name_prefix = "${var.project_name}-frontend-"
  description = "Frontend traffic only from ALB"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "ALB to frontend"
    from_port       = local.services.frontend.port
    to_port         = local.services.frontend.port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "backend" {
  name_prefix = "${var.project_name}-backend-"
  description = "Backend traffic only from ALB"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "ALB to backend"
    from_port       = local.services.backend.port
    to_port         = local.services.backend.port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}


resource "aws_security_group" "prediction" {
  name        = "${var.project_name}-prediction-sg"
  description = "Security group for prediction service"
  vpc_id      = aws_vpc.main.id

  # Backend ECS task -> Prediction ECS task
  ingress {
    description     = "Backend to prediction"
    from_port       = local.services.prediction.port
    to_port         = local.services.prediction.port
    protocol        = "tcp"
    security_groups = [aws_security_group.backend.id]
  }

  # Application Load Balancer -> Prediction ECS task
  ingress {
    description     = "ALB to WeedScan"
    from_port       = local.services.prediction.port
    to_port         = local.services.prediction.port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "Allow outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
