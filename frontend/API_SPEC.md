# Lucky Bunny API 명세

이 문서는 Lucky Bunny 프론트엔드와 FastAPI 백엔드가 함께 사용할 API 계약입니다. 모든 서비스 API는 `/api` 접두사를 유지합니다.

## 1. 공통 규칙

- 기본 주소: `${NEXT_PUBLIC_API_BASE_URL}`
- API 접두사: `/api`
- JSON 요청의 `Content-Type`: `application/json`
- 보호 API 인증: `Authorization: Bearer <access_token>`
- 날짜와 시간: ISO 8601 문자열
- 필드명: 백엔드의 Python 모델에 맞춰 `snake_case` 사용

FastAPI 기본 오류 응답을 사용합니다.

```json
{
  "detail": "오류 내용"
}
```

입력값 검증 실패는 `422 Unprocessable Entity`와 `detail` 배열을 반환할 수 있습니다.

## 2. 구현 현황

| 기능 | 메서드 | 경로 | 인증 | 상태 |
| --- | --- | --- | --- | --- |
| 회원가입 | `POST` | `/api/auth/register` | 없음 | 구현됨 |
| 로그인 | `POST` | `/api/auth/login` | 없음 | 구현됨 |
| 검증 규칙 | `GET` | `/api/auth/validation-rules` | 없음 | 구현됨 |
| 토큰 갱신 | `POST` | `/api/auth/refresh` | refresh cookie | 추가 필요 |
| 로그아웃 | `POST` | `/api/auth/logout` | refresh cookie | 추가 필요 |
| AI 메시지 전송 | `POST` | `/api/chat` | Bearer JWT | 구현됨 |
| 과거 메시지 조회 | `GET` | `/api/me/chats` | Bearer JWT | 구현됨, 페이지네이션 추가 필요 |

## 3. 인증 API

### 3.1 회원가입

`POST /api/auth/register`

요청:

```json
{
  "username": "lucky_user",
  "password": "lucky1234"
}
```

성공: `201 Created`

```json
{
  "id": 1,
  "username": "lucky_user",
  "created_at": "2026-08-09T00:00:00Z"
}
```

주요 오류:

- `409 Conflict`: 이미 사용 중인 아이디
- `422 Unprocessable Entity`: 아이디 또는 비밀번호 규칙 위반

회원가입 성공만으로 로그인 처리하지 않습니다. 프론트엔드는 성공 후 로그인 API를 호출하거나 로그인 화면으로 이동합니다.

### 3.2 로그인

`POST /api/auth/login`

FastAPI `OAuth2PasswordRequestForm`을 사용하므로 JSON이 아니라 `application/x-www-form-urlencoded`로 전송합니다.

```text
username=lucky_user&password=lucky1234
```

성공: `200 OK`

```json
{
  "access_token": "jwt-access-token",
  "token_type": "bearer"
}
```

주요 오류:

- `401 Unauthorized`: 아이디 또는 비밀번호 불일치
- `422 Unprocessable Entity`: 필수 form 항목 누락

### 3.3 회원가입 검증 규칙

`GET /api/auth/validation-rules`

성공: `200 OK`

```json
{
  "username": {
    "min_length": 3,
    "max_length": 50,
    "pattern": "^[a-zA-Z0-9_-]+$",
    "message": "아이디는 영문, 숫자, _, - 만 사용할 수 있습니다."
  },
  "password": {
    "min_length": 8,
    "max_length": 72
  }
}
```

비밀번호는 영문과 숫자를 모두 포함하고 앞뒤 공백이 없어야 합니다.

### 3.4 토큰 갱신

> 백엔드 추가 구현이 필요한 목표 명세입니다.

`POST /api/auth/refresh`

- 요청 본문 없음
- 브라우저가 HttpOnly refresh cookie를 전송
- 프론트 요청 옵션에 `credentials: include` 사용

성공: `200 OK`

```json
{
  "access_token": "new-jwt-access-token",
  "token_type": "bearer"
}
```

실패: `401 Unauthorized`

### 3.5 로그아웃

> 백엔드 추가 구현이 필요한 목표 명세입니다.

`POST /api/auth/logout`

- 요청 본문 없음
- 백엔드는 refresh token을 폐기하고 cookie를 만료 처리

