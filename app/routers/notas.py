from fastapi import APIRouter, HTTPException, Depends, Request
from app.database import get_db_connection
from app.models import NotaCreate, NotaResponse
from app.security import get_current_user
from app.utils.auditoria_logger import registrar_accion

router = APIRouter(prefix="/notas", tags=["notas"])

def require_profesor_or_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("rol") not in ["admin", "profesor"]:
        raise HTTPException(status_code=403, detail="Profesor o admin requerido")
    return current_user

def require_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("rol") != "admin":
        raise HTTPException(status_code=403, detail="Solo admin puede eliminar")
    return current_user

def require_authenticated(current_user: dict = Depends(get_current_user)):
    return current_user

# ✅ Listar todas las notas
@router.get("/", response_model=list[NotaResponse])
async def get_notas(current_user: dict = Depends(require_profesor_or_admin)):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT n.id, n.estudiante_id, n.asignatura, n.calificacion,
                   n.periodo, n.creado_por, n.creado_en,
                   u.nombre AS estudiante_nombre, up.nombre AS creado_por_nombre
            FROM notas n
            JOIN estudiantes e ON n.estudiante_id = e.id
            JOIN usuarios u ON e.usuario_id = u.id
            LEFT JOIN usuarios up ON n.creado_por = up.id
            ORDER BY n.creado_en DESC
        """)
        registrar_accion(current_user["user_id"], "Consultó todas las notas")
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

# ✅ Crear nota
@router.post("/", response_model=NotaResponse)
async def crear_nota(nota_data: NotaCreate, request: Request, current_user: dict = Depends(require_profesor_or_admin)):
    if nota_data.calificacion < 0 or nota_data.calificacion > 5.0:
        raise HTTPException(status_code=400, detail="La calificación debe estar entre 0 y 5.0")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id FROM estudiantes WHERE id = %s", (nota_data.estudiante_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Estudiante no encontrado")

        cursor.execute("""
            INSERT INTO notas (estudiante_id, asignatura, calificacion, periodo, creado_por)
            VALUES (%s, %s, %s, %s, %s)
        """, (nota_data.estudiante_id, nota_data.asignatura, nota_data.calificacion, nota_data.periodo, current_user["user_id"]))
        conn.commit()
        registrar_accion(current_user["user_id"], f"Creó nota para estudiante {nota_data.estudiante_id}", request.client.host)

        cursor.execute("""
            SELECT n.*, u.nombre AS estudiante_nombre
            FROM notas n
            JOIN estudiantes e ON n.estudiante_id = e.id
            JOIN usuarios u ON e.usuario_id = u.id
            WHERE n.id = LAST_INSERT_ID()
        """)
        return cursor.fetchone()
    finally:
        cursor.close()
        conn.close()

# ✅ Actualizar nota
@router.put("/{nota_id}", response_model=NotaResponse)
async def actualizar_nota(nota_id: int, nota_data: NotaCreate, request: Request, current_user: dict = Depends(require_profesor_or_admin)):
    if nota_data.calificacion < 0 or nota_data.calificacion > 5.0:
        raise HTTPException(status_code=400, detail="La calificación debe estar entre 0 y 5.0")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM notas WHERE id = %s", (nota_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Nota no encontrada")

        cursor.execute("""
            UPDATE notas
            SET calificacion=%s, asignatura=%s, periodo=%s
            WHERE id=%s
        """, (nota_data.calificacion, nota_data.asignatura, nota_data.periodo, nota_id))
        conn.commit()
        registrar_accion(current_user["user_id"], f"Actualizó nota ID {nota_id}", request.client.host)

        cursor.execute("""
            SELECT n.*, u.nombre AS estudiante_nombre
            FROM notas n
            JOIN estudiantes e ON n.estudiante_id = e.id
            JOIN usuarios u ON e.usuario_id = u.id
            WHERE n.id = %s
        """, (nota_id,))
        return cursor.fetchone()
    finally:
        cursor.close()
        conn.close()

# ✅ Eliminar nota
@router.delete("/{nota_id}")
async def eliminar_nota(nota_id: int, request: Request, current_user: dict = Depends(require_admin)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM notas WHERE id = %s", (nota_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Nota no encontrada")

        cursor.execute("DELETE FROM notas WHERE id = %s", (nota_id,))
        conn.commit()
        registrar_accion(current_user["user_id"], f"Eliminó nota ID {nota_id}", request.client.host)
        return {"message": "Nota eliminada correctamente"}
    finally:
        cursor.close()
        conn.close()
