import uuid
from typing import Optional
from fastapi import Request, Depends
from fastapi_users import BaseUserManager, FastAPIUsers, UUIDIDMixin
from fastapi_users.authentication import BearerTransport, CookieTransport
from fastapi_users.authentication import AuthenticationBackend, JWTStrategy
from fastapi_users.db import SQLAlchemyUserDatabase
from app.core.config import config
from app.models.tables import User, get_user_db


class UserManager(UUIDIDMixin, BaseUserManager[User, uuid.UUID]):
    reset_password_token_secret = config.jwt_secret_key
    verification_token_secret = config.jwt_secret_key

    async def on_after_register(self, user: User, request: Optional[Request] = None):
        print(f"New user with id: {user.id} has registered.")

    async def on_after_forgot_password(self, user: User, token: str, request: Optional[Request] = None):
        print(f"Forgot password requested for user id: {user.id}, Reset token: {token}")

    async def on_after_request_verify(self, user: User, token: str, request: Optional[Request] = None):
        print(f"Verification requested for user id: {user.id}, Verification token: {token}")

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
