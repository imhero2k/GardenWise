terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.7"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.7"
    }
  }
}

provider "aws" {
  region     = var.aws_region
  access_key = var.localstack_enabled ? "test" : null
  secret_key = var.localstack_enabled ? "test" : null

  skip_credentials_validation = var.localstack_enabled
  skip_requesting_account_id  = var.localstack_enabled
  skip_metadata_api_check     = var.localstack_enabled
  s3_use_path_style           = var.localstack_enabled

  dynamic "endpoints" {
    for_each = var.localstack_enabled ? [1] : []
    content {
      apigatewayv2 = var.localstack_endpoint
      dynamodb     = var.localstack_endpoint
      ec2          = var.localstack_endpoint
      ecr          = var.localstack_endpoint
      iam          = var.localstack_endpoint
      lambda       = var.localstack_endpoint
      rds          = var.localstack_endpoint
      sts          = var.localstack_endpoint
    }
  }

  default_tags {
    tags = var.tags
  }
}