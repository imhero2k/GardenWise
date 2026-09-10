variable "aws_region" {
  description = "AWS region for GardenWise resources."
  type        = string
  default     = "ap-southeast-1"
}

variable "localstack_enabled" {
  description = "Use the local LocalStack endpoint instead of AWS."
  type        = bool
  default     = false
}

variable "localstack_endpoint" {
  description = "LocalStack edge endpoint."
  type        = string
  default     = "http://127.0.0.1:4566"
}

variable "project_name" {
  description = "Prefix used for resource names."
  type        = string
  default     = "gardenwise"
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
  default     = "dev"
}

variable "lambda_image_uri" {
  description = "Optional full ECR image URI for the weed-scan Lambda."
  type        = string
  default     = null
  nullable    = true
}

variable "api_lambda_arn" {
  description = "Optional invoke ARN of an externally deployed API Lambda. Leave null to use the zip-deployed Lambda."
  type        = string
  default     = null
  nullable    = true
}

variable "api_lambda_enabled" {
  description = "Build and deploy server/lambda.mjs as a zip Lambda."
  type        = bool
  default     = false
}

variable "api_cors_origins" {
  description = "Allowed browser origins for the HTTP API."
  type        = list(string)
  default     = ["http://localhost:5173"]
}

variable "rds_enabled" {
  description = "Provision a private PostgreSQL RDS instance and networking."
  type        = bool
  default     = false
}

variable "rds_database_name" {
  description = "Initial PostgreSQL database name."
  type        = string
  default     = "gardenwise"
}

variable "rds_master_username" {
  description = "PostgreSQL master username."
  type        = string
  default     = "gardenwise_admin"
}

variable "rds_instance_class" {
  description = "RDS instance class."
  type        = string
  default     = "db.t4g.micro"
}

variable "rds_allocated_storage" {
  description = "Initial RDS storage in GiB."
  type        = number
  default     = 20
}

variable "rds_ingress_cidr_blocks" {
  description = "Optional CIDR blocks allowed to connect to PostgreSQL on port 5432, for example a VPN or migration host."
  type        = list(string)
  default     = []
}

variable "api_database_url_override" {
  description = "Optional DATABASE_URL override for local development or an externally managed database."
  type        = string
  default     = null
  nullable    = true
  sensitive   = true
}

variable "api_database_ssl" {
  description = "Set to 0 for a plain local PostgreSQL connection; leave null to use the API default TLS behavior."
  type        = string
  default     = null
  nullable    = true
}

variable "tags" {
  description = "Tags applied to all supported resources."
  type        = map(string)
  default = {
    ManagedBy = "terraform"
    Project   = "gardenwise"
  }
}