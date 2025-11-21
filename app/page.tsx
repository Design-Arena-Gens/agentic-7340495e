const steps = [
  {
    title: "Configure secrets",
    description:
      "Add the required environment variables in Vercel or your local `.env.local` file."
  },
  {
    title: "Register Telegram webhook",
    description:
      "Point your bot to the Vercel API endpoint and include the shared secret."
  },
  {
    title: "Send a photo message",
    description:
      "Send a photo with an optional caption in Telegram. The bot forwards it to Instagram."
  }
];

const envVars = [
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_WEBHOOK_SECRET",
  "INSTAGRAM_ACCESS_TOKEN",
  "INSTAGRAM_BUSINESS_ACCOUNT_ID"
];

const webhookCommand = [
  'curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \\',
  '  -H "Content-Type: application/json" \\',
  '  -d \'{"url":"https://agentic-7340495e.vercel.app/api/telegram?secret=$TELEGRAM_WEBHOOK_SECRET"}\''
].join("\n");

export default function Page() {
  return (
    <main>
      <section>
        <div className="badges">
          <span className="badge">Webhook</span>
          <span className="badge">Serverless</span>
          <span className="badge">Instagram Graph API</span>
        </div>
        <h1>Telegram → Instagram</h1>
        <p>
          Deploy this project to bridge your Telegram bot with an Instagram
          Business profile. When a user sends a photo in Telegram, the bot
          automatically uploads it to Instagram with the same caption.
        </p>
      </section>

      <section>
        <h2>Setup checklist</h2>
        <ol>
          {envVars.map((variable) => (
            <li key={variable}>
              <code>{variable}</code>
            </li>
          ))}
        </ol>
        <p>
          Ensure your Instagram account meets the{" "}
          <a
            href="https://developers.facebook.com/docs/instagram-api/reference/ig-user/media#creating"
            target="_blank"
            rel="noreferrer"
          >
            Instagram Graph API requirements
          </a>
          . Once the tokens are in place, set the webhook:
        </p>
        <pre>
          <code>{webhookCommand}</code>
        </pre>
      </section>

      <section>
        <h2>How it works</h2>
        <ol>
          {steps.map((step) => (
            <li key={step.title}>
              <strong>{step.title}:</strong> {step.description}
            </li>
          ))}
        </ol>
        <p>
          The Telegram webhook handler lives at{" "}
          <code>/api/telegram</code>. It validates the shared secret, fetches
          the Telegram file, creates an Instagram media container, publishes the
          post, then replies in Telegram with a confirmation or error message.
        </p>
      </section>

      <section>
        <h2>Instagram format</h2>
        <p>
          Only photo messages are supported in this build. The highest
          resolution image from the message is sent to Instagram. Video and
          carousel support can be added by extending the API helpers in{" "}
          <code>lib/instagram.ts</code>.
        </p>
      </section>

      <section>
        <h2>Need to rotate tokens?</h2>
        <p>
          Update the environment variables and redeploy. The serverless function
          reads from the environment on every execution, so no extra steps are
          required.
        </p>
      </section>
    </main>
  );
}
