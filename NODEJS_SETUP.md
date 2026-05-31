# Node.js/Express Email System

Complete email subscription system built with Node.js and Express.

## ✅ What's Included

- ✅ **Express.js Backend** - Modern Node.js web server
- ✅ **JSON File Storage** - Email data stored in `subscribers.json`
- ✅ **Email Validation** - Both client and server-side
- ✅ **REST API** - Two endpoints for subscriptions
- ✅ **Error Handling** - Comprehensive error messages
- ✅ **Automatic Startup** - Batch script for Windows

## 🚀 Quick Start

### Option 1: Double-Click Batch Script (Easiest)
Simply **double-click** `start-server.bat` in the project folder.

The server will start automatically on `http://localhost:5001`

### Option 2: PowerShell Commands

```powershell
# Add Node.js to PATH
$env:Path += ";C:\Program Files\nodejs"

# Navigate to project
cd C:\Users\oyene\Documents\AI\Edn_Application_Repo

# Start the server
node server.js

# Or use npm
npm start
```

## 📖 How It Works

### Architecture

```
Frontend (index.html)
    ↓ POST /subscribe
    ↓
Express Server (server.js)
    ↓ Validate email
    ↓ Check duplicates
    ↓
JSON File (subscribers.json)
    ↓ Store email + timestamp
    ↓
Console Output ✅
    ↓ "Confirmation email sent to: user@example.com"
```

### API Endpoints

#### POST /subscribe
Subscribe a new email

**Request:**
```bash
curl -X POST http://localhost:5001/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Successfully subscribed! Check your email for confirmation.",
  "email_sent": true
}
```

**Error Response (400/409):**
```json
{
  "success": false,
  "message": "Email already subscribed"
}
```

#### GET /subscribers
Get all subscribers

**Request:**
```bash
curl http://localhost:5001/subscribers
```

**Response:**
```json
{
  "total": 3,
  "subscribers": [
    {
      "email": "user1@example.com",
      "subscribedAt": "2026-05-30T10:30:00.000Z",
      "confirmed": false
    }
  ]
}
```

## 📁 File Structure

```
MyWebApp/
├── src/main/webapp/
│   ├── index.html              # Frontend (unchanged)
│   └── flasktest.py            # (Old Flask code - not used)
├── server.js                   # Express.js server ✨
├── package.json                # Node.js dependencies
├── .env                        # Configuration
├── start-server.bat            # Windows startup script
├── subscribers.json            # Email storage
└── node_modules/               # Dependencies (auto-created)
```

## 🗄️ Database (subscribers.json)

Emails are stored in a simple JSON format:

```json
{
  "subscribers": [
    {
      "email": "user@example.com",
      "subscribedAt": "2026-05-30T10:30:00.000Z",
      "confirmed": false
    }
  ]
}
```

Edit this file directly to add/remove emails, or use the API endpoints.

## ⚙️ Configuration

Edit `.env` file to customize settings:

```env
PORT=5001                    # Server port (default: 5001)
NODE_ENV=development         # Environment mode

# Optional: Email sending (requires nodemailer setup)
# SENDER_EMAIL=your-email@gmail.com
# SENDER_PASSWORD=your-app-password
# SMTP_SERVER=smtp.gmail.com
# SMTP_PORT=587
```

## 🧪 Testing the System

1. **Start the server:**
   ```bash
   node server.js
   ```

2. **Visit the website:**
   ```
   http://localhost:5001
   ```

3. **Subscribe with email:**
   - Enter: `test@example.com`
   - Click "Notify Me"
   - See: "✓ Thanks! Check your email for confirmation."

4. **View subscribers:**
   ```
   http://localhost:5001/subscribers
   ```

5. **Check stored data:**
   - Open `subscribers.json` in the project root
   - See your email stored with timestamp

## 📊 Console Output

When running the server, you'll see:

```
╔════════════════════════════════════╗
║    🍿 Popcorn Maths Server 🍿    ║
╚════════════════════════════════════╝

✅ Server running on http://localhost:5001
📧 Email storage: C:\...\subscribers.json
📊 View subscribers: http://localhost:5001/subscribers

Press Ctrl+C to stop the server
```

When someone subscribes:
```
✉️  Confirmation email sent to: user@example.com
```

## 🔧 Features

| Feature | Implementation | Details |
|---------|-----------------|---------|
| Email validation | Regex pattern | Both client & server |
| Storage | JSON file | Simple, file-based |
| Duplicates | Prevented | Unique email constraint |
| Timestamps | ISO format | When subscribed |
| Errors | HTTP status codes | 400, 409, 500 |
| Console logs | Detailed | Useful for debugging |
| Static files | Express.static | Serves HTML/CSS/JS |

## 📧 Email Sending (Optional)

Currently, emails are logged to console only. To enable actual email sending:

1. Install nodemailer:
   ```bash
   npm install nodemailer
   ```

2. Uncomment the email sending code in `server.js` (lines 84-102)

3. Configure `.env` with your SMTP credentials:
   ```env
   SENDER_EMAIL=your-email@gmail.com
   SENDER_PASSWORD=your-app-password
   ```

4. Restart the server

## ❓ Troubleshooting

### "Command not found: node"
**Solution:** Use full path: `"C:\Program Files\nodejs\node.exe" server.js`
Or use the batch script: `start-server.bat`

### Port already in use
**Solution:** Change PORT in `.env` or kill process on port 5001
```powershell
netstat -ano | findstr :5001
taskkill /PID <PID> /F
```

### Can't write to subscribers.json
**Solution:** Check file permissions or delete and let server recreate it

### Email not being sent
**Note:** Currently logs only. Set up nodemailer to send real emails (see "Email Sending" section)

## 🚀 Deployment

For production deployment:

1. Install PM2 process manager:
   ```bash
   npm install -g pm2
   ```

2. Start with PM2:
   ```bash
   pm2 start server.js --name "popcorn-maths"
   pm2 startup
   pm2 save
   ```

3. Enable email sending with real SMTP service
4. Add authentication to `/subscribers` endpoint
5. Use proper database (SQLite, PostgreSQL, etc.)

## 📞 Support

- **Server won't start?** → Check Node.js installation
- **Emails not saving?** → Check file permissions
- **Port issues?** → Change PORT in `.env`
- **API issues?** → Check browser console for errors

## 🎉 You're All Set!

Run the server and visit `http://localhost:5001`

The email system is fully functional and ready to use!

---

**Next Steps:**
1. Run `start-server.bat`
2. Visit `http://localhost:5001`
3. Test subscription
4. View `subscribers.json`
5. Optional: Set up real email sending
