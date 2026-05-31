# PopCorn Maths Coming Soon Page

A modern coming soon landing page for PopCorn Maths with email subscription, countdown timer, and full backend integration.

## Features

- ✨ Beautiful glassmorphism design with dark theme
- ⏱️ Animated countdown timer to launch date
- 📧 Email subscription with backend storage
- 💌 Automatic confirmation emails
- 🗄️ SQLite database for subscriber management
- 🔒 Email validation (frontend + backend)
- 📱 Fully responsive design

## Project Structure

```
MyWebApp/
├── src/main/webapp/
│   ├── index.html          # Landing page
│   ├── flasktest.py        # Flask backend server
│   └── WEB-INF/
│       └── web.xml         # Tomcat config
├── requirements.txt        # Python dependencies
├── .env.example           # Environment variables template
└── .env                   # (Create this from .env.example)
```

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your settings:
   ```env
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   SENDER_EMAIL=your-email@gmail.com
   SENDER_PASSWORD=your-app-password  # Use Gmail App Password
   DATABASE_URL=sqlite:///subscribers.db
   ```

#### Gmail Setup (Recommended)

If using Gmail for email sending:
1. Enable 2-Factor Authentication on your Google Account
2. Generate an [App Password](https://myaccount.google.com/apppasswords)
3. Use the generated 16-character password in `.env`

### 3. Run the Server

```bash
python MyWebApp/src/main/webapp/flasktest.py
```

The server will start on `http://localhost:5001`

### 4. Access the Application

Open your browser and navigate to:
```
http://localhost:5001
```

## API Endpoints

### POST `/subscribe`
Subscribe a new email to notifications.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Successfully subscribed! Check your email for confirmation.",
  "email_sent": true
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Email already subscribed"
}
```

### GET `/subscribers` (Admin)
Get all subscribers (consider adding authentication for production).

**Response:**
```json
{
  "total": 5,
  "subscribers": [
    {
      "email": "user@example.com",
      "subscribed_at": "2026-05-30T10:30:00",
      "confirmed": false
    }
  ]
}
```

## Database Schema

The application uses SQLite with a `subscribers` table:

| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key |
| email | String | Email address (unique) |
| subscribed_at | DateTime | Subscription timestamp |
| confirmed | Boolean | Email confirmation status |

## Customization

### Change Launch Date
Edit `index.html` line 227:
```javascript
const launchDate = new Date('2026-12-01T15:00:00Z'); // Change this date
```

### Change Sender Email
Update in `.env`:
```env
SENDER_EMAIL=your-new-email@domain.com
```

### Change Email Template
Edit the `send_confirmation_email()` function in `flasktest.py` (lines 75-100)

## Frontend Features

- **Email Validation**: Real-time regex validation on client and server
- **User Feedback**: Clear status messages for all actions
- **Disabled State**: Form disables while request is in progress
- **Responsive Design**: Works on all screen sizes

## Backend Features

- **Email Deduplication**: Prevents duplicate subscriptions
- **HTML & Plain Text Emails**: Both formats for maximum compatibility
- **Error Handling**: Comprehensive error messages and logging
- **Database Persistence**: All subscriptions stored in SQLite

## Troubleshooting

### "Error saving email" message
1. Check if Flask server is running on port 5001
2. Verify `.env` file exists and is configured correctly
3. Check server logs for detailed error messages

### Email not sending
1. Verify SMTP credentials in `.env`
2. Check Gmail App Password (if using Gmail)
3. Ensure less secure app access is enabled (for non-Gmail SMTP)
4. Check firewall/antivirus blocking port 587

### Database issues
1. Delete `subscribers.db` to reset database
2. Restart the server

## Security Considerations (Production)

Before deploying to production:
- [ ] Add authentication to `/subscribers` endpoint
- [ ] Implement rate limiting on `/subscribe` endpoint
- [ ] Use environment variables for all sensitive data
- [ ] Add CORS configuration if needed
- [ ] Implement email verification links
- [ ] Use a production SMTP service (SendGrid, Mailgun, etc.)
- [ ] Add HTTPS/SSL encryption
- [ ] Implement CAPTCHA to prevent bot subscriptions

## License

Popcorn Maths © 2026
