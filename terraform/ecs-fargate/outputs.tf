output "ecr_repository_urls" {
  description = "Optional ECR repositories retained for compatibility; ECS images are pulled from GHCR."
  value       = { for name, repo in aws_ecr_repository.service : name => repo.repository_url }
}

output "alb_url" {
  description = "Public URL (HTTP only for this lab). Valid after deploying and health checking services."
  value       = "http://${aws_lb.main.dns_name}"
}

output "backend_health_url" {
  value = "http://${aws_lb.main.dns_name}/api/health"
}

output "prediction_internal_url" {
  value = "http://prediction.${aws_service_discovery_private_dns_namespace.internal.name}:${local.services.prediction.port}"
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "vpc_id" {
  description = "VPC ID for the separate private PostGIS Terraform root."
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs; use one for the temporary database loader."
  value       = aws_subnet.public[*].id
}

output "backend_security_group_id" {
  description = "Backend task security group; RDS ingress is restricted to this group."
  value       = aws_security_group.backend.id
}

output "ecs_service_names" {
  value = [for name, service in aws_ecs_service.app : service.name]
}

output "log_group_names" {
  value = { for name, group in aws_cloudwatch_log_group.service : name => group.name }
}
