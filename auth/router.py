from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from auth import service, validators
from auth.dependencies import get_db
from core import schemas

# 라우터 초기 설정
router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user: schemas.UserCreate, db = Depends(get_db)):
    """
    회원가입 API: 
    사용자의 아이디와 비밀번호를 받아 새 계정을 생성합니다.
    """
    # 비즈니스 로직은 service 계층에 위임
    return service.create_user(user=user, db=db)

@router.post("/login", response_model=schemas.Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db = Depends(get_db)
):
    """
    로그인 API: 
    아이디와 비밀번호를 검증하고 정상적인 로그인일 경우 JWT 토큰을 발급합니다.
    """
    # 비즈니스 로직은 service 계층에 위임
    return service.authenticate_user(
        username=form_data.username, 
        password=form_data.password, 
        db=db
    )

@router.get("/validation-rules")
def get_validation_rules():
    """프론트엔드가 회원가입 폼 검증에 사용할 규칙을 반환합니다."""
    return validators.get_validation_rules()
