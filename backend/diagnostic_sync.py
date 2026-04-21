
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from database.postgres_client import SessionLocal, User
from database.milvus_client import init_milvus
from pymilvus import Collection

def run_diagnostic(repair=False):
    print(f"--- Bio.VAN Synchronization Diagnostic (Repair: {repair}) ---")
    
    # 1. Check Postgres
    session = SessionLocal()
    try:
        pg_users = session.query(User).all()
        print(f"Postgres Users Found: {len(pg_users)}")
        
        pg_uuids = {u.voice_uuid for u in pg_users if u.voice_uuid}
        
        # 2. Check Milvus
        collection = init_milvus()
        
        print("\nChecking cross-ref...")
        for user in pg_users:
            status = user.voice_profile_status
            v_uuid = user.voice_uuid
            
            if not v_uuid:
                print(f"User {user.id} ({user.email}): NO voice_uuid (Status: {status})")
                continue
                
            # Check if exists in Milvus
            res = collection.query(expr=f'speaker_id == "{v_uuid}"', output_fields=["speaker_id"])
            if res:
                print(f"User {user.id} ({user.email}): YES in Milvus (Status: {status})")
                if repair and not user.biometric_synced:
                    user.biometric_synced = True
                    session.commit()
                    print(f"   -> Fixed flag: biometric_synced=True")
            else:
                print(f"User {user.id} ({user.email}): MISSING in Milvus! (Status: {status})")
                if repair and status == "active":
                    print(f"   -> REPAIRING: Setting status to 'pending' to allow re-enrollment.")
                    user.voice_profile_status = "pending"
                    user.biometric_synced = False
                    session.commit()
        
        # 3. Check for Orphans in Milvus
        all_milvus = collection.query(expr="speaker_id != ''", output_fields=["speaker_id"])
        milvus_uuids = {r['speaker_id'] for r in all_milvus}
        
        orphans = milvus_uuids - pg_uuids
        if orphans:
            print(f"\nORPHAN Vectors found in Milvus: {len(orphans)}")
            if repair:
                from database.milvus_client import delete_embedding
                for o in orphans:
                    print(f"   -> Deleting orphan vector {o}")
                    delete_embedding(o)
        else:
            print("\nNo Orphan vectors found in Milvus.")
            
    except Exception as e:
        print(f"Error during diagnostic: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--repair", action="store_true", help="Repair broken links")
    args = parser.parse_args()
    
    run_diagnostic(repair=args.repair)
