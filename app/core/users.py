import uuid
from datetime import date
from typing import Optional
from fastapi import Request, Depends
from fastapi_users import BaseUserManager, FastAPIUsers, UUIDIDMixin
from fastapi_users.authentication import BearerTransport, CookieTransport
from fastapi_users.authentication import AuthenticationBackend, JWTStrategy
from fastapi_users.exceptions import InvalidPasswordException
from fastapi_users.db import SQLAlchemyUserDatabase

from app.core.config import config
from app.core.logger import get_logger
from app.core.email import email_service
from app.models.user import User, get_user_db
from app.schemas.user import UserCreate, UserUpdate


logger = get_logger(__name__)

class UserManager(UUIDIDMixin, BaseUserManager[User, uuid.UUID]):
    reset_password_token_secret = config.jwt_secret_key
    verification_token_secret = config.jwt_secret_key

    async def validate_password(self, password: str, user: UserCreate | UserUpdate):
        if len(password) < 4:
            raise InvalidPasswordException(reason="Password must be at least 4 characters long")

    async def on_after_register(self, user: User, request: Optional[Request] = None):
        logger.info(f"New user registered email: {user.email}, id: {user.id}")

    async def on_after_request_verify(self, user: User, token: str, request: Optional[Request] = None):
        logger.info(f"Verification requested by user: {user.email}, Verification token: {token}")
        subject = f"Welcome to {config.app_name}"
        body = {
            "username": user.full_name,
            "app_name": config.app_name,
            "year": date.today().year,
            "verify_url": f"{config.app_domain}/pages/public/user-verify?token={token}",
            "support_url": f"{config.app_domain}/pages/public/support",
        }
        await email_service.send_email([user.email], subject, template_body=body, template_name="user_welcome.html")

    async def on_after_forgot_password(self, user: User, token: str, request: Optional[Request] = None):
        logger.info(f"Forgot password requested by user: {user.email}, Reset token: {token}")
        subject = f"Password Recovery - {config.app_name}"
        body = {
            "username": user.full_name,
            "app_name": config.app_name,
            "year": date.today().year,
            "reset_url": f"{config.app_domain}/pages/public/reset-password?token={token}",
            "support_url": f"{config.app_domain}/pages/public/support",
        }
        await email_service.send_email([user.email], subject, template_body=body, template_name="reset_password.html")


async def get_user_manager(user_db: SQLAlchemyUserDatabase = Depends(get_user_db)):
    yield UserManager(user_db)

def get_jwt_strategy():
    return JWTStrategy(
        secret=config.jwt_secret_key, 
        lifetime_seconds=config.jwt_lifetime_sec,
    )

transport_type = None
if config.cookie_based_auth:
    transport_type = CookieTransport(
        cookie_max_age=config.jwt_lifetime_sec,
        cookie_secure=False,   # allow cookie in http domain
        cookie_samesite='lax', # not allow in cross-origin request, 'none' requires secure=True
    )
else:
    transport_type = BearerTransport(tokenUrl="auth/jwt/login")

auth_backend = AuthenticationBackend(
    name="jwt",
    transport=transport_type,
    get_strategy=get_jwt_strategy,
)

fastapi_users = FastAPIUsers[User, uuid.UUID](get_user_manager, [auth_backend])
current_active_user = fastapi_users.current_user(active=True)
current_active_superuser = fastapi_users.current_user(active=True, superuser=True)
