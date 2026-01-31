import sys
import os

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database.postgres_client import SessionLocal, User
from core.security import verify_password, get_password_hash

def test_login():
    email = "admin@biovan.internal"
    password = "securepassword123"
    
    print(f"Testing login for: {email}")
    
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            print("ERROR: User not found in database!")
            return
            
        print(f"User found: ID={user.id}, Role={user.role}")
        print(f"Stored Hash: {user.hashed_password}")
        
        # Test verification
        is_valid = verify_password(password, user.hashed_password)
        if is_valid:
            print("SUCCESS: Password verified correctly!")
        else:
            print("FAILURE: Password verification failed.")
            
            # Debug hash generation
            new_hash = get_password_hash(password)
            print(f"New Hash of '{password}': {new_hash}")
            
    finally:
        db.close()

if __name__ == "__main__":
    test_login()
