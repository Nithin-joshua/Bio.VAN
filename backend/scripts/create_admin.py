
import sys
import os
import argparse

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database.postgres_client import create_user, init_db
from core.security import get_password_hash

def main():
    parser = argparse.ArgumentParser(description="Create initial Admin user")
    parser.add_argument("--name", default="Super Admin")
    parser.add_argument("--email", required=True)
    parser.add_argument("--password", required=True)
    
    args = parser.parse_args()
    
    print(f"Creating Admin: {args.email}")
    
    # Ensure DB tables exist
    init_db()
    
    hashed_pw = get_password_hash(args.password)
    
    try:
        user = create_user(
            full_name=args.name,
            email=args.email,
            role="admin",
            hashed_password=hashed_pw
        )
        print(f"Success! Admin created with ID: {user.id}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
