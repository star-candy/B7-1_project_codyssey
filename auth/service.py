from fastapi import HTTPException, status
from auth import security
from core import models, schemas

def create_user(user: schemas.UserCreate, db) -> schemas.UserResponse:
    """
    회원가입 비즈니스 로직:
    아이디 중복을 검사하고, 비밀번호를 해싱한 뒤 DB에 유저를 생성합니다.
    """
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already registered")

    # 비밀번호 안전하게 암호화
    hashed_password = security.get_password_hash(user.password)

    new_user = models.User(username=user.username, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

def authenticate_user(username: str, password: str, db) -> schemas.Token:
    """
    로그인 비즈니스 로직:
    유저 존재 여부와 비밀번호를 검증하고, 성공 시 JWT 토큰을 발급합니다.
    """
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user or not security.verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 검증 성공 시 JWT 토큰 생성
    access_token = security.create_access_token(data={"sub": username})
    
    return schemas.Token(access_token=access_token, token_type="bearer")