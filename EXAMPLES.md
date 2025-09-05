# AutoWebhook Usage Examples

Here you will find several examples demonstrating how to use the `AutoWebhook` library with its multi-tunnel capabilities.

## Example 1: Basic Usage (Single Tunnel)

This example shows how to get a single public URL using the new configuration format.

```typescript
// examples/basic.ts
import { AutoWebhook } from 'autowebhook';

async function main() {
  const webhook = new AutoWebhook({
    tunnels: [{ name: 'my-app', provider: 'ngrok', port: 3000 }]
  });

  try {
    // .start() now returns an array of all tunnel URLs
    const [url] = await webhook.start();

    if (url) {
      console.log('✨ Your webhook is ready:', url);
    }
    console.log('Press Ctrl+C to exit.');

  } catch (error) { 
    console.error('Failed to start AutoWebhook:', error);
  }
}

main();
```

## Example 2: Integration with a Telegram Bot (grammy)

This example shows how to set up a webhook for a bot using the new API.

```typescript
// examples/telegram-bot.ts
import { AutoWebhook } from 'autowebhook';
import { Bot, webhookCallback } from 'grammy';
import express from 'express';

// --- Configuration ---
const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_TELEGRAM_BOT_TOKEN';
const PORT = 3000;

async function setupBot() {
  // 1. Initialize AutoWebhook with a single tunnel
  const autowebhook = new AutoWebhook({
    tunnels: [{ name: 'telegram-bot', provider: 'ngrok', port: PORT }]
  });

  // 2. Create a bot instance
  const bot = new Bot(BOT_TOKEN);

  // 3. Set up bot logic
  bot.command('start', (ctx) => ctx.reply('Hi! I am running via AutoWebhook!'));
  bot.on('message', (ctx) => ctx.reply('Received your message!'));

  // 4. Start the tunnel and get the URL
  const [webhookUrl] = await autowebhook.start();
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

## Example 3: Advanced Usage with Multiple Tunnels and Events

This example demonstrates how to start multiple tunnels (one `ngrok` and one `localhost.run`) and listen for lifecycle events.

```typescript
// examples/multi-tunnel.ts
import { AutoWebhook } from 'autowebhook';

const webhook = new AutoWebhook({
  tunnels: [
    {
      name: 'ngrok-main',
      provider: 'ngrok',
      port: 8080,
      ngrok: { region: 'eu' } // Provider-specific config
    },
    {
      name: 'lhr-backup',
      provider: 'localhost.run',
      port: 8080
    }
  ],
  healthCheck: {
    interval: 15000, // Check every 15 seconds
    maxFailures: 2,  // Restart a tunnel after 2 failures
  },
});

// Event: A tunnel is ready and has a public URL
webhook.on('tunnelReady', (name, url) => {
  console.log(`✅ Tunnel "${name}" is ready: ${url}`);
});

// Event: A tunnel has gone down and will be restarted
webhook.on('tunnelDown', (name, error) => {
  console.warn(`⚠️ Tunnel "${name}" is down and will be restarted. Reason: ${error.message}`);
});

// Event: A global error occurred (e.g., failed to start all tunnels)
webhook.on('error', (error) => {
  console.error(`❌ A critical error occurred:`, error);
});

async function run() {
  try {
    const urls = await webhook.start();
    console.log('All tunnels started and ready:', urls);
    // You can now use the array of URLs for your load balancer or A/B tests
  } catch (err) {
    console.error('Failed to start tunnels:', err);
  }
}

run();
```

## Example 4: Advanced ngrok Configuration (TCP Tunnel)

This example shows how to create a TCP tunnel for services like SSH or databases, and how to restrict access using an IP whitelist.

```typescript
// examples/tcp-tunnel.ts
import { AutoWebhook } from 'autowebhook';

const webhook = new AutoWebhook({
  tunnels: [
    {
      name: 'ssh-tunnel',
      provider: 'ngrok',
      port: 22, // Your local SSH port
      ngrok: {
        proto: 'tcp', // Specify TCP protocol
        region: 'eu',
        allow_cidr: 'YOUR_IP_ADDRESS/32', // Whitelist your IP
      }
    }
  ],
});

webhook.on('tunnelReady', (name, url) => {
  console.log(`✅ TCP Tunnel "${name}" is ready: ${url}`);
  console.log(`You can now connect via: ssh user@${url.replace('tcp://', '')}`);
});

async function run() {
  try {
    await webhook.start();
  } catch (err) {
    console.error('Failed to start tunnels:', err);
  }
}

run();
```

## Example 5: Using with Different Package Managers and Module Systems

This example shows different ways to import and use AutoWebhook depending on your setup.

```typescript
// ESM (TypeScript/modern Node.js)
import { AutoWebhook } from 'autowebhook';

const webhook = new AutoWebhook({
  tunnels: [{ name: 'my-app', provider: 'ngrok', port: 3000 }]
});
```

```javascript
// CommonJS (traditional Node.js)
const { AutoWebhook } = require('autowebhook');

const webhook = new AutoWebhook({
  tunnels: [{ name: 'my-app', provider: 'ngrok', port: 3000 }]
});
```

```javascript
// With Bun
import { AutoWebhook } from 'autowebhook';

// Bun supports top-level await
const webhook = new AutoWebhook({
  tunnels: [{ name: 'my-app', provider: 'ngrok', port: 3000 }]
});

const [url] = await webhook.start();
console.log(`Running at: ${url}`);
```

## Example 6: Error Handling and Graceful Shutdown

This example demonstrates proper error handling and cleanup.

```typescript
// examples/error-handling.ts
import { AutoWebhook } from 'autowebhook';

const webhook = new AutoWebhook({
  tunnels: [
    { name: 'primary', provider: 'ngrok', port: 3000 },
    { name: 'backup', provider: 'localhost.run', port: 3000 }
  ],
  healthCheck: {
    enabled: true,
    interval: 30000,
    maxFailures: 3
  }
});

// Handle individual tunnel events
webhook.on('tunnelReady', (name, url) => {
  console.log(`✅ Tunnel '${name}' ready: ${url}`);
});

webhook.on('tunnelDown', (name, error) => {
  console.warn(`⚠️ Tunnel '${name}' down: ${error.message}`);
  // You could implement fallback logic here
});

webhook.on('error', (error) => {
  console.error('❌ AutoWebhook error:', error);
});

async function main() {
  try {
    const urls = await webhook.start();
    console.log('🚀 All tunnels started:', urls);
    
    // Your application logic here
    console.log('Application running... Press Ctrl+C to stop');
    
  } catch (error) {
    console.error('💥 Failed to start tunnels:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  try {
    await webhook.stop();
    console.log('✅ All tunnels stopped');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

main();
```