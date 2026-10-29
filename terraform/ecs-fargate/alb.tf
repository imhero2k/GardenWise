resource "aws_lb" "main" {
  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id
}

resource "aws_lb_target_group" "web" {
  for_each = local.web_services

  name        = "${var.project_name}-${each.key}"
  port        = each.value.port
  protocol    = "HTTP"
  target_type = "ip" # REQUIRED for ECS Fargate (awsvpc networking).
  vpc_id      = aws_vpc.main.id

  health_check {
    enabled             = true
    path                = each.value.health_path
    protocol            = "HTTP"
    matcher             = "200-399"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web["frontend"].arn
  }
}

# ALB does not strip the /api path. Backend must implement /api/health,
# /api/predict, etc. Browsers should call relative URLs such as /api/predict.
resource "aws_lb_listener_rule" "backend" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 10

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web["backend"].arn
  }

  condition {
    path_pattern {
      values = ["/api", "/api/*"]
    }
  }
}
resource "aws_lb_target_group" "prediction" {
  name        = "${var.project_name}-prediction"
  port        = 8080
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = aws_vpc.main.id

  health_check {
    path    = "/health"
    matcher = "200-299"
  }
}

resource "aws_lb_listener_rule" "prediction" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 20

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.prediction.arn
  }

  condition {
    path_pattern {
      values = ["/predict", "/predict/*"]
    }
  }
}
