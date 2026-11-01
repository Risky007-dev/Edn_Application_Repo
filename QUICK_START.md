# Quick Start Guide

This application is a **Node.js & Express** web application for **Tutor Time with Teacher Cassie & Popcorn Math**.

---

## 🚀 Fast Start: Choose Your Platform

### 🪟 Windows Setup

#### Option 1: One-Click Runner (Easiest)
1. Double-click **`run.bat`** (or `start-server.bat`) in the root folder.
2. The script will automatically:
   - Verify Node.js is installed
   - Create `.env` from `.env.example` if missing
   - Run `npm install` on first launch
   - Start the server on `http://localhost:5001`

#### Option 2: PowerShell or Command Prompt
```powershell
# 1. Ensure Node.js 20+ is installed (https://nodejs.org/)
node -v

# 2. Clone and navigate to repository
cd Edn_Application_Repo

# 3. Copy environment configuration
copy .env.example .env

# 4. Install dependencies
npm install

# 5. Start the server
npm start
```
Open **`http://localhost:5001`** in your browser.

---

### 🐧 Ubuntu / Linux Setup

#### Option 1: Automated Script
```bash
chmod +x run.sh
./run.sh
```

#### Option 2: Manual Terminal Commands
```bash
# 1. Install Node.js 20 (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Copy environment file
cp .env.example .env

# 3. Install dependencies
npm install

# 4. Start local development server
npm start
```
The application will listen on **`http://localhost:5001`**.

---

## 🌐 Production Deployment (Ubuntu with PM2 & Nginx)

To run the application 24/7 in background with automatic restarts, reverse proxying, and SSL:

### 1. Install and Start with PM2
```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the application
pm2 start server.js --name "tutortime"

# Save process list and enable boot startup
pm2 save
pm2 startup
```

Useful PM2 commands:
```bash
pm2 status tutortime          # Check status
pm2 logs tutortime            # View real-time logs
pm2 restart tutortime         # Restart after code changes
```

### 2. Connect with Nginx Reverse Proxy
Create `/etc/nginx/sites-available/tutortime.nathaniel.name.ng`:
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name tutortime.nathaniel.name.ng;

    client_max_body_size 25m;

    location / {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 120s;
    }
}
```

Enable site and test:
```bash
sudo ln -sf /etc/nginx/sites-available/tutortime.nathaniel.name.ng /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. Add Free SSL with Certbot
```bash
sudo certbot --nginx -d tutortime.nathaniel.name.ng
```

---

## 🧪 Testing the Application

1. **Verify Health Endpoint:**
   ```bash
   curl http://localhost:5001/health
   # Response: {"status":"ok","uptime":...}
   ```

2. **Run Automated Test Suites:**
   ```bash
   npm test
   ```

3. **View Subscribers List:**
   ```
   http://localhost:5001/subscribers
   ```
