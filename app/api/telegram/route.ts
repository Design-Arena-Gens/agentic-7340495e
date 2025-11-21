import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import {
  getFileUrl,
  getHighestResolutionPhotoId,
  sendTelegramMessage,
  TelegramUpdate
} from "@/lib/telegram";
import { publishImageToInstagram } from "@/lib/instagram";

function jsonOk() {
  return NextResponse.json({ ok: true });
}

function trimCaption(value: string | undefined): string {
  const fallback = "Posted via Telegram bridge.";
  if (!value) {
    return fallback;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }
  const maxLength = 2200; // Instagram caption limit
  return trimmed.length > maxLength
    ? `${trimmed.slice(0, maxLength - 1)}…`
    : trimmed;
}

export async function POST(req: NextRequest) {
  const { TELEGRAM_WEBHOOK_SECRET } = getEnv();
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  let update: TelegramUpdate;
  try {
    update = (await req.json()) as TelegramUpdate;
  } catch (error) {
    console.error("Unable to parse webhook payload", error);
    return NextResponse.json(
      { ok: false, error: "Invalid payload" },
      { status: 400 }
    );
  }

  const message = update.message ?? update.edited_message;
  if (!message) {
    return jsonOk();
  }

  const chatId = message.chat.id;

  if (message.text?.startsWith("/start")) {
    await sendTelegramMessage(
      chatId,
      [
        "👋 Ready to post to Instagram!",
        "",
        "Send me a photo with an optional caption and I will publish it to Instagram instantly.",
        "",
        "Only standard photo posts are supported right now."
      ].join("\n")
    );
    return jsonOk();
  }

  if (!message.photo?.length) {
    await sendTelegramMessage(
      chatId,
      "Please send a photo message. Videos and albums are not supported in this version."
    );
    return jsonOk();
  }

  const selectedPhoto = getHighestResolutionPhotoId(message.photo);

  try {
    const fileUrl = await getFileUrl(selectedPhoto.file_id);
    const caption = trimCaption(message.caption ?? message.text);
    const published = await publishImageToInstagram(fileUrl, caption);

    const permalinkText = published.permalink
      ? `\n\n🔗 ${published.permalink}`
      : "";

    await sendTelegramMessage(
      chatId,
      [
        "✅ Posted to Instagram!",
        "",
        `Photo size: ${selectedPhoto.width}x${selectedPhoto.height}`,
        permalinkText
      ]
        .filter(Boolean)
        .join("\n")
    );
  } catch (error) {
    console.error("Failed to complete Instagram publish workflow", error);
    await sendTelegramMessage(
      chatId,
      [
        "❌ Something went wrong while publishing to Instagram.",
        "Please verify your tokens and try again."
      ].join("\n")
    );
  }

  return jsonOk();
}
