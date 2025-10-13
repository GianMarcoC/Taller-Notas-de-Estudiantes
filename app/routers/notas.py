from fastapi import APIRouter, HTTPException, Depends
from app.database import get_db_connection
from app.models import NotaCreate, NotaResponse
from app.security import get_current_user

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


# ✅ Listar todas las notas (para profesor/admin)
@router.get("/", response_model=list[NotaResponse])
async def get_notas(current_user: dict = Depends(require_profesor_or_admin)):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT n.id, n.estudiante_id, n.asignatura, n.calificacion,
                   n.periodo, n.creado_por, n.creado_en,
                   u.nombre AS estudiante_nombre,
                   up.nombre AS creado_por_nombre
            FROM notas n
            JOIN estudiantes e ON n.estudiante_id = e.id
            JOIN usuarios u ON e.usuario_id = u.id
            LEFT JOIN usuarios up ON n.creado_por = up.id
            ORDER BY n.creado_en DESC
        """)
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()


# ✅ Ver notas de un estudiante
@router.get("/mias", response_model=list[NotaResponse])
async def get_mis_notas(current_user: dict = Depends(require_authenticated)):
    if current_user.get("rol") != "estudiante":
        raise HTTPException(status_code=403, detail="Solo estudiantes pueden ver sus notas")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id FROM estudiantes WHERE usuario_id = %s", (current_user.get("user_id"),))
        estudiante = cursor.fetchone()
        if not estudiante:
            raise HTTPException(status_code=404, detail="Estudiante no encontrado")

        cursor.execute("""
            SELECT n.id, n.estudiante_id, n.asignatura, n.calificacion, n.periodo,
                   n.creado_por, n.creado_en, u.nombre AS estudiante_nombre
            FROM notas n
            JOIN estudiantes e ON n.estudiante_id = e.id
            JOIN usuarios u ON e.usuario_id = u.id
            WHERE n.estudiante_id = %s
            ORDER BY n.creado_en DESC
        """, (estudiante["id"],))
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()


# ✅ Crear nota
@router.post("/", response_model=NotaResponse)
async def crear_nota(nota_data: NotaCreate, current_user: dict = Depends(require_profesor_or_admin)):
    if nota_data.calificacion < 0 or nota_data.calificacion > 5.0:
        raise HTTPException(status_code=400, detail="La calificación debe estar entre 0 y 5.0")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # Validar estudiante
        cursor.execute("SELECT id FROM estudiantes WHERE id = %s", (nota_data.estudiante_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Estudiante no encontrado")

        # Insertar
        cursor.execute("""
            INSERT INTO notas (estudiante_id, asignatura, calificacion, periodo, creado_por)
            VALUES (%s, %s, %s, %s, %s)
        """, (nota_data.estudiante_id, nota_data.asignatura, nota_data.calificacion, nota_data.periodo, current_user.get("user_id")))
        conn.commit()

        cursor.execute("""
            SELECT n.id, n.estudiante_id, n.asignatura, n.calificacion,
                   n.periodo, n.creado_por, n.creado_en,
                   u.nombre AS estudiante_nombre
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
async def actualizar_nota(nota_id: int, nota_data: NotaCreate, current_user: dict = Depends(require_profesor_or_admin)):
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
async def eliminar_nota(nota_id: int, current_user: dict = Depends(require_admin)):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM notas WHERE id = %s", (nota_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Nota no encontrada")
        cursor.execute("DELETE FROM notas WHERE id = %s", (nota_id,))
        conn.commit()
        return {"message": "Nota eliminada correctamente"}
    finally:
        cursor.close()
        conn.close()
