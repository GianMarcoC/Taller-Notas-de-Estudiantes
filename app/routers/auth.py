# app/routers/auth.py
from fastapi import APIRouter, HTTPException, Depends, Response, Cookie, status
from app.database import get_db_connection
from app.models import LoginRequest, Token, UserCreate, UserResponse
from app.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    verify_token,
    set_auth_cookie,
    clear_auth_cookie
)

router = APIRouter(prefix="/api/auth", tags=["authentication"])

# ---------------------- LOGIN ----------------------
@router.post("/login", response_model=dict)
async def login(login_data: LoginRequest, response: Response):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM usuarios WHERE email = %s", (login_data.email,))
        user = cursor.fetchone()

        if not user or not verify_password(login_data.password, user['password_hash']):
            raise HTTPException(
                status_code=401,
                detail="Credenciales incorrectas",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Crear token JWT (payload mínimo necesario)
        token_data = {
            "sub": user['email'],
            "rol": user['rol'],
            "user_id": user['id'],
            "nombre": user.get('nombre', '')
        }
        access_token = create_access_token(data=token_data)

        # Poner cookie HttpOnly (secure=True en producción)
        # Ajusta max_age si quieres duración distinta
        set_auth_cookie(response, access_token, max_age=3600)

        # Retornar solo información pública del usuario (NO el token)
        user_public = {
            "id": user['id'],
            "email": user['email'],
            "rol": user['rol'],
            "nombre": user.get('nombre', '')
        }
        return {"message": "Login exitoso", "user": user_public}

    finally:
        cursor.close()
        conn.close()


# ---------------------- REGISTER ----------------------
@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate):
    if user_data.rol not in ['admin', 'profesor', 'estudiante']:
        raise HTTPException(status_code=400, detail="Rol no válido")

    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM usuarios WHERE email = %s", (user_data.email,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="El email ya está registrado")

        try:
            hashed_password = get_password_hash(user_data.password)
        except Exception as hash_error:
            raise HTTPException(status_code=500, detail=f"Error procesando contraseña: {str(hash_error)}")

        cursor.execute(
            """
            INSERT INTO usuarios (email, password_hash, rol, nombre)
            VALUES (%s, %s, %s, %s)
            """,
            (user_data.email, hashed_password, user_data.rol, user_data.nombre)
        )
        conn.commit()

        cursor.execute("SELECT id FROM usuarios WHERE email = %s", (user_data.email,))
        new_user = cursor.fetchone()
        user_id = new_user[0]

        if user_data.rol == "estudiante":
            codigo_estudiante = f"EST{str(user_id).zfill(3)}"
            cursor.execute(
                """
                INSERT INTO estudiantes (usuario_id, codigo_estudiante, nombre)
                VALUES (%s, %s, %s)
                """,
                (user_id, codigo_estudiante, user_data.nombre)
            )
            conn.commit()

        return {
            "id": user_id,
            "email": user_data.email,
            "rol": user_data.rol,
            "nombre": user_data.nombre
        }

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error creando usuario: {str(e)}")
    finally:
        cursor.close()
        conn.close()


# ---------------------- REFRESH TOKEN ----------------------
@router.post("/refresh", response_model=dict)
async def refresh_token(access_token: str = Cookie(None), response: Response = None):
    if not access_token:
        raise HTTPException(status_code=401, detail="No autenticado")

    payload = verify_token(access_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido")

    # Crear nuevo token (podrías querer cambiar expiración)
    new_token = create_access_token(
        data={
            "sub": payload.get("sub"),
            "rol": payload.get("rol"),
            "user_id": payload.get("user_id"),
            "nombre": payload.get("nombre", "")
        }
    )

    # Actualizar cookie
    set_auth_cookie(response, new_token, max_age=3600)
    return {"access_token_refreshed": True}


# ---------------------- GET PROFILE (/me) ----------------------
@router.get("/me", response_model=UserResponse)
async def get_profile(access_token: str = Cookie(None)):
    if not access_token:
        raise HTTPException(status_code=401, detail="No autenticado")
    payload = verify_token(access_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido")
    return {
        "id": payload.get("user_id"),
        "email": payload.get("sub"),
        "rol": payload.get("rol"),
        "nombre": payload.get("nombre", "")
    }


# ---------------------- LOGOUT ----------------------
@router.post("/logout")
async def logout(response: Response):
    clear_auth_cookie(response)
    return {"message": "Sesión cerrada"}
