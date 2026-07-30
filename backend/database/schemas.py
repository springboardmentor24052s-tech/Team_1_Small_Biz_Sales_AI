from pydantic import BaseModel, EmailStr

class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str
    role_id: int

class UserLogin(BaseModel):
    email: EmailStr
    password: str

from pydantic import BaseModel

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role_id: int
    is_active: bool

    class Config:
        from_attributes = True

class RoleUpdate(BaseModel):
    role_id: int

class StatusUpdate(BaseModel):
    is_active: bool

from pydantic import BaseModel

class InventoryCreate(BaseModel):
    product_name: str
    category: str
    quantity: int
    price: int


class InventoryResponse(BaseModel):
    id: int
    product_name: str
    category: str
    quantity: int
    price: int

    class Config:
        from_attributes = True

class InventoryUpdate(BaseModel):
    product_name: str
    category: str
    quantity: int
    price: int 