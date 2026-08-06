from fastapi import HTTPException, status
from datetime import datetime
from auth import schemas, security

def create_user(user: schemas.UserCreate, db) -> schemas.UserResponse:
    """
    회원가입 비즈니스 로직:
    아이디 중복을 검사하고, 비밀번호를 해싱한 뒤 DB에 유저를 생성합니다.
    """
    # TODO: core.models 및 DB 연동 시 아래 주석 해제 및 적용
    # db_user = db.query(models.User).filter(models.User.username == user.username).first()
    # if db_user:
    #     raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already registered")
    
    # [임시 더미 로직] "admin"이라는 아이디는 이미 존재한다고 가정하여 에러 발생 테스트
    if user.username == "admin":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already registered")

    # 비밀번호 안전하게 암호화
    hashed_password = security.get_password_hash(user.password)

    # TODO: 실제 DB 객체 생성 및 저장 로직으로 변경
    # new_user = models.User(username=user.username, hashed_password=hashed_password)
    # db.add(new_user)
    # db.commit()
    # db.refresh(new_user)
    # return new_user

    # [임시 더미 로직] DB 저장 성공을 가정하고 Pydantic 응답 스키마 반환
    return schemas.UserResponse(
        id=1,
        username=user.username,
        created_at=datetime.now()
    )

def authenticate_user(username: str, password: str, db) -> schemas.Token:
    """
    로그인 비즈니스 로직:
    유저 존재 여부와 비밀번호를 검증하고, 성공 시 JWT 토큰을 발급합니다.
    """
    # TODO: 실제 DB 조회 및 검증 로직으로 변경
    # user = db.query(models.User).filter(models.User.username == username).first()
    # if not user or not security.verify_password(password, user.hashed_password):
    #     raise HTTPException(...)

    # [임시 더미 로직] "testuser" / "secret123" 조합만 로그인 성공한다고 가정
    if username != "testuser" or password != "secret123":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 검증 성공 시 JWT 토큰 생성
    access_token = security.create_access_token(data={"sub": username})
    
    return schemas.Token(access_token=access_token, token_type="bearer")