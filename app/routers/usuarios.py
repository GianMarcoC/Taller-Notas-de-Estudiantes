from fastapi import APIRouter, HTTPException, Depends, Request
from app.database import get_db_connection
from app.models import UserResponse
from app.security import get_current_user
from app.utils.auditoria_logger import registrar_accion

router = APIRouter(prefix="/usuarios", tags=["usuarios"])

def require_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("rol") != "admin":
        raise HTTPException(status_code=403, detail="Acceso solo para administradores")
    return current_user

@router.get("/", response_model=list[UserResponse])
async def get_usuarios(current_user: dict = Depends(require_admin)):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión a la base de datos")

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id, email, rol, nombre FROM usuarios")
        usuarios = cursor.fetchall()
        registrar_accion(current_user["user_id"], "Consultó la lista de usuarios")
        return usuarios
    finally:
        cursor.close()
        conn.close()

@router.get("/{usuario_id}", response_model=UserResponse)
async def get_usuario(usuario_id: int, current_user: dict = Depends(require_admin)):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión a la base de datos")

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id, email, rol, nombre FROM usuarios WHERE id = %s", (usuario_id,))
        usuario = cursor.fetchone()
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        registrar_accion(current_user["user_id"], f"Consultó usuario con ID {usuario_id}")
        return usuario
    finally:
        cursor.close()
        conn.close()

@router.delete("/{usuario_id}")
async def delete_usuario(usuario_id: int, request: Request, current_user: dict = Depends(require_admin)):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión a la base de datos")

    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM usuarios WHERE id = %s", (usuario_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        if current_user.get("user_id") == usuario_id:
            raise HTTPException(status_code=400, detail="No puedes eliminarte a ti mismo")

        cursor.execute("DELETE FROM usuarios WHERE id = %s", (usuario_id,))
        conn.commit()
        registrar_accion(current_user["user_id"], f"Eliminó usuario con ID {usuario_id}", request.client.host)
        return {"message": "Usuario eliminado correctamente"}

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error eliminando usuario: {str(e)}")
    finally:
        cursor.close()
        conn.close()
