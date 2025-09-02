# AutoWebhook

[![npm version](https://img.shields.io/npm/v/@rozeraf/autowebhook.svg)](https://www.npmjs.com/package/@rozeraf/autowebhook)
[![License: GPL-3.0-only](https://img.shields.io/badge/License-GPL--3.0--only-blue.svg)](https://www.gnu.org/licenses/gpl-3.0.html)
[![Powered by Bun](https://img.shields.io/badge/powered%20by-Bun-black.svg?style=flat&logo=bun)](https://bun.sh)

**AutoWebhook** is a library for Node.js and Bun that automatically creates and manages an [ngrok](https://ngrok.com/) tunnel. It provides a stable public URL for your local server, which is ideal for developing and testing webhooks for bots (Telegram, Discord, Slack, etc.), APIs, and other services.

The library runs ngrok in the background, monitors its status, automatically restarts it in case of failures, and provides a simple API to get the current URL.

## Why AutoWebhook?

When developing bots or services that use webhooks, you face the need for a public HTTPS URL that can receive requests from external platforms (like Telegram). Ngrok is excellent for this, but it requires manual startup, and the free version provides temporary URLs that change with each restart.

**AutoWebhook** automates this process:
- **Automatic Start**: Runs ngrok along with your application.
- **Stable URL**: Automatically retrieves the tunnel URL and provides it to your application.
- **Monitoring and Restart**: A built-in health check monitors the tunnel's status and restarts ngrok on failure, providing a "persistent" webhook for development.
- **Simplicity**: Eliminates the need for manual steps and extra scripts.

## Core Features

- **Automatic ngrok tunnel management**: Start, stop, and restart in the background.
- **URL Retrieval**: Gets the public URL from the ngrok agent API.
- **Health Check**: Optional component to monitor the status of the tunnel and your application's endpoint.
- **Reliability**: Automatic restart on connection loss or failures.
- **Flexible Configuration**: Ability to specify port, ngrok region, subdomain, auth token, and health check parameters.
- **Event-driven Architecture**: Get real-time notifications for tunnel status changes (`ready`, `restarting`, `error`).
- **TypeScript Support**: Fully typed for robust development.

## Installation

```bash
bun add @rozeraf/autowebhook
# or with npm
npm install @rozeraf/autowebhook
# or with yarn
yarn add @rozeraf/autowebhook
```

## Quick Start

Here's how you can set up a webhook for a Telegram bot in just a few lines:

```typescript
// bot.ts
import { AutoWebhook } from '@rozeraf/autowebhook';
import { Bot } from 'grammy'; // Example with grammy

// 1. Initialize AutoWebhook, specifying the port of your local server
const webhook = new AutoWebhook({ port: 3000 });

// 2. Create a bot instance
const bot = new Bot('YOUR_TELEGRAM_BOT_TOKEN');

// 3. Start the tunnel and get the URL
const url = await webhook.start();

// 4. Set the webhook
await bot.api.setWebhook(`${url}/webhook`);

console.log(`Bot started with webhook: ${url}`);

// Your logic for the local server that will listen on port 3000
// ...
```

For more examples, see the [EXAMPLES.md](./EXAMPLES.md) file.

## Configuration

You can configure `AutoWebhook` via the configuration object in the constructor:

```typescript
import { AutoWebhook } from '@rozeraf/autowebhook';

const config = {
  // The port of your local server
  port: 8080,
  
  // Or a command to run, if you have complex logic
  // command: 'python -m http.server 8080',

  // ngrok region (us, eu, ap, au, sa, jp, in)
  region: 'eu',

  // Custom subdomain (requires a paid ngrok plan)
  subdomain: 'my-cool-bot',

  // ngrok authentication token
  auth: 'YOUR_NGROK_AUTHTOKEN',

  // Health check settings
  healthCheck: {
    enabled: true,       // Enable checking
    interval: 20000,     // Check interval (ms)
    timeout: 10000,      // Request timeout (ms)
    maxFailures: 3,      // Number of failures before restart
  },

  // Callbacks
  onUrlChange: (url) => console.log(`New URL: ${url}`),
  onError: (error) => console.error(`An error occurred: ${error}`),
  onRestart: () => console.log('Restarting tunnel...'),
};

const webhook = new AutoWebhook(config);
await webhook.start();
```

### `AutoWebhookConfig`

| Field         | Type                              | Default      | Description                                                                                             |
|---------------|-----------------------------------|--------------|---------------------------------------------------------------------------------------------------------|
| `port`        | `number`                          | `3000`       | The port of the local server that ngrok will proxy traffic to.                                          |
| `command`     | `string`                          | `''`         | Alternative to `port`. Command to start ngrok (e.g., `http 80`). Overrides `port`.                      |
| `region`      | `string`                          | `'eu'`       | The ngrok server region.                                                                                |
| `subdomain`   | `string`                          | `''`         | Request a specific subdomain (requires a paid ngrok plan).                                              |
| `auth`        | `string`                          | `''`         | Your ngrok authentication token.                                                                        |
| `healthCheck` | `HealthCheckConfig`               | `{...}`      | Configuration object for the health check module.                                                       |
| `onUrlChange` | `(url: string) => void`           | `() => {}`   | Callback invoked when the URL is retrieved or changed.                                                  |
| `onError`     | `(error: Error) => void`          | `() => {}`   | Callback for handling errors from the ngrok process.                                                    |
| `onRestart`   | `() => void`                      | `() => {}`   | Callback invoked before a tunnel restart is attempted.                                                  |

## API

### `webhook.start(): Promise<string>`
Starts the ngrok tunnel and returns a `Promise` that resolves with the public URL.

### `webhook.stop(): Promise<void>`
Stops the ngrok tunnel.

### `webhook.restart(): Promise<string>`
Forcibly restarts the tunnel and returns the new URL.

### `webhook.webhookUrl: string`
Returns the current active tunnel URL.

### `webhook.getStatus()`
Returns an object with the current tunnel status, including `isRunning`, `currentUrl`, `isRestarting`, and the health check status.

## Events

The `AutoWebhook` instance is an `EventEmitter` and emits the following events:

- `ready (url: string)`: Emitted when the tunnel is successfully started and the URL is retrieved.
- `restarting`: Emitted before a tunnel restart is attempted.
- `restarted (newUrl: string)`: Emitted after a successful restart.
- `error (error: Error)`: Emitted when an error occurs in the ngrok process.
- `maxRestartsReached`: Emitted if the maximum number of restart attempts is reached.

Example usage:
```typescript
webhook.on('ready', (url) => {
  console.log(`Tunnel ready: ${url}`);
});

webhook.on('error', (err) => {
  console.error('ngrok error:', err);
});
```

## Changelog

All changes are documented in the [CHANGELOG.md](./CHANGELOG.md) file.

## License

This project is distributed under the GPL-3.0-only license. See the [LICENSE](./LICENSE) file for more information.
