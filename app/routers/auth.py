from fastapi import APIRouter, HTTPException, Depends
from app.database import get_db_connection
from app.models import LoginRequest, Token, UserCreate, UserResponse
from app.security import verify_password, get_password_hash, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["authentication"])

# ---------------------- LOGIN ----------------------
@router.post("/login", response_model=Token)
async def login(login_data: LoginRequest):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    cursor = conn.cursor(dictionary=True)
    try:
        # Buscar usuario por email
        cursor.execute("SELECT * FROM usuarios WHERE email = %s", (login_data.email,))
        user = cursor.fetchone()
        
        if not user or not verify_password(login_data.password, user['password_hash']):
            raise HTTPException(
                status_code=401,
                detail="Credenciales incorrectas",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Crear token JWT
        access_token = create_access_token(
            data={"sub": user['email'], "rol": user['rol'], "user_id": user['id']}
        )
        
        return {"access_token": access_token, "token_type": "bearer"}
    
    finally:
        cursor.close()
        conn.close()


# ---------------------- REGISTER ----------------------
@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate):
    """
    Registro de usuario. 
    Si el rol es estudiante, también lo inserta en la tabla 'estudiantes'.
    """
    # Validar el rol
    if user_data.rol not in ['admin', 'profesor', 'estudiante']:
        raise HTTPException(status_code=400, detail="Rol no válido")
    
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    cursor = conn.cursor()

    try:
        # Verificar si el email ya está registrado
        cursor.execute("SELECT id FROM usuarios WHERE email = %s", (user_data.email,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="El email ya está registrado")
        
        # Hashear contraseña
        try:
            hashed_password = get_password_hash(user_data.password)
        except Exception as hash_error:
            raise HTTPException(
                status_code=500, 
                detail=f"Error procesando contraseña: {str(hash_error)}"
            )
        
        # Insertar usuario en la tabla usuarios
        cursor.execute(
            """
            INSERT INTO usuarios (email, password_hash, rol, nombre)
            VALUES (%s, %s, %s, %s)
            """,
            (user_data.email, hashed_password, user_data.rol, user_data.nombre)
        )
        conn.commit()

        # Obtener el ID del usuario recién creado
        cursor.execute("SELECT id FROM usuarios WHERE email = %s", (user_data.email,))
        new_user = cursor.fetchone()
        user_id = new_user[0]

        # ✅ Si el rol es estudiante, también insertarlo en la tabla `estudiantes`
        if user_data.rol == "estudiante":
            codigo_estudiante = f"EST{str(user_id).zfill(3)}"  # Ejemplo: EST001
            cursor.execute(
                """
                INSERT INTO estudiantes (usuario_id, codigo_estudiante, nombre)
                VALUES (%s, %s, %s)
                """,
                (user_id, codigo_estudiante, user_data.nombre)
            )
            conn.commit()
            print(f"✅ Estudiante creado con código {codigo_estudiante}")

        # Retornar el nuevo usuario
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
@router.post("/refresh", response_model=Token)
async def refresh_token(current_user: dict = Depends(get_current_user)):
    """
    Genera un nuevo token manteniendo los datos del usuario actual.
    """
    new_token = create_access_token(
        data={
            "sub": current_user['sub'],
            "rol": current_user['rol'],
            "user_id": current_user['user_id']
        }
    )
    return {"access_token": new_token, "token_type": "bearer"}
