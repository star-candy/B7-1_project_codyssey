"use client";

import { CSSProperties, FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { authApi } from "../lib/api";

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


