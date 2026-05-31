# Python Installation Guide for Windows

## Problem
Python is not properly installed or configured on your system. The `pip` command and `python` command are not accessible from PowerShell.

## Solution

### Option 1: Install Python from Official Website (Recommended)

1. **Download Python**
   - Visit: https://www.python.org/downloads/
   - Download the latest Python 3.11 or 3.12 (Windows installer)

2. **Run the Installer**
   - Double-click the downloaded `.exe` file
   - **IMPORTANT:** Check the box that says "Add Python to PATH" ✅
   - Select "Install Now" or customize as needed

3. **Verify Installation**
   ```powershell
   python --version
   pip --version
   ```

### Option 2: Quick Install via Windows Package Manager

If you have `winget` installed (Windows 11+):

```powershell
winget install Python.Python.3.12
```

Then restart your terminal and verify:
```powershell
python --version
```

### Option 3: Microsoft Store (Simplest but Limited)

1. Open Microsoft Store
2. Search for "Python 3.12"
3. Click "Get" to install
4. Wait for installation to complete
5. Disable the app execution alias if needed (see below)

## Disabling Python App Aliases (If Using MS Store Python)

If Python from Microsoft Store is conflicting:

1. Go to **Settings > Apps > Advanced app settings**
2. Scroll down to find "App aliases"
3. Find "python.exe" and "python3.exe"
4. Click on each and toggle OFF to disable the alias

Then install a real Python:
```powershell
winget install Python.Python.3.12
```

## After Installation

1. **Close and reopen PowerShell** (or all terminals)

2. **Navigate to your project:**
   ```powershell
   cd C:\Users\oyene\Documents\AI\Edn_Application_Repo
   ```

3. **Install dependencies:**
   ```powershell
   pip install -r requirements.txt
   ```

4. **Create .env file:**
   ```powershell
   copy .env.example .env
   ```

5. **Edit .env** with your email configuration

6. **Run the server:**
   ```powershell
   python MyWebApp/src/main/webapp/flasktest.py
   ```

7. **Open browser:** http://localhost:5001

## Troubleshooting

### If you still get "pip is not recognized"

Try these commands in order:

```powershell
# Try python.exe explicitly
python.exe -m pip install -r requirements.txt

# Or use py launcher
py -m pip install -r requirements.txt

# Or use python3
python3 -m pip install -r requirements.txt
```

### If nothing works

1. Uninstall Python completely
2. Restart your computer
3. Reinstall Python from https://www.python.org/downloads/
4. **Make sure to check "Add Python to PATH"** during installation

## Verify Setup

After installing Python, verify everything works:

```powershell
# Check Python version
python --version

# Check pip version
pip --version

# Check Python installation location
python -c "import sys; print(sys.executable)"
```

If all commands work, you're ready to proceed!

## Next Steps

Once Python is properly installed:

```powershell
cd C:\Users\oyene\Documents\AI\Edn_Application_Repo

# Install dependencies
pip install -r requirements.txt

# Configure email
copy .env.example .env
# Edit .env with your SMTP credentials

# Run the server
python MyWebApp/src/main/webapp/flasktest.py

# Visit in browser: http://localhost:5001
```

## Need Help?

- Python Official Guide: https://docs.python.org/3/using/windows.html
- pip Documentation: https://pip.pypa.io/
- Flask Setup: https://flask.palletsprojects.com/

---

**Once Python is installed, come back and run:**
```powershell
pip install -r requirements.txt
```
