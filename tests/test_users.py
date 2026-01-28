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
    Test the /api/v1/users/ endpoint.
    Ensures:
      - API returns 200 OK
      - Response is a list
      - Each user has id and name fields
    """

    async with AsyncClient(app=app, base_url=API_BASE_URL) as ac:
        response = await ac.get("/api/v1/users/")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    # Basic structure validation
    assert isinstance(data, list)
    assert len(data) > 0

    for user in data:
        assert "id" in user
        assert "name" in user


@pytest.mark.asyncio
async def test_user_content():
    """
    Validate the sample user content.
    (Based on your implementation)
    """

    async with AsyncClient(app=app, base_url=API_BASE_URL) as ac:
        response = await ac.get("/api/v1/users/1")

    users = response.json()

    # You can adjust this based on your real DB later
    assert users[0]["name"] in ["Alice", "Bob"]
