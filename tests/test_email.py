import sys
import pytest
from pathlib import Path

# Add project root to Python path
sys.path.append(str(Path(__file__).parent.parent))
from app.core.email import email_service

RECIPIENT_EMAILS = ["user@example.com"]


@pytest.mark.asyncio
async def test_send_email():
    subject = "Test Email"
    body = {
        "username": "User1",
        "app_name": "FastAPI App",
        "year": 2026,
        "verify_url": "https://yourdomain.com/verify_url",
        "support_url": "https://yourdomain.com/support",
    }    
    result = await email_service.send_email(
        recipients=RECIPIENT_EMAILS,
        subject=subject,
        template_body=body,
        template_name="user_welcome.html"
    )
    assert result is not None
