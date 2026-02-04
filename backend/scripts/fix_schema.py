import sys
import os

# Add parent directory to path to import config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from config.settings import POSTGRES_URL

def fix_schema():
    print(f"Connecting to database...")
    engine = create_engine(POSTGRES_URL)
    with engine.connect() as conn:
        print("Attempting to add missing columns...")
        
        # Add voice_uuid column
        try:
            # Check if column exists first to be safe, or just use IF NOT EXISTS if postgres supports it (it does for 9.6+)
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS voice_uuid VARCHAR"))
            print("Successfully processed 'voice_uuid' column.")
        except Exception as e:
            print(f"Error processing 'voice_uuid': {e}")

        # Add enrolled_at column
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS enrolled_at TIMESTAMP"))
            print("Successfully processed 'enrolled_at' column.")
        except Exception as e:
            print(f"Error processing 'enrolled_at': {e}")
            
        conn.commit()
        print("Schema update complete.")

if __name__ == "__main__":
    fix_schema()
