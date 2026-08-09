# Codyssey AI Chatbot

## 1. 프로젝트 개요
*   **문제 정의**: 사용자가 편리하게 AI와 대화하고 과거 대화 이력을 확인할 수 있는 안정적인 웹 기반 챗봇 서비스 필요
*   **타겟 사용자**: AI의 도움을 받아 정보를 얻거나 작업을 수행하고자 하는 일반 사용자
*   **핵심 시나리오**:
    1. 사용자가 계정을 생성하고 로그인한다.
    2. 챗봇 화면에서 질문을 입력하면, AI가 맥락을 이해하고 응답을 반환한다.
    3. 과거의 대화 기록이 자동으로 저장되어 재로그인 시에도 확인 가능하다.
    4. AI 서버 지연 시 사용자에게 친절한 안내 메시지를 제공한다.

## 2. 시스템 구조
*   **아키텍처**: 프론트엔드/백엔드 분리형 아키텍처 (Next.js + FastAPI + SQLite)
*   **주요 컴포넌트 역할**:
    *   **Frontend (Next.js)**: 사용자 인터페이스 제공 및 비동기 API 통신(Fetch API).
    *   **Backend (FastAPI)**: REST API 서버. 사용자 인증(JWT), 입력 검증, 비즈니스 로직(AI 호출, 에러 핸들링) 처리.
    *   **Database (SQLite + SQLAlchemy)**: 사용자 정보 및 채팅 로그(질문, 응답, 에러 상태, 시간) 영구 저장.
    *   **AI Service (Gemini API)**: `google-generativeai` 라이브러리를 사용해 프롬프트 및 컨텍스트를 기반으로 답변 생성.

## 3. API 명세

### 인증 API
*   `POST /api/auth/register`: 회원가입
    *   요청: `{"username": "user1", "password": "password123"}`
    *   응답: `{"id": 1, "username": "user1", "created_at": "..."}`
*   `POST /api/auth/login`: 로그인 (JWT 발급)
    *   요청: Form Data `username=user1&password=password123`
    *   응답: `{"access_token": "eyJ...", "token_type": "bearer"}`

### 챗봇 API
*   `POST /api/chat`: AI 질문 전송 (Requires Bearer Token)
    *   요청: `{"message": "안녕, 넌 누구니?"}`
    *   응답: `{"id": 1, "user_message": "안녕, 넌 누구니?", "ai_response": "저는 AI 어시스턴트입니다.", "error_status": null, "created_at": "..."}`
*   `GET /api/me/chats`: 내 대화 내역 조회 (Requires Bearer Token)
    *   응답: `[{"id": 1, "user_message": "...", "ai_response": "...", ...}]`

## 4. DB 구조 (ERD / 테이블)

**Users 테이블 (`users`)**
| 필드명 | 타입 | 설명 | 제약조건 |
|---|---|---|---|
| id | Integer | PK | Auto Increment |
| username | String(50) | 사용자 ID | Unique, Not Null |
| hashed_password | String | 암호화된 비밀번호 | Not Null |
| created_at | DateTime | 가입 일시 | 자동 생성 |

**ChatLogs 테이블 (`chat_logs`)**
| 필드명 | 타입 | 설명 | 제약조건 |
|---|---|---|---|
| id | Integer | PK | Auto Increment |
| user_id | Integer | 작성자 ID | FK (users.id), Not Null |
| user_message | Text | 사용자 질문 | Not Null |
| ai_response | Text | AI 응답 내용 | Nullable |
| error_status | String | 에러 상태 코드 | Nullable (예: "AI_TIMEOUT") |
| created_at | DateTime | 채팅 일시 | 자동 생성 |

## 5. 배포 / 실행 방법

### 요구사항
*   Python 3.9+
*   Node.js 20.9+
*   Gemini API Key

### 로컬 실행 방법
이 프로젝트는 백엔드(FastAPI)와 프론트엔드(Next.js)가 분리되어 있으므로 **두 개의 터미널**에서 각각 실행해야 합니다.

**[터미널 1: 백엔드 실행]**
프로젝트 최상단 폴더에서 실행합니다.
```bash
# 1. 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\activate

# 2. 의존성 설치
pip install -r requirements.txt

# 3. 환경 변수 세팅
# 루트 폴더에 .env 파일을 생성하고 GEMINI_API_KEY 등을 입력합니다.

# 4. FastAPI 서버 실행 (포트 8000)
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**[터미널 2: 프론트엔드 실행]**
Node.js 20.9 이상이 필요합니다. `frontend` 폴더로 이동하여 실행합니다.
```bash
# 1. 프론트엔드 디렉토리 이동
cd frontend

# 2. NPM 패키지 설치
npm install

# 3. 환경 변수 설정
cp .env.example .env.local

# 4. Next.js 서버 실행 (포트 3000)
npm run dev
```
**접속:** 브라우저에서 `http://localhost:3000` 또는 `http://localhost:8000` 접속 시 전체 애플리케이션을 사용할 수 있습니다.

