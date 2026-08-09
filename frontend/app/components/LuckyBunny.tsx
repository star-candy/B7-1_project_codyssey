"use client";

import { CSSProperties, FormEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { authApi, chatApi, ChatMessage } from "../lib/api";

type AuthMode = "login" | "signup";

const BOARD_WIDTH = 1536;
const BOARD_HEIGHT = 1024;

type SpriteProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  className?: string;
  label?: string;
};

function Sprite({ x, y, width, height, className = "", label }: SpriteProps) {
  const positionX = BOARD_WIDTH === width ? 0 : (x / (BOARD_WIDTH - width)) * 100;
  const positionY = BOARD_HEIGHT === height ? 0 : (y / (BOARD_HEIGHT - height)) * 100;
  const style: CSSProperties = {
    aspectRatio: `${width} / ${height}`,
    backgroundImage: "url('/assets/lucky-bunny-final-board.png')",
    backgroundSize: `${(BOARD_WIDTH / width) * 100}% ${(BOARD_HEIGHT / height) * 100}%`,
    backgroundPosition: `${positionX}% ${positionY}%`,
  };

  return <span className={`design-sprite ${className}`} style={style} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} />;
}

function PixelAsset({ src, width, height, className = "", alt = "" }: { src: string; width: number; height: number; className?: string; alt?: string }) {
  return <Image className={`pixel-asset ${className}`} src={src} width={width} height={height} alt={alt} unoptimized />;
}

function PageDecor() {
  return (
    <div className="page-decor" aria-hidden="true">
      <PixelAsset src="/assets/final-sprites/decor-heart.png" width={53} height={52} className="page-decor-heart" />
      <PixelAsset src="/assets/final-sprites/decor-clover.png" width={74} height={76} className="page-decor-clover" />
      <PixelAsset src="/assets/final-sprites/decor-star.png" width={48} height={52} className="page-decor-star" />
      <PixelAsset src="/assets/final-sprites/decor-carrot.png" width={65} height={66} className="page-decor-carrot" />
      <PixelAsset src="/assets/final-sprites/decor-seven.png" width={61} height={68} className="page-decor-seven" />
      <PixelAsset src="/assets/final-sprites/decor-sparkle.png" width={43} height={51} className="page-decor-sparkle" />
      <PixelAsset src="/assets/final-sprites/decor-cloud-left.png" width={80} height={53} className="page-decor-cloud page-decor-cloud-left" />
      <PixelAsset src="/assets/final-sprites/decor-cloud-right.png" width={127} height={75} className="page-decor-cloud page-decor-cloud-right" />
    </div>
  );
}

function WindowTitlebar({ variant }: { variant: "login" | "signup" | "chat" }) {
  const controls = {
    login: { src: "/assets/final-sprites/controls-login.png", width: 87, height: 35 },
    signup: { src: "/assets/final-sprites/controls-signup.png", width: 90, height: 35 },
    chat: { src: "/assets/final-sprites/controls-chat.png", width: 99, height: 38 },
  } as const;

  return (
    <header className={`window-titlebar ${variant}-titlebar`}>
      <div className="window-brand">
        <PixelAsset src="/assets/final-sprites/brand-rabbit.png" width={101} height={112} className="window-brand-rabbit" />
        <span>LUCKY BUNNY</span>
      </div>
      <PixelAsset {...controls[variant]} className="titlebar-controls" />
    </header>
  );
}

function AuthHero({ mode }: { mode: AuthMode }) {
  return mode === "login" ? (
    <PixelAsset src="/assets/final-sprites/login-hero.png" width={288} height={277} className="auth-hero-art login-hero-art" alt="손을 들고 인사하는 Lucky Bunny" />
  ) : (
    <PixelAsset src="/assets/final-sprites/signup-hero.png" width={279} height={279} className="auth-hero-art signup-hero-art" alt="하트를 안고 있는 Lucky Bunny" />
  );
}

