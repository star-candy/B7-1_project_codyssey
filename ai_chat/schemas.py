# 채팅 메시지 요청 데이터 구조
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000) # 메시지는 비어있지 않아야 함

# 채팅 내역 반환 데이터 구조
class ChatResponse(BaseModel):
    id: int
    user_message: str
    ai_response: Optional[str] = None
    error_status: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True) # Pydantic v2 표준 방식
