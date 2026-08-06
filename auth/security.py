from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
import bcrypt

from auth.dependencies import get_db
from auth.schemas import TokenData
from core.config import settings

def get_password_hash(password: str) -> str:
    """비밀번호를 bcrypt 알고리즘을 사용해 암호화(단방향 해시)하여 반환합니다."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """사용자가 입력한 비밀번호와 DB에 저장된 암호화된 비밀번호가 일치하는지 검증합니다."""
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """주어진 데이터(페이로드)를 바탕으로 JWT Access Token을 생성합니다."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(datetime.timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    
    # 토큰 만료 시간 추가
    to_encode.update({"exp": expire})
    # 시크릿 키와 알고리즘을 사용해 토큰 생성
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt


# FastAPI의 보안 의존성 처리 객체 (토큰을 얻는 엔드포인트 URL 지정)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme), db = Depends(get_db)):
    """
    클라이언트가 보낸 JWT 토큰을 검증하고, 유효한 경우 현재 로그인된 사용자 객체를 반환합니다.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # 토큰 디코딩 및 검증 (이전 스텝에서 만든 SECRET_KEY, ALGORITHM 변수 활용)
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        username = payload.get("sub")
        if username is None:
            raise credentials_exception

        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    # TODO: core.database 및 models 완성 시 실제 DB 조회 로직으로 변경해야 함
    # user = db.query(models.User).filter(models.User.username == token_data.username).first()
    # if user is None:
    #     raise credentials_exception
    # return user

    # 현재는 DB 연동 전이므로, 테스트 통과를 위한 더미 유저 데이터를 반환합니다.
    from datetime import datetime
    return {
        "id": 1,
        "username": token_data.username,
        "created_at": datetime.now()
    }