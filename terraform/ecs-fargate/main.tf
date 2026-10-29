locals {
  # Load this task.yaml at plan time. The AWS provider needs JSON container definitions.
  task_file = fileexists("${path.module}/task.yaml") ? "${path.module}/task.yaml" : "${path.module}/task.yaml.example"
  services  = yamldecode(file(local.task_file)).services

  # Only these two services are exposed through the public load balancer.
  web_services = {
    frontend = local.services.frontend
    backend  = local.services.backend
  }
}

resource "aws_ecs_cluster" "main" {
  name = var.project_name
}

resource "aws_ecr_repository" "service" {
  for_each = local.services

  name                 = "${var.project_name}-${each.key}"
  image_tag_mutability = "MUTABLE"
  force_delete         = true # Lab convenience: permit destroy after pushing images.

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_cloudwatch_log_group" "service" {
  for_each = local.services

  # No retention_in_days: KodeKloud denies logs:PutRetentionPolicy.
  name = "/ecs/${var.project_name}/${each.key}"
}
