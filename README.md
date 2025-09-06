# AutoWebhook

[![npm version](https://img.shields.io/npm/v/autowebhook.svg)](https://www.npmjs.com/package/autowebhook)
[![License: GPL-3.0-only](https://img.shields.io/badge/License-GPL--3.0--only-blue.svg)](https://www.gnu.org/licenses/gpl-3.0.html)
[![Powered by Bun](https://img.shields.io/badge/powered%20by-Bun-black.svg?style=flat&logo=bun)](https://bun.sh)
[![GitHub](https://img.shields.io/badge/GitHub-autowebhook-blue?logo=github)](https://github.com/rozeraf/autowebhook)

**AutoWebhook** is a library for Node.js and Bun that automatically creates and manages tunnels using services like [ngrok](https://ngrok.com/) and [localhost.run](https://localhost.run). It provides stable public URLs for your local server, which is ideal for developing and testing webhooks.

The library runs your chosen tunnel provider in the background, monitors its status, automatically restarts it in case of failures, and provides a simple API to manage one or multiple tunnels simultaneously.

## Why AutoWebhook?

When developing services that use webhooks, you need a public HTTPS URL. Tunneling services are excellent for this, but often require manual startup and management.

**AutoWebhook** automates this entire process:

- **Automatic Start**: Runs tunnel providers alongside your application.
- **Multi-Provider**: Supports `ngrok` and `localhost.run` out of the box.
- **Multi-Tunnel**: Run and manage multiple tunnels at the same time.
- **Monitoring and Restart**: A built-in health checker monitors each tunnel and automatically restarts it on failure.
- **Simplicity**: Eliminates the need for manual steps and extra scripts.

## Core Features

- **Automatic Tunnel Management**: Start, stop, and restart in the background.
- **Multi-Provider Support**: Use `ngrok`, `localhost.run`, or other future providers.
- **Multi-Tunnel Management**: Run multiple tunnels simultaneously for high availability or A/B testing.
- **Health Check**: Optional component to monitor the status of each tunnel.
- **Reliability**: Automatic restart on connection loss or failures.
- **Flexible Configuration**: Configure multiple tunnels, each with its own provider, port, and provider-specific settings.
- **Event-driven Architecture**: Get real-time notifications for each tunnel's status.
- **TypeScript Support**: Fully typed for robust development.

## Installation

```bash
npm install autowebhook
# or with bun
bun add autowebhook
# or with yarn
yarn add autowebhook
```

## Quick Start

Here's how you can get a public URL for your local server in just a few lines:

```typescript
// index.ts
import { AutoWebhook } from 'autowebhook';

// 1. Configure a tunnel
const webhook = new AutoWebhook({
  tunnels: [{ name: 'my-app', provider: 'ngrok', port: 3000 }]
});

// 2. Start the tunnel(s)
const [url] = await webhook.start(); // .start() returns an array of URLs

console.log(`App running at: ${url}`);

// Your local server logic that will listen on port 3000
// ...
```

## Requirements

- **Node.js**: >= 18.0.0
- **Bun**: >= 1.0.0 (optional)
- **TypeScript**: >= 5.0.0 (optional, but recommended)

For `ngrok` tunnels, you may need to install ngrok separately or provide an auth token for advanced features.

## Documentation

For detailed configuration, API methods, and events, see the **[API Reference](./API.md)**.

For more complex use cases, including how to set up a Telegram bot or manage multiple tunnels, see the **[Usage Examples](./EXAMPLES.md)**.

## Package Contents

This package is published as compiled JavaScript with TypeScript definitions:

- **ESM**: `dist/index.js` (ES modules)
- **CommonJS**: `dist/index.cjs` (CommonJS modules)
- **Types**: `dist/index.d.ts` (TypeScript definitions)

The package supports both `import` and `require` syntax:

```typescript
// ESM
import { AutoWebhook } from 'autowebhook';

// CommonJS
const { AutoWebhook } = require('autowebhook');
```

## Development

```bash
# Clone the repository
gh repo clone rozeraf/autowebhook

# Install dependencies
bun install

# Run tests
bun test

# Build the package
bun run build

# Run linting
bun run lint
```

## Changelog

All changes are documented in the [CHANGELOG.md](./CHANGELOG.md) file.

## License

This project is distributed under the GPL-3.0-only license. See the [LICENSE](./LICENSE) file for more information.