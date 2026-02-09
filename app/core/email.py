from pathlib import Path
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from app.core.config import config


EMAIL_TEMPLATE_DIR = "app/templates/email"

email_config = ConnectionConfig(
    MAIL_USERNAME=config.smtp_user,
    MAIL_PASSWORD=config.smtp_password,
    MAIL_SERVER=config.smtp_host,
    MAIL_PORT=config.smtp_port,
    MAIL_FROM=config.smtp_user,
    MAIL_FROM_NAME=config.email_from_name,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
    TEMPLATE_FOLDER = Path(EMAIL_TEMPLATE_DIR),
)

async def send_email(recipients: list[str], subject: str, body: str):
    if not config.email_support_enable:
        return
    
    message = MessageSchema(
        subject=subject,
        recipients=recipients,
        body=body,
        subtype=MessageType.html,
    )

    fm = FastMail(email_config)
    await fm.send_message(message)

async def send_email_template(recipients: list[str], subject: str, template_body: dict):
    if not config.email_support_enable:
        return
    
    message = MessageSchema(
        subject=subject,
        recipients=recipients,
        template_body=template_body,
        subtype=MessageType.html,
    )
 
    fm = FastMail(email_config)
    await fm.send_message(message, template_name="welcome.html")
