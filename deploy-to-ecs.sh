#!/bin/bash

# AWS ECS Deployment Script for Popcorn Maths

set -e

echo "╔════════════════════════════════════════╗"
echo "║  AWS ECS Deployment - Popcorn Maths   ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
read -p "Enter AWS Region (default: us-east-1): " AWS_REGION
AWS_REGION=${AWS_REGION:-us-east-1}

read -p "Enter AWS Account ID: " AWS_ACCOUNT_ID

read -p "Enter ECR Repository Name (default: popcorn-maths): " ECR_REPO_NAME
ECR_REPO_NAME=${ECR_REPO_NAME:-popcorn-maths}

read -p "Enter ECS Cluster Name (default: popcorn-maths-cluster): " ECS_CLUSTER
ECS_CLUSTER=${ECS_CLUSTER:-popcorn-maths-cluster}

read -p "Enter ECS Service Name (default: popcorn-maths-service): " ECS_SERVICE
ECS_SERVICE=${ECS_SERVICE:-popcorn-maths-service}

ECR_REGISTRY="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
IMAGE_URI="$ECR_REGISTRY/$ECR_REPO_NAME:latest"

echo ""
echo -e "${BLUE}Configuration:${NC}"
echo "  Region: $AWS_REGION"
echo "  Account ID: $AWS_ACCOUNT_ID"
echo "  ECR Repository: $ECR_REPO_NAME"
echo "  ECS Cluster: $ECS_CLUSTER"
echo "  ECS Service: $ECS_SERVICE"
echo "  Image URI: $IMAGE_URI"
echo ""

# Step 1: Check AWS CLI
echo -e "${BLUE}[1/6]${NC} Checking AWS CLI..."
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install it first."
    exit 1
fi
echo -e "${GREEN}✓ AWS CLI found${NC}"
echo ""

# Step 2: Create ECR Repository
echo -e "${BLUE}[2/6]${NC} Checking/Creating ECR Repository..."
if aws ecr describe-repositories \
    --repository-names "$ECR_REPO_NAME" \
    --region "$AWS_REGION" 2>/dev/null; then
    echo -e "${GREEN}✓ ECR Repository already exists${NC}"
else
    echo "Creating ECR repository..."
    aws ecr create-repository \
        --repository-name "$ECR_REPO_NAME" \
        --region "$AWS_REGION"
    echo -e "${GREEN}✓ ECR Repository created${NC}"
fi
echo ""

# Step 3: Build and Push Docker Image
echo -e "${BLUE}[3/6]${NC} Building and Pushing Docker Image..."
echo "Logging in to ECR..."
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REGISTRY"

echo "Building Docker image..."
docker build -t "$ECR_REPO_NAME:latest" .

echo "Tagging image..."
docker tag "$ECR_REPO_NAME:latest" "$IMAGE_URI"

echo "Pushing image to ECR..."
docker push "$IMAGE_URI"
echo -e "${GREEN}✓ Docker image pushed${NC}"
echo ""

# Step 4: Update Task Definition
echo -e "${BLUE}[4/6]${NC} Updating ECS Task Definition..."

# Read task definition template and replace variables
TASK_DEF=$(cat ecs-task-definition.json \
  | sed "s|YOUR_AWS_ACCOUNT_ID|$AWS_ACCOUNT_ID|g" \
  | sed "s|YOUR_REGION|$AWS_REGION|g")

echo "$TASK_DEF" > /tmp/task-definition.json

aws ecs register-task-definition \
    --cli-input-json file:///tmp/task-definition.json \
    --region "$AWS_REGION" > /dev/null

echo -e "${GREEN}✓ Task definition registered${NC}"
echo ""

# Step 5: Create CloudWatch Log Group
echo -e "${BLUE}[5/6]${NC} Setting up CloudWatch Logs..."
if aws logs describe-log-groups \
    --log-group-name-prefix "/ecs/popcorn-maths" \
    --region "$AWS_REGION" 2>/dev/null | grep -q "logGroupName"; then
    echo -e "${GREEN}✓ Log group already exists${NC}"
else
    aws logs create-log-group \
        --log-group-name "/ecs/popcorn-maths" \
        --region "$AWS_REGION"
    echo -e "${GREEN}✓ Log group created${NC}"
fi
echo ""

# Step 6: Update Service
echo -e "${BLUE}[6/6]${NC} Updating ECS Service..."
if aws ecs describe-services \
    --cluster "$ECS_CLUSTER" \
    --services "$ECS_SERVICE" \
    --region "$AWS_REGION" 2>/dev/null | grep -q "serviceArn"; then
    
    echo "Service exists. Updating..."
    aws ecs update-service \
        --cluster "$ECS_CLUSTER" \
        --service "$ECS_SERVICE" \
        --force-new-deployment \
        --region "$AWS_REGION" > /dev/null
    echo -e "${GREEN}✓ Service updated${NC}"
else
    echo -e "${YELLOW}⚠ Service '$ECS_SERVICE' not found in cluster '$ECS_CLUSTER'${NC}"
    echo "Please create the service manually using:"
    echo "  aws ecs create-service \\"
    echo "    --cluster $ECS_CLUSTER \\"
    echo "    --service-name $ECS_SERVICE \\"
    echo "    --task-definition popcorn-maths-email-service:1 \\"
    echo "    --desired-count 1 \\"
    echo "    --launch-type FARGATE \\"
    echo "    --network-configuration 'awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}' \\"
    echo "    --region $AWS_REGION"
fi
echo ""

echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Deployment Complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo "Next steps:"
echo "1. Configure email secrets in AWS Secrets Manager:"
echo "   aws secretsmanager create-secret --name popcorn-maths/sender-email --secret-string 'your-email@gmail.com' --region $AWS_REGION"
echo "   aws secretsmanager create-secret --name popcorn-maths/sender-password --secret-string 'your-app-password' --region $AWS_REGION"
echo ""
echo "2. Check service status:"
echo "   aws ecs describe-services --cluster $ECS_CLUSTER --services $ECS_SERVICE --region $AWS_REGION"
echo ""
echo "3. View logs:"
echo "   aws logs tail /ecs/popcorn-maths --follow --region $AWS_REGION"
echo ""
echo "4. Get public IP/DNS from your load balancer and test:"
echo "   curl http://your-public-dns:5001"
echo ""
