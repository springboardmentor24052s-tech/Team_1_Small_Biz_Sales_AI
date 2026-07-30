from database.database import SessionLocal
from database.models import Role

db = SessionLocal()

roles = ["Administrator","Business Owner","Store Manager","Sales Executive"]

for role_name in roles:
    existing_role = db.query(Role).filter(Role.name == role_name).first()

    if not existing_role:
        role = Role(name=role_name)
        db.add(role)

db.commit()

print("✅ Roles inserted successfully!")

db.close()