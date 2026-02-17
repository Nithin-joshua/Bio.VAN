# database/milvus_client.py

import time
from pymilvus import (
    connections,
    Collection,
    FieldSchema,
    CollectionSchema,
    DataType,
    utility,
)

from config.settings import MILVUS_COLLECTION, EMBEDDING_DIM

_collection = None


def reset_milvus_client():
    """Reset the global collection object."""
    global _collection
    _collection = None


def init_milvus(retries: int = 10, delay: int = 2):
    global _collection

    if _collection is not None:
        return _collection

    last_error = None

    for attempt in range(retries):
        try:
            # 1. Connect
            connections.connect(
                alias="default",
                host="localhost",
                port="19530"
            )

            # 2. Check/Create Collection
            if not utility.has_collection(MILVUS_COLLECTION):
                # ... (schema definition remains the same) ...
                fields = [
                    FieldSchema(name="speaker_id", dtype=DataType.VARCHAR, max_length=128, is_primary=True, auto_id=False),
                    FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=EMBEDDING_DIM)
                ]
                schema = CollectionSchema(fields, description="Speaker embeddings")
                _collection = Collection(name=MILVUS_COLLECTION, schema=schema)
                
                # Create Index
                index_params = {
                    "index_type": "IVF_FLAT",
                    "metric_type": "COSINE",
                    "params": {"nlist": 1024}
                }
                _collection.create_index(field_name="embedding", index_params=index_params)
            else:
                _collection = Collection(MILVUS_COLLECTION)

            # 3. Load Collection (Retry if leader unavailable)
            for load_attempt in range(3):
                try:
                    _collection.load()
                    break
                except Exception as e:
                    if "leader not available" in str(e) and load_attempt < 2:
                        print(f"WARN: Milvus leader unavailable during load (attempt {load_attempt+1}), retrying...")
                        time.sleep(1)
                    else:
                        raise e

            print("Milvus connected and collection loaded")
            return _collection

        except Exception as e:
            last_error = e
            print(f"Milvus not ready (attempt {attempt+1}/{retries}): {e}")
            try:
                 connections.disconnect("default")
            except:
                 pass
            time.sleep(delay)

    raise last_error


def insert_embedding(speaker_id: str, embedding: list[float]):
    collection = init_milvus()

    # Delete existing if present (Upsert behavior)
    try:
        collection.delete(f"speaker_id == '{speaker_id}'")
    except Exception as e:
        print(f"Warning during delete: {e}")

    collection.insert([
        {
            "speaker_id": speaker_id,
            "embedding": embedding
        }
    ])

    # 🔴 REQUIRED
    collection.flush()


def search_embedding(embedding: list[float], top_k: int = 1, speaker_id: str = None):
    collection = init_milvus()

    # 🔴 REQUIRED for fresh inserts
    collection.load()

    search_params = {
        "metric_type": "COSINE",
        "params": {"nprobe": 10},
    }

    expr = None
    if speaker_id is not None:
        expr = f"speaker_id == '{speaker_id}'"

    try:
        if speaker_id:
             print(f"DEBUG: Milvus Search (Speaker ID: {speaker_id})")
        else:
             print(f"DEBUG: Milvus Search (Global Scan)")

        results = collection.search(
            data=[embedding],
            anns_field="embedding",
            param=search_params,
            limit=top_k,
            expr=expr,
            consistency_level="Strong",
        )
    except Exception as e:
        print(f"ERROR: Milvus Search Failed: {e}")
        return []

    if not results or not results[0]:
        print("DEBUG: Milvus - No matches found.")
        return []

    print(f"DEBUG: Milvus - Found {len(results[0])} matches. Top Score: {results[0][0].distance}")
    return results[0]

# Alias for testing consistency
get_milvus_client = init_milvus

def delete_embedding(voice_uuid: str):
    collection = init_milvus()
    try:
        # Delete based on primary key (speaker_id in Milvus matches voice_uuid from Postgres)
        expr = f"speaker_id == '{voice_uuid}'"
        collection.delete(expr)
        print(f"DEBUG: Deleted embedding for UUID {voice_uuid}")
    except Exception as e:
        print(f"ERROR: Failed to delete embedding for UUID {voice_uuid}: {e}")

