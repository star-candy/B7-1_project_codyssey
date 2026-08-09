export type MessageRole = "user" | "assistant";
export type MessageStatus = "sending" | "success" | "error";

export type ChatMessage = {
  id: string;
  role: MessageRole;
  content: string;
  status: MessageStatus;
  createdAt: string;
  retryContent?: string;
};

export type HistoryPage = {
  messages: ChatMessage[];
  nextCursor: string | null;
  hasMore: boolean;
};

type ChatRecordResponse = {
  id: number;
  user_message: string;
  ai_response: string | null;
  error_status: "AI_TIMEOUT" | "AI_ERROR" | null;
  created_at: string;
};

type AuthResult = {
  access_token: string;
  token_type: "bearer";
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// API 주소가 비어 있으면 백엔드 없이 화면을 확인할 수 있는 데모 모드로 동작합니다.
const rawApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
const apiBaseUrl = rawApiBaseUrl?.replace(/\/$/, "") ?? "";
const isMockMode = !apiBaseUrl;
const mockSessionKey = "lucky-bunny-demo-session";
const endpoints = {
  login: "/auth/login",
  signup: "/auth/signup",
  logout: "/auth/logout",
  refresh: "/auth/refresh",
  chat: "/chat",
  history: "/me/chats",
} as const;

// Access Token은 브라우저 저장소에 남기지 않고 현재 탭의 메모리에만 보관합니다.
let accessToken: string | null = null;
// 동시에 여러 요청이 401을 받아도 토큰 갱신 요청은 한 번만 실행합니다.
let refreshPromise: Promise<boolean> | null = null;

const delay = (milliseconds: number) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

const createId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

function tokenFrom(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  // 확정된 FastAPI 인증 응답의 access_token만 사용합니다.
  const { access_token } = payload as Partial<AuthResult>;
  return typeof access_token === "string" ? access_token : undefined;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function errorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") return fallback;
  const value = payload as Record<string, unknown>;
  const data =
    value.data && typeof value.data === "object"
      ? (value.data as Record<string, unknown>)
      : undefined;
  // FastAPI는 일반 오류와 입력 검증 오류를 detail 필드로 반환합니다.
  const detail = value.detail;
  const validationMessage = Array.isArray(detail)
    ? (detail[0] as Record<string, unknown> | undefined)?.msg
    : undefined;
  const message =
    value.message ??
    value.error ??
    (typeof detail === "string" ? detail : undefined) ??
    validationMessage ??
    data?.message;
  return typeof message === "string" && message.trim() ? message : fallback;
}

async function performTokenRefresh() {
  if (isMockMode) {
    const active = sessionStorage.getItem(mockSessionKey) === "active";
    accessToken = active ? "mock-access-token" : null;
    return active;
  }

  // HttpOnly Refresh Token은 JavaScript로 읽지 않고 쿠키로만 전송합니다.
  const response = await fetch(`${apiBaseUrl}${endpoints.refresh}`, {
    method: "POST",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    accessToken = null;
    return false;
  }
  const payload = await readJson(response);
  accessToken = tokenFrom(payload) ?? null;
  return Boolean(accessToken);
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = performTokenRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  retryAfterRefresh = true,
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body) headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  // Access Token 만료 시 갱신한 뒤 실패한 요청을 한 번만 다시 보냅니다.
  if (response.status === 401 && retryAfterRefresh) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return request<T>(path, init, false);
  }

  const payload = await readJson(response);
  if (!response.ok) {
    throw new ApiError(
      errorMessage(payload, "요청을 처리하지 못했어요."),
      response.status,
      payload,
    );
  }
  return payload as T;
}

// API 서버 없이 페이지네이션과 채팅 UI를 확인하기 위한 데모 데이터입니다.
const mockMessages: ChatMessage[] = [
  ["assistant", "안녕하세요! 저는 Lucky예요. 오늘은 무엇을 도와드릴까요?"],
  ["user", "오늘 해야 할 일을 정리하고 싶어."],
  ["assistant", "좋아요! 해야 할 일을 모두 적어주시면 중요도와 마감일을 기준으로 정리해 드릴게요. 🍀"],
  ["user", "발표 자료 완성, 이메일 답장, 운동이 있어."],
  ["assistant", "먼저 마감이 있는 발표 자료를 끝내고, 이메일 답장 후 가볍게 운동하는 순서를 추천해요."],
  ["user", "발표 준비를 세 단계로 나눠줘."],
  ["assistant", "1. 핵심 메시지 정리\n2. 슬라이드 구성\n3. 발표 연습 순서로 진행해 보세요."],
  ["user", "집중이 잘 안 될 때는 어떻게 하지?"],
  ["assistant", "25분만 집중하고 5분 쉬는 방식으로 시작해 보세요. 작은 당근 하나만 완성한다는 기분이면 좋아요! 🥕"],
  ["user", "발표 첫 문장도 추천해줘."],
  ["assistant", "‘오늘은 우리가 더 빠르게 협업할 수 있는 한 가지 방법을 소개하겠습니다.’로 시작해 보세요."],
  ["user", "조금 더 친근하게 바꿔줘."],
  ["assistant", "‘여러분, 일하면서 이런 순간 한 번쯤 있으셨죠?’처럼 공감되는 질문으로 시작해도 좋아요."],
  ["user", "좋아. 이제 할 일 최종 정리해줘."],
  ["assistant", "발표 자료 마무리 → 이메일 답장 → 30분 운동 순서예요. 발표 자료는 핵심 메시지, 슬라이드, 연습의 세 단계로 나눠 진행하세요. ✨"],
  ["user", "고마워!"],
  ["assistant", "천만에요! 오늘도 행운 가득하게 하나씩 해내봐요. 🍀"],
  ["user", "내일 일정도 같이 정리할게."],
  ["assistant", "좋아요. 내일 해야 할 일을 편하게 적어주세요!"],
  ["user", "오전 회의, 점심 약속, 저녁 장보기."],
  ["assistant", "오전에는 회의 준비, 점심 약속 후 짧은 정리 시간, 퇴근길 장보기 순서로 잡으면 자연스러워요."],
].map(([role, content], index) => ({
  id: `history-${index + 1}`,
  role: role as MessageRole,
  content,
  status: "success" as const,
  createdAt: new Date(Date.now() - (21 - index) * 180_000).toISOString(),
}));

