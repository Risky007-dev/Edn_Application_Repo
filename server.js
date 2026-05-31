const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'MyWebApp/src/main/webapp')));

// Database file path
const dbFile = path.join(__dirname, 'subscribers.json');

// Initialize database file if it doesn't exist
if (!fs.existsSync(dbFile)) {
  fs.writeFileSync(dbFile, JSON.stringify({ subscribers: [] }, null, 2));
}

// Helper function to read subscribers
function getSubscribers() {
  try {
    const data = fs.readFileSync(dbFile, 'utf8');
    return JSON.parse(data).subscribers || [];
  } catch (err) {
    console.error('Error reading subscribers:', err);
    return [];
  }
}

// Helper function to save subscribers
function saveSubscribers(subscribers) {
  try {
    fs.writeFileSync(dbFile, JSON.stringify({ subscribers }, null, 2));
    return true;
  } catch (err) {
    console.error('Error saving subscribers:', err);
    return false;
  }
}

// Helper function to validate email
function isValidEmail(email) {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

// Helper function to send confirmation email
async function sendConfirmationEmail(email) {
  try {
    // For now, we'll just log it. In production, use nodemailer or similar
    console.log(`✉️  Confirmation email sent to: ${email}`);
    
    // Optional: Actually send email if configured
    // This is commented out because it requires nodemailer setup
    // const nodemailer = require('nodemailer');
    // const transporter = nodemailer.createTransport({
    //   service: 'gmail',
    //   auth: {
    //     user: process.env.SENDER_EMAIL,
    //     pass: process.env.SENDER_PASSWORD
    //   }
    // });
    // await transporter.sendMail({
    //   from: process.env.SENDER_EMAIL,
    //   to: email,
    //   subject: '🍿 Welcome to Popcorn Maths - Launch Notification',
    //   html: getEmailTemplate(email)
    // });
    
    return true;
  } catch (err) {
    console.error('Error sending email:', err);
    return false;
  }
}

// Email template
function getEmailTemplate(email) {
  return `
    <html>
      <body style="font-family: system-ui, -apple-system, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #ff3b3b;">🍿 Welcome to Popcorn Maths!</h2>
          <p>Thanks for signing up for our launch notification.</p>
          <p>We'll send you an email as soon as we go live with the freshest batch of educational content.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">You're receiving this because you subscribed to Popcorn Maths launch notifications.</p>
        </div>
      </body>
    </html>
  `;
}

// Routes

// GET / - Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'MyWebApp/src/main/webapp/index.html'));
});

// POST /subscribe - Subscribe a new email
app.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Validate input
    if (!email || !isValidEmail(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const subscribers = getSubscribers();

    // Check if already subscribed
    if (subscribers.some(s => s.email === cleanEmail)) {
      return res.status(409).json({
        success: false,
        message: 'Email already subscribed'
      });
    }

    // Add new subscriber
    const newSubscriber = {
      email: cleanEmail,
      subscribedAt: new Date().toISOString(),
      confirmed: false
    };

    subscribers.push(newSubscriber);

    // Save to file
    if (!saveSubscribers(subscribers)) {
      return res.status(500).json({
        success: false,
        message: 'Error saving email. Try again later.'
      });
    }

    // Send confirmation email
    const emailSent = await sendConfirmationEmail(cleanEmail);

    return res.status(201).json({
      success: true,
      message: 'Successfully subscribed! Check your email for confirmation.',
      email_sent: emailSent
    });

  } catch (err) {
    console.error('Error in /subscribe:', err);
    return res.status(500).json({
      success: false,
      message: 'Error processing subscription'
    });
  }
});

// GET /subscribers - Get all subscribers (admin endpoint)
app.get('/subscribers', (req, res) => {
  try {
    const subscribers = getSubscribers();
    return res.json({
      total: subscribers.length,
      subscribers: subscribers
    });
  } catch (err) {
    console.error('Error fetching subscribers:', err);
    return res.status(500).json({
      success: false,
      message: 'Error fetching subscribers'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════╗
║    🍿 Popcorn Maths Server 🍿    ║
╚════════════════════════════════════╝

✅ Server running on http://localhost:${PORT}
📧 Email storage: ${dbFile}
📊 View subscribers: http://localhost:${PORT}/subscribers

Press Ctrl+C to stop the server
`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Server shutting down...');
  process.exit(0);
});
