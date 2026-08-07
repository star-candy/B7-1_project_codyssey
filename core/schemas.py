from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

# 회원가입 시 요청받는 데이터 구조
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50) # 아이디는 3~50자 제한
    password: str = Field(..., min_length=4)                # 비밀번호는 4자 이상 제한

# 클라이언트로 반환할 사용자 정보 구조 (비밀번호 제외)
class UserResponse(BaseModel):
    id: int
    username: str
    created_at: datetime

    class Config:
        from_attributes = True  # ORM 모델(SQLAlchemy)을 Pydantic 객체로 변환할 수 있게 설정

# JWT 토큰 반환 구조
class Token(BaseModel):
    access_token: str
    token_type: str

# 채팅 메시지 요청 데이터 구조
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000) # 메시지는 비어있지 않아야 함

# 채팅 내역 반환 데이터 구조
class ChatResponse(BaseModel):
    id: int
    user_message: str
    ai_response: Optional[str] = None
    error_status: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
