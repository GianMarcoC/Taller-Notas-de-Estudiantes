from fastapi import APIRouter, HTTPException
from app.database import get_db_connection

router = APIRouter(
    prefix="/api/estudiantes",
    tags=["Estudiantes"]
)

@router.get("/")
def listar_estudiantes():
    """
    Retorna todos los estudiantes con su código, nombre, correo y promedio de notas.
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error de conexión con la base de datos")

    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT 
                e.id,
                e.codigo_estudiante,
                u.nombre,
                u.email,
                COALESCE(ROUND(AVG(n.calificacion), 2), 0) AS promedio
            FROM estudiantes e
            JOIN usuarios u ON e.usuario_id = u.id
            LEFT JOIN notas n ON e.id = n.estudiante_id
            WHERE u.rol = 'estudiante'
            GROUP BY e.id, e.codigo_estudiante, u.nombre, u.email
            ORDER BY u.nombre ASC
        """)
        estudiantes = cursor.fetchall()

        resultado = []
        for e in estudiantes:
            resultado.append({
                "id": e[0],
                "codigo_estudiante": e[1],
                "nombre": e[2],
                "email": e[3],
                "curso": "N/A",
                "promedio": float(e[4]),
                "estado": "activo" if e[4] >= 3 else "bajo rendimiento"
            })

        return resultado

    except Exception as ex:
        raise HTTPException(status_code=500, detail=f"Error al obtener estudiantes: {str(ex)}")
    finally:
        cursor.close()
        conn.close()
