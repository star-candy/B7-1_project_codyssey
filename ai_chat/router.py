import time
import os
import logging
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ai_chat import schemas
from core import models
from core.database import get_db 
from auth.security import get_current_user
from ai_chat import service

# 로깅 객체 생성
logger = logging.getLogger("chatbot")

# 라우터 초기화
# prefix: api 주소의 접두사, tags: swagger 문서에서 그룹명
router = APIRouter(prefix="/api", tags=["chat"])

# /api/chat 주소로 post 요청시 chat 함수 실행
# 사용자의 질문을 수신하여 DB에 저장한 뒤, AI API를 호출해 답변을 받고 그 결과를 다시 DB에 기록
    # Depends(get_db): 의존성 주입을 통해 데이터베이스 세션을 가져옴
    # Depends(get_current_user): 의존성 주입을 통해 현재 로그인된 사용자의 정보를 가져옴 + 토큰 검증
    # response_model: 응답으로 반환할 데이터 구조를 지정
@router.post("/chat", response_model=schemas.ChatResponse)
async def chat(request: schemas.ChatRequest, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):

    # 요청 추적용 고유 난수 생성
    # 4 바이트 랜덤 값을 16bit 문자열로
    request_id = os.urandom(4).hex() 
    logger.info(f"request_received user_id={current_user.id} path=/api/chat")
    # DB에서 사용자의 최근 채팅 기록 3개 조회 (내림차순, 즉 최신순)
    # 오름차순으로 정렬할 경우 가장 오래된 채팅 3개가 조회되는 문제 발생
    context_logs = db.query(models.ChatLog).filter(models.ChatLog.user_id == current_user.id).order_by(models.ChatLog.id.desc()).limit(3).all()
    # DB 조회 결과는 내림차순(최신순)이므로, AI가 순서대로 읽을 수 있게 뒤집음
    context_logs.reverse()
    
    # 요청이 오자마자 일단 유저의 메시지를 DB에 저장 (AI 답변이 오기 전)
    new_chat = models.ChatLog(user_id=current_user.id, user_message=request.message)
    db.add(new_chat)
    db.commit()
    db.refresh(new_chat)
    
    logger.info(f"ai_call_start user_id={current_user.id} request_id={request_id}")
    start_time = time.time()
    
    ai_response_text = None
    error_status = None
    
    try:
        # gen_response 함수로 ai 답변 return
        ai_response_text = await service.generate_response(request.message, context_logs)
        latency_ms = int((time.time() - start_time) * 1000) # 시간 측정
        logger.info(f"ai_call_success request_id={request_id} latency_ms={latency_ms}")
    except Exception as e:
        error_msg = str(e)
        if error_msg == "AI_TIMEOUT":
            error_status = "AI_TIMEOUT"
            ai_response_text = "현재 응답이 지연되고 있어요. 잠시 후 다시 시도해 주세요. (error: AI_TIMEOUT)"
        else:
            error_status = "AI_ERROR"
            ai_response_text = "AI 서버 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."
        logger.error(f"ai_call_failed request_id={request_id} error={error_status}")
    
    # ai 답변 db에 저장
    new_chat.ai_response = ai_response_text
    new_chat.error_status = error_status
    db.commit()
    db.refresh(new_chat)
    
    if error_status:
        logger.info(f"db_save_failure user_id={current_user.id} chat_id={new_chat.id} error={error_status}")
    else:
        logger.info(f"db_save_success user_id={current_user.id} chat_id={new_chat.id}")
        
    return new_chat


# 현재 로그인된 사용자의 모든 과거 채팅 로그를 시간순(오름차순)으로 반환
@router.get("/me/chats", response_model=list[schemas.ChatResponse])
def get_my_chats(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # 과거 채팅 기록 모두 조회 (과거부터 최신순으로)
    chats = db.query(models.ChatLog).filter(models.ChatLog.user_id == current_user.id).order_by(models.ChatLog.id.asc()).all()
    return chats
