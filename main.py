from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.database import engine, Base
from auth.router import router as auth_router

# 애플리케이션 시작 시 데이터베이스에 정의된 모든 테이블을 자동 생성합니다.
Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)

@app.get("/")
def health_check():
    """서버가 살아있는지 확인하는 기본 헬스체크 엔드포인트"""
    return {"status": "ok"}