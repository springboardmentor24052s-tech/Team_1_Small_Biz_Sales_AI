import smtplib
from email.message import EmailMessage

from app.core.config import settings


class EmailDeliveryError(RuntimeError):
    pass


def email_delivery_configured() -> bool:
    return bool(settings.smtp_host and settings.smtp_from_email)


def require_production_email_delivery() -> None:
    if settings.is_production and not email_delivery_configured():
        raise EmailDeliveryError("Email delivery is not configured")


def send_security_email(*, recipient: str, subject: str, body: str) -> bool:
    if not email_delivery_configured():
        return False
    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings.smtp_from_email
    message["To"] = recipient
    message.set_content(body)
    try:
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
    except (OSError, smtplib.SMTPException) as exc:
        raise EmailDeliveryError("Email delivery failed") from exc
    return True


def send_invitation_email(*, recipient: str, full_name: str, token: str) -> bool:
    return send_security_email(
        recipient=recipient,
        subject="Activate your MarketMind employee account",
        body=(
            f"Hello {full_name},\n\n"
            "Your Business Owner invited you to MarketMind. Open the MarketMind sign-in page, "
            "choose 'Activate your account', and use this one-time invitation token:\n\n"
            f"{token}\n\n"
            "Create your password to confirm ownership of this email address. If you were not "
            "expecting this invitation, you can ignore this email."
        ),
    )


def send_password_reset_email(*, recipient: str, full_name: str, token: str) -> bool:
    return send_security_email(
        recipient=recipient,
        subject="Reset your MarketMind password",
        body=(
            f"Hello {full_name},\n\n"
            "Use this one-time token in the Forgot Password window on MarketMind:\n\n"
            f"{token}\n\n"
            "If you did not request a password reset, ignore this email. Existing sessions are "
            "revoked after the password is changed."
        ),
    )


def send_verification_email(*, recipient: str, full_name: str, token: str) -> bool:
    return send_security_email(
        recipient=recipient,
        subject="Verify your MarketMind business account",
        body=(
            f"Hello {full_name},\n\n"
            "Use this one-time token in MarketMind to verify your email address:\n\n"
            f"{token}\n\n"
            "Your workspace remains inactive until this verification is completed."
        ),
    )