function toAssistantMessage(chat: ChatRecordResponse): ChatMessage {
  // 질문은 화면에 먼저 추가되므로 POST 응답에서는 AI 메시지만 변환합니다.
  return {
    id: `chat-${chat.id}-assistant`,
    role: "assistant",
    content: chat.ai_response ?? "답변을 불러오지 못했어요.",
    status: chat.error_status ? "error" : "success",
    createdAt: chat.created_at,
    // AI 오류 메시지 대신 사용자가 보낸 원래 질문으로 재시도합니다.
    retryContent: chat.error_status ? chat.user_message : undefined,
  };
}

function toChatMessages(chat: ChatRecordResponse): ChatMessage[] {
  // 백엔드의 채팅 한 건을 화면에서 사용하는 사용자·AI 메시지로 분리합니다.
  const messages: ChatMessage[] = [
    {
      id: `chat-${chat.id}-user`,
      role: "user",
      content: chat.user_message,
      status: "success",
      createdAt: chat.created_at,
    },
  ];

  if (chat.ai_response) messages.push(toAssistantMessage(chat));
  return messages;
}

export const authApi = {
  async restore() {
    try {
      return await refreshAccessToken();
    } catch {
      accessToken = null;
      return false;
    }
  },

  async login(username: string, password: string) {
    if (isMockMode) {
      await delay(650);
      if (!username || !password) throw new Error("아이디와 비밀번호를 입력해 주세요.");
      if (username.toLowerCase() === "error") {
        throw new Error("아이디 또는 비밀번호를 확인해 주세요.");
      }
      sessionStorage.setItem(mockSessionKey, "active");
      accessToken = "mock-access-token";
      return;
    }
    const payload = await request<AuthResult>(
      endpoints.login,
      { method: "POST", body: JSON.stringify({ username, password }) },
      false,
    );
    accessToken = tokenFrom(payload) ?? null;
  },

  async signup(username: string, password: string) {
    if (isMockMode) {
      await delay(750);
      if (username.toLowerCase() === "lucky") throw new Error("이미 사용 중인 아이디예요.");
      sessionStorage.setItem(mockSessionKey, "active");
      accessToken = "mock-access-token";
      return;
    }
    const payload = await request<AuthResult>(
      endpoints.signup,
      { method: "POST", body: JSON.stringify({ username, password }) },
      false,
    );
    accessToken = tokenFrom(payload) ?? null;
    if (!accessToken) {
      // 회원가입 응답에는 토큰이 없으므로 가입 성공 후 로그인합니다.
      await authApi.login(username, password);
    }
  },

  async logout() {
    if (isMockMode) {
      await delay(250);
      sessionStorage.removeItem(mockSessionKey);
      accessToken = null;
      return;
    }
    try {
      await request(endpoints.logout, { method: "POST" }, false);
    } finally {
      accessToken = null;
    }
  },
};

export const chatApi = {
  async history(cursor: string | null, limit = 8): Promise<HistoryPage> {
    if (isMockMode) {
      await delay(cursor ? 450 : 800);
      const end = cursor ? Number(cursor) : mockMessages.length;
      const safeEnd = Number.isFinite(end) ? end : mockMessages.length;
      const start = Math.max(0, safeEnd - limit);
      return {
        messages: mockMessages.slice(start, safeEnd),
        nextCursor: start > 0 ? String(start) : null,
        hasMore: start > 0,
      };
    }

    // 현재 백엔드는 페이지네이션 없이 전체 대화 기록을 반환합니다.
    const chats = await request<ChatRecordResponse[]>(endpoints.history);
    return {
      messages: chats.flatMap(toChatMessages),
      nextCursor: null,
      hasMore: false,
    };
  },

  async send(content: string): Promise<ChatMessage> {
    if (isMockMode) {
      await delay(900);
      if (content.includes("오류")) {
        throw new Error("답변을 불러오지 못했어요. 다시 시도해 주세요.");
      }
      return {
        id: createId("assistant"),
        role: "assistant",
        content: `좋아요! “${content}”에 대해 차근차근 함께 정리해 볼게요. 먼저 가장 중요한 한 가지부터 알려주세요. 🍀`,
        status: "success",
        createdAt: new Date().toISOString(),
      };
    }

    const payload = await request<ChatRecordResponse>(endpoints.chat, {
      method: "POST",
      body: JSON.stringify({ message: content }),
    });
    return toAssistantMessage(payload);
  },
};

export const apiMode = isMockMode ? "demo" : "live";
