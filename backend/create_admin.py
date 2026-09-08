from database.postgres_client import SessionLocal, User, init_db
from core.security import get_password_hash
from getpass import getpass

def create_admin_user():
    init_db()
    session = SessionLocal()
    try:
        email = input("Admin email: ").strip()
        password = getpass("Admin password: ")
        if not email or not password:
            raise ValueError("Admin email and password are required")
        
        user = session.query(User).filter(User.email == email).first()
        if user:
            print(f"Updating existing admin user: {email}")
            user.hashed_password = get_password_hash(password)
            user.role = "admin"
        else:
            print(f"Creating new admin user: {email}")
            new_user = User(
                id="ADMIN001",
                full_name="System Administrator",
                email=email,
                role="admin",
                hashed_password=get_password_hash(password),
                voice_profile_status="active",
                voice_uuid="admin-uuid-secure",
                enrolled_at=datetime.utcnow()
            )
            session.add(new_user)
        
        session.commit()
        print("Admin user configured successfully.")
        
    except Exception as e:
        print(f"Failed to create admin user: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    create_admin_user()
