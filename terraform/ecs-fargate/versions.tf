terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0, < 7.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project   = var.project_name
      ManagedBy = "Terraform"
      Purpose   = "KodeKloud ECS practice"
    }
  }
}

# Cloud Map cannot be tagged by restricted KodeKloud IAM users.
# Keep this alias tag-free; explicitly use it on BOTH Cloud Map resources.
provider "aws" {
  alias  = "untagged"
  region = var.aws_region
}
