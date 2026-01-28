import sys
import pytest
from pathlib import Path

# Add project root to Python path
sys.path.append(str(Path(__file__).parent.parent))
from app.core.email import send_email, send_email_template

RECIPIENT_EMAILS = ["user@example.com"]

@pytest.mark.asyncio
async def test_send_email():
    await send_email(
        recipients=RECIPIENT_EMAILS,
        subject="FastAPI Email Test",
        body="<h3>Wecome to FastAPI Email Service</h3>"
    )
    assert True

@pytest.mark.asyncio
async def test_send_email_template():
    template_body = {
        "username": "User1",
        "app_name": "FastAPI App",
        "year": 2026,
        "verify_url": "https://yourdomain.com/verify_url",
        "support_url": "https://yourdomain.com/support",
    }    
    await send_email_template(
        recipients=RECIPIENT_EMAILS,
        subject="FastAPI Email Test",
        template_body=template_body
    )
    assert True
