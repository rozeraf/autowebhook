# AutoWebhook API Reference

This document provides detailed information about the configuration, methods, and events for the `AutoWebhook` library.

---

## 🚀 Installation

```bash
npm install autowebhook
# or
bun add autowebhook
```

---

## ✨ Quick Start

Get your local server online in seconds.

```typescript
import { AutoWebhook } from 'autowebhook';

const webhook = new AutoWebhook({
  tunnels: [{ name: 'my-app', provider: 'ngrok', port: 3000 }]
});

const [url] = await webhook.start();
console.log('✨ Your webhook is ready:', url);
```

---

## ⚙️ Configuration

You configure `AutoWebhook` by passing a configuration object to its constructor. The main component is the `tunnels` array, which defines all the tunnels you want to create.

```typescript
import { AutoWebhook } from 'autowebhook';

const config = {
  // Default port for all tunnels if not specified individually
  port: 8080,

  // Array of tunnels to create
  tunnels: [
    {
      name: 'primary-ngrok', // A unique name for this tunnel
      provider: 'ngrok',
      port: 8081, // Override default port
      ngrok: { // ngrok-specific settings
        region: 'eu',
        subdomain: 'my-cool-bot', // Requires a paid ngrok plan
        auth: 'YOUR_NGROK_AUTHTOKEN',
      }
    },
    {
      name: 'backup-lhr',
      provider: 'localhost.run',
      port: 8082,
    }
  ],

  // Health check settings for all tunnels
  healthCheck: {
    enabled: true,
    interval: 20000,
    timeout: 10000,
    maxFailures: 3, // Attempts before restarting a tunnel
  },
  
  // Enable expanded logging for debugging
  expanded: false,
};

const webhook = new AutoWebhook(config);
const urls = await webhook.start();
console.log('Tunnels are ready:', urls);
```

### `AutoWebhookConfig`

The main configuration object passed to the `AutoWebhook` constructor.

| Field         | Type              | Default   | Description                                                                    |
|---------------|-------------------|-----------|--------------------------------------------------------------------------------|
| `tunnels`     | `TunnelConfig[]`  | `[]`      | **Required**. An array of tunnel configurations to create.                     |
| `port`        | `number`          | `3000`    | A default port for all tunnels if not specified in the tunnel's config.        |
| `healthCheck` | `HealthCheckConfig` | `{...}`   | Global health check settings applied to all tunnels.                           |
| `expanded`    | `boolean`         | `false`   | Enable detailed debug logging for all tunnels.                                 |
| `onError`     | `(error: Error) => void` | `() => {}`| Callback for handling global errors that occur outside a specific tunnel.    |

### `TunnelConfig`

This object defines a single tunnel to be managed by `AutoWebhook`.

| Field      | Type                             | Default                      | Description                                                                    |
|------------|----------------------------------|------------------------------|--------------------------------------------------------------------------------|
| `name`     | `string`                         | -                            | **Required**. A unique name to identify the tunnel in events and status logs.  |
| `provider` | `'ngrok' \| 'localhost.run'`   | -                            | **Required**. The tunneling service to use.                                    |
| `port`     | `number`                         | Inherits from global `port`  | The local port for this specific tunnel to expose.                             |
| `ngrok`    | `NgrokTunnelConfig`              | `{}`                         | An object with ngrok-specific settings. See `NgrokTunnelConfig` below. |

### `NgrokTunnelConfig`

This object provides detailed configuration for tunnels using `ngrok` as the provider.

