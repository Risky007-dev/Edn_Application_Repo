# AWS ECS Quick Start Guide

Get your Popcorn Maths email system running on AWS ECS in 10 minutes.

## 🚀 Quick Start (5 Steps)

### Step 1: Gather AWS Info

Get your AWS Account ID:
```powershell
aws sts get-caller-identity --query Account --output text
```

Get your AWS Region:
```powershell
aws configure get region
# or specify: us-east-1, us-west-2, eu-west-1, etc.
```

### Step 2: Run Deployment Script (Windows)

```powershell
# PowerShell
.\deploy-to-ecs.ps1

# You'll be prompted to enter:
# - AWS Region (default: us-east-1)
# - AWS Account ID
# - ECR Repository Name (default: popcorn-maths)
# - ECS Cluster Name (default: popcorn-maths-cluster)
# - ECS Service Name (default: popcorn-maths-service)
```

Or on Linux/Mac:
```bash
chmod +x deploy-to-ecs.sh
./deploy-to-ecs.sh
```

### Step 3: Wait for Build & Push

The script will:
1. ✅ Create ECR repository
2. ✅ Build Docker image
3. ✅ Push to ECR
4. ✅ Register task definition
5. ✅ Create CloudWatch logs
6. ✅ Update ECS service

### Step 4: Configure Secrets

Add your email configuration to AWS Secrets Manager:

```powershell
$AWS_REGION = "us-east-1"  # Change to your region

# Store sender email
aws secretsmanager create-secret `
  --name popcorn-maths/sender-email `
  --secret-string "your-email@gmail.com" `
  --region $AWS_REGION

# Store app password
aws secretsmanager create-secret `
  --name popcorn-maths/sender-password `
  --secret-string "your-16-char-app-password" `
  --region $AWS_REGION
```

### Step 5: Test Deployment

Check service status:
```powershell
aws ecs describe-services `
  --cluster popcorn-maths-cluster `
  --services popcorn-maths-service `
  --region us-east-1
```

View logs:
```powershell
aws logs tail /ecs/popcorn-maths --follow --region us-east-1
```

## 📊 What Gets Deployed

```
┌─────────────────────────────────┐
│   AWS ECS Architecture          │
├─────────────────────────────────┤
│                                 │
│  ┌──────────────────────────┐   │
│  │ Load Balancer (ALB)      │   │
│  │ http://:5001             │   │
│  └──────────────────────────┘   │
│           ↓                      │
│  ┌──────────────────────────┐   │
│  │ ECS Cluster              │   │
│  │ (popcorn-maths-cluster)  │   │
│  └──────────────────────────┘   │
│           ↓                      │
│  ┌──────────────────────────┐   │
│  │ ECS Service              │   │
│  │ (popcorn-maths-service)  │   │
│  └──────────────────────────┘   │
│           ↓                      │
│  ┌──────────────────────────┐   │
│  │ ECS Task (Docker)        │   │
│  │ - Express.js Backend     │   │
│  │ - Port 5001              │   │
│  │ - 256 CPU / 512 MB RAM   │   │
│  └──────────────────────────┘   │
│           ↓                      │
│  ┌──────────────────────────┐   │
│  │ Storage                  │   │
│  │ - subscribers.json       │   │
│  │ - AWS Secrets Manager    │   │
│  │ - CloudWatch Logs        │   │
│  └──────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
```

## 🔑 Environment Variables

The Docker container uses these environment variables:

```env
PORT=5001                    # Server port
NODE_ENV=production          # Production mode
SENDER_EMAIL=***secret***    # From Secrets Manager
SENDER_PASSWORD=***secret*** # From Secrets Manager
```

## 📈 Check Deployment Status

### View Service Status
```powershell
aws ecs describe-services `
  --cluster popcorn-maths-cluster `
  --services popcorn-maths-service `
  --query "services[0].[serviceName,status,desiredCount,runningCount]" `
  --region us-east-1