function FieldIcon({ type }: { type: "user" | "lock" }) {
  return type === "user" ? (
    <Sprite x={96} y={564} width={22} height={23} className="field-icon" />
  ) : (
    <Sprite x={96} y={644} width={22} height={23} className="field-icon" />
  );
}

function FooterIcon({ type }: { type: "heart" | "clover" | "seven" | "star" | "carrot" }) {
  const assets = {
    heart: { src: "/assets/final-sprites/decor-heart.png", width: 53, height: 52 },
    clover: { src: "/assets/final-sprites/decor-clover.png", width: 74, height: 76 },
    seven: { src: "/assets/final-sprites/decor-seven.png", width: 61, height: 68 },
    star: { src: "/assets/final-sprites/decor-star.png", width: 48, height: 52 },
    carrot: { src: "/assets/final-sprites/decor-carrot.png", width: 65, height: 66 },
  } as const;
  return <PixelAsset {...assets[type]} className={`footer-icon footer-icon-${type}`} />;
}

function FooterBar({ variant }: { variant: "login" | "signup" | "chat" }) {
  const icons = variant === "signup"
    ? (["carrot", "star", "seven", "clover"] as const)
    : (["heart", "clover", "seven", "star"] as const);
  return <footer className={`footer-bar ${variant}-footer-bar`} aria-hidden="true">{icons.map((icon) => <FooterIcon key={icon} type={icon} />)}</footer>;
}

function BunnyAvatar({ profile = false }: { profile?: boolean }) {
  return profile ? (
    <Sprite x={803} y={234} width={70} height={69} className="profile-bunny" label="Lucky Bunny" />
  ) : (
    <Sprite x={803} y={384} width={66} height={65} className="message-avatar-sprite" label="Lucky Bunny" />
  );
}

function CarrotAvatar() {
  return <Sprite x={1381} y={327} width={67} height={66} className="message-avatar-sprite" label="당근 사용자" />;
}

function AppLoading({ label }: { label: string }) {
  return (
    <main className="page-shell loading-page">
      <PageDecor />
      <div className="loading-card" aria-live="polite">
        <BunnyAvatar profile />
        <div className="typing-dots large" aria-hidden="true"><i /><i /><i /></div>
        <p>{label}</p>
      </div>
    </main>
  );
}

export function AuthScreen({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const isSignup = mode === "signup";
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    authApi.restore().then((authenticated) => {
      if (!active) return;
      if (authenticated) router.replace("/chat");
      else setCheckingAuth(false);
    });
    return () => { active = false; };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError("");

    if (!username.trim() || !password || (isSignup && !passwordConfirm)) {
      setError(isSignup ? "모든 항목을 입력해 주세요." : "아이디와 비밀번호를 입력해 주세요.");
      return;
    }
    if (isSignup && password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않아요.");
      return;
    }

    setSubmitting(true);
    try {
      if (isSignup) await authApi.signup(username.trim(), password);
      else await authApi.login(username.trim(), password);
      router.replace("/chat");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "문제가 발생했어요. 잠시 후 다시 시도해 주세요.");
      if (!isSignup) setPassword("");
    } finally {
      setSubmitting(false);
    }
  }

  if (checkingAuth) return <AppLoading label="로그인 상태를 확인하고 있어요" />;

  return (
    <main className={`page-shell auth-page ${isSignup ? "signup-theme" : "login-theme"}`}>
      <PageDecor />
      <section className="auth-window pixel-window" aria-label={isSignup ? "회원가입" : "로그인"}>
        <WindowTitlebar variant={mode} />
        <div className="auth-content">
          <AuthHero mode={mode} />
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <label className="field-label" htmlFor={`${mode}-username`}>아이디</label>
            <div className="field-wrap">
              <FieldIcon type="user" />
              <input id={`${mode}-username`} name="username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} disabled={submitting} aria-invalid={Boolean(error)} />
            </div>

            <label className="field-label" htmlFor={`${mode}-password`}>비밀번호</label>
            <div className="field-wrap">
              <FieldIcon type="lock" />
              <input id={`${mode}-password`} name="password" type="password" autoComplete={isSignup ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} disabled={submitting} aria-invalid={Boolean(error)} />
            </div>

            {isSignup && (
              <>
                <label className="field-label" htmlFor="signup-password-confirm">비밀번호 확인</label>
                <div className="field-wrap">
                  <FieldIcon type="lock" />
                  <input id="signup-password-confirm" name="passwordConfirm" type="password" autoComplete="new-password" value={passwordConfirm} onChange={(event) => setPasswordConfirm(event.target.value)} disabled={submitting} aria-invalid={Boolean(error)} />
                </div>
              </>
            )}

            <div className={`form-error ${error ? "visible" : ""}`} role="alert" aria-live="assertive">{error}</div>
            <button className="auth-submit" type="submit" disabled={submitting}>
              {submitting ? (isSignup ? "가입 중..." : "로그인 중...") : (isSignup ? "회원가입" : "로그인")}
            </button>
            <div className="auth-divider"><Sprite x={214} y={759} width={19} height={20} className="divider-heart" /></div>
            <a className="auth-link" href={isSignup ? "/login" : "/signup"}>{isSignup ? "로그인으로 돌아가기" : "회원가입"}</a>
          </form>
        </div>
        <FooterBar variant={mode} />
      </section>
    </main>
  );
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}

