import json
import logging
import smtplib
import urllib.error
import urllib.request
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger("marketmind.email")


class EmailDeliveryError(RuntimeError):
    pass


def brevo_configured() -> bool:
    key = ""
    if settings.brevo_api_key:
        key = settings.brevo_api_key.get_secret_value().strip()
    elif settings.smtp_password:
        candidate = settings.smtp_password.get_secret_value().strip()
        if candidate.startswith(("xkeysib-", "xsmtpsib-")) or len(candidate) >= 60:
            key = candidate
    from_email = settings.brevo_from_email or settings.smtp_from_email or settings.smtp_username
    return bool(key and from_email)


def resend_configured() -> bool:
    return bool(settings.resend_api_key and settings.resend_api_key.get_secret_value().strip())


def smtp_configured() -> bool:
    return bool(settings.smtp_host and (settings.smtp_from_email or settings.smtp_username))


def email_delivery_configured() -> bool:
    return bool(brevo_configured() or smtp_configured() or resend_configured())


def require_production_email_delivery() -> None:
    pass


def send_via_brevo_api(*, recipient: str, subject: str, body: str) -> bool:
    api_key = ""
    if settings.brevo_api_key:
        api_key = settings.brevo_api_key.get_secret_value().strip()
    elif settings.smtp_password:
        api_key = settings.smtp_password.get_secret_value().strip()
    from_email = settings.brevo_from_email or settings.smtp_from_email or settings.smtp_username

    if not api_key or not from_email:
        return False

    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "api-key": api_key,
        "content-type": "application/json",
        "User-Agent": "MarketMind/1.0",
    }
    payload = {
        "sender": {"name": "MarketMind Security", "email": from_email},
        "to": [{"email": recipient}],
        "subject": subject,
        "textContent": body,
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            logger.info("Brevo API email delivered successfully to %s (HTTP %s)", recipient, response.status)
            return response.status in (200, 201, 202)
    except urllib.error.HTTPError as exc:
        err_body = exc.read().decode("utf-8", errors="ignore")
        logger.error("Brevo API delivery failed to %s: %s", recipient, err_body)
        raise EmailDeliveryError(f"Brevo API failed: {err_body}") from exc
    except Exception as exc:
        logger.error("Brevo API network error to %s: %s", recipient, exc)
        raise EmailDeliveryError(f"Brevo API error: {exc}") from exc


def send_via_resend(*, recipient: str, subject: str, body: str) -> bool:
    api_key = settings.resend_api_key.get_secret_value().strip()
    from_email = settings.resend_from_email or "MarketMind Security <onboarding@resend.dev>"

    url = "https://api.resend.com/emails"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "User-Agent": "MarketMind/1.0",
    }
    payload = {
        "from": from_email,
        "to": [recipient],
        "subject": subject,
        "text": body,
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            logger.info("Resend API email delivered successfully to %s (HTTP %s)", recipient, response.status)
            return response.status in (200, 201)
    except urllib.error.HTTPError as exc:
        err_body = exc.read().decode("utf-8", errors="ignore")
        logger.error("Resend API delivery failed to %s: %s", recipient, err_body)
        raise EmailDeliveryError(f"Resend API delivery failed: {err_body}") from exc
    except Exception as exc:
        logger.error("Resend API error to %s: %s", recipient, exc)
        raise EmailDeliveryError(f"Resend API error: {exc}") from exc


def send_via_smtp(*, recipient: str, subject: str, body: str) -> bool:
    if not smtp_configured():
        return False
    from_addr = settings.smtp_from_email or settings.smtp_username or "noreply@marketmind.ai"
    sender_name = "MarketMind Security"
    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = f"{sender_name} <{from_addr}>" if "<" not in from_addr else from_addr
    message["To"] = recipient
    message.set_content(body)
    try:
        if settings.smtp_port == 465:
            with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=10) as smtp:
                if settings.smtp_username and settings.smtp_password:
                    smtp.login(
                        settings.smtp_username,
                        settings.smtp_password.get_secret_value(),
                    )
                smtp.send_message(message)
        else:
            with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as smtp:
                smtp.ehlo()
                if settings.smtp_starttls:
                    smtp.starttls()
                    smtp.ehlo()
                if settings.smtp_username and settings.smtp_password:
                    smtp.login(
                        settings.smtp_username,
                        settings.smtp_password.get_secret_value(),
                    )
                smtp.send_message(message)
        logger.info("SMTP email delivered successfully to %s via %s", recipient, settings.smtp_host)
        return True
    except (OSError, smtplib.SMTPException) as exc:
        logger.error("SMTP delivery failed to %s via %s: %s", recipient, settings.smtp_host, exc)
        raise EmailDeliveryError(f"SMTP email delivery failed: {exc}") from exc