```

### View Running Tasks
```powershell
aws ecs list-tasks `
  --cluster popcorn-maths-cluster `
  --region us-east-1
```

### View Task Details
```powershell
aws ecs describe-tasks `
  --cluster popcorn-maths-cluster `
  --tasks <TASK_ARN> `
  --region us-east-1
```

### View Logs
```powershell
# Last 50 lines
aws logs get-log-events `
  --log-group-name /ecs/popcorn-maths `
  --log-stream-name ecs/popcorn-maths/... `
  --region us-east-1

# Or follow logs in real-time
aws logs tail /ecs/popcorn-maths --follow --region us-east-1
```

## 🧪 Test the Application

Get the public DNS name from your load balancer or task IP:

```powershell
# Test landing page
curl http://your-public-dns:5001

# Test subscription
curl -X POST http://your-public-dns:5001/subscribe `
  -H "Content-Type: application/json" `
  -d @'
{
  "email": "test@example.com"
}
'@

# View subscribers
curl http://your-public-dns:5001/subscribers
```

## 💰 Cost Estimation

**Monthly cost (approximate):**
- ECS Fargate (256 CPU, 512 MB): $12-15
- Load Balancer: $15-20
- Data transfer: $0-10
- CloudWatch logs: $5-10
- ECR storage: $1-5

**Total: $35-60/month** for one task

Reduce costs by:
- Stopping tasks during off-hours
- Using spot instances
- Consolidating with other services
- Using auto-scaling

## 🔒 Security Checklist

- [ ] Secrets stored in AWS Secrets Manager (not in code)
- [ ] IAM roles with minimal permissions
- [ ] VPC security groups restrict traffic
- [ ] CloudWatch alarms configured
- [ ] CloudTrail enabled for audit logs
- [ ] HTTPS configured at load balancer
- [ ] DDoS protection (Shield)
- [ ] Auto-scaling configured

## 🆘 Troubleshooting

### Task won't start
```powershell
# Check logs
aws logs tail /ecs/popcorn-maths --follow

# Common issues:
# - Security group blocking port 5001
# - Insufficient IAM permissions
# - Docker image not found in ECR
# - Memory/CPU limits too low
```

### High costs
```powershell
# Check CPU/memory usage
aws cloudwatch get-metric-statistics `
  --namespace AWS/ECS `
  --metric-name CPUUtilization `
  --dimensions Name=ServiceName,Value=popcorn-maths-service `
  --start-time (Get-Date).AddDays(-7) `
  --end-time (Get-Date) `
  --period 3600 `
  --statistics Average `
  --region us-east-1
```

### Connection timeout
- Check security group allows inbound on port 5001
- Verify load balancer health checks
- Check task is in RUNNING state
- Review CloudWatch logs

## 📚 Resources

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [AWS Fargate Pricing](https://aws.amazon.com/fargate/pricing/)
- [ECS CLI Reference](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/cmd-ecs-cli.html)

## ✅ Deployment Checklist

- [ ] AWS CLI installed and configured
- [ ] Docker installed
- [ ] AWS Account ID and Region ready
- [ ] Ran `deploy-to-ecs.ps1` successfully
- [ ] Configured secrets in Secrets Manager
- [ ] Service shows RUNNING status
- [ ] Logs show successful startup
- [ ] Can access http://public-dns:5001
- [ ] Subscription form works
- [ ] Emails stored correctly

## 🎯 Next Steps

1. **Monitor & Alert**
   - Set up CloudWatch alarms for CPU/memory
   - Configure SNS for alerts

2. **Optimize**
   - Enable auto-scaling
   - Use spot instances for cost savings

3. **Enhance**
   - Add real email sending (configure SMTP)
   - Add database (RDS)
   - Add caching (ElastiCache)

4. **CI/CD**
   - Set up GitHub Actions for auto-deployment
   - Create staging environment

---

**Your application is live on AWS ECS!** 🎉

For detailed configuration and troubleshooting, see **AWS_ECS_DEPLOYMENT.md**
