from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from core.database import Base

class User(Base):
    """사용자 계정 정보를 저장하는 테이블 모델"""
    __tablename__ = "users"

    # 고유 식별자 (PK)
    id = Column(Integer, primary_key=True, index=True)
    # 로그인 아이디
    username = Column(String(50), unique=True, index=True, nullable=False)
    # 암호화된 비밀번호
    hashed_password = Column(String, nullable=False)
    # 계정 생성 시간 (DB 서버 시간 기준 자동 생성)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
