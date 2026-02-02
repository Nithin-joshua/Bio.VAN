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


def init_milvus(retries: int = 10, delay: int = 2):
    global _collection

    if _collection is not None:
        return _collection

    last_error = None

    for attempt in range(retries):
        try:
            connections.connect(
                alias="default",
                host="localhost",
                port="19530"
            )

            if not utility.has_collection(MILVUS_COLLECTION):
                fields = [
                    FieldSchema(
                        name="speaker_id",
                        dtype=DataType.VARCHAR,
                        max_length=128,
                        is_primary=True,
                        auto_id=False
                    ),
                    FieldSchema(
                        name="embedding",
                        dtype=DataType.FLOAT_VECTOR,
                        dim=EMBEDDING_DIM
                    )
                ]

                schema = CollectionSchema(
                    fields,
                    description="Speaker embeddings"
                )

                _collection = Collection(
                    name=MILVUS_COLLECTION,
                    schema=schema
                )

                index_params = {
                    "index_type": "IVF_FLAT",
                    "metric_type": "COSINE",
                    "params": {"nlist": 1024}
                }

                _collection.create_index(
                    field_name="embedding",
                    index_params=index_params
                )

            else:
                _collection = Collection(MILVUS_COLLECTION)

            _collection.load()
            print("✅ Milvus connected & collection loaded")
            return _collection

        except Exception as e:
            last_error = e
            print(f"⏳ Milvus not ready (attempt {attempt+1}/{retries}), retrying...")
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
        raise e

    if not results or not results[0]:
        return []

    return results[0]
