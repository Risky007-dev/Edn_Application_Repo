# AWS EC2 Access Troubleshooting - Manual Verification Checklist

**Problem**: Cannot access `http://3.139.236.139:5001/` from browser
**Public IP**: 3.139.236.139
**Expected Service**: Node.js server on port 5001
**Region**: us-east-1 (or us-east-2)

---

## ✅ CHECKLIST 1: Internet Gateway Configuration

### Step 1: Verify IGW Exists & is Attached
1. Go to **AWS Console** → **VPC** → **Internet Gateways**
2. Look for: `popcorn-maths-igw` (ID: `igw-0742e2372b4ce4896`)
3. Status should be: **"Available"**
4. Check **Attachments** tab - should show:
   - **VPC**: `vpc-03d03dc16c317cee0`
   - **State**: `available`

**✅ Expected**: IGW is attached to VPC
**❌ If missing**: Create IGW and attach to VPC

---

## ✅ CHECKLIST 2: Route Table Configuration

### Step 1: Find the Route Table
1. Go to **AWS Console** → **VPC** → **Route Tables**
2. Filter by VPC: `vpc-03d03dc16c317cee0`
3. Click the route table (should be default if using default VPC)

### Step 2: Check Routes
4. Click **Routes** tab
5. You should see **TWO routes**:

| Destination | Target | Status |
|-------------|--------|--------|
| 172.31.0.0/16 | local | active |
| **0.0.0.0/0** | **igw-0742e2372b4ce4896** | **active** |

**✅ Expected**: Both routes present, especially the 0.0.0.0/0 → IGW route
**❌ If missing the 0.0.0.0/0 route**: 
- Click **Edit routes**
- Click **Add route**
- Destination: `0.0.0.0/0`
- Target: Select IGW `igw-0742e2372b4ce4896`
- Save

---

## ✅ CHECKLIST 3: Subnet Configuration

### Step 1: Find Your Subnet
1. Go to **AWS Console** → **VPC** → **Subnets**
2. Filter by VPC: `vpc-03d03dc16c317cee0`
3. Find subnet where EC2 instance is located (note the subnet ID)

### Step 2: Check Public IP Settings
4. Click on the subnet
5. Go to **Actions** → **Edit subnet settings**
6. Check: **"Enable auto-assign public IPv4 address"** - should be **ENABLED** ✅

**✅ Expected**: Public IP auto-assign is enabled
**❌ If disabled**: Enable it

---

## ✅ CHECKLIST 4: EC2 Instance Configuration

### Step 1: Find Your Instance
1. Go to **AWS Console** → **EC2** → **Instances**
2. Look for instance with Public IPv4: **3.139.236.139**
3. Click on it to view details

### Step 2: Verify Instance Details
4. Check **Instance State**: Should be **running** ✅
5. Check **Public IPv4 address**: Should be **3.139.236.139** ✅
6. Check **VPC**: Should be **vpc-03d03dc16c317cee0** ✅
7. Check **Subnet**: Should be in **172.31.x.x/20** range ✅
8. Check **Security Groups**: Should include **jenkins-sg-2022** ✅

**✅ Expected**: Instance is running with public IP in correct VPC
**❌ If not running**: Start the instance

---

## ✅ CHECKLIST 5: Security Group Configuration

### Step 1: Open Security Group
1. In Instance Details, scroll down to **Security groups**
2. Click on **jenkins-sg-2022** security group

### Step 2: Check Inbound Rules
3. Go to **Inbound rules** tab
4. You should see:

| Type | Protocol | Port Range | Source | Purpose |
|------|----------|-----------|--------|---------|
| SSH | TCP | 22 | 0.0.0.0/0 | SSH access |
| Custom TCP | TCP | **5001** | 0.0.0.0/0 | **Node.js app** |
| Custom TCP | TCP | 8080 | 0.0.0.0/0 | Jenkins (optional) |

**✅ Expected**: Port 5001 is listed with source 0.0.0.0/0
**❌ If MISSING port 5001**:
- Click **Edit inbound rules**
- Click **Add rule**
- Type: Custom TCP
- Port range: 5001
- Source: 0.0.0.0/0
- Click **Save rules**

### Step 3: Check Outbound Rules
5. Go to **Outbound rules** tab
6. Should have at least one rule allowing traffic out (usually `0.0.0.0/0`)

**✅ Expected**: Outbound rule allows instance to reach internet
**❌ If missing**: Add outbound rule for 0.0.0.0/0 TCP all ports

---

## ✅ CHECKLIST 6: EC2 Instance Status Checks

### Step 1: View Status Checks
1. In EC2 Instance Details, look for **Status checks** section
2. Should show:
   - **Instance Status**: **2/2 checks passed** ✅
   - **System Status**: **2/2 checks passed** ✅

