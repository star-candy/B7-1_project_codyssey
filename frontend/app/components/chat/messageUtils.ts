import { ChatMessage } from "../../lib/api";

export function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]) {
  const byId = new Map<string, ChatMessage>();
  [...current, ...incoming].forEach((message) => byId.set(message.id, message));
  return [...byId.values()].sort(
    (first, second) => Date.parse(first.createdAt) - Date.parse(second.createdAt),
  );
}

export function createUserMessage(content: string): ChatMessage {
  const createdAt = new Date();
  return {
    id: `user-${createdAt.getTime()}`,
    role: "user",
    content,
    status: "sending",
    createdAt: createdAt.toISOString(),
  };
}
