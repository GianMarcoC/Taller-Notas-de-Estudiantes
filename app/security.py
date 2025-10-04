from datetime import datetime, timedelta
from jose import JWTError, jwt
import hashlib
import secrets
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Configuración
SECRET_KEY = "tu_clave_secreta_super_segura_cambiar_en_produccion"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

security_scheme = HTTPBearer()

# 🔥 SOLUCIÓN DEFINITIVA: SHA256 + Salt
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verificar contraseña usando SHA256"""
    try:
        # Separar el salt y el hash
        salt, stored_hash = hashed_password.split('$')
        # Calcular hash de la contraseña + salt
        computed_hash = hashlib.sha256((plain_password + salt).encode()).hexdigest()
        return computed_hash == stored_hash
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    """Hashear contraseña usando SHA256 con salt"""
    # Generar salt aleatorio
    salt = secrets.token_hex(16)
    # Calcular hash (password + salt)
    password_hash = hashlib.sha256((password + salt).encode()).hexdigest()
    # Devolver salt y hash separados por $
    return f"{salt}${password_hash}"

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

# Dependencia para obtener usuario actual
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security_scheme)):
    token = credentials.credentials
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload