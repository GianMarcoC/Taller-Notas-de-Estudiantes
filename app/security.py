# app/utils/security.py
from datetime import datetime, timedelta
from jose import JWTError, jwt
import hashlib
import secrets
from fastapi import Response

# Config
SECRET_KEY = "tu_clave_secreta_super_segura_cambiar_en_produccion"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # ajustar

# Password hashing (ya tienes esto, lo dejo igual)
def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        salt, stored_hash = hashed_password.split('$')
        computed_hash = hashlib.sha256((plain_password + salt).encode()).hexdigest()
        return computed_hash == stored_hash
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    salt = secrets.token_hex(16)
    password_hash = hashlib.sha256((password + salt).encode()).hexdigest()
    return f"{salt}${password_hash}"

# JWT creation / verification
def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

# Cookie helpers
def set_auth_cookie(response: Response, token: str, max_age: int = 3600):
    # Nota: secure=True requiere HTTPS. Para pruebas locales en HTTP pon secure=False.
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="Strict",
        max_age=max_age,
        path="/"
    )

def clear_auth_cookie(response: Response):
    response.delete_cookie("access_token", path="/")
