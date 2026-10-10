# AWS ECS Deployment Guide

Complete guide to deploy the Popcorn Maths email system to AWS ECS (Elastic Container Service).

## 📋 Prerequisites

- AWS Account with ECS access
- AWS CLI installed and configured (`aws --version`)
- Docker installed (for local testing)
- IAM permissions for ECS, ECR, and CloudWatch
- GitHub access to your repository

## 🚀 Step-by-Step Deployment

### Step 1: Set Up ECR (Elastic Container Registry)

Create an ECR repository to store your Docker image:

```bash
# Set variables
$AWS_REGION = "us-east-1"  # Change to your region
$AWS_ACCOUNT_ID = "YOUR_ACCOUNT_ID"  # Get from: aws sts get-caller-identity
$ECR_REPO_NAME = "popcorn-maths"
n 
# Create ECR repository
aws ecr create-repository `
  --repository-name $ECR_REPO_NAME `
  --region $AWS_REGION

# Output will include repositoryUri - save this!
```

### Step 2: Build and Push Docker Image

```bash
# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build Docker image
docker build -t $ECR_REPO_NAME:latest .

# Tag image for ECR
docker tag $ECR_REPO_NAME:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_NAME:latest

# Push to ECR
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_NAME:latest
```

### Step 3: Update ECS Task Definition

1. **Get your AWS Account ID:**
   ```bash
   aws sts get-caller-identity --query Account --output text
   ```

2. **Edit `ecs-task-definition.json`:**
   - Replace `YOUR_AWS_ACCOUNT_ID` with your actual account ID
   - Replace `YOUR_REGION` with your AWS region (e.g., us-east-1)

3. **Register the task definition:**
   ```bash
   aws ecs register-task-definition `
     --cli-input-json file://ecs-task-definition.json `
     --region $AWS_REGION
   ```

### Step 4: Set Up AWS Secrets Manager

Store sensitive data securely:

```bash
# Store sender email
aws secretsmanager create-secret `
  --name popcorn-maths/sender-email `
  --secret-string "your-email@gmail.com" `
  --region $AWS_REGION

# Store sender password (app password for Gmail)
aws secretsmanager create-secret `
  --name popcorn-maths/sender-password `
  --secret-string "your-app-password" `
  --region $AWS_REGION
```

### Step 5: Create CloudWatch Log Group

```bash
aws logs create-log-group `
  --log-group-name /ecs/popcorn-maths `
  --region $AWS_REGION
```

### Step 6: Create ECS Cluster (if you don't have one)

```bash
aws ecs create-cluster `
  --cluster-name popcorn-maths-cluster `
  --region $AWS_REGION
```

### Step 7: Create ECS Service

```bash
aws ecs create-service `
  --cluster popcorn-maths-cluster `
  --service-name popcorn-maths-service `
  --task-definition popcorn-maths-email-service:1 `
  --desired-count 1 `
  --launch-type FARGATE `
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" `
  --region $AWS_REGION
```

Replace subnet and security group IDs with your actual values.

### Step 8: Set Up Application Load Balancer (Optional but Recommended)

```bash
# Create target group
aws elbv2 create-target-group `
  --name popcorn-maths-targets `
  --protocol HTTP `
  --port 5001 `
  --vpc-id vpc-xxx `
  --target-type ip `
  --health-check-path "/" `
  --region $AWS_REGION

# Create load balancer
aws elbv2 create-load-balancer `
  --name popcorn-maths-alb `
  --subnets subnet-xxx subnet-yyy `
  --security-groups sg-xxx `
  --scheme internet-facing `
  --region $AWS_REGION

# Create listener
aws elbv2 create-listener `
  --load-balancer-arn arn:aws:elasticloadbalancing:... `
  --protocol HTTP `
  --port 80 `
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:... `
  --region $AWS_REGION
```

## 📊 Verify Deployment

### Check Service Status

```bash
# Get service details
aws ecs describe-services `
  --cluster popcorn-maths-cluster `
  --services popcorn-maths-service `
  --region $AWS_REGION

# Check running tasks
aws ecs list-tasks `
  --cluster popcorn-maths-cluster `
  --region $AWS_REGION

# Get task details
aws ecs describe-tasks `
  --cluster popcorn-maths-cluster `
  --tasks arn:aws:ecs:... `
  --region $AWS_REGION
```

### View Logs

```bash
# Get recent logs
aws logs tail /ecs/popcorn-maths --follow --region $AWS_REGION
```

## 🔄 CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/deploy-ecs.yml`:

```yaml
name: Deploy to ECS

on:
  push:
    branches: [main]

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: popcorn-maths
  ECS_SERVICE: popcorn-maths-service
  ECS_CLUSTER: popcorn-maths-cluster
  ECS_TASK_DEFINITION: popcorn-maths-email-service

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build, tag, and push image to Amazon ECR
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> $GITHUB_OUTPUT

      - name: Update ECS service
        run: |
          aws ecs update-service \
            --cluster $ECS_CLUSTER \
            --service $ECS_SERVICE \
            --force-new-deployment \
            --region $AWS_REGION
```

## 📈 Monitoring & Scaling

### Auto Scaling

```bash
# Register scalable target
aws application-autoscaling register-scalable-target `
  --service-namespace ecs `
  --resource-id service/popcorn-maths-cluster/popcorn-maths-service `
  --scalable-dimension ecs:service:DesiredCount `
  --min-capacity 1 `
  --max-capacity 4 `
  --region $AWS_REGION

# Create scaling policy
aws application-autoscaling put-scaling-policy `
  --policy-name popcorn-maths-scaling `
  --service-namespace ecs `
  --resource-id service/popcorn-maths-cluster/popcorn-maths-service `
  --scalable-dimension ecs:service:DesiredCount `
  --policy-type TargetTrackingScaling `
  --target-tracking-scaling-policy-configuration "{ `
    \"TargetValue\": 70.0, `
    \"PredefinedMetricSpecification\": { `
      \"PredefinedMetricType\": \"ECSServiceAverageCPUUtilization\" `
    }, `
    \"ScaleOutCooldown\": 60, `
    \"ScaleInCooldown\": 300 `
  }" `
  --region $AWS_REGION
```

### CloudWatch Alarms

```bash
aws cloudwatch put-metric-alarm `
  --alarm-name popcorn-maths-cpu-high `
  --alarm-description "Alert when CPU exceeds 80%" `
  --metric-name CPUUtilization `
  --namespace AWS/ECS `
  --statistic Average `
  --period 300 `
  --threshold 80 `
  --comparison-operator GreaterThanThreshold `
  --evaluation-periods 2 `
  --region $AWS_REGION
```

## 🔐 Security Best Practices

1. **Use AWS Secrets Manager** for all sensitive data
2. **Enable ECR Image Scanning** for vulnerabilities
3. **Use VPC** with proper security groups
4. **Enable CloudTrail** for audit logging
5. **Use IAM Roles** with minimal required permissions
6. **Enable HTTPS** with ACM certificate
7. **Use private subnets** for tasks when possible

## 📝 Environment Variables

Update your ECS task to use proper environment variables:

```json
"environment": [
  {
    "name": "PORT",
    "value": "5001"
  },
  {
    "name": "NODE_ENV",
    "value": "production"
  },
  {
    "name": "AWS_REGION",
    "value": "us-east-1"
  }
]
```

## 🛠️ Troubleshooting

### Task won't start
- Check CloudWatch logs: `aws logs tail /ecs/popcorn-maths --follow`
- Verify security group allows port 5001
- Check IAM role permissions
- Verify image exists in ECR

### Service not healthy
- Check health check endpoint (GET http://localhost:5001)
- Verify network connectivity
- Check application logs

### High costs
- Reduce task count during off-peak hours
- Use spot instances for non-critical tasks
- Monitor CloudWatch for unusual activity

## 🎯 Testing the Deployment

```bash
# Get public IP/DNS from load balancer or task
# Visit: http://your-public-dns:5001

# Test subscription endpoint
curl -X POST http://your-public-dns:5001/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Check subscribers
curl http://your-public-dns:5001/subscribers
```

## 📚 Additional Resources

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [AWS ECR Documentation](https://docs.aws.amazon.com/ecr/)
- [Docker Documentation](https://docs.docker.com/)
- [AWS Fargate Pricing](https://aws.amazon.com/fargate/pricing/)

## ✅ Deployment Checklist

- [ ] AWS CLI installed and configured
- [ ] Docker installed and running
- [ ] ECR repository created
- [ ] Docker image built and pushed
- [ ] ECS cluster created
- [ ] Task definition registered
- [ ] AWS Secrets Manager configured
- [ ] CloudWatch log group created
- [ ] Security groups configured
- [ ] Load balancer set up (optional)
- [ ] Service created and running
- [ ] Health checks passing
- [ ] Tested via public endpoint
- [ ] Monitoring and alarms configured

---

**Your application is ready for production on AWS ECS!** 🚀
