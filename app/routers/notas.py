from fastapi import APIRouter, HTTPException, Depends
from app.database import get_db_connection
from app.models import NotaCreate, NotaResponse
from app.security import get_current_user  # ✅ Importar desde security

router = APIRouter(prefix="/notas", tags=["notas"])

# Solo admin y profesor pueden crear/editar notas
def require_profesor_or_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("rol") not in ["admin", "profesor"]:
        raise HTTPException(status_code=403, detail="Profesor or admin access required")
    return current_user

# Solo admin puede eliminar
def require_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("rol") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# Estudiantes pueden ver solo sus notas
def require_authenticated(current_user: dict = Depends(get_current_user)):
    return current_user

@router.get("/", response_model=list[NotaResponse])
async def get_notas(current_user: dict = Depends(require_profesor_or_admin)):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("""
            SELECT n.id, n.estudiante_id, n.asignatura, n.calificacion, n.periodo, n.creado_por 
            FROM notas n
        """)
        notas = cursor.fetchall()
        return notas
    finally:
        cursor.close()
        conn.close()

@router.get("/mias", response_model=list[NotaResponse])
async def get_mis_notas(current_user: dict = Depends(require_authenticated)):
    if current_user.get("rol") != "estudiante":
        raise HTTPException(status_code=403, detail="Solo estudiantes pueden ver sus notas")
    
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Obtener el ID del estudiante asociado al usuario
        cursor.execute("SELECT id FROM estudiantes WHERE usuario_id = %s", (current_user.get("user_id"),))
        estudiante = cursor.fetchone()
        
        if not estudiante:
            raise HTTPException(status_code=404, detail="No se encontró perfil de estudiante")
        
        cursor.execute("""
            SELECT n.id, n.estudiante_id, n.asignatura, n.calificacion, n.periodo, n.creado_por 
            FROM notas n WHERE n.estudiante_id = %s
        """, (estudiante['id'],))
        
        notas = cursor.fetchall()
        return notas
    finally:
        cursor.close()
        conn.close()

@router.post("/", response_model=NotaResponse)
async def crear_nota(nota_data: NotaCreate, current_user: dict = Depends(require_profesor_or_admin)):
    # Validar calificación
    if nota_data.calificacion < 0 or nota_data.calificacion > 5.0:
        raise HTTPException(status_code=400, detail="La calificación debe estar entre 0 y 5.0")
    
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    cursor = conn.cursor()
    
    try:
        # Verificar que el estudiante existe
        cursor.execute("SELECT id FROM estudiantes WHERE id = %s", (nota_data.estudiante_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Estudiante no encontrado")
        
        # Insertar nota
        cursor.execute(
            """INSERT INTO notas (estudiante_id, asignatura, calificacion, periodo, creado_por) 
               VALUES (%s, %s, %s, %s, %s)""",
            (nota_data.estudiante_id, nota_data.asignatura, nota_data.calificacion, 
             nota_data.periodo, current_user.get("user_id"))
        )
        conn.commit()
        
        # Obtener la nota creada
        cursor.execute("SELECT * FROM notas WHERE id = LAST_INSERT_ID()")
        nueva_nota = cursor.fetchone()
        
        return {
            "id": nueva_nota[0],
            "estudiante_id": nueva_nota[1],
            "asignatura": nueva_nota[2],
            "calificacion": float(nueva_nota[3]),
            "periodo": nueva_nota[4],
            "creado_por": nueva_nota[5]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating note: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@router.delete("/{nota_id}")
async def eliminar_nota(nota_id: int, current_user: dict = Depends(require_admin)):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    cursor = conn.cursor()
    
    try:
        # Verificar que la nota existe
        cursor.execute("SELECT id FROM notas WHERE id = %s", (nota_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Nota no encontrada")
        
        cursor.execute("DELETE FROM notas WHERE id = %s", (nota_id,))
        conn.commit()
        
        return {"message": "Nota eliminada correctamente"}
    
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting note: {str(e)}")
    finally:
        cursor.close()
        conn.close()