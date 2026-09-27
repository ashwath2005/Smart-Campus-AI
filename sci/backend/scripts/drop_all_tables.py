import os
import pymysql
from dotenv import load_dotenv

load_dotenv()

MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "smartcampus")

try:
    conn = pymysql.connect(
        host=MYSQL_HOST,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        port=int(MYSQL_PORT),
        database=MYSQL_DATABASE
    )
    cursor = conn.cursor()
    
    # Disable foreign key checks
    cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
    
    # Get all tables
    cursor.execute("SHOW TABLES")
    tables = [row[0] for row in cursor.fetchall()]
    
    # Drop each table
    print("Dropping all tables in smartcampus database:")
    for table in tables:
        cursor.execute(f"DROP TABLE IF EXISTS `{table}`")
        print(f"- Dropped table: `{table}`")
            
    # Re-enable foreign key checks
    cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
    conn.commit()
    conn.close()
    print("\nAll database tables successfully dropped!")
except Exception as e:
    print(f"Error dropping tables: {e}")
