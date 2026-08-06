from datetime import datetime, timedelta, timezone
from jose import jwt
import bcrypt

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
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    
    # 토큰 만료 시간 추가
    to_encode.update({"exp": expire})
    # 시크릿 키와 알고리즘을 사용해 토큰 생성
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt