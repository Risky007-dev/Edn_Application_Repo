# Complete Setup & Installation Guide

Comprehensive setup, configuration, and operations guide for **Tutor Time with Teacher Cassie & Popcorn Math** on both **Windows** and **Ubuntu / Linux**.

---

## 🏗️ System Architecture

* **Runtime:** Node.js (v20.x or higher)
* **Web Framework:** Express 5.x
* **Security:** Helmet, Rate-Limiting, Path Traversal Defenses, Honeypots
* **Storage Drivers:**
  * **Local Driver (Default):** Flat-file JSON persistence in `./data/tutortime-submissions.json` and `./subscribers.json`. Requires zero cloud setup.
  * **AWS Driver (Production Cloud):** DynamoDB for submissions, private S3 bucket for candidate CV uploads, and Amazon SESv2 for email notifications.
* **Process Manager:** PM2
* **Reverse Proxy:** Nginx with Let's Encrypt TLS

---

## 🪟 Windows Setup Guide

### 1. Prerequisites
* **Node.js 20+**: Download and install the LTS version from [nodejs.org](https://nodejs.org/). Make sure "Add to PATH" is checked during setup.
* **Git for Windows** (Optional but recommended): From [git-scm.com](https://git-scm.com/).

### 2. Quick Setup with `run.bat`
1. Navigate to the project directory in File Explorer.
2. Double-click `run.bat`.
3. The script will automatically copy `.env.example` to `.env`, install dependencies via `npm install`, and launch the web server.

### 3. Manual Installation (PowerShell / CMD)
```powershell
# Verify Node and npm
node -v
npm -v

# Clone the repository
git clone https://github.com/Risky007-dev/Edn_Application_Repo.git
cd Edn_Application_Repo

# Create your local environment file
copy .env.example .env

# Install Node dependencies
npm install

# Start the application in development mode
npm start
```
Open **`http://localhost:5001`** in any web browser.

---

## 🐧 Ubuntu / Linux Setup Guide

### 1. Prerequisites
Ensure `curl`, `git`, and Node.js v20+ are installed:

```bash
# Update system packages
sudo apt-get update && sudo apt-get install -y curl git build-essential

# Install Node.js 20.x LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify versions
node -v
npm -v
```

### 2. Quick Launch
```bash
chmod +x run.sh
./run.sh
```

### 3. Manual Launch
```bash
# Clone and enter repo
git clone https://github.com/Risky007-dev/Edn_Application_Repo.git
cd Edn_Application_Repo

# Initialize .env
cp .env.example .env

# Install dependencies
npm install

# Launch server
npm start
```

---

## ⚙️ Production Operations on Ubuntu (PM2 & Nginx)

### 1. Process Management with PM2
PM2 ensures the server automatically restarts if it crashes or the system reboots.

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the Express server
pm2 start server.js --name "tutortime"

# Save the current PM2 list
pm2 save

# Setup systemd startup service
pm2 startup
# (Run the sudo command that PM2 displays to configure the systemd unit)
```

**Common PM2 Commands:**
* `pm2 status` — List running processes
* `pm2 logs tutortime` — View streaming application output
* `pm2 restart tutortime` — Restart the application
* `pm2 stop tutortime` — Stop the application

---

### 2. Nginx Reverse Proxy Setup
Create an Nginx configuration file at `/etc/nginx/sites-available/tutortime.nathaniel.name.ng`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name tutortime.nathaniel.name.ng;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

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

Enable and reload Nginx:
```bash
sudo ln -sf /etc/nginx/sites-available/tutortime.nathaniel.name.ng /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### 3. HTTPS / TLS Certificate with Let's Encrypt Certbot
Ensure your DNS `A` record points to your server's IP, then run:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tutortime.nathaniel.name.ng
```
Certbot will automatically install the certificate and configure HTTP-to-HTTPS redirection.

---

## 🔧 Environment Variables Reference

Edit `.env` to configure your environment:

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `5001` | HTTP port the server listens on |
| `NODE_ENV` | `production` | Environment mode (`development` or `production`) |
| `TRUST_PROXY` | `true` | Enables trust for `X-Forwarded-*` headers behind Nginx / ALB |
| `STORAGE_DRIVER` | `local` | `local` for JSON files on disk; `aws` for DynamoDB/S3/SES |
| `DATA_DIR` | `./data` | Local directory where form submissions are written |
| `SUBSCRIBERS_DB_FILE`| `./subscribers.json` | Path to JSON file storing newsletter subscribers |
| `FORM_RATE_LIMIT_MAX`| `100` | Max submissions allowed per IP per 15-minute window |
| `ADMIN_API_KEY` | *(empty)* | Secret key required in `X-Admin-Key` header for `/api/metrics` |
| `AWS_REGION` | `us-east-2` | AWS region when `STORAGE_DRIVER=aws` |
| `DYNAMODB_TABLE_NAME`| `tutortime-submissions` | AWS DynamoDB table name |
| `UPLOADS_BUCKET_NAME`| *(empty)* | S3 bucket name for CV uploads |
| `ADMIN_NOTIFICATION_EMAIL`| *(empty)* | Verified SES recipient for new submissions |
| `SENDER_EMAIL` | *(empty)* | Verified SES sender address |

---

## 🧪 Testing & Verification

Run the automated test suites:
```bash
npm test
```
All stages verify:
* Core page routes and canonical branding
* Security headers (Helmet CSP, X-Frame-Options, no-sniff)
* Form processing pipeline and rate limiters
* Traversal security and static file lockdown
* Presigned S3 upload protocols and health endpoints
