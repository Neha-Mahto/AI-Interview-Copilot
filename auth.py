from pydantic import BaseModel
from typing import Optional

class UserCreate(BaseModel):
    email: str
    username: str
    full_name: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    full_name: str
    total_interviews: int = 0
    average_score: float = 0.0
    model_config = {"from_attributes": True}

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    target_role: Optional[str] = None
    experience_years: Optional[float] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str