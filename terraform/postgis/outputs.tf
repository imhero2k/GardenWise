output "rds_hostname" { value = aws_db_instance.database.address }
output "rds_security_group_id" { value = aws_security_group.database.id }
output "private_subnet_ids" { value = aws_subnet.database[*].id }
output "loader_instance_id" { value = try(aws_instance.loader[0].id, null) }
output "admin_database_url" {
  description = "For EC2 import only. Never use this administrative login in ECS."
  value       = "postgresql://gardenwise_admin:${urlencode(random_password.admin.result)}@${aws_db_instance.database.address}:5432/gardenwise?sslmode=require"
  sensitive   = true
}
