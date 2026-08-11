#!/usr/bin/env bash
# Deploy GardenWise to LocalStack EKS (embedded k3d).
#
# Prereqs: LocalStack running (Student/Pro with EKS), kubectl, docker, aws CLI
# Usage:   ./scripts/deploy-localstack-eks.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-test}"
export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-test}"
export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-ap-southeast-2}"
export AWS_EC2_METADATA_DISABLED=true
ENDPOINT="${LOCALSTACK_ENDPOINT:-http://localhost:4566}"
CLUSTER="${EKS_CLUSTER_NAME:-gardenwise}"
NODEGROUP="${EKS_NODEGROUP_NAME:-gardenwise-nodes}"

aws_ls() {
  aws --endpoint-url="$ENDPOINT" --region "$AWS_DEFAULT_REGION" "$@"
}

echo "==> Ensure images exist"
docker image inspect gardenwise-api:latest >/dev/null 2>&1 || \
  docker build -f Dockerfile.api -t gardenwise-api:latest .
docker image inspect gardenwise-web:latest >/dev/null 2>&1 || \
  docker build -t gardenwise-web:latest .

echo "==> Resolve VPC / subnets (reuse LocalStack defaults if present)"
VPC_ID="$(aws_ls ec2 describe-vpcs --query 'Vpcs[0].VpcId' --output text)"
SUBNETS="$(aws_ls ec2 describe-subnets --query 'Subnets[].SubnetId' --output text | tr '\t' ' ')"
SUBNET_ARR=($SUBNETS)
if [[ -z "$VPC_ID" || "$VPC_ID" == "None" || ${#SUBNET_ARR[@]} -lt 1 ]]; then
  echo "Creating VPC + subnets..."
  VPC_ID="$(aws_ls ec2 create-vpc --cidr-block 10.10.0.0/16 --query 'Vpc.VpcId' --output text)"
  S1="$(aws_ls ec2 create-subnet --vpc-id "$VPC_ID" --cidr-block 10.10.1.0/24 --availability-zone "${AWS_DEFAULT_REGION}a" --query 'Subnet.SubnetId' --output text)"
  S2="$(aws_ls ec2 create-subnet --vpc-id "$VPC_ID" --cidr-block 10.10.2.0/24 --availability-zone "${AWS_DEFAULT_REGION}b" --query 'Subnet.SubnetId' --output text)"
  SUBNET_ARR=("$S1" "$S2")
fi
echo "VPC=$VPC_ID SUBNETS=${SUBNET_ARR[*]}"

echo "==> Create EKS cluster (if missing)"
if ! aws_ls eks describe-cluster --name "$CLUSTER" >/dev/null 2>&1; then
  SUBNET_JSON="$(printf '%s\n' "${SUBNET_ARR[@]}" | /usr/bin/python3 -c 'import sys,json; print(json.dumps({"subnetIds":[l.strip() for l in sys.stdin if l.strip()]}))')"
  aws_ls eks create-cluster \
    --name "$CLUSTER" \
    --role-arn "arn:aws:iam::000000000000:role/eks-role" \
    --resources-vpc-config "$SUBNET_JSON"
fi

echo "==> Wait for cluster ACTIVE"
aws_ls eks wait cluster-active --name "$CLUSTER"
aws_ls eks describe-cluster --name "$CLUSTER" --query 'cluster.status' --output text

echo "==> Create node group (if missing)"
if ! aws_ls eks describe-nodegroup --cluster-name "$CLUSTER" --nodegroup-name "$NODEGROUP" >/dev/null 2>&1; then
  aws_ls eks create-nodegroup \
    --cluster-name "$CLUSTER" \
    --nodegroup-name "$NODEGROUP" \
    --node-role "arn:aws:iam::000000000000:role/eks-nodegroup-role" \
    --subnets "${SUBNET_ARR[@]}" \
    --scaling-config desiredSize=1,minSize=1,maxSize=2
fi
aws_ls eks wait nodegroup-active --cluster-name "$CLUSTER" --nodegroup-name "$NODEGROUP" || true

echo "==> Configure kubectl"
aws_ls eks update-kubeconfig --name "$CLUSTER"
kubectl config use-context "arn:aws:eks:${AWS_DEFAULT_REGION}:000000000000:cluster/${CLUSTER}" || true

echo "==> Import images into k3d cluster"
# LocalStack names the k3d cluster after the EKS cluster name
K3D_NAME="$CLUSTER"
if command -v k3d >/dev/null 2>&1; then
  k3d image import gardenwise-api:latest gardenwise-web:latest -c "$K3D_NAME" || \
    k3d image import gardenwise-api:latest gardenwise-web:latest -c "k3d-$K3D_NAME" || true
else
  # Fallback: save/load via the k3d node container
  NODE="$(docker ps --format '{{.Names}}' | /usr/bin/grep -E "k3d-${K3D_NAME}.*server|k3d-${K3D_NAME}.*agent" | /usr/bin/head -1 || true)"
  if [[ -n "$NODE" ]]; then
    echo "Loading images into $NODE via docker save/ctr..."
    docker save gardenwise-api:latest gardenwise-web:latest | docker exec -i "$NODE" ctr images import -
  else
    echo "WARN: could not find k3d node; pods may fail ImagePull if imagePullPolicy is not Never/IfNotPresent on same docker"
  fi
fi

echo "==> Apply manifests"
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/dynamodb.yaml
kubectl apply -f k8s/api.yaml
kubectl apply -f k8s/web.yaml

echo "==> Wait for rollouts"
kubectl -n gardenwise rollout status deploy/dynamodb --timeout=180s
kubectl -n gardenwise wait --for=condition=complete job/dynamodb-init --timeout=180s || true
kubectl -n gardenwise rollout status deploy/api --timeout=180s
kubectl -n gardenwise rollout status deploy/web --timeout=180s

echo "==> Services"
kubectl -n gardenwise get pods,svc,job
echo
echo "Port-forward web if LoadBalancer is not mapped:"
echo "  kubectl -n gardenwise port-forward svc/web 8088:80"
echo "Then open http://localhost:8088"
