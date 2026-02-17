import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from database.postgres_client import SessionLocal, User
from database.milvus_client import search_embedding
from config.settings import MILVUS_COLLECTION
from pymilvus import Collection, connections

def debug_user(user_id):
    print(f"Inspecting User ID: {user_id}")
    
    # 1. Check Postgres
    db = SessionLocal()
    user = db.query(User).filter(User.id == user_id).first()
    db.close()
    
    if user:
        print(f"Postgres: Found User '{user.full_name}'")
        print(f"   - Voice UUID: {user.voice_uuid}")
        print(f"   - Enrolled At: {user.enrolled_at}")
        
        # 2. Check Milvus
        try:
            connections.connect("default", host="localhost", port="19530")
            collection = Collection(MILVUS_COLLECTION)
            collection.load()
            
            # Query by ID (Milvus stores voice_uuid as 'id' usually, or separate field?)
            # In milvus_client.py, we might need to check how insert happens.
            # Usually we verify by searching.
            
            print(f"Milvus: Connected to '{MILVUS_COLLECTION}'")
            print(f"   - Collection Row Count: {collection.num_entities}")
            
            # Query by 'speaker_id' since that's the primary key field name in Milvus schema
            res = collection.query(expr=f"speaker_id == '{user.voice_uuid}'", output_fields=["speaker_id"])
            if res:
                print(f"Milvus: Vector found for Voice UUID {user.voice_uuid}")
            else:
                print(f"Milvus: NO VECTOR FOUND for Voice UUID {user.voice_uuid}")
                 
        except Exception as e:
            print(f"Milvus Error: {e}")
            
    else:
        print("Postgres: User NOT FOUND.")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        debug_user(sys.argv[1])
    else:
        print("Usage: python debug_user.py <user_id>")
