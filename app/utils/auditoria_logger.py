from app.database import get_db_connection
import mysql.connector

def registrar_accion(usuario_id: int, accion: str, ip: str = None):
    """
    Guarda una acción en la tabla de auditoría.
    """
    conn = get_db_connection()
    if not conn:
        print("❌ Error: No se pudo conectar a la base de datos.")
        return

    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO auditoria (usuario_id, accion, ip)
            VALUES (%s, %s, %s)
        """, (usuario_id, accion, ip))
        conn.commit()
        print(f"🧾 Acción registrada: {accion}")
    except mysql.connector.Error as err:
        print(f"⚠️ Error registrando acción en auditoría: {err}")
    finally:
        cursor.close()
        conn.close()