### AWS 실행 방법 (Ubuntu EC2 기준)
한 대의 EC2 서버에서 백엔드와 프론트엔드를 모두 띄우는 가이드입니다. Node.js 20.9 이상 버전을 사용합니다.
```bash
# 접속 방법
ssh -i "다운받은키페어이름.pem" ubuntu@복사한퍼블릭IP
# 예시
ssh -i "codyssey_keypair.pem" ubuntu@13.124.238.238

# 1. 시스템 업데이트 및 필요 패키지(Node.js 포함) 설치
sudo apt update
sudo apt install python3-pip python3-venv git curl -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 2. 프로젝트 클론 및 폴더 이동
git clone [본인의 깃허브 레포지토리 주소]
cd B7-1_project_codyssey

# 3. 백엔드 세팅 및 실행
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
nano .env  # 백엔드 환경변수(.env) 세팅
nohup uvicorn main:app --host 0.0.0.0 --port 8000 &

# 4. 프론트엔드 세팅 및 실행
cd frontend
npm install
cp .env.example .env.local
nano .env.local 
npm run build
nohup npm start &

# 브라우저에서 http://[EC2퍼블릭IP]:3000 접속
```

## 6. 팀 구성원 역할 및 개인별 작업 요약 (커밋 시나리오)
이 프로젝트는 총 4명의 팀원이 협업하여 완성하였으며, 기능 단위의 브랜치 전략(`feature/*`, `refactor/*`)을 활용하여 개발을 진행했습니다. 실제 GitHub 커밋 로그에 기반한 팀원별 **전체 작업 내역**은 다음과 같습니다.

### 👩‍💻 팀원 1: 초기 설정, 코어(Core) 모듈 및 DB 연동
**주요 브랜치**: `feature/set-up`, `feature/core`, `refactor/separate-schemas-by-domain`
**역할**: 프로젝트 뼈대 구성, 데이터베이스 모델링 및 Pydantic 데이터 검증 스키마 설계, TDD(테스트 주도 개발) 도입.
**작업 내역 (Commit Summary)**:
1. `chore: initial folder setting` (45001f1)
2. `chore: add .gitignore` (8001145)
3. `chore: initial docs files` (027150b)
4. `docs: add contributing guide (rule.md)` (197d5cb)
5. `chore: FastAPI 프로젝트 기본 뼈대 구성` (c3bf376)
6. `chore: 프로젝트 core 및 tests 초기 구조 세팅` (4c5b5a8)
7. `test: core/config.py 설정 관리를 위한 테스트 작성` (c6ebab3)
8. `feat: 공통 설정 관리를 위한 core/config.py 세팅` (83324af)
9. `test: DB 연결 및 세션 관리를 위한 테스트 작성` (fd32812)
10. `feat: DB 연결 및 세션 관리를 위한 core/database.py 생성` (31cd047)
11. `test: SQLAlchemy 기반 User DB 모델 테스트 작성` (ee25530)
12. `feat: SQLAlchemy 기반 User DB 모델 생성 (core/models.py)` (4654687)
13. `test: 채팅 기록 저장을 위한 ChatLog 모델 테스트 작성` (5308ad1)
14. `feat: 채팅 기록 저장을 위한 ChatLog DB 모델 생성 (core/models.py)` (8b4f8af)
15. `test: Pydantic 기반 User 데이터 검증 모델 테스트 작성` (60fe743)
16. `feat: Pydantic 기반 User 데이터 검증 모델 작성 (core/schemas.py)` (10b8698)
17. `test: Pydantic 기반 Chat 데이터 검증 모델 테스트 작성` (f063390)
18. `feat: Pydantic 기반 Chat 데이터 검증 모델 작성 (core/schemas.py)` (fda7c56)
19. `docs: core 모듈 구조 설명 및 check_logs.sql 스크립트 작성` (0e0ed2f)
20. `chore: .vscode 폴더 git 트래킹 제외 설정` (8552f24)
21. `refactor: AI 채팅 스키마 분리 및 Pydantic v2 설정 방식 적용` (c5b4c82)
22. `fix: 잘못된 timezone 모듈 임포트 사용 수정` (edd702f)
23. `refactor: SQLAlchemy 모델에서 Column을 Mapped로 변경하여 타입 힌트 추가` (e51bdcb)
24. `refactor: core 스키마 유효성 검사 고도화 및 auth 검증 규칙 일원화` (1b7f08d)
25. `feat: main.py DB 테이블 자동 생성 연동 및 Core 모듈 최신 라이브러리 규격 반영` (b3dce21)
26. `test: pytest 및 Pylance 임포트 경로 설정을 위한 conftest.py 추가` (ac0e24d)
27. `fix: Base.metadata.create_all 동작을 위해 main.py에 core.models 임포트 추가` (08cecbc)

