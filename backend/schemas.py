from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    full_name: str
    email: str
    role: str

class UserCreate(UserBase):
    password: Optional[str] = None

class UserResponse(UserBase):
    id: str
    voice_profile_status: str
    created_at: datetime

    class Config:
        from_attributes = True
