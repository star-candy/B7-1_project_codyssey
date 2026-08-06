import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # 애플리케이션 이름
    app_name: str = "Codyssey AI Chatbot"
    # 데이터베이스 연결 URL (SQLite 사용)
    database_url: str = "sqlite:///./chatbot.db"
    # Gemini AI API 키
    gemini_api_key: str = ""
    # JWT 서명에 사용할 시크릿 키
    secret_key: str = ""
    # JWT 암호화 알고리즘
    algorithm: str = ""
    # 토큰 만료 시간 (분)
    access_token_expire_minutes: int = 0
    # AI 응답 대기 시간 (초) - 타임아웃 처리에 사용
    ai_timeout_seconds: int = 10

    class Config:
        # 환경 변수를 읽어올 .env 파일 지정
        env_file = ".env"

# 설정 인스턴스 생성 (앱 전체에서 공유)
settings = Settings()
