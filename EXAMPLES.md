# AutoWebhook Usage Examples

Here you will find several examples demonstrating how to use the `AutoWebhook` library in various scenarios.

## Example 1: Basic Usage

This example shows how to get a public URL. This is sufficient if you just need a stable address to access your local server.

```typescript
// examples/basic.ts
import { AutoWebhook } from '@rozeraf/autowebhook';

async function main() {
  // Initialize AutoWebhook, specifying the port of your local server
  const webhook = new AutoWebhook({ port: 3000 });

  try {
    // Start the tunnel and wait for the URL
    const url = await webhook.start();

    console.log('✨ Your persistent webhook is ready:', url);
    console.log('Press Ctrl+C to exit.');

    // You can now use this URL to set up webhooks
    // or to access your local application from the outside.

  } catch (error) { 
    console.error('Failed to start AutoWebhook:', error);
  }
}

main();
```

## Example 2: Integration with a Telegram Bot (grammy)

This is the most common use case: automatically setting up a webhook for a bot every time the application starts.

```typescript
// examples/telegram-bot.ts
import { AutoWebhook } from '@rozeraf/autowebhook';
import { Bot, webhookCallback } from 'grammy';
import express from 'express';

// --- Configuration ---
const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_TELEGRAM_BOT_TOKEN';
const PORT = 3000;

async function setupBot() {
  // 1. Initialize AutoWebhook
  const autowebhook = new AutoWebhook({ port: PORT });

  // 2. Create a bot instance
  const bot = new Bot(BOT_TOKEN);

  // 3. Set up bot logic
  bot.command('start', (ctx) => ctx.reply('Hi! I am running via AutoWebhook!'));
  bot.on('message', (ctx) => ctx.reply('Received your message!'));

  // 4. Start the tunnel and get the URL
  const webhookUrl = await autowebhook.start();
  console.log(`Webhook URL: ${webhookUrl}`);

  // 5. Set up a web server to handle incoming updates from Telegram
  const server = express();
  server.use(express.json());
  server.use(`/webhook`, webhookCallback(bot, 'express'));

  server.listen(PORT, async () => {
    // 6. Set the webhook in Telegram
    await bot.api.setWebhook(`${webhookUrl}/webhook`);
    console.log(`Bot started! Server is listening on port ${PORT}`);
  });
}

setupBot().catch(console.error);
```

## Example 3: Advanced Usage with Event Handling

You can track the tunnel's lifecycle using events. This is useful for logging, monitoring, or performing actions when the state changes.

```typescript
// examples/advanced.ts
import { AutoWebhook } from '@rozeraf/autowebhook';

const webhook = new AutoWebhook({
  port: 8080,
  region: 'eu',
  healthCheck: {
    interval: 15000, // Check every 15 seconds
    maxFailures: 2,  // Restart after 2 failures
  },
});

// Event: tunnel is ready
webhook.on('ready', (url) => {
  console.log(`✅ Tunnel is ready and available at: ${url}`);
});

// Event: restart is beginning
webhook.on('restarting', () => {
  console.warn('⚠️ A problem was detected. Restarting the tunnel...');
});

// Event: tunnel has been successfully restarted
webhook.on('restarted', (newUrl) => {
  console.log(`🔄 Tunnel successfully restarted. New URL: ${newUrl}`);
  // Here you can update the webhook URL in your service
  // await bot.api.setWebhook(newUrl);
});

// Event: ngrok process error
webhook.on('error', (error) => {
  console.error(`❌ A critical error occurred in the ngrok process:`, error);
});

// Event: max restart attempts reached
webhook.on('maxRestartsReached', () => {
  console.error('🚫 Maximum number of restart attempts has been reached. Check the logs.');
  // You could send a notification to an administrator here
});

async function run() {
  try {
    await webhook.start();
  } catch (err) {
    console.error('Failed to start ngrok:', err);
  }
}

run();
```