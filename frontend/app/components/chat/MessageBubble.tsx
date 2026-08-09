import { ChatMessage } from "../../lib/api";
import { BunnyAvatar } from "../common/BunnyAvatar";
import { Sprite } from "../common/Sprite";
import { CarrotAvatar } from "./CarrotAvatar";
import { formatTime } from "./messageUtils";

type MessageBubbleProps = {
  message: ChatMessage;
  onRetry: () => void;
};

export function MessageBubble({ message, onRetry }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <article className={`message-row ${isUser ? "user-message" : "assistant-message"}`}>
      <div className="message-avatar">
        {isUser ? <CarrotAvatar /> : <BunnyAvatar />}
      </div>
      <div className="message-column">
        <div className="message-meta">
          <strong>{isUser ? "" : "LUCKY BUNNY"}</strong>
          <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
        </div>
        <div className={`message-bubble ${message.status === "sending" ? "pending" : ""}`}>
          {message.content.split("\n").map((line, index) => (
            <span key={`${message.id}-${index}`}>{line}</span>
          ))}
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
