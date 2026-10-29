resource "aws_ecs_task_definition" "app" {
  for_each = local.services

  family                   = "${var.project_name}-${each.key}"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = tostring(each.value.cpu)
  memory                   = tostring(each.value.memory)
  execution_role_arn       = local.ecs_execution_role_arn

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }

  container_definitions = jsonencode([
    {
      name      = each.key
      image     = each.value.image
      essential = true

      portMappings = [
        {
          containerPort = each.value.port
          protocol      = "tcp"
        }
      ]

      environment = [
        for k, v in merge(
          try(each.value.environment, {}),
          each.key == "backend" ? {
            PREDICTION_URL = "http://prediction.${aws_service_discovery_private_dns_namespace.internal.name}:${local.services.prediction.port}"
          } : {}
          ) : {
          name  = k
          value = tostring(v)
        }
      ]

      secrets = each.key == "backend" && var.backend_database_url_secret_arn != null ? [
        {
          name      = "DATABASE_URL"
          valueFrom = var.backend_database_url_secret_arn
        }
      ] : []

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.service[each.key].name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])
}

# Create services when deploy_services=true; images are pulled from public GHCR packages.
# With 3 tasks allowed in the playground, stop-before-start upgrades mean downtime.
resource "aws_ecs_service" "app" {
  for_each = { for name, config in local.services : name => config if var.deploy_services }

  name            = "${var.project_name}-${each.key}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app[each.key].arn
  desired_count   = 1
  launch_type     = "FARGATE"

  deployment_minimum_healthy_percent = 0
  deployment_maximum_percent         = 100

  # An ALB needs time to start checking the frontend/backend containers.
  health_check_grace_period_seconds = each.key == "prediction" ? null : 60

  network_configuration {
    subnets = aws_subnet.public[*].id
    security_groups = [
      each.key == "frontend" ? aws_security_group.frontend.id :
      each.key == "backend" ? aws_security_group.backend.id :
      aws_security_group.prediction.id
    ]
    assign_public_ip = true # Pull public GHCR images without NAT; SG restricts inbound.
  }
  dynamic "load_balancer" {
    for_each = [1]

    content {
      target_group_arn = (
        each.key == "prediction"
        ? aws_lb_target_group.prediction.arn
        : aws_lb_target_group.web[each.key].arn
      )

      container_name = each.key
      container_port = each.value.port
    }
  }

  dynamic "service_registries" {
    for_each = each.key == "prediction" ? [1] : []
    content {
      registry_arn = aws_service_discovery_service.prediction.arn
    }
  }

  # Ensure execution-role permissions and ALB listener exist before service start.
  depends_on = [
    aws_iam_role_policy_attachment.ecs_execution,
    aws_lb_listener.http,
    aws_lb_listener_rule.backend
  ]
}