**✅ Expected**: All status checks passing
**❌ If failing**: Instance may have issues - try stopping and starting it

---

## ✅ CHECKLIST 7: Server Running on Instance

### Step 1: Connect to Instance
1. In EC2 Instance Details, click **Connect** button
2. Choose connection method:
   - **EC2 Instance Connect** (easiest - browser-based)
   - **SSH** (if you have key pair)

### Step 2: Check if Node.js is Running
3. Run command:
   ```bash
   ps aux | grep node
   ```
4. You should see output like:
   ```
   ec2-user   12345  0.0  0.5 500000 20000 ?  Sl  10:30   0:01 node server.js
   ```

**✅ Expected**: Node.js process is running
**❌ If NOT running**: Start it with:
   ```bash
   cd ~/Edn_Application_Repo
   node server.js
   ```

### Step 3: Check Port 5001 is Listening
5. Run command:
   ```bash
   netstat -tuln | grep 5001
   ```
6. You should see:
   ```
   tcp  0  0  0.0.0.0:5001  0.0.0.0:*  LISTEN
   ```

**✅ Expected**: Server is listening on port 5001
**❌ If NOT listening**: Server crashed or not started

### Step 4: Test Locally on Instance
7. Run:
   ```bash
   curl http://localhost:5001
   ```
8. Should get HTML response (index.html)

**✅ Expected**: Server responds with 200 OK
**❌ If error**: Check server.js logs

---

## ✅ CHECKLIST 8: External Connectivity Test

### Step 1: From Your Local Machine (Windows PowerShell)
1. Test if instance is reachable:
   ```powershell
   Test-NetConnection 3.139.236.139 -Port 5001
   ```

2. Try accessing via browser:
   ```
   http://3.139.236.139:5001
   ```

3. Or via curl:
   ```powershell
   curl http://3.139.236.139:5001
   ```

**✅ Expected**: Connection successful, HTML page loads
**❌ If timeout**: Network/firewall issue

---

## 🔍 DIAGNOSTIC FLOW

**Follow this order to find the issue:**

```
Is instance running?
├─ NO  → START INSTANCE
└─ YES → Is public IP assigned?
    ├─ NO  → ASSIGN ELASTIC IP
    └─ YES → Does security group have port 5001?
        ├─ NO  → ADD SECURITY GROUP RULE
        └─ YES → Is IGW attached to VPC?
            ├─ NO  → ATTACH IGW
            └─ YES → Does route table have 0.0.0.0/0 → IGW?
                ├─ NO  → ADD ROUTE
                └─ YES → Is Node.js running on instance?
                    ├─ NO  → SSH AND START SERVER
                    └─ YES → TEST curl http://3.139.236.139:5001
```

---

## 🛠️ QUICK FIXES

### Fix 1: Add Port 5001 to Security Group
```powershell
$SG_ID = "sg-xxxxxx"  # From AWS Console

aws ec2 authorize-security-group-ingress `
  --group-id $SG_ID `
  --protocol tcp `
  --port 5001 `
  --cidr 0.0.0.0/0 `
  --region us-east-1
```

### Fix 2: Add Route to IGW
```powershell
$RT_ID = "rtb-xxxxxx"  # From Route Tables
$IGW_ID = "igw-0742e2372b4ce4896"

aws ec2 create-route `
  --route-table-id $RT_ID `
  --destination-cidr-block 0.0.0.0/0 `
  --gateway-id $IGW_ID `
  --region us-east-1
```

### Fix 3: Start Node.js Server on Instance
```bash
# SSH into instance first
ssh -i "your-key.pem" ec2-user@3.139.236.139

# Then run:
cd ~/Edn_Application_Repo
node server.js
```

---

## 📋 Summary Table

| Component | Status | Location in AWS Console |
|-----------|--------|------------------------|
| Internet Gateway | ✅ Attached | VPC → Internet Gateways |
| Route Table | ? Check | VPC → Route Tables |
| Security Group | ? Check | EC2 → Security Groups |
| Port 5001 Rule | ? Check | EC2 → Security Groups → Inbound |
| EC2 Instance | ? Check | EC2 → Instances |
| Public IP | 3.139.236.139 | EC2 → Instances → Details |
| Server Running | ? Check | SSH to instance, run `ps aux \| grep node` |

---

## 📞 Next Steps

1. **Go through CHECKLIST 1-8 above**
2. **Note which items are FAILING** ❌
3. **Apply the corresponding FIX**
4. **Test with**: `curl http://3.139.236.139:5001`
5. **If still fails**, report which checklists PASSED ✅ and which FAILED ❌

**Report back with results!** 🍿
