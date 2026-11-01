# 📚 Documentation Index: Tutor Time & Popcorn Math

Welcome to the documentation for **Tutor Time with Teacher Cassie & Popcorn Math**, a production web application built on **Node.js & Express**.

---

## 🗺️ Documentation Directory

| Document | Description | Target Audience |
|---|---|---|
| [**`README.md`**](README.md) | High-level project overview, quick start, testing, and AWS deployment order | All developers & operators |
| [**`QUICK_START.md`**](QUICK_START.md) | 5-minute setup cheatsheet for **Windows** and **Ubuntu / Linux** | Anyone who wants to run the app quickly |
| [**`SETUP_GUIDE.md`**](SETUP_GUIDE.md) | Complete step-by-step installation, PM2 process management, Nginx setup, and SSL guide | Sysadmins & DevOps engineers |
| [**`NODEJS_SETUP.md`**](NODEJS_SETUP.md) | Deep dive into the Node.js/Express architecture and email subscription endpoints | Backend developers |
| [**`ARCHITECTURE.md`**](ARCHITECTURE.md) | Comprehensive system architecture, module diagrams, and security design | Systems architects |
| [**`AWS_ECS_DEPLOYMENT.md`**](AWS_ECS_DEPLOYMENT.md) | Containerization, Dockerfile, CloudFormation, and ECS deployment guides | AWS DevOps engineers |

---

## ⚡ Super-Quick Cheatsheet

### 🪟 Windows
* **One-Click:** Double-click `run.bat`
* **Command Line:**
  ```cmd
  copy .env.example .env
  npm install
  npm start
  ```
  App runs on `http://localhost:5001`.

### 🐧 Ubuntu / Linux
* **One-Click:** `./run.sh`
* **Development:**
  ```bash
  cp .env.example .env
  npm install
  npm start
  ```
* **Production Background (PM2):**
  ```bash
  pm2 start server.js --name tutortime
  pm2 save
  ```

---

## 🧪 Testing

```bash
npm test                # Run all test suites
npm run check:todos     # Check for unapproved TODO markers
npm run check:copy      # Validate copy integrity
```
