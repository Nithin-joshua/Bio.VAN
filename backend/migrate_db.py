
from database.postgres_client import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        print("Migrating database...")
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS biometric_synced BOOLEAN DEFAULT FALSE"))
        conn.commit()
        print("Schema updated successfully.")

if __name__ == "__main__":
    migrate()
