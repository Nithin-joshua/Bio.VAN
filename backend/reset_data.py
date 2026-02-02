import os
import sys

# Add current directory to path so we can import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.postgres_client import engine, Base
from database.milvus_client import init_milvus
from pymilvus import utility, connections
from config.settings import MILVUS_COLLECTION

def reset_all():
    print("Resetting PostgreSQL...")
    Base.metadata.drop_all(engine)
    print("PostgreSQL tables dropped.")
    Base.metadata.create_all(engine)
    print("PostgreSQL tables recreated.")

    print("Resetting Milvus...")
    try:
        connections.connect(alias="default", host="localhost", port="19530")
        if utility.has_collection(MILVUS_COLLECTION):
            utility.drop_collection(MILVUS_COLLECTION)
            print(f"Milvus collection '{MILVUS_COLLECTION}' dropped.")
        else:
            print(f"Milvus collection '{MILVUS_COLLECTION}' does not exist.")
    except Exception as e:
        print(f"Error resetting Milvus: {e}")

if __name__ == "__main__":
    reset_all()
