from typing import Optional

from pydantic import BaseModel, ConfigDict
from datetime import datetime

class UserCreate(BaseModel):
    """회원가입 시 요청받을 데이터"""
    username: str
    password: str

class UserResponse(BaseModel):
    """응답으로 내려줄 데이터 (비밀번호 제외)"""
    id: int
    username: str
    created_at: datetime

    # SQLAlchemy 모델(ORM)을 Pydantic 모델로 변환할 수 있도록 설정
    model_config = ConfigDict(from_attributes=True) # Pydantic v2 표준 방식

class Token(BaseModel):
    """로그인 성공 시 프론트엔드에 전달할 JWT 토큰 스키마"""
    access_token: str
    token_type: str

# 토큰 디코딩 후 payload 검증용 (선택이지만 흔히 씀)
class TokenData(BaseModel):
    username: Optional[str] = None