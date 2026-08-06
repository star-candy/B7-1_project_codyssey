# auth/dependencies.py

# TODO: core/database.py 완성되면 아래 import로 교체하고 이 파일의 get_db 삭제
# from core.database import get_db

def get_db():
    """
    [임시 Mock] 요청당 DB 세션을 생성하는 의존성 함수입니다.
    core.database.get_db가 구현되기 전까지 사용하는 자리표시자(placeholder)이며,
    실제 DB 세션이 아닌 None을 반환합니다.

    주의: 이 함수를 사용하는 모든 서비스 로직은 db 파라미터로 실제 쿼리를 수행할 수 없습니다.
    (auth/service.py의 TODO 주석과 함께 더미 로직으로 동작 중)
    """
    yield None