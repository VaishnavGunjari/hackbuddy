"""
Email notification service for Hackbuddy.
Uses Python's built-in smtplib with SMTP_SSL for sending emails.
"""
import smtplib
import os
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 465))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USER)


def send_email_notification(to_email: str, subject: str, body: str) -> bool:
    """
    Send a plain-text email notification.
    Returns True on success, False if credentials not configured or on error.
    """
    if not SMTP_USER or not SMTP_PASSWORD:
        logger.warning("SMTP credentials not configured — email not sent to %s", to_email)
        return False
    if not to_email:
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"Hackbuddy <{FROM_EMAIL}>"
        msg["To"] = to_email

        # Plain text part
        text_part = MIMEText(body, "plain")
        # HTML part
        html_body = body.replace("\n", "<br>")
        html_part = MIMEText(
            f"""
            <html><body style="font-family: Arial, sans-serif; padding: 20px; background:#0a0a0a; color:#eee">
            <h2 style="color:#a855f7">🚀 Hackbuddy</h2>
            <p>{html_body}</p>
            <hr style="border-color:#333; margin:20px 0">
            <p style="font-size:12px; color:#555">You're receiving this because you're a Hackbuddy member.</p>
            </body></html>
            """,
            "html"
        )
        msg.attach(text_part)
        msg.attach(html_part)

        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(FROM_EMAIL, to_email, msg.as_string())

        logger.info("Email sent to %s: %s", to_email, subject)
        return True

    except Exception as e:
        logger.error("Failed to send email to %s: %s", to_email, str(e))
        return False
