import { z } from "zod";

const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_WEBHOOK_SECRET: z.string().min(1),
  INSTAGRAM_ACCESS_TOKEN: z.string().min(1),
  INSTAGRAM_BUSINESS_ACCOUNT_ID: z.string().min(1)
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) {
    return cachedEnv;
  }
  const result = envSchema.safeParse({
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_WEBHOOK_SECRET: process.env.TELEGRAM_WEBHOOK_SECRET,
    INSTAGRAM_ACCESS_TOKEN: process.env.INSTAGRAM_ACCESS_TOKEN,
    INSTAGRAM_BUSINESS_ACCOUNT_ID: process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID
  });

  if (!result.success) {
    const missing = Object.entries(result.error.flatten().fieldErrors)
      .filter(([, errors]) => errors && errors.length > 0)
      .map(([key]) => key)
      .join(", ");

    throw new Error(
      `Missing required environment variables: ${missing || "unknown"}`
    );
  }

  cachedEnv = result.data;
  return cachedEnv;
}
