## Telegram → Instagram Bridge

Serverless Next.js project that consumes Telegram webhook updates and publishes the attached photo to Instagram via the Graph API. Deploy to Vercel, point your Telegram bot at `/api/telegram`, and every photo message becomes an Instagram post.

### Requirements

- Node.js 18+
- Telegram Bot token with HTTPS webhook enabled
- Instagram Business or Creator account connected to a Facebook Page
- Long-lived `INSTAGRAM_ACCESS_TOKEN` with `instagram_content_publish` permission
- `INSTAGRAM_BUSINESS_ACCOUNT_ID` that corresponds to the token

### Environment variables

Create an `.env.local` file (or configure the variables in Vercel):

```
TELEGRAM_BOT_TOKEN=123456789:abc
TELEGRAM_WEBHOOK_SECRET=super-secret-string
INSTAGRAM_ACCESS_TOKEN=EAAG...
INSTAGRAM_BUSINESS_ACCOUNT_ID=1784...
```

### Local development

```bash
npm install
npm run dev
```

Expose the dev server and register a webhook if you want to test end-to-end:

```bash
ngrok http 3000
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://<ngrok-host>/api/telegram?secret='$TELEGRAM_WEBHOOK_SECRET'"}'
```

### Deployment

1. Push secrets to Vercel (`vercel env pull .env.local && vercel env push` or via the dashboard).
2. Deploy:

   ```bash
   vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-7340495e
   ```

3. Register the production webhook using the same `setWebhook` call but replacing the host with `https://agentic-7340495e.vercel.app`.

### How it works

- The webhook handler validates the `secret` query parameter.
- It fetches the highest resolution photo from the Telegram update.
- Telegram `getFile` supplies a download URL which is passed directly to the Instagram Graph API.
- The app creates a media container, publishes it, and replies in Telegram with the permalink.

Extend `lib/instagram.ts` to add video, Reel, or carousel support. Modify `app/api/telegram/route.ts` if you need richer bot behavior.
