import { getEnv } from "./env";

export interface TelegramPhotoSize {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  file_size?: number;
}

export interface TelegramChat {
  id: number;
  type: "private" | "group" | "supergroup" | "channel";
  username?: string;
  title?: string;
}

export interface TelegramMessage {
  message_id: number;
  date: number;
  chat: TelegramChat;
  text?: string;
  caption?: string;
  photo?: TelegramPhotoSize[];
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
}

interface TelegramApiResponse<T> {
  ok: boolean;
  result?: T;
  description?: string;
  error_code?: number;
}

function getApiBaseUrl(): string {
  const { TELEGRAM_BOT_TOKEN } = getEnv();
  return `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
}

function getFileBaseUrl(): string {
  const { TELEGRAM_BOT_TOKEN } = getEnv();
  return `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}`;
}

export async function sendTelegramMessage(
  chatId: number,
  text: string
): Promise<void> {
  const response = await fetch(`${getApiBaseUrl()}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true
    })
  });

  if (!response.ok) {
    const details = await response.text();
    console.error("Failed to send Telegram message", details);
    throw new Error("Failed to send Telegram message");
  }
}

export function getHighestResolutionPhotoId(
  photos: TelegramPhotoSize[]
): TelegramPhotoSize {
  return photos.reduce((largest, current) => {
    if (!largest) {
      return current;
    }
    const largestPixels = largest.width * largest.height;
    const currentPixels = current.width * current.height;
    return currentPixels > largestPixels ? current : largest;
  });
}

export async function getFileUrl(fileId: string): Promise<string> {
  const response = await fetch(
    `${getApiBaseUrl()}/getFile?file_id=${encodeURIComponent(fileId)}`
  );
  if (!response.ok) {
    const details = await response.text();
    console.error("Failed to fetch Telegram file metadata", details);
    throw new Error("Unable to fetch Telegram file metadata");
  }

  const data = (await response.json()) as TelegramApiResponse<{
    file_path: string;
  }>;

  if (!data.ok || !data.result?.file_path) {
    console.error("Invalid Telegram getFile response", data);
    throw new Error("Telegram did not return a file_path");
  }

  return `${getFileBaseUrl()}/${data.result.file_path}`;
}
