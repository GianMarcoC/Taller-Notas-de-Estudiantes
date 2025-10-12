import mysql.connector
from mysql.connector import Error

def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host='sistema-notas-db.ctmika2a025d.us-east-2.rds.amazonaws.com',  # Tu Endpoint de AWS
            database='sistema_notas',
            user='admin',                    # Tu Master username
            password='GoMyGCRTES12*',      # Tu Master password
            port=3306,
            auth_plugin='mysql_native_password'
        )
        if connection.is_connected():
            print("✅ Conexión a AWS RDS MySQL exitosa")
            return connection
    except Error as e:
        print(f"❌ Error conectando a AWS RDS: {e}")
        return None