| Field        | Type                          | Default  | Description                                                                                                     |
|--------------|-------------------------------|----------|-----------------------------------------------------------------------------------------------------------------|
| `proto`      | `'http' \| 'tcp' \| 'tls'`    | `'http'` | The protocol to tunnel (`http`, `tcp`, or `tls`).                                                               |
| `region`     | `'us' \| 'eu' \| 'ap' \| 'au' \| 'sa' \| 'jp' \| 'in'`         | -        | The ngrok datacenter region to use.                                                                             |
| `subdomain`  | `string`                      | -        | A custom subdomain for your tunnel (requires a paid ngrok plan).                                                |
| `hostname`   | `string`                      | -        | A custom hostname for your tunnel (requires a paid ngrok plan).                                                 |
| `auth`       | `string`                      | -        | Your ngrok authtoken.                                                                                           |
| `basic_auth` | `string`                      | -        | Protect the tunnel with a username and password (e.g., `'user:password'`).                                     |
| `allow_cidr` | `string \| string[]`          | -        | A single CIDR or a list of CIDRs to whitelist for access to the tunnel.                                         |
| `command`    | `string`                      | -        | A raw ngrok command string to execute. If provided, it overrides all other ngrok settings like `proto` or `port`. |

---

## 🛠️ API Methods

### `webhook.start(): Promise<string[]>`

Starts all tunnels defined in the `tunnels` configuration array. Returns a `Promise` that resolves with an array of the public URLs.

**Example:**
```typescript
const urls = await webhook.start();
console.log('Available tunnels:', urls);
// Output: ['https://abc123.ngrok.io', 'https://random-id.lhr.life']
```

### `webhook.stop(): Promise<void>`

Stops all active tunnels and their health checkers.

**Example:**
```typescript
await webhook.stop();
console.log('All tunnels stopped');
```

### `webhook.getUrls(): string[]`

Returns an array of the currently active public URLs for all managed tunnels.

**Example:**
```typescript
const activeUrls = webhook.getUrls();
console.log('Currently active:', activeUrls);
```

### `webhook.getStatus()`

Returns an object containing the detailed status of all managed tunnels, including their running state, URL, provider, restart attempts, and health status.

**Example:**
```typescript
const status = webhook.getStatus();
console.log('Tunnel status:', JSON.stringify(status, null, 2));
```

---

## 🔔 Events

The `AutoWebhook` instance is an `EventEmitter` and emits the following events to allow you to react to the lifecycle of each tunnel.

### `tunnelReady`
- **Arguments**: `(name: string, url: string)`
- **Description**: Emitted when a tunnel is successfully started and its public URL is retrieved.

### `tunnelDown`
- **Arguments**: `(name: string, error: Error)`
- **Description**: Emitted when a tunnel fails its health check and is about to be restarted.

### `error`
- **Arguments**: `(error: Error)`
- **Description**: Emitted when a global error occurs that isn't specific to one tunnel (e.g., failure to start all tunnels).

**Example usage:**
```typescript
webhook.on('tunnelReady', (name, url) => {
  console.log(`✅ Tunnel "${name}" is ready at: ${url}`);
});

webhook.on('tunnelDown', (name, error) => {
  console.warn(`⚠️ Tunnel "${name}" went down: ${error.message}`);
});

webhook.on('error', (error) => {
  console.error('❌ Global error:', error);
});
```

---

## 🔷 TypeScript Support

AutoWebhook v3.0+ includes full TypeScript definitions out of the box. All configuration objects and method return types are properly typed.

```typescript
import type { AutoWebhookConfig, TunnelConfig } from 'autowebhook';

const config: AutoWebhookConfig = {
  tunnels: [
    {
      name: 'my-tunnel',
      provider: 'ngrok', // TypeScript will validate this
      port: 3000
    }
  ]
};
```

---

## 🔄 Migration from v2.x

### Breaking Changes in v3.0

1. **Package format changed**: Now published as compiled JavaScript with TypeScript definitions.
2. **Dual module support**: Both ESM and CommonJS are supported.
3. **Import path remains the same**: `import { AutoWebhook } from 'autowebhook'`.

### No code changes required

Your existing code will work without modifications. The API remains the same, only the package distribution format changed.

```typescript
// This still works exactly the same
import { AutoWebhook } from 'autowebhook';

const webhook = new AutoWebhook({
  tunnels: [{ name: 'test', provider: 'ngrok', port: 3000 }]
});
```