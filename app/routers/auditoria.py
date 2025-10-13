from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db_connection
from app.security import get_current_user
import mysql.connector

router = APIRouter(prefix="/auditoria", tags=["auditoria"])

@router.get("/")
async def obtener_auditoria(current_user: dict = Depends(get_current_user)):
    if current_user.get("rol") != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado: solo administradores")

    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error al conectar con la base de datos")
    
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT 
                a.id,
                u.nombre AS usuario,
                a.accion,
                a.fecha,
                a.ip
            FROM auditoria a
            JOIN usuarios u ON a.usuario_id = u.id
            ORDER BY a.fecha DESC
        """)
        registros = cursor.fetchall()
        return registros
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Error SQL: {err}")
    finally:
        cursor.close()
        conn.close()
