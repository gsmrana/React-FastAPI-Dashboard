from pathlib import Path
from typing import Optional
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType

from app.core.config import config
from app.core.logger import get_logger


EMAIL_TEMPLATE_DIR = Path("app/templates/email")
logger = get_logger(__name__)


class EmailService:
    _instance: Optional['EmailService'] = None
    _initialized: bool = False
    
    def __new__(cls) -> 'EmailService':
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if EmailService._initialized:
            return
            
        self._config: Optional[ConnectionConfig] = None
        self._fast_mail: Optional[FastMail] = None
        EmailService._initialized = True
    
    @property
    def email_config(self) -> ConnectionConfig:
        if self._config is None:
            self._config = ConnectionConfig(
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
                TEMPLATE_FOLDER=EMAIL_TEMPLATE_DIR,
            )
        return self._config
    
    @property
    def fast_mail(self) -> FastMail:
        if self._fast_mail is None:
            self._fast_mail = FastMail(self.email_config)
        return self._fast_mail
        
    async def send_email_message(
        self,
        message: MessageSchema,
        template_name: Optional[str] = None,
    ) -> bool:
        if not config.email_support_enable:
            logger.warning("Email support is disabled. Skipping email to: %s",
                           ", ".join(str(r) for r in message.recipients))
            return False

        await self.fast_mail.send_message(message, template_name)
        logger.info("Email sent successfully with template '%s', recipients: %s",
                    template_name, ", ".join(str(r) for r in message.recipients))
        return True
    
    async def send_email(
        self,
        recipients: list[str],
        subject: str,
        *,
        body: Optional[str] = None,
        template_body: Optional[dict] = None,
        template_name: Optional[str] = None,
        subtype: MessageType = MessageType.html,
    ) -> bool:
        message = MessageSchema(
            recipients=recipients,
            subject=subject,
            body=body,
            template_body=template_body,
            subtype=subtype
        )
        return await self.send_email_message(message, template_name)

# Global instance
email_service = EmailService()
