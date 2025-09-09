
# AutoWebhook

> Effortlessly manage public tunnels for local webhooks with automatic monitoring and multi-provider support.

[![npm version](https://img.shields.io/npm/v/autowebhook.svg)](https://www.npmjs.com/package/autowebhook)
[![License: GPL-3.0-only](https://img.shields.io/badge/License-GPL--3.0--only-blue.svg)](https://www.gnu.org/licenses/gpl-3.0.html)
[![Powered by Bun](https://img.shields.io/badge/powered%20by-Bun-black.svg?style=flat&logo=bun)](https://bun.sh)
[![GitHub](https://img.shields.io/badge/GitHub-autowebhook-blue?logo=github)](https://github.com/rozeraf/autowebhook)


---


## Table of Contents

- [Overview](#overview)
- [Why AutoWebhook](#why-autowebhook)
- [Core Features](#core-features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Requirements](#requirements)
- [Documentation](#documentation)
- [Package Contents](#package-contents)
- [Development](#development)
- [Changelog](#changelog)
- [License](#license)
- [Contributing](#contributing)

---

## Overview

**AutoWebhook** is a library for Node.js and Bun that automatically creates and manages tunnels using services like [ngrok](https://ngrok.com/) and [localhost.run](https://localhost.run). It provides stable public URLs for your local server, making it ideal for developing and testing webhooks.

The library runs your chosen tunnel provider in the background, monitors its status, automatically restarts it in case of failures, and provides a simple API to manage one or multiple tunnels simultaneously.



## Why AutoWebhook

When developing services that use webhooks, you need a public HTTPS URL. Tunneling services are great for this, but they often require manual startup, monitoring, and restarting.

**AutoWebhook** removes all the manual hassle:

- **Zero manual steps**: Tunnels start and restart automatically with your app.
- **Multi-provider**: Use `ngrok`, `localhost.run`, or both for redundancy.
- **Multi-tunnel**: Manage several tunnels at once for advanced workflows.
- **Automatic monitoring**: Built-in health checks and auto-restart on failure.
- **Simple API**: One config, one method call, and you’re ready.


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

It is recommended to use AutoWebhook with [Bun](https://bun.sh/) — it's faster and easier than npm/yarn. Below are the instructions for all operating systems.

<details>
<summary><strong>macOS</strong></summary>

**1. Install Bun:**

```bash
curl -fsSL https://bun.sh/install | bash
```

**2. Install AutoWebhook:**

```bash
bun add autowebhook
```

<details>
<summary>Alternative: via npm</summary>

```bash
brew install node
npm install autowebhook
```
</details>

</details>

<details>
<summary><strong>Windows</strong></summary>

**1. Install Bun:**

- Download and run the installer from [bun.sh](https://bun.sh/)

**2. Install AutoWebhook:**

```powershell
bun add autowebhook
```

<details>
<summary>Alternative: via npm</summary>

Download Node.js from [nodejs.org](https://nodejs.org/)

```powershell
npm install autowebhook
```
</details>

</details>

<details>
<summary><strong>Linux (Debian/Ubuntu, Arch, Fedora)</strong></summary>

**1. Install Bun:**

```bash
curl -fsSL https://bun.sh/install | bash
```

**2. Install AutoWebhook:**

```bash
bun add autowebhook
```

<details>
<summary>Alternative: via npm</summary>

- <details>
  <summary>Debian/Ubuntu</summary>
  
  ```bash
  sudo apt update && sudo apt install nodejs npm
  npm install autowebhook
  ```
  </details>

- <details>
  <summary>Arch Linux</summary>
  
  ```bash
  sudo pacman -S nodejs npm
  npm install autowebhook
  ```
  </details>

- <details>
  <summary>Fedora</summary>
  
  ```bash
  sudo dnf install nodejs npm
  npm install autowebhook
  ```
  </details>
</details>

</details>




## Quick Start

The recommended way is to run it with Bun:

```typescript
// index.ts
import { AutoWebhook } from 'autowebhook';

const webhook = new AutoWebhook({
  tunnels: [{ name: 'my-app', provider: 'ngrok', port: 3000 }]
});

const [url] = await webhook.start();
console.log(`App running at: ${url}`);
// ...your server on port 3000
```

<details>
<summary><strong>How to run</strong></summary>

**With Bun:**

```bash
bun run index.ts
```

<details>
<summary>Via npm (alternative)</summary>

```bash
npx tsx index.ts
# or
npm run start
```
</details>

<details>
<summary>Via node (after compiling to JS)</summary>

```bash
tsc index.ts
node index.js
```
</details>

</details>


## Requirements

- **Node.js**: >= 18.0.0
- **Bun**: >= 1.0.0 (optional)
- **TypeScript**: >= 5.0.0 (optional, but recommended)

For `ngrok` tunnels, you may need to install ngrok separately or provide an auth token for advanced features.


## Documentation


For detailed configuration, API methods, and events, see the [API Reference](./API.md).

For more complex use cases, including how to set up a Telegram bot or manage multiple tunnels, see the [Usage Examples](./EXAMPLES.md).


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

---


## Contributing

Contributions, bug reports, and feature requests are welcome! Please open an issue or submit a pull request on [GitHub](https://github.com/rozeraf/autowebhook).