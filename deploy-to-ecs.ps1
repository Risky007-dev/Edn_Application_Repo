#!/usr/bin/env pwsh

# AWS ECS Deployment Script for Popcorn Maths (PowerShell)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  AWS ECS Deployment - Popcorn Maths   ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

# Configuration
$AWS_REGION = Read-Host "Enter AWS Region (default: us-east-1)"
if ([string]::IsNullOrWhiteSpace($AWS_REGION)) { $AWS_REGION = "us-east-1" }

$AWS_ACCOUNT_ID = Read-Host "Enter AWS Account ID"
if ([string]::IsNullOrWhiteSpace($AWS_ACCOUNT_ID)) {
    Write-Host "❌ AWS Account ID is required" -ForegroundColor Red
    exit 1
}

$ECR_REPO_NAME = Read-Host "Enter ECR Repository Name (default: popcorn-maths)"
if ([string]::IsNullOrWhiteSpace($ECR_REPO_NAME)) { $ECR_REPO_NAME = "popcorn-maths" }

$ECS_CLUSTER = Read-Host "Enter ECS Cluster Name (default: popcorn-maths-cluster)"
if ([string]::IsNullOrWhiteSpace($ECS_CLUSTER)) { $ECS_CLUSTER = "popcorn-maths-cluster" }

$ECS_SERVICE = Read-Host "Enter ECS Service Name (default: popcorn-maths-service)"
if ([string]::IsNullOrWhiteSpace($ECS_SERVICE)) { $ECS_SERVICE = "popcorn-maths-service" }

$ECR_REGISTRY = "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
$IMAGE_URI = "$ECR_REGISTRY/$ECR_REPO_NAME`:latest"

Write-Host ""
Write-Host "Configuration:" -ForegroundColor Blue
Write-Host "  Region: $AWS_REGION"
Write-Host "  Account ID: $AWS_ACCOUNT_ID"
Write-Host "  ECR Repository: $ECR_REPO_NAME"
Write-Host "  ECS Cluster: $ECS_CLUSTER"
Write-Host "  ECS Service: $ECS_SERVICE"
Write-Host "  Image URI: $IMAGE_URI"
Write-Host ""

# Step 1: Check AWS CLI
Write-Host "[1/6] Checking AWS CLI..." -ForegroundColor Blue
try {
    $version = aws --version
    Write-Host "✓ AWS CLI found: $version" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI not found. Please install it first." -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Create ECR Repository
Write-Host "[2/6] Checking/Creating ECR Repository..." -ForegroundColor Blue
try {
    aws ecr describe-repositories `
        --repository-names $ECR_REPO_NAME `
        --region $AWS_REGION 2>$null | Out-Null
    Write-Host "✓ ECR Repository already exists" -ForegroundColor Green
} catch {
    Write-Host "Creating ECR repository..."
    aws ecr create-repository `
        --repository-name $ECR_REPO_NAME `
        --region $AWS_REGION | Out-Null
    Write-Host "✓ ECR Repository created" -ForegroundColor Green
}
Write-Host ""

# Step 3: Build and Push Docker Image
Write-Host "[3/6] Building and Pushing Docker Image..." -ForegroundColor Blue
Write-Host "Logging in to ECR..."
$login_output = aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY
Write-Host "✓ Logged in to ECR" -ForegroundColor Green

Write-Host "Building Docker image..."
docker build -t "$ECR_REPO_NAME`:latest" .
Write-Host "✓ Docker image built" -ForegroundColor Green

Write-Host "Tagging image..."
docker tag "$ECR_REPO_NAME`:latest" $IMAGE_URI
Write-Host "✓ Image tagged" -ForegroundColor Green

Write-Host "Pushing image to ECR..."
docker push $IMAGE_URI
Write-Host "✓ Docker image pushed" -ForegroundColor Green
Write-Host ""

# Step 4: Update Task Definition
Write-Host "[4/6] Updating ECS Task Definition..." -ForegroundColor Blue

$task_def = Get-Content ecs-task-definition.json -Raw
$task_def = $task_def -replace "YOUR_AWS_ACCOUNT_ID", $AWS_ACCOUNT_ID
$task_def = $task_def -replace "YOUR_REGION", $AWS_REGION

$task_def | Out-File -FilePath "$env:TEMP\task-definition.json" -Encoding UTF8

aws ecs register-task-definition `
    --cli-input-json file://$env:TEMP/task-definition.json `
    --region $AWS_REGION | Out-Null

Write-Host "✓ Task definition registered" -ForegroundColor Green
Write-Host ""

# Step 5: Create CloudWatch Log Group
Write-Host "[5/6] Setting up CloudWatch Logs..." -ForegroundColor Blue
try {
    aws logs describe-log-groups `
        --log-group-name-prefix "/ecs/popcorn-maths" `
        --region $AWS_REGION 2>$null | Out-Null
    Write-Host "✓ Log group already exists" -ForegroundColor Green
} catch {
    aws logs create-log-group `
        --log-group-name "/ecs/popcorn-maths" `
        --region $AWS_REGION | Out-Null
    Write-Host "✓ Log group created" -ForegroundColor Green
}
Write-Host ""

# Step 6: Update Service
Write-Host "[6/6] Updating ECS Service..." -ForegroundColor Blue
try {
    aws ecs describe-services `
        --cluster $ECS_CLUSTER `
        --services $ECS_SERVICE `
        --region $AWS_REGION 2>$null | Out-Null
    
    Write-Host "Service exists. Updating..."
    aws ecs update-service `
        --cluster $ECS_CLUSTER `
        --service $ECS_SERVICE `
        --force-new-deployment `
        --region $AWS_REGION | Out-Null
    Write-Host "✓ Service updated" -ForegroundColor Green
} catch {
    Write-Host "⚠ Service '$ECS_SERVICE' not found in cluster '$ECS_CLUSTER'" -ForegroundColor Yellow
    Write-Host "Please create the service manually using:" -ForegroundColor Yellow
    Write-Host "  aws ecs create-service \" -ForegroundColor Yellow
    Write-Host "    --cluster $ECS_CLUSTER \" -ForegroundColor Yellow
    Write-Host "    --service-name $ECS_SERVICE \" -ForegroundColor Yellow
    Write-Host "    --task-definition popcorn-maths-email-service:1 \" -ForegroundColor Yellow
    Write-Host "    --desired-count 1 \" -ForegroundColor Yellow
    Write-Host "    --launch-type FARGATE \" -ForegroundColor Yellow
    Write-Host "    --network-configuration 'awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}' \" -ForegroundColor Yellow
    Write-Host "    --region $AWS_REGION" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "════════════════════════════════════════" -ForegroundColor Green
Write-Host "✓ Deployment Complete!" -ForegroundColor Green
Write-Host "════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Configure email secrets in AWS Secrets Manager:"
Write-Host "   aws secretsmanager create-secret --name popcorn-maths/sender-email --secret-string 'your-email@gmail.com' --region $AWS_REGION"
Write-Host "   aws secretsmanager create-secret --name popcorn-maths/sender-password --secret-string 'your-app-password' --region $AWS_REGION"
Write-Host ""
Write-Host "2. Check service status:"
Write-Host "   aws ecs describe-services --cluster $ECS_CLUSTER --services $ECS_SERVICE --region $AWS_REGION"
Write-Host ""
Write-Host "3. View logs:"
Write-Host "   aws logs tail /ecs/popcorn-maths --follow --region $AWS_REGION"
Write-Host ""
Write-Host "4. Get public IP/DNS from your load balancer and test:"
Write-Host "   curl http://your-public-dns:5001"
Write-Host ""
