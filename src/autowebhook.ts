import { EventEmitter } from 'events';
import { HealthChecker } from './health-checker.js';
import { TunnelProvider } from './providers/base.js';
import { NgrokProvider } from './providers/ngrok.js';
import { LocalhostRunProvider } from './providers/localhostrun.js';
import type { AutoWebhookConfig, TunnelConfig } from './types.js';

interface ManagedTunnel {
  config: TunnelConfig;
  provider: TunnelProvider;
  healthChecker: HealthChecker;
  url: string;
  startAttempts: number;
}

export class AutoWebhook extends EventEmitter {
  private readonly config: AutoWebhookConfig;
  private tunnels: Map<string, ManagedTunnel> = new Map();
  private isStopping = false;
  private readonly maxStartAttempts = 5;

  constructor(config: AutoWebhookConfig) {
    super();
    this.config = {
      port: 3000,
      expanded: false,
      healthCheck: { enabled: true, interval: 15000, timeout: 5000, maxFailures: 3 },
      ...config,
    };
  }

  async start(): Promise<string[]> {
    this.isStopping = false;
    const urls: string[] = [];
    for (const tunnelConfig of this.config.tunnels) {
      try {
        const url = await this.startTunnel(tunnelConfig);
        urls.push(url);
      } catch (e) {
        const error = e instanceof Error ? e : new Error(String(e));
        console.error(`[AutoWebhook] Failed to start tunnel "${tunnelConfig.name}".`, error);
        this.emit('error', new Error(`Failed to start tunnel "${tunnelConfig.name}"`));
      }
    }
    return urls;
  }

  private async startTunnel(tunnelConfig: TunnelConfig): Promise<string> {
    if (this.tunnels.has(tunnelConfig.name)) {
      console.warn(`[AutoWebhook] Tunnel "${tunnelConfig.name}" is already running.`);
      return this.tunnels.get(tunnelConfig.name)!.url;
    }

    console.log(
      `[AutoWebhook] Starting tunnel "${tunnelConfig.name}" with provider ${tunnelConfig.provider}...`
    );

    const provider = this.createProvider(tunnelConfig);
    const url = await provider.start();

    const healthChecker = new HealthChecker(this.config.healthCheck, this.config.expanded);
    healthChecker.start(url);

    healthChecker.on('critical', async (error: Error) => {
      if (this.isStopping) return;
      console.warn(`[AutoWebhook] Tunnel "${tunnelConfig.name}" is down: ${error.message}`);
      this.emit('tunnelDown', tunnelConfig.name, error);
      await this.restartTunnel(tunnelConfig);
    });

    const managedTunnel: ManagedTunnel = {
      config: tunnelConfig,
      provider,
      healthChecker,
      url,
      startAttempts: 0,
    };
    this.tunnels.set(tunnelConfig.name, managedTunnel);

    console.log(`[AutoWebhook] Tunnel "${tunnelConfig.name}" ready: ${url}`);
    this.emit('tunnelReady', tunnelConfig.name, url);

    return url;
  }

  private createProvider(tunnelConfig: TunnelConfig): TunnelProvider {
    const providerConfig = {
      ...this.config,
      port: tunnelConfig.port || this.config.port || 3000,
      ngrok: tunnelConfig.ngrok,
    };

    switch (tunnelConfig.provider) {
      case 'ngrok':
        return new NgrokProvider(providerConfig);
      case 'localhost.run':
        return new LocalhostRunProvider(providerConfig);
      default:
        throw new Error(`Unknown provider: ${tunnelConfig.provider}`);
    }
  }

  private async restartTunnel(tunnelConfig: TunnelConfig): Promise<void> {
    if (this.isStopping) return;

    const managedTunnel = this.tunnels.get(tunnelConfig.name);
    if (!managedTunnel) {
      console.error(`[AutoWebhook] Cannot restart tunnel "${tunnelConfig.name}", not found.`);
      return;
    }

    // Stop and remove the old tunnel first
    managedTunnel.healthChecker.stop();
    await managedTunnel.provider.stop();
    this.tunnels.delete(tunnelConfig.name);

    const newStartAttempts = (managedTunnel.startAttempts || 0) + 1;

    if (newStartAttempts > this.maxStartAttempts) {
      console.error(
        `[AutoWebhook] Max restart attempts reached for tunnel "${tunnelConfig.name}". Giving up.`
      );
      this.emit(
        'error',
        new Error(`Max restart attempts reached for tunnel "${tunnelConfig.name}"`)
      );
      return;
    }

    console.log(
      `[AutoWebhook] Restarting tunnel "${tunnelConfig.name}" (attempt ${newStartAttempts})...`
    );

    try {
      const url = await this.startTunnel(tunnelConfig);
      const newManagedTunnel = this.tunnels.get(tunnelConfig.name);
      if (newManagedTunnel) {
        newManagedTunnel.url = url;
        newManagedTunnel.startAttempts = newStartAttempts;
      }
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      console.error(`[AutoWebhook] Failed to restart tunnel "${tunnelConfig.name}".`, error);
      // It will be tried again on the next health check failure.
    }
  }

  async stop(): Promise<void> {
    this.isStopping = true;
    console.log('[AutoWebhook] Stopping all tunnels...');
    const stopPromises = Array.from(this.tunnels.values()).map(tunnel => {
      tunnel.healthChecker.stop();
      return tunnel.provider.stop();
    });
    await Promise.all(stopPromises);
    this.tunnels.clear();
    console.log('[AutoWebhook] All tunnels stopped.');
  }

  getUrls(): string[] {
    return Array.from(this.tunnels.values()).map(t => t.url);
  }

  getStatus() {
    const tunnelsStatus: { [key: string]: any } = {};
    for (const [name, tunnel] of this.tunnels.entries()) {
      tunnelsStatus[name] = {
        isRunning: tunnel.provider.isRunning(),
        url: tunnel.url,
        provider: tunnel.config.provider,
        startAttempts: tunnel.startAttempts,
        health: tunnel.healthChecker.getStatus(),
      };
    }
    return {
      tunnels: tunnelsStatus,
    };
  }
}
