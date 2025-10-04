from fastapi import APIRouter, HTTPException, Depends
from app.database import get_db_connection
from app.models import LoginRequest, Token, UserCreate, UserResponse
from app.security import verify_password, get_password_hash, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["authentication"])

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
        
        # Crear token
        access_token = create_access_token(
            data={"sub": user['email'], "rol": user['rol'], "user_id": user['id']}
        )
        
        return {"access_token": access_token, "token_type": "bearer"}
    
    finally:
        cursor.close()
        conn.close()

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate):
    # Verificar que el rol sea válido
    if user_data.rol not in ['admin', 'profesor', 'estudiante']:
        raise HTTPException(status_code=400, detail="Rol no válido")
    
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    cursor = conn.cursor()
    
    try:
        # Verificar si el email ya existe
        cursor.execute("SELECT id FROM usuarios WHERE email = %s", (user_data.email,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="El email ya está registrado")
        
        # Hash password con manejo de errores mejorado
        try:
            hashed_password = get_password_hash(user_data.password)
        except Exception as hash_error:
            raise HTTPException(
                status_code=500, 
                detail=f"Error procesando contraseña: {str(hash_error)}"
            )
        
        # Insertar usuario
        cursor.execute(
            "INSERT INTO usuarios (email, password_hash, rol, nombre) VALUES (%s, %s, %s, %s)",
            (user_data.email, hashed_password, user_data.rol, user_data.nombre)
        )
        conn.commit()
        
        # Obtener el usuario creado
        cursor.execute("SELECT id, email, rol, nombre FROM usuarios WHERE email = %s", (user_data.email,))
        new_user = cursor.fetchone()
        
        return {
            "id": new_user[0],
            "email": new_user[1],
            "rol": new_user[2],
            "nombre": new_user[3]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating user: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@router.post("/refresh", response_model=Token)
async def refresh_token(current_user: dict = Depends(get_current_user)):
    # Crear nuevo token con la misma información
    new_token = create_access_token(
        data={"sub": current_user['sub'], "rol": current_user['rol'], "user_id": current_user['user_id']}
    )
    
    return {"access_token": new_token, "token_type": "bearer"}