output "planner_layout_table_name" {
  description = "Set DYNAMODB_PLANNER_LAYOUT_TABLE to this value for the API runtime."
  value       = aws_dynamodb_table.planner_layout.name
}

output "weedscan_ecr_repository_url" {
  description = "Push the Lambda container image to this ECR repository."
  value       = aws_ecr_repository.weedscan.repository_url
}

output "weedscan_lambda_name" {
  description = "Deployed Lambda name, when lambda_image_uri is supplied."
  value       = try(aws_lambda_function.weedscan[0].function_name, null)
}

output "weedscan_api_gateway_url" {
  description = "Weed prediction API URL, when the weed-scan Lambda is enabled."
  value       = try(aws_apigatewayv2_stage.weedscan[0].invoke_url, null)
}

output "api_gateway_url" {
  description = "Public API URL, when api_lambda_arn is supplied."
  value       = try(aws_apigatewayv2_stage.api_default[0].invoke_url, null)
}

output "api_lambda_name" {
  description = "Zip-deployed API Lambda name, when api_lambda_enabled is true."
  value       = try(aws_lambda_function.api[0].function_name, null)
}

output "rds_endpoint" {
  description = "Private PostgreSQL endpoint, when rds_enabled is true."
  value       = try(aws_db_instance.postgres[0].address, null)
}

output "rds_database_url" {
  description = "Connection URL for DATABASE_URL. Treat this output as sensitive."
  value       = local.rds_database_url
  sensitive   = true
}

output "api_database_url_source" {
  description = "Whether the API Lambda uses an override or the Terraform-managed RDS URL."
  value       = var.api_database_url_override != null ? "override" : "rds"
  sensitive   = true
}