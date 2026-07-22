from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas.auth import (
    UserCreate, UserResponse, Token,
    LoginRequest, RefreshTokenRequest,
    UserUpdate, ChangePasswordRequest
)
from services.auth_service import AuthService
from utils.security import get_current_user

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=201)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    service = AuthService(db)
    if service.get_user_by_email(user_data.email):
        raise HTTPException(status_code=409, detail="Email already registered")
    if service.get_user_by_username(user_data.username):
        raise HTTPException(status_code=409, detail="Username already taken")
    user = service.create_user(user_data)
    return user

@router.post("/login", response_model=Token)
async def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    user = service.authenticate_user(login_data.email, login_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")
    return service.create_tokens(user)

@router.post("/refresh", response_model=Token)
async def refresh_token(data: RefreshTokenRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    tokens = service.refresh_access_token(data.refresh_token)
    if not tokens:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    return tokens

@router.post("/logout")
async def logout(
    data: RefreshTokenRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = AuthService(db)
    service.revoke_refresh_token(data.refresh_token)
    return {"message": "Logged out successfully"}

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.patch("/me", response_model=UserResponse)
async def update_profile(
    update_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = AuthService(db)
    return service.update_user(current_user.id, update_data)

@router.post("/change-password")
async def change_password(
    data: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = AuthService(db)
    from utils.security import verify_password
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    service.update_password(current_user.id, data.new_password)
    return {"message": "Password changed successfully"}
