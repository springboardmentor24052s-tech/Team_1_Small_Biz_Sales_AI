from utils.security import verify_password

hashed = "$2b$12$.4oOvPUN8DSirlPCoG2FPOl.FFqhaw4nCknSj6vXQZ7dyx4wLODKu"

print(verify_password("Komal@123", hashed))