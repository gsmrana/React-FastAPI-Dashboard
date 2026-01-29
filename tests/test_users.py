import sys
import pytest
from pathlib import Path
from fastapi import status
from httpx import AsyncClient

# Add project root to Python path
sys.path.append(str(Path(__file__).parent.parent))
from app.app import app


API_BASE_URL="http://localhost:8000"

@pytest.mark.asyncio
async def test_get_users():
    """
    Test the /admin/users/ endpoint.
    Ensures:
      - API returns 200 OK
      - Response is a list
      - Each user has id and email fields
    """

    async with AsyncClient(app=app, base_url=API_BASE_URL) as ac:
        response = await ac.get("/admin/users/")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    # Basic structure validation
    assert isinstance(data, list)
    assert len(data) > 0

    for user in data:
        assert "id" in user
        assert "email" in user


@pytest.mark.asyncio
async def test_user_content():
    """
    Validate the sample user content.
    """

    async with AsyncClient(app=app, base_url=API_BASE_URL) as ac:
        response = await ac.get("/users/1")

    users = response.json()
    assert users[0]["email"] in ["test_user1@gmail.com", "test_user2@gmail.com"]
