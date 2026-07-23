from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime
from database import get_db
from models import User, Role, users_roles
from schemas import UserCreate, UserResponse, UserRoleUpdate, UserRoleUpdateResponse

router = APIRouter(prefix="/users", tags=["users"])

@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    """
    Creates a new system user profile (Administrator only logic mapped).
    """
    # Check if email exists
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        password_hash="pbkdf2:sha256:default_hashed_password"  # Placeholder hash
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Associate default role
    if payload.initial_role:
        role = db.query(Role).filter(Role.name == payload.initial_role).first()
        if role:
            # Add mapping via users_roles Table
            db.execute(users_roles.insert().values(user_id=user.id, role_id=role.id))
            db.commit()
            db.refresh(user)

    return user

@router.put("/{user_id}/role", response_model=UserRoleUpdateResponse)
def update_user_role(user_id: UUID, payload: UserRoleUpdate, db: Session = Depends(get_db)):
    """
    Modifies user access tier mappings (Administrator only access).
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    role = db.query(Role).filter(Role.id == payload.role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    # Clear old roles
    db.execute(users_roles.delete().where(users_roles.c.user_id == user_id))
    
    # Insert new role mapping
    db.execute(users_roles.insert().values(user_id=user_id, role_id=payload.role_id))
    db.commit()

    return {
        "user_id": user.id,
        "updated_role": role.name,
        "timestamp": datetime.utcnow()
    }
