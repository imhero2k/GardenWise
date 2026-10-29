# Internal DNS is resolvable ONLY inside the VPC.
# Backend will reach prediction using http://prediction.prediction-lab.internal:8080.
resource "aws_service_discovery_private_dns_namespace" "internal" {
  provider = aws.untagged

  name = "${var.project_name}.internal"
  vpc  = aws_vpc.main.id
}

resource "aws_service_discovery_service" "prediction" {
  provider = aws.untagged

  name = "prediction"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.internal.id

    dns_records {
      ttl  = 10
      type = "A" # Resolves the prediction task's private IP.
    }

    routing_policy = "MULTIVALUE"
  }

  # ECS updates instance health based on the task state/health checks.

}
