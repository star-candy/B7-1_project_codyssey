type AuthResult = {
  accessToken?: string;
};

const rawApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
const apiBaseUrl = rawApiBaseUrl?.replace(/\/$/, "") ?? "";
const isMockMode = !apiBaseUrl;
const mockSessionKey = "lucky-bunny-demo-session";

let accessToken: string | null = null;

const delay = (milliseconds: number) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

function tokenFrom(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const value = payload as Record<string, unknown>;
  const data = value.data && typeof value.data === "object"
    ? (value.data as Record<string, unknown>)
    : undefined;
  const token = value.accessToken ?? value.token ?? data?.accessToken ?? data?.token;
  return typeof token === "string" ? token : undefined;
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
  const data = value.data && typeof value.data === "object"
    ? (value.data as Record<string, unknown>)
    : undefined;
  const message = value.message ?? value.error ?? data?.message;
  return typeof message === "string" && message.trim() ? message : fallback;
}

async function refreshAccessToken() {
  if (isMockMode) {
    const active = sessionStorage.getItem(mockSessionKey) === "active";
    accessToken = active ? "mock-access-token" : null;
    return active;
  }

  const response = await fetch(`${apiBaseUrl}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    accessToken = null;
    return false;
  }
  accessToken = tokenFrom(await readJson(response)) ?? null;
  return Boolean(accessToken);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body) headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });
  const payload = await readJson(response);
  if (!response.ok) throw new Error(errorMessage(payload, "요청을 처리하지 못했어요."));
  return payload as T;
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
      if (username.toLowerCase() === "error") throw new Error("아이디 또는 비밀번호를 확인해 주세요.");
      sessionStorage.setItem(mockSessionKey, "active");
      accessToken = "mock-access-token";
      return;
    }
    const payload = await request<AuthResult>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
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
    const payload = await request<AuthResult>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    accessToken = tokenFrom(payload) ?? null;
    if (!accessToken) await authApi.login(username, password);
  },

  async logout() {
    if (isMockMode) {
      await delay(250);
      sessionStorage.removeItem(mockSessionKey);
      accessToken = null;
      return;
    }
    try {
      await request("/auth/logout", { method: "POST" });
    } finally {
      accessToken = null;
    }
  },
};
