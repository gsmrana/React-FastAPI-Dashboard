import os
import sys
import pytest
from pathlib import Path
from dotenv import load_dotenv

# Add project root to Python path
sys.path.append(str(Path(__file__).parent.parent))

from app.core.config import config
from app.core.email import UserEmailSchema, email_service

# Load environment variables from .env file
load_dotenv()

TEST_EMAIL_TO = os.getenv("TEST_EMAIL_TO")


@pytest.mark.asyncio
async def test_send_welcome_email():
    if not TEST_EMAIL_TO:
        pytest.skip("TEST_EMAIL_TO environment variable not set")

    token = "sample-verification-token"
    body = UserEmailSchema(
        user_name = "User1",
        action_url = f"{config.app_domain}/pages/public/user-verify?token={token}"
    )    
    result = await email_service.send_email(
        recipients = [TEST_EMAIL_TO],
        subject = "Welcome Email",
        template_body = body.model_dump(),
        template_name = "user_welcome.html",
    )
    assert result is not None

@pytest.mark.asyncio
async def test_send_password_recovery_email():
    if not TEST_EMAIL_TO:
        pytest.skip("TEST_EMAIL_TO environment variable not set")

    token = "sample-reset-token"
    body = UserEmailSchema(
        user_name = "User2",
        action_url = f"{config.app_domain}/pages/public/reset-password?token={token}"
    )    
    result = await email_service.send_email(
        recipients = [TEST_EMAIL_TO],
        subject = "Password Recovery Email",
        template_body = body.model_dump(),
        template_name = "reset_password.html",
    )
    assert result is not None

@pytest.mark.asyncio
async def test_send_email_with_attachments():
    if not TEST_EMAIL_TO:
        pytest.skip("TEST_EMAIL_TO environment variable not set")

    file_path = Path(__file__).parent.parent / "README.md"    
    result = await email_service.send_email(
        recipients = [TEST_EMAIL_TO],
        subject = "Email with Attachments",
        body = "Please find the attached file(s).",
        attachment_files=[str(file_path)],
    )
    assert result is not None

@pytest.mark.asyncio
async def test_send_email_with_buffer_attachments():
    if not TEST_EMAIL_TO:
        pytest.skip("TEST_EMAIL_TO environment variable not set")

    file_path = Path(__file__).parent.parent / "README.md" 
    with open(file_path, "rb") as f:
        file_buffer = f.read()
    result = await email_service.send_email_with_buffer_attachments(
        recipients = [TEST_EMAIL_TO],
        subject = "Email with Buffer Attachments",
        body = "Please find the attached file(s).",
        attachments=[("README.md", file_buffer)],
    )
    assert result is not None