### 👨‍💻 팀원 2: 인증/보안 모듈 (Auth) 개발
**주요 브랜치**: `feature/auth`, `feature/connect-auth-db`, `feature/auth-refresh-token`
**역할**: JWT 기반 인증 시스템 구축, 비밀번호 암호화, 로그인/회원가입 비즈니스 로직 및 Refresh Token 인프라 구현.
**작업 내역 (Commit Summary)**:
1. `chore(auth): 인증 모듈 필수 패키지 의존성 추가` (2087c41)
2. `feat(auth): 비밀번호 해싱 및 검증 유틸리티 추가` (ceb75df)
3. `eat(auth): JWT 생성 함수 구현` (a4dd934)
4. `feat: auth 의존성 및 스키마 기본 구조 작성` (e999897)
5. `hotfix 매직 넘버 settings 변수로 교체` (0dd2866)
6. `feat(auth): 현재 유저 조회 의존성(get_current_user) 추가` (051b49f)
7. `feat: 회원가입/로그인 서비스 로직 구현 (더미 버전)` (3956c40)
8. `hotfix import Optional 추가` (2ae97d1)
9. `feat(auth): API 라우터 조립 및 샌드박스 연결 완료` (dd43b9b)
10. `chore 유저네임 중복 409 상태코드 적용` (4e56aa3)
11. `feat: username/password 검증 규칙 분리 및 register 응답 코드 명시` (f2eb207)
12. `feat: Auth 모듈 실제 DB 연동 및 임시 더미 코드 제거` (3a8f8c5)
13. `feat: Refresh Token 도입 및 HttpOnly 쿠키 기반 인증 구현` (9a39547)
14. `fix: align jwt authentication responses` (b6269a3)

### 👩‍💻 팀원 3: AI 챗봇 모듈 (AI Chat) 및 문서화
**주요 브랜치**: `feature/ai-chat`, `feature/deploy-document-setup`
**역할**: Gemini API 통신 비즈니스 로직 작성, 비동기 통신 처리, 그리고 API 및 개발 문서(explanation.md, async.md 등) 작성.
**작업 내역 (Commit Summary)**:
1. `chore: ai_chat 기능 기본 뼈대 구성` (5c4c86d)
2. `feat: generate_response 함수 기초 구현` (7e5d2ef)
3. `feat: ai_chat 대화 로직 처리 함수 _call_api 구현` (d6c3dc0)
4. `feat: 로깅, 에러 핸들링, db 처리 관련 router 함수 chat 구현` (aeb552c)
5. `feat: 사용자 과거 채팅 로그 반환 함수 get_my_chats 구현` (61133ea)
6. `docs: 비동기 처리 정리 문서 async.md 작성` (236dc17)
7. `docs: service, router 내 함수 세부 동작 문서 explanation.md 작성` (5d30aa2)
8. `docs: 로그 분석 관련 문서 logging.md 작성` (710a9b6)
9. `feat: main.py에 ai_chat router 진입점 생성` (8b514d3)
10. `chore: service.py 관련 주석 추가` (90b4ae2)
11. `feat: chat 관련 데이터 구조 생성` (a591e34)
12. `chore: router.py 관련 주석 추가` (99cf1fa)

### 👨‍💻 팀원 4: 프론트엔드 (Next.js) 및 클라이언트 연동
**주요 브랜치**: `feature/frontend-ui`, `feature/refactor-components`, `feature/connect-chat-api`
**역할**: Next.js 기반 UI 구현, API 명세(Contract) 수립, 백엔드 서버와의 비동기 데이터 통신(Fetch API) 및 상태 관리 연동.
**작업 내역 (Commit Summary)**:
1. `chore: set up frontend workspace` (9c1814f)
2. `feat: add Lucky Bunny pixel assets` (7896cd1)
3. `feat: add login and signup interfaces` (214514a)
4. `feat: add responsive ai chat interface` (16b83a8)
5. `feat: add message history pagination and error states` (61038dc)
6. `refactor: add jwt ready api client` (c13b6dc)
7. `docs: document frontend setup and api integration` (160f54a)
8. `fix: upgrade Next.js security patches` (e1fdc53)
9. `docs: define api prefixed backend contract` (5d71f36)
10. `docs: remove incorrect team reference` (70b3026)
11. `refactor: extract shared interface components` (e5e2e28)
12. `refactor: separate authentication components` (2099e54)
13. `refactor: separate chat components` (9ef0ef2)
14. `feat: connect ai chat message api` (9e5ec7c)
15. `feat: connect chat history api` (d7a7065)
16. `fix: retry failed ai responses with original message` (58f291d)
17. `docs: align frontend api contract` (65cce83)
18. `fix: preserve chat message order` (7d652b3)
19. `docs: add frontend code comments` (fd7fd42)
20. `chore: configure local api example` (403c6b5)
21. `feat: render markdown in ai messages` (4ffddd3)
22. `chore: disable message retry button` (4b80de6)
23. `refactor: simplify access token parsing` (0141557)
24. `feat: frontend 연동 위한 CORS 설정 및 루트 접속 방식 수정` (4aa875f)

제공된 `scripts/check_logs.sql` 파일을 통해 데이터베이스에 저장된 최신 채팅 로그를 확인할 수 있습니다.
```bash
sqlite3 chatbot.db < scripts/check_logs.sql
```
