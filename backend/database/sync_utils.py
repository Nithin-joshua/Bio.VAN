# database/sync_utils.py

from typing import List
from database.postgres_client import get_all_users
from database.milvus_client import get_all_embedding_ids, delete_embedding

def purge_orphaned_biometrics():
    """
    Scans for and deletes any Milvus embeddings that don't have a 
    matching user recorded in the Postgres database.
    
    Returns:
        A dictionary containing the number of orphans found and purged.
    """
    print("SYNC: Starting global biometric integrity audit...")
    
    # 1. Get all valid voice_uuids from Postgres
    users = get_all_users()
    valid_uuids = {u.voice_uuid for u in users if u.voice_uuid}
    
    # 2. Get all exists IDs in Milvus
    try:
        milvus_ids = get_all_embedding_ids()
    except Exception as e:
        print(f"SYNC ABORTED: Biometric database unreachable: {e}")
        return {
            "status": "error", 
            "purged_count": 0, 
            "message": f"Biometric database unreachable: {str(e)}. Cleanup aborted to protect data integrity."
        }
    
    # 3. Identify Orphans (Exist in Milvus but not in Postgres)
    orphans = [mid for mid in milvus_ids if mid not in valid_uuids]
    
    if not orphans:
        print("SYNC: Perfect alignment detected. No orphaned biometrics found.")
        return {"status": "success", "purged_count": 0, "message": "Databases are perfectly synchronized."}
    
    print(f"SYNC: Found {len(orphans)} orphaned biometrics. Initiating purge...")
    
    # 4. Delete orphans
    purged = 0
    for voice_uuid in orphans:
        try:
            delete_embedding(voice_uuid)
            purged += 1
            print(f"SYNC: Purged orphan {voice_uuid}")
        except Exception as e:
            print(f"SYNC ERROR: Failed to purge orphan {voice_uuid}: {e}")
            
    return {
        "status": "success",
        "purged_count": purged,
        "total_orphans_found": len(orphans),
        "message": f"Successfully synchronized biometrics. Purged {purged} orphan(s)."
    }
