# If your KodeKloud identity cannot create IAM roles, pass an existing role
# with -var='execution_role_arn=arn:aws:iam::ACCOUNT:role/ROLE_NAME'.
# An execution role needs AmazonECSTaskExecutionRolePolicy permissions.

data "aws_iam_policy_document" "ecs_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ecs_execution" {
  count = var.execution_role_arn == null ? 1 : 0

  name               = "${var.project_name}-ecs-execution"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume_role.json
}

resource "aws_iam_role_policy_attachment" "ecs_execution" {
  count = var.execution_role_arn == null ? 1 : 0

  role       = aws_iam_role.ecs_execution[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "backend_database_secret" {
  count = var.execution_role_arn == null && var.backend_database_url_secret_arn != null ? 1 : 0

  name = "${var.project_name}-backend-database-secret"
  role = aws_iam_role.ecs_execution[0].id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["secretsmanager:GetSecretValue"]
      Resource = var.backend_database_url_secret_arn
    }]
  })
}

locals {
  ecs_execution_role_arn = var.execution_role_arn != null ? var.execution_role_arn : aws_iam_role.ecs_execution[0].arn
}