성공: `204 No Content`

## 4. 채팅 API

### 4.1 AI 메시지 전송

`POST /api/chat`

요청 헤더:

```text
Authorization: Bearer <access_token>
Content-Type: application/json
```

요청:

```json
{
  "message": "오늘 해야 할 일을 정리해줘"
}
```

메시지는 1자 이상 1,000자 이하입니다.

성공: `200 OK`

```json
{
  "id": 25,
  "user_message": "오늘 해야 할 일을 정리해줘",
  "ai_response": "좋아요. 우선순위부터 함께 정리해볼게요.",
  "error_status": null,
  "created_at": "2026-08-09T00:00:00Z"
}
```

AI 호출에 실패해도 현재 백엔드는 저장된 채팅 객체를 `200 OK`로 반환합니다.

```json
{
  "id": 26,
  "user_message": "다시 알려줘",
  "ai_response": "현재 응답이 지연되고 있어요. 잠시 후 다시 시도해 주세요. (error: AI_TIMEOUT)",
  "error_status": "AI_TIMEOUT",
  "created_at": "2026-08-09T00:01:00Z"
}
```

`error_status` 값:

- `AI_TIMEOUT`: AI 응답 제한 시간 초과
- `AI_ERROR`: 기타 AI 서버 오류

### 4.2 과거 메시지 조회

`GET /api/me/chats?limit=20&cursor=<chat_id>`

현재 백엔드는 query parameter 없이 전체 기록 배열을 반환합니다. 다음 형태의 cursor 페이지네이션을 목표 명세로 사용합니다.

요청 규칙:

- `limit`: 한 페이지의 채팅 개수, 기본값 `20`
- `cursor`: 이전 응답의 `next_cursor`; 최초 요청에서는 생략
- 최초 요청은 최신 기록부터 한 페이지를 조회
- `items`는 화면 표시를 위해 오래된 기록부터 최신 기록 순으로 반환
- 다음 요청은 cursor보다 작은 ID의 기록을 조회

성공: `200 OK`

```json
{
  "items": [
    {
      "id": 21,
      "user_message": "안녕",
      "ai_response": "안녕하세요!",
      "error_status": null,
      "created_at": "2026-08-09T00:00:00Z"
    }
  ],
  "next_cursor": "21",
  "has_more": true
}
```

더 불러올 기록이 없을 때:

```json
{
  "items": [],
  "next_cursor": null,
  "has_more": false
}
```

## 5. 프론트 메시지 변환 규칙

백엔드의 채팅 한 건은 사용자 질문과 AI 답변을 함께 저장합니다. 프론트는 한 객체를 다음 두 메시지로 변환합니다.

```text
ChatResponse.user_message -> role: user
ChatResponse.ai_response  -> role: assistant
```

두 메시지의 안정적인 key는 다음처럼 만들 수 있습니다.

```text
chat-25-user
chat-25-assistant
```

`error_status`가 있으면 해당 assistant 메시지에 오류 및 재시도 UI를 표시합니다.

## 6. 보안 및 CORS 합의사항

- access token은 프론트 메모리에만 보관합니다.
- refresh token은 백엔드가 `HttpOnly`, `Secure`, 적절한 `SameSite` 속성의 cookie로 발급합니다.
- 백엔드는 모든 보호 API에서 JWT와 사용자 권한을 다시 검증합니다.
- 운영 환경의 CORS `allow_origins`는 실제 프론트엔드 origin만 허용합니다.
- `allow_credentials=True`를 사용할 때 wildcard origin(`*`)을 사용하지 않습니다.
- 로그인 시도 제한, refresh token 폐기 및 회전 정책은 백엔드에서 처리합니다.

## 7. 프론트 연결 시 변경할 파일

실제 연결은 `app/lib/api.ts`에서 다음 항목을 수정합니다.

- 모든 요청 경로에 `/api` 적용
- 로그인 요청을 form-urlencoded로 변경
- `access_token` 응답 읽기
- `ChatResponse`를 사용자·AI 메시지로 변환
- 과거 기록의 `items`, `next_cursor`, `has_more` 매핑

API 명세가 확정되기 전까지 `NEXT_PUBLIC_API_BASE_URL`을 비워두면 demo 모드가 유지됩니다.
