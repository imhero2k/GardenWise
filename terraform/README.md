# GardenWise Terraform

This starter provisions:

- The DynamoDB table required by `server/plannerLayoutDynamo.mjs`.
- An ECR repository for the `lambda_weedscan` container.
- The weed-scan Lambda when `lambda_image_uri` is provided.
- A zip-deployed Node API Lambda when `api_lambda_enabled` is true.
- An HTTP API Gateway in front of the API Lambda when either API Lambda option is enabled.
- A private PostgreSQL RDS instance and VPC networking when `rds_enabled` is true.

## Usage

```sh
cd terraform
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform plan
terraform apply
```

## LocalStack

With LocalStack running on `http://127.0.0.1:4566`, apply the complete local stack with fake AWS credentials:

```sh
terraform init
terraform apply -auto-approve \
	-var='localstack_enabled=true' \
	-var='api_lambda_enabled=true' \
	-var='rds_enabled=true' \
	-var='lambda_image_uri=null'
```

The local API is available through the LocalStack hostname shown by `terraform output -raw api_gateway_url`; use the `execute-api.localhost.localstack.cloud:4566` hostname form. For example:

```sh
curl http://32f269b9.execute-api.localhost.localstack.cloud:4566/api/health
```

LocalStack's RDS API is only a control-plane emulation; it does not run PostgreSQL. For real local database queries, run PostGIS separately and pass its connection string as `api_database_url_override`:

```sh
docker run --name gardenwise-postgres -d \
	-e POSTGRES_DB=gardenwise \
	-e POSTGRES_USER=gardenwise \
	-e POSTGRES_PASSWORD=gardenwise \
	-p 5432:5432 postgis/postgis:16-3.4

terraform apply -auto-approve \
	-var='localstack_enabled=true' \
	-var='api_lambda_enabled=true' \
	-var='rds_enabled=true' \
	-var='api_database_url_override=postgresql://gardenwise:gardenwise@host.docker.internal:15432/gardenwise' \
	-var='api_database_ssl=0'
```

Before importing repository datasets, restore Git LFS files from the repository root:

```sh
brew install git-lfs
git lfs install
git lfs pull
```

The restored `database/plant.csv`, `database/bioregion.csv`, and `database/bioregion_plant.csv` can then be loaded with client-side `\copy` commands. The current repository does not contain the advisory weed CSV referenced by `database/etl.py`; add that source file before importing `weed_info`. Without it, recommendation and plant-detail routes work, but weed-specific routes return empty results.

LocalStack may report harmless refresh drift for the emulated RDS port and security-group IDs. The real AWS plan is unaffected when `localstack_enabled` is false.

The AWS credentials used by Terraform must already be configured in your shell or AWS profile. Do not put database URLs, Firebase service accounts, or API keys in Terraform variables. Supply those to the API runtime through its secret manager or deployment environment.

Build and push the Lambda image before enabling the function:

```sh
aws_account_id=$(aws sts get-caller-identity --query Account --output text)
aws_region=ap-southeast-2
repository=$(terraform output -raw weedscan_ecr_repository_url)

aws ecr get-login-password --region "$aws_region" | docker login --username AWS --password-stdin "${aws_account_id}.dkr.ecr.${aws_region}.amazonaws.com"
docker build -f ../lambda_weedscan/Dockerfile -t "$repository:latest" ../lambda_weedscan
docker push "$repository:latest"
```

Then set `lambda_image_uri` in `terraform.tfvars` to the pushed image URI and run `terraform apply` again.

## API Lambda and API Gateway

Set `api_lambda_enabled = true` to package `server/lambda.mjs` and its production dependencies into `lambda-build/api.zip`, then deploy it with Terraform:

```hcl
api_lambda_enabled = true
api_lambda_arn     = null
```

Terraform runs `npm ci --omit=dev`, creates the Node.js 24 Lambda, and connects API Gateway to it. The archive is built locally and is ignored by Git.

Alternatively, deploy the Node API Lambda separately and set its Lambda **invoke ARN**:

```hcl
api_lambda_enabled = false
api_lambda_arn     = "arn:aws:lambda:ap-southeast-1:123456789012:function:gardenwise-api"
api_cors_origins = ["https://your-frontend.example.com"]
```

Run `terraform apply`, then retrieve the URL with:

```sh
terraform output -raw api_gateway_url
```

The HTTP API uses a `$default` route, so paths such as `/api/health` are forwarded to the Express Lambda. Configure the Lambda environment with `DATABASE_URL`, `DYNAMODB_PLANNER_LAYOUT_TABLE`, `CORS_ORIGIN`, and Firebase/PlantNet secrets through your deployment secret mechanism.

## PostgreSQL RDS

Set `rds_enabled = true` to provision an encrypted private PostgreSQL 16 instance. When `api_lambda_enabled` is also true, the API Lambda is placed in the private subnets and receives the generated `DATABASE_URL` automatically. A single NAT gateway provides the Lambda outbound access needed for Firebase and PlantNet; it has an ongoing AWS cost.

After RDS is available, apply the schema and load the data from a machine that can reach the VPC, such as a bastion, VPN-connected host, or temporary migration job:

```sh
terraform output -raw rds_endpoint
terraform output -raw rds_database_url
psql "$(terraform output -raw rds_database_url)" -f ../database/create\ table.sql
```

The schema enables PostGIS. The local `COPY` path in `database/create table.sql` must be removed or replaced with a client-side `\copy` command for RDS, because the RDS server cannot read files from your Mac. The generated master password is stored in Terraform state, so use encrypted remote state with restricted access.