import sys
import os
import random

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pymilvus import connections, utility, Collection, CollectionSchema, FieldSchema, DataType

def test_milvus_health():
    print("Testing Milvus Health...")
    try:
        connections.connect(alias="default", host="localhost", port="19530")
        print("Connected to Milvus.")
        
        cols = utility.list_collections()
        print(f"Collections found: {cols}")
        
        # Try to Create, Insert, Search, Drop a dummy collection
        collection_name = "health_check_" + str(random.randint(1000, 9999))
        
        fields = [
            FieldSchema(name="pk", dtype=DataType.INT64, is_primary=True, auto_id=True),
            FieldSchema(name="vec", dtype=DataType.FLOAT_VECTOR, dim=4)
        ]
        schema = CollectionSchema(fields, "Health check")
        
        c = Collection(collection_name, schema)
        print(f"Created collection {collection_name}")
        
        import numpy as np
        vectors = [[random.random() for _ in range(4)] for _ in range(10)]
        c.insert([vectors])
        print("Inserted data")
        
        c.create_index("vec", {"index_type": "IVF_FLAT", "metric_type": "L2", "params": {"nlist": 128}})
        c.load()
        print("Loaded collection")
        
        res = c.search([vectors[0]], "vec", {"metric_type": "L2", "params": {"nprobe": 10}}, limit=1)
        print(f"Search result: {res}")
        
        c.drop()
        print("Dropped collection")
        print("Milvus is HEALTHY.")
        
    except Exception as e:
        print(f"Milvus Health Check FAILED: {e}")

if __name__ == "__main__":
    test_milvus_health()
