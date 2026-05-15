"""
Verify and fix database setup for GuardIon
Run this script to check if database permissions are correct
"""

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Database connection details
POSTGRES_USER = "postgres"
POSTGRES_PASSWORD = input("Enter postgres user password: ")
DB_NAME = "guardion_dev"
APP_USER = "guardion_user"

print("\n=== GuardIOn Database Setup Verification ===\n")

try:
    # Connect as postgres superuser
    conn = psycopg2.connect(
        dbname="postgres",
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD,
        host="localhost",
        port=5432
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()
    
    print("✓ Connected to PostgreSQL\n")
    
    # Grant permissions to guardion_user
    print(f"Granting permissions to '{APP_USER}' on database '{DB_NAME}'...")
    
    # Connect to the target database
    conn.close()
    conn = psycopg2.connect(
        dbname=DB_NAME,
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD,
        host="localhost",
        port=5432
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()
    
    # Grant schema permissions
    cursor.execute(f"GRANT ALL ON SCHEMA public TO {APP_USER};")
    print(f"✓ Granted schema permissions")
    
    # Grant table creation permissions
    cursor.execute(f"GRANT CREATE ON SCHEMA public TO {APP_USER};")
    print(f"✓ Granted CREATE permission")
    
    # Grant all privileges on all tables
    cursor.execute(f"GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO {APP_USER};")
    print(f"✓ Granted table privileges")
    
    # Grant all privileges on all sequences
    cursor.execute(f"GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO {APP_USER};")
    print(f"✓ Granted sequence privileges")
    
    # Set default privileges for future tables
    cursor.execute(f"ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO {APP_USER};")
    cursor.execute(f"ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO {APP_USER};")
    print(f"✓ Set default privileges for future objects")
    
    print(f"\n✅ Database permissions fixed successfully!")
    print(f"\nYou can now run: alembic revision --autogenerate -m \"Initial database schema\"")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    print("\nPlease run the following SQL commands manually in psql:")
    print(f"\npsql -U postgres -d {DB_NAME}")
    print(f"GRANT ALL ON SCHEMA public TO {APP_USER};")
    print(f"GRANT CREATE ON SCHEMA public TO {APP_USER};")
    print(f"GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO {APP_USER};")
    print(f"GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO {APP_USER};")
    print(f"ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO {APP_USER};")
    print(f"ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO {APP_USER};")
