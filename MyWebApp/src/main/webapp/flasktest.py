import os
import re
import smtplib
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import Flask, render_template, send_from_directory, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Tell Flask where your HTML/CSS/JS live
WEBAPP_DIR = "MyWebApp"

app = Flask(
    __name__,
    template_folder=WEBAPP_DIR,   # where index.html is
    static_folder=WEBAPP_DIR,     # serve css/js/img from same folder
    static_url_path=""            # so /file.png works
)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///subscribers.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Email configuration
SMTP_SERVER = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
SENDER_EMAIL = os.getenv('SENDER_EMAIL', 'your-email@gmail.com')
SENDER_PASSWORD = os.getenv('SENDER_PASSWORD', 'your-app-password')

# Database Model
class Subscriber(db.Model):
    __tablename__ = 'subscribers'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    subscribed_at = db.Column(db.DateTime, default=datetime.utcnow)
    confirmed = db.Column(db.Boolean, default=False)

    def __repr__(self):
        return f'<Subscriber {self.email}>'

# Create tables
with app.app_context():
    db.create_all()

def is_valid_email(email):
    """Validate email format"""
    pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    return re.match(pattern, email) is not None

def send_confirmation_email(email):
    """Send a confirmation email to the subscriber"""
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = '🍿 Welcome to Popcorn Maths - Launch Notification'
        msg['From'] = SENDER_EMAIL
        msg['To'] = email

        # Plain text version
        text = f"""Welcome to Popcorn Maths!

Thanks for signing up for our launch notification. We'll send you an email as soon as we go live.

Expect to hear from us soon!

Best regards,
The Popcorn Maths Team"""

        # HTML version
        html = f"""\
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
        </html>"""

        part1 = MIMEText(text, 'plain')
        part2 = MIMEText(html, 'html')
        msg.attach(part1)
        msg.attach(part2)

        # Send email
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.send_message(msg)
        
        return True
    except Exception as e:
        print(f"Error sending email to {email}: {str(e)}")
        return False

@app.get("/")
def home():
    return render_template("index.html", launch_iso="2025-12-01T15:00:00Z")

@app.post("/subscribe")
def subscribe():
    """Handle email subscription requests"""
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()

        # Validate email
        if not email or not is_valid_email(email):
            return jsonify({'success': False, 'message': 'Invalid email address'}), 400

        # Check if already subscribed
        existing = Subscriber.query.filter_by(email=email).first()
        if existing:
            return jsonify({'success': False, 'message': 'Email already subscribed'}), 409

        # Add to database
        subscriber = Subscriber(email=email, confirmed=False)
        db.session.add(subscriber)
        db.session.commit()

        # Send confirmation email
        email_sent = send_confirmation_email(email)

        return jsonify({
            'success': True,
            'message': 'Successfully subscribed! Check your email for confirmation.',
            'email_sent': email_sent
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error in /subscribe: {str(e)}")
        return jsonify({'success': False, 'message': 'Error processing subscription'}), 500

@app.get("/subscribers")
def get_subscribers():
    """Get all subscribers (admin endpoint - consider adding authentication)"""
    subscribers = Subscriber.query.all()
    return jsonify({
        'total': len(subscribers),
        'subscribers': [
            {'email': s.email, 'subscribed_at': s.subscribed_at.isoformat(), 'confirmed': s.confirmed}
            for s in subscribers
        ]
    }), 200

# (Optional) catch-all to serve other files from webapp/
@app.get("/<path:path>")
def static_proxy(path):
    return send_from_directory(WEBAPP_DIR, path)

if __name__ == "__main__":
    # Use a port that doesn't clash with Tomcat (8080). 5000/5001 are common.
    app.run(host="0.0.0.0", port=5001, debug=True)
