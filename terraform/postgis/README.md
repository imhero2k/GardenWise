# GardenWise private PostgreSQL/PostGIS

This separate Terraform root is based on `other-infra/postgis` in `gardenwise-infra-backup.zip`. It uses the ECS VPC and backend security group, creates isolated database subnets `10.42.20.0/24` and `10.42.21.0/24`, a single-AZ private PostgreSQL/PostGIS RDS instance, and a temporary EC2 loader with Session Manager access.

The database subnet group spans both isolated subnets, but provisions only one database instance. Its route table has no internet default route. RDS accepts PostgreSQL/TLS on TCP 5432 only from the backend and loader security groups.

## Deploy

Apply the ECS root first. From `terraform/ecs-fargate`, record the output values required by the database root. Then:

```powershell
Set-Location ..\postgis
Copy-Item terraform.tfvars.example terraform.tfvars
# Set vpc_id, backend_security_group_id, and public_subnet_id from ECS outputs.
terraform init
terraform fmt -check
terraform validate
terraform plan
terraform apply
```

The populated `terraform.tfvars` is ignored by Git. The generated administrator connection string is a sensitive output intended only for loader/import use; do not use the administrator account for ECS application traffic or publish sensitive output. Use encrypted, access-restricted Terraform state.

The loader uses the generated administrator credentials during import. After importing data, set `create_loader = false` and apply to remove the temporary instance and its generated IAM resources while retaining RDS data. Keep deletion protection enabled unless performing an intentional database teardown.

The PostGIS Terraform root does not create a backend application login or a Secrets Manager secret. Provision a least-privilege application login and its connection URL separately, then provide that URL as a Secrets Manager secret consumed by the ECS backend.
