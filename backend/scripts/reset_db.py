import sys
import os

# Add backend directory to sys.path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database.postgres_client import engine, Base
from database.milvus_client import init_milvus
from pymilvus import utility, connections
from config.settings import MILVUS_COLLECTION

def reset_postgres():
    print("Resetting PostgreSQL...")
    with engine.connect() as connection:
        # Disable foreign key checks if necessary, though we don't have complex relationships yet
        connection.execute(text("TRUNCATE TABLE users, auth_logs RESTART IDENTITY CASCADE;"))
        connection.commit()
    print("PostgreSQL tables truncated.")

def reset_milvus():
    print("Resetting Milvus...")
    try:
        # Standard connection
        connections.connect(alias="default", host="localhost", port="19530")
        
        if utility.has_collection(MILVUS_COLLECTION):
            utility.drop_collection(MILVUS_COLLECTION)
            print(f"Collection '{MILVUS_COLLECTION}' dropped.")
        else:
            print(f"Collection '{MILVUS_COLLECTION}' does not exist.")
            
    except Exception as e:
        print(f"Milvus Error: {e}")

if __name__ == "__main__":
    confirm = input("WARNING: This will DELETE ALL DATA. Type 'yes' to proceed: ")
    if confirm.lower() == "yes":
        try:
            reset_postgres()
            reset_milvus()
            print("\nSystem Reset Complete. Please restart the backend server.")
        except Exception as e:
            print(f"\nReset Failed: {e}")
    else:
        print("Operation cancelled.")
