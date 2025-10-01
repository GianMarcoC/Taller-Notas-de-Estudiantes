from fastapi import APIRouter, HTTPException, Depends
from app.database import get_db_connection
from app.models import UserResponse
from app.security import verify_token

router = APIRouter(prefix="/usuarios", tags=["usuarios"])

# Dependency para verificar token y roles
def get_current_user(token: str = Depends(lambda: None)):
    if not token:
        raise HTTPException(status_code=401, detail="Token missing")
    
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return payload

def require_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("rol") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

@router.get("/", response_model=list[UserResponse])
async def get_usuarios(current_user: dict = Depends(require_admin)):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("SELECT id, email, rol, nombre FROM usuarios")
        usuarios = cursor.fetchall()
        return usuarios
    finally:
        cursor.close()
        conn.close()

@router.get("/{usuario_id}", response_model=UserResponse)
async def get_usuario(usuario_id: int, current_user: dict = Depends(require_admin)):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("SELECT id, email, rol, nombre FROM usuarios WHERE id = %s", (usuario_id,))
        usuario = cursor.fetchone()
        
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        return usuario
    finally:
        cursor.close()
        conn.close()

@router.delete("/{usuario_id}")
async def delete_usuario(usuario_id: int, current_user: dict = Depends(require_admin)):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    cursor = conn.cursor()
    
    try:
        # Verificar que el usuario existe
        cursor.execute("SELECT id FROM usuarios WHERE id = %s", (usuario_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        # No permitir eliminarse a sí mismo
        if current_user.get("user_id") == usuario_id:
            raise HTTPException(status_code=400, detail="No puedes eliminarte a ti mismo")
        
        cursor.execute("DELETE FROM usuarios WHERE id = %s", (usuario_id,))
        conn.commit()
        
        return {"message": "Usuario eliminado correctamente"}
    
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting user: {str(e)}")
    finally:
        cursor.close()
        conn.close()