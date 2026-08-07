import time
import os
import logging
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from core import models, schemas
from core.database import get_db
from auth.security import get_current_user
from ai_chat import service

logger = logging.getLogger("chatbot")

router = APIRouter(prefix="/api", tags=["chat"])

@router.post("/chat", response_model=schemas.ChatResponse)
async def chat(request: schemas.ChatRequest, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    채팅 API (인증 필요): 
    사용자의 질문을 수신하여 DB에 저장한 뒤, AI API를 호출해 답변을 받고 그 결과를 다시 DB에 기록합니다.
    """
    request_id = os.urandom(4).hex()
    logger.info(f"request_received user_id={current_user.id} path=/api/chat")
    
    context_logs = db.query(models.ChatLog).filter(models.ChatLog.user_id == current_user.id).order_by(models.ChatLog.id.desc()).limit(3).all()
    context_logs.reverse()
    
    new_chat = models.ChatLog(user_id=current_user.id, user_message=request.message)
    db.add(new_chat)
    db.commit()
    db.refresh(new_chat)
    
    logger.info(f"ai_call_start user_id={current_user.id} request_id={request_id}")
    start_time = time.time()
    
    ai_response_text = None
    error_status = None
    
    try:
        ai_response_text = await service.generate_response(request.message, context_logs)
        latency_ms = int((time.time() - start_time) * 1000)
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
    
    new_chat.ai_response = ai_response_text
    new_chat.error_status = error_status
    db.commit()
    db.refresh(new_chat)
    
    if error_status:
        logger.info(f"db_save_failure user_id={current_user.id} chat_id={new_chat.id} error={error_status}")
    else:
        logger.info(f"db_save_success user_id={current_user.id} chat_id={new_chat.id}")
        
    return new_chat



@router.get("/me/chats", response_model=list[schemas.ChatResponse])
def get_my_chats(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    내 채팅 기록 조회 API (인증 필요):
    현재 로그인된 사용자의 모든 과거 채팅 로그를 시간순(오름차순)으로 반환합니다.
    """
    chats = db.query(models.ChatLog).filter(models.ChatLog.user_id == current_user.id).order_by(models.ChatLog.id.asc()).all()
    return chats
