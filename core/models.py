from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column
from core.database import Base

class User(Base):
    """사용자 계정 정보를 저장하는 테이블 모델"""
    __tablename__ = "users"

    # 고유 식별자 (PK)
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    # 로그인 아이디
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    # 암호화된 비밀번호
    hashed_password: Mapped[str] = mapped_column(String)
    # 계정 생성 시간 (DB 서버 시간 기준 자동 생성)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class ChatLog(Base):
    """사용자와 AI 간의 대화 기록을 저장하는 테이블 모델"""
    __tablename__ = "chat_logs"

    # 고유 식별자 (PK)
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    # 대화를 작성한 사용자의 ID (FK)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    # 사용자가 입력한 질문
    user_message: Mapped[str] = mapped_column(Text)
    # AI가 생성한 응답 내용 (nullable=True이므로 Optional 적용)
    ai_response: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # API 호출 실패나 타임아웃 발생 시의 에러 코드
    error_status: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    # 대화 생성 시간 (DB 서버 시간 기준 자동 생성)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())