# GardenWise ECS Fargate

This Terraform root is based on the ECS/Fargate configuration in `gardenwise-infra-backup.zip`. It creates a VPC (`10.42.0.0/16`), two public subnets, an internet-facing ALB, a Fargate cluster with frontend/API/prediction services, CloudWatch log groups, and private Cloud Map discovery for the prediction task.

The services use the GHCR images and ports in [`task.yaml.example`](./task.yaml.example). Copy that file to `task.yaml` and configure the public frontend settings needed by your deployment. `task.yaml` is ignored by Git. Never put private credentials or a database URL in it.

## Deploy the ECS network and services

Configure AWS credentials in your normal AWS profile or environment. Check the GHCR packages and image tags are accessible before enabling services.

```powershell
Copy-Item task.yaml.example task.yaml
Copy-Item terraform.tfvars.example terraform.tfvars
terraform init
terraform fmt -check
terraform validate
terraform plan
terraform apply
```

The example variables enable one task for each service. The tasks use public subnets to pull public GHCR images without a NAT gateway; their inbound access is restricted by security groups, with ALB ingress for frontend/API and ALB plus backend ingress for prediction. The ALB listener is HTTP on port 80; configure TLS before treating this as a production deployment.

Outputs `vpc_id`, `public_subnet_ids`, and `backend_security_group_id` are inputs to the separate PostGIS root. Preserve this root's state; do not copy Terraform state from the backup.

### Private database URL

To supply the backend's `DATABASE_URL`, create a Secrets Manager secret outside this Terraform root and set `backend_database_url_secret_arn` in the ignored `terraform.tfvars`. The task definition references the secret rather than storing its value in the task configuration. When Terraform creates the ECS execution role, it grants `secretsmanager:GetSecretValue` for that secret. If you provide an existing execution role, grant that permission to it yourself. Restrict and encrypt Terraform state because resource metadata and sensitive inputs may be represented there.

The database URL secret is optional at plan time. Without it, Terraform does not configure `DATABASE_URL` in the backend task. Prometheus and application `/metrics` instrumentation are not created by this backup configuration.
