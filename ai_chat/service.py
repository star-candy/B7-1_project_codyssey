import asyncio
import logging
from google import genai
from google.genai import types
from core.config import settings

# 로거 초기화 (터미널 관련 로그 출력 제어)
logger = logging.getLogger("chatbot")

# gemini api를 호출하여 ai 응답을 생성, 반환하는 함수
# 이전 대화 기록 (context)를 넣어 문맥을 유지함. (최대 과거 채팅 이력 3개까지)
# 사용자의 최신 질문 (prompt)을 함께 제공 
# 시간 내 미응답 시 타임아웃 발생시킴 
async def generate_response(prompt: str, context: list = None) -> str:
    
    # API 키가 환경 변수에 설정되어 있지 않은 경우 더미 응답 반환
    if not settings.gemini_api_key:
        logger.warning("Gemini API Key is not set. Returning dummy response.")
        return "I am a dummy AI. Please configure GEMINI_API_KEY in your .env file to enable real AI responses."


    # 내부 비동기 호출 함수 정의
    async def _call_api():
        # gemini api key를 기반으로 gemini client 초기화
        client = genai.Client(api_key=settings.gemini_api_key)
        
        # 모델에 전달할 대화 내역 리스트 구성
        # genai sdk 자료구조 types에 기반함 
            # types.contens는 role과 parts로 구분됨
        # (과거 대화내역, 최신 대화내역 순으로 contents 리스트에 저장)
        contents = []
        if context:
            # DB에서 가져온 최근 대화 기록을 순회하며 역할(role)에 맞춰 추가
            for log in context:
                # 사용자의 질문
                contents.append(
                    types.Content(
                        role="user",
                        parts=[types.Part.from_text(text=log.user_message)]
                    )
                )
                # AI의 응답 (정상적으로 존재할 경우에만)
                if log.ai_response:
                    contents.append(
                        types.Content(
                            role="model",
                            parts=[types.Part.from_text(text=log.ai_response)]
                        )
                    )
        
        # 현재 사용자가 방금 입력한 프롬프트(질문) 추가
        contents.append(
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=prompt)]
            )
        )

        try:
            # I/O 바운드 작업인 외부 API 호출을 스레드풀에서 실행하여 비동기 처리
            # 기본적으로 generate_content는 동기함수이므로 async, awit 비동기 처리 위한 추가 과정 필요
            # asyncio.to_thread를 통해 동기 함수를 비동기함수처럼 동작시킬 수 있음 (타 워커 스레드에서 동작시킴)
            response = await asyncio.to_thread(
                client.models.generate_content,
                model='gemini-2.5-flash',
                contents=contents
            )
            return response.text
        except Exception as e:
            logger.error(f"Error calling AI API: {str(e)}")
            raise e


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