def send_security_email(*, recipient: str, subject: str, body: str) -> bool:
    if recipient.endswith(("@example.com", ".example.com", "@marketmind.local")):
        return True

    # 1. Try Brevo HTTP API (Fastest & most reliable over HTTPS)
    if brevo_configured():
        try:
            return send_via_brevo_api(recipient=recipient, subject=subject, body=body)
        except Exception as exc:
            logger.warning("Brevo API attempt failed (%s), attempting SMTP...", exc)

    # 2. Try Standard SMTP (Brevo / Gmail / Hostinger)
    if smtp_configured():
        try:
            return send_via_smtp(recipient=recipient, subject=subject, body=body)
        except Exception as exc:
            logger.warning("SMTP attempt failed (%s), attempting Resend fallback...", exc)

    # 3. Try Resend API (Fallback)
    if resend_configured():
        try:
            return send_via_resend(recipient=recipient, subject=subject, body=body)
        except Exception as exc:
            logger.warning("Resend attempt failed: %s", exc)

    return False


def send_invitation_email(*, recipient: str, full_name: str, token: str) -> bool:
    return send_security_email(
        recipient=recipient,
        subject="🔐 MarketMind Employee Account Activation",
        body=(
            f"Hello {full_name},\n\n"
            "Your Business Owner has invited you to join the MarketMind Sales & Intelligence workspace.\n\n"
            "Please open the MarketMind sign-in page, select 'Activate Account', and enter your one-time activation token:\n\n"
            f"👉  {token}  👈\n\n"
            "Set your password to confirm ownership of this account. This token will expire shortly for security.\n\n"
            "— MarketMind System Security"
        ),
    )


def send_password_reset_email(*, recipient: str, full_name: str, token: str) -> bool:
    return send_security_email(
        recipient=recipient,
        subject="🔐 MarketMind Password Reset OTP",
        body=(
            f"Hello {full_name},\n\n"
            "We received a request to reset your password for your MarketMind account.\n\n"
            "Your 6-digit one-time password reset OTP is:\n\n"
            f"👉  {token}  👈\n\n"
            "Enter this 6-digit OTP code in the Forgot Password window to set your new password.\n"
            "This OTP will expire in 30 minutes. If you did not initiate this request, you can safely ignore this email.\n\n"
            "— MarketMind System Security"
        ),
    )


def send_verification_email(*, recipient: str, full_name: str, token: str) -> bool:
    return send_security_email(
        recipient=recipient,
        subject="🔐 Your MarketMind Registration Verification OTP",
        body=(
            f"Hello {full_name},\n\n"
            "Thank you for registering your business workspace on MarketMind!\n\n"
            "Your 6-digit One-Time Password (OTP) for account verification is:\n\n"
            f"👉  {token}  👈\n\n"
            "Please enter this 6-digit OTP code in the verification popup to confirm your email address and activate your account.\n\n"
            "This OTP is valid for 30 minutes.\n\n"
            "— MarketMind System Security"
        ),
    )


def send_business_deletion_otp_email(
    *, recipient: str, full_name: str, business_name: str, token: str
) -> bool:
    return send_security_email(
        recipient=recipient,
        subject=f"⚠️ Action Required: Confirmation OTP to Schedule Deletion of {business_name}",
        body=(
            f"Hello {full_name},\n\n"
            f"We received a request from the Business Owner to schedule the deletion of your business workspace: '{business_name}'.\n\n"
            f"Your 6-digit confirmation OTP is:\n\n"
            f"👉  {token}  👈\n\n"
            "CRITICAL INFORMATION ABOUT DELETION:\n"
            "1. Once you confirm with this OTP, your workspace will enter a 15-day grace period and all team member logins will be temporarily blocked.\n"
            "2. IF YOU LOGIN AGAIN WITHIN 15 DAYS, YOUR BUSINESS WILL AUTOMATICALLY BE RESTORED AND REACTIVATED (no data will be deleted).\n"
            "3. If you do NOT login within 15 days, all data, invoices, products, staff accounts, and business history will be permanently and irreversibly deleted.\n\n"
            "This confirmation OTP is valid for 30 minutes. If you did not initiate this request, please secure your password immediately.\n\n"
            "— MarketMind Security & Governance"
        ),
    )


def send_business_deletion_scheduled_email(
    *, recipient: str, full_name: str, business_name: str, due_date: str
) -> bool:
    return send_security_email(
        recipient=recipient,
        subject=f"⚠️ Business Deletion Scheduled (15-Day Grace Period): {business_name}",
        body=(
            f"Hello {full_name},\n\n"
            f"Your business workspace '{business_name}' has been scheduled for deletion.\n\n"
            f"• Grace Period Deadline: {due_date}\n"
            "• Current Status: Temporarily Suspended (Staff logins blocked)\n\n"
            "HOW TO RESTORE YOUR BUSINESS:\n"
            "If you change your mind, simply log in to your MarketMind Business Owner account before the deadline. Logging in will automatically cancel the deletion and restore all your business data, staff access, and transactions immediately.\n\n"
            f"If you do not log in by {due_date}, all business records will be permanently erased.\n\n"
            "— MarketMind Security & Governance"
        ),
    )
