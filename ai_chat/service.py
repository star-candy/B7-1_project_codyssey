import asyncio
import logging
from google import genai
from google.genai import types
from core.config import settings

# 로거 초기화 (터미널 관련 로그 출력 제어)
logger = logging.getLogger("chatbot")


async def generate_response(prompt: str, context: list = None) -> str:
    """
    Gemini API를 호출하여 AI의 응답을 생성하는 메인 함수입니다.
    이전 대화 기록(context)을 모델에 함께 넘겨주어 문맥(Context)을 유지하게 합니다.
    설정된 시간 내에 응답이 오지 않으면 타임아웃 예외를 발생시킵니다.
    """
    
    # API 키가 환경 변수에 설정되어 있지 않은 경우 더미 응답 반환 (개발용)
    if not settings.gemini_api_key:
        logger.warning("Gemini API Key is not set. Returning dummy response.")
        return "I am a dummy AI. Please configure GEMINI_API_KEY in your .env file to enable real AI responses."

    
    try:
        # 비동기 함수(_call_api)를 주어진 제한 시간(timeout) 동안만 대기
        result = await asyncio.wait_for(_call_api(), timeout=settings.ai_timeout_seconds)
        return result
    except asyncio.TimeoutError:
        # 제한 시간이 초과된 경우
        logger.error("AI API call timed out")
        raise Exception("AI_TIMEOUT")
    except Exception as e:
        # 그 외 API 에러
        raise e
