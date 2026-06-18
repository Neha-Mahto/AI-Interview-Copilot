from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from models import User, RefreshToken
from utils.security import hash_password, verify_password, create_access_token, create_refresh_token
from config import settings
import uuid

class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def get_user_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email).first()

    def get_user_by_username(self, username: str) -> Optional[User]:
        return self.db.query(User).filter(User.username == username).first()

    def create_user(self, data) -> User:
        user = User(
            email=data.email, username=data.username,
            full_name=data.full_name,
            hashed_password=hash_password(data.password),
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def authenticate_user(self, email: str, password: str) -> Optional[User]:
        user = self.get_user_by_email(email)
        if user and verify_password(password, user.hashed_password):
            return user
        return None

    def create_tokens(self, user: User) -> dict:
        access = create_access_token({"sub": str(user.id)})
        refresh = create_refresh_token({"sub": str(user.id)})
        token_obj = RefreshToken(user_id=user.id, token=refresh,
            expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS))
        self.db.add(token_obj)
        self.db.commit()
        return {"access_token": access, "refresh_token": refresh, "token_type": "bearer"}

    def refresh_access_token(self, refresh_token: str) -> Optional[dict]:
        token_obj = self.db.query(RefreshToken).filter(
            RefreshToken.token == refresh_token,
            RefreshToken.is_revoked == False
        ).first()
        if not token_obj or token_obj.expires_at < datetime.utcnow():
            return None
        access = create_access_token({"sub": str(token_obj.user_id)})
        return {"access_token": access, "refresh_token": refresh_token, "token_type": "bearer"}

    def revoke_refresh_token(self, token: str):
        self.db.query(RefreshToken).filter(RefreshToken.token == token).update({"is_revoked": True})
        self.db.commit()

    def update_user(self, user_id, data) -> User:
        user = self.db.query(User).filter(User.id == user_id).first()
        for k, v in data.dict(exclude_unset=True).items():
            setattr(user, k, v)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update_password(self, user_id, new_password: str):
        self.db.query(User).filter(User.id == user_id).update(
            {"hashed_password": hash_password(new_password)})
        self.db.commit()