function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]) {
  const byId = new Map<string, ChatMessage>();
  [...current, ...incoming].forEach((message) => byId.set(message.id, message));
  return [...byId.values()].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
}

function createUserMessage(content: string): ChatMessage {
  const createdAt = new Date();
  return { id: `user-${createdAt.getTime()}`, role: "user", content, status: "sending", createdAt: createdAt.toISOString() };
}

export function ChatScreen() {
  const router = useRouter();
  const listRef = useRef<HTMLDivElement>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyLoadingMore, setHistoryLoadingMore] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const scrollToBottom = () => requestAnimationFrame(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  });

  const loadInitialHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const page = await chatApi.history(null);
      setMessages(page.messages);
      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);
      requestAnimationFrame(() => {
        if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
      });
    } catch (caught) {
      setHistoryError(caught instanceof Error ? caught.message : "대화 기록을 불러오지 못했어요. 다시 시도해 주세요.");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    authApi.restore().then((authenticated) => {
      if (!active) return;
      if (!authenticated) return router.replace("/login");
      setCheckingAuth(false);
      loadInitialHistory();
    });
    return () => { active = false; };
  }, [loadInitialHistory, router]);

  const loadOlder = useCallback(async () => {
    if (!nextCursor || !hasMore || historyLoadingMore) return;
    const list = listRef.current;
    const previousHeight = list?.scrollHeight ?? 0;
    const previousTop = list?.scrollTop ?? 0;
    setHistoryLoadingMore(true);
    setHistoryError("");
    try {
      const page = await chatApi.history(nextCursor);
      setMessages((current) => mergeMessages(current, page.messages));
      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);
      requestAnimationFrame(() => {
        if (list) list.scrollTop = list.scrollHeight - previousHeight + previousTop;
      });
    } catch {
      setHistoryError("이전 대화를 불러오지 못했어요.");
    } finally {
      setHistoryLoadingMore(false);
    }
  }, [hasMore, historyLoadingMore, nextCursor]);

  async function sendExisting(message: ChatMessage) {
    if (sending) return;
    setSending(true);
    setMessages((current) => current.map((item) => item.id === message.id ? { ...item, status: "sending" } : item));
    try {
      const reply = await chatApi.send(message.content);
      setMessages((current) => mergeMessages(current.map((item) => item.id === message.id ? { ...item, status: "success" } : item), [reply]));
      scrollToBottom();
    } catch {
      setMessages((current) => current.map((item) => item.id === message.id ? { ...item, status: "error" } : item));
    } finally {
      setSending(false);
    }
  }

  async function handleSend() {
    const content = draft.trim();
    if (!content || sending) return;
    const userMessage = createUserMessage(content);
    setDraft("");
    setMessages((current) => mergeMessages(current, [userMessage]));
    scrollToBottom();
    await sendExisting(userMessage);
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try { await authApi.logout(); }
    finally { setMessages([]); router.replace("/login"); }
  }

  if (checkingAuth) return <AppLoading label="Lucky를 만나러 가고 있어요" />;

  return (
    <main className="page-shell chat-page">
      <PageDecor />
      <section className="chat-window pixel-window" aria-label="Lucky Bunny AI 채팅">
        <WindowTitlebar variant="chat" />
        <div className="chat-profilebar">
          <div className="chat-identity">
            <BunnyAvatar profile />
            <div><strong>LUCKY BUNNY</strong><span className="online"><i />ONLINE</span></div>
          </div>
          <button className="logout-button sprite-button" type="button" onClick={handleLogout} disabled={loggingOut} aria-label="로그아웃">
            <Sprite x={1338} y={247} width={129} height={46} className="logout-sprite" />
          </button>
        </div>

        <div className="chat-body" ref={listRef} onScroll={() => { if ((listRef.current?.scrollTop ?? 100) < 56) loadOlder(); }} aria-live="polite">
          {historyLoading && <div className="history-state"><BunnyAvatar profile /><p>지난 대화를 불러오고 있어요...</p></div>}
          {!historyLoading && hasMore && !historyLoadingMore && <button className="load-older" type="button" onClick={loadOlder}>이전 대화 더 보기</button>}
          {historyLoadingMore && <div className="history-more"><div className="typing-dots"><i /><i /><i /></div></div>}
          {historyError && <div className="history-error" role="alert"><p>{historyError}</p><button type="button" onClick={messages.length ? loadOlder : loadInitialHistory}>다시 시도</button></div>}

          {!historyLoading && !historyError && messages.length === 0 && (
            <MessageBubble message={{ id: "welcome", role: "assistant", content: "안녕하세요! 저는 Lucky예요. 무엇을 도와드릴까요?", status: "success", createdAt: new Date().toISOString() }} onRetry={() => {}} />
          )}
          {messages.map((message) => <MessageBubble key={message.id} message={message} onRetry={() => sendExisting(message)} />)}
          {sending && <div className="typing-row"><BunnyAvatar /><div className="typing-bubble"><div className="typing-dots"><i /><i /><i /></div></div></div>}
        </div>

        <div className="composer-wrap">
            <PixelAsset src="/assets/final-sprites/decor-clover.png" width={74} height={76} className="composer-clover" />
          <label className="sr-only" htmlFor="chat-message">메시지</label>
          <textarea id="chat-message" rows={1} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={handleComposerKeyDown} placeholder="메시지를 입력해 주세요" disabled={sending} />
          <button className="send-button sprite-button" type="button" onClick={handleSend} disabled={!draft.trim() || sending} aria-label="전송">
            <PixelAsset src="/assets/final-sprites/send-carrot.png" width={124} height={63} className="send-sprite" />
          </button>
        </div>
        <FooterBar variant="chat" />
      </section>
    </main>
  );
}

function MessageBubble({ message, onRetry }: { message: ChatMessage; onRetry: () => void }) {
  const isUser = message.role === "user";
  return (
    <article className={`message-row ${isUser ? "user-message" : "assistant-message"}`}>
      <div className="message-avatar">{isUser ? <CarrotAvatar /> : <BunnyAvatar />}</div>
      <div className="message-column">
        <div className="message-meta"><strong>{isUser ? "" : "LUCKY BUNNY"}</strong><time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time></div>
        <div className={`message-bubble ${message.status === "sending" ? "pending" : ""}`}>
          {message.content.split("\n").map((line, index) => <span key={`${message.id}-${index}`}>{line}</span>)}
        </div>
        {message.status === "error" && (
          <div className="message-error" role="alert">
            <Sprite x={878} y={695} width={26} height={25} className="warning-sprite" />
            <p>답변을 불러오지 못했어요. 다시 시도해 주세요.</p>
            <button type="button" onClick={onRetry}>다시 시도</button>
          </div>
        )}
      </div>
    </article>
  );
}

