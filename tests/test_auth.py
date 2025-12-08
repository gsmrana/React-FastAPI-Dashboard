from app.core.auth import auth_manager

hash = auth_manager.hash_password("1234")
print(hash)
