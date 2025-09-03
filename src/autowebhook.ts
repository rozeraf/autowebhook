import { EventEmitter } from 'events';
import { NgrokHealthChecker } from './health-checker.js';
import { TunnelProvider } from './providers/base.js';
import { NgrokProvider } from './providers/ngrok.js';
import { LocalhostRunProvider } from './providers/localhostrun.js';
import type { AutoWebhookConfig, ProviderName } from './types.js';

export class AutoWebhook extends EventEmitter {
  private readonly config: AutoWebhookConfig;
  private healthChecker: NgrokHealthChecker;
  private providers: TunnelProvider[];
  private activeProviderIndex = 0;
  private isSwitching = false;
  private startAttempts = 0;
  private readonly maxStartAttempts = 5; // Per provider

  constructor(config: AutoWebhookConfig = {}) {
    super();

    this.config = {
      port: 3000,
      providers: ['ngrok'],
      ngrok: {},
      expanded: false,
      onUrlChange: () => {},
      onError: () => {},
      onRestart: () => {},
      onProviderChange: () => {},
      healthCheck: { enabled: true, interval: 15000, timeout: 5000, maxFailures: 3 },
      ...config,
    };

    this.providers = (this.config.providers || ['ngrok']).map(p => this.createProvider(p));
    this.healthChecker = new NgrokHealthChecker(
      this.config.healthCheck,
      this.config.expanded
    );
    this.setupHealthChecker();
  }

  private createProvider(name: ProviderName): TunnelProvider {
    switch (name) {
      case 'ngrok':
        return new NgrokProvider(this.config);
      case 'localhost.run':
        return new LocalhostRunProvider(this.config);
      default:
        throw new Error(`Unknown provider: ${name}`);
    }
  }

  private setupHealthChecker(): void {
    this.healthChecker.on('critical', async (error: Error) => {
      if (!this.isSwitching) {
        const provider = this.getActiveProvider();
        if (provider) {
          console.warn(`[AutoWebhook] Health check critical failure for ${provider.name}: ${error.message}`);
          await this.switchToNextProvider();
        }
      }
    });

    this.healthChecker.on('unhealthy', (error: Error, failureCount: number) => {
      const provider = this.getActiveProvider();
      if (provider) {
        console.warn(`[AutoWebhook] Health check failed for ${provider.name} (${failureCount}): ${error.message}`);
      }
    });
  }

  async start(): Promise<string> {
    const provider = this.getActiveProvider();
    if (provider?.currentUrl) {
      console.warn('[AutoWebhook] Already running');
      return provider.currentUrl;
    }

    try {
      const url = await this.tryStartingProviders();
      this.startAttempts = 0;
      return url;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  private async tryStartingProviders(): Promise<string> {
    if (!this.providers || this.providers.length === 0) {
      throw new Error('No providers configured.');
    }
    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.getActiveProvider();
      if (!provider) {
        this.activeProviderIndex = (this.activeProviderIndex + 1) % this.providers.length;
        continue;
      }
      try {
        const url = await this.startProvider(provider);
        return url;
      } catch (error) {
        console.error(`[AutoWebhook] Provider ${provider.name} failed to start.`, error);
        this.activeProviderIndex = (this.activeProviderIndex + 1) % this.providers.length;
      }
    }
    throw new Error('All configured providers failed to start.');
  }

  private async startProvider(provider: TunnelProvider): Promise<string> {
    provider.on('exit', (code: number | null) => {
      if (!this.isSwitching) {
        console.log(`[AutoWebhook] ${provider.name} process exited with code ${code}`);
        this.healthChecker.stop();
        this.handleUnexpectedExit();
      }
    });

    const url = await provider.start();
    this.config.onUrlChange?.(url);
    this.healthChecker.start(url);
    this.emit('ready', url);
    return url;
  }

  private async handleUnexpectedExit(): Promise<void> {
    const provider = this.getActiveProvider();
    if (!provider) return;

    if (this.startAttempts < this.maxStartAttempts) {
      console.log(
        `[AutoWebhook] Attempting to restart ${provider.name} (attempt ${this.startAttempts + 1}/${this.maxStartAttempts})`
      );
      await this.restart();
    } else {
      console.error(`[AutoWebhook] Max restart attempts reached for ${provider.name}. Switching to next provider.`);
      await this.switchToNextProvider();
    }
  }

  async restart(): Promise<string> {
    const provider = this.getActiveProvider();
    if (!provider) {
      throw new Error('Cannot restart, no active provider.');
    }

    this.startAttempts++;
    console.log(`[AutoWebhook] Restarting ${provider.name}...`);
    this.config.onRestart?.();
    this.emit('restarting');

    await provider.stop();
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const newUrl = await this.startProvider(provider);
      this.emit('restarted', newUrl);
      return newUrl;
    } catch (error) {
      console.error(`[AutoWebhook] Restart failed for ${provider.name}:`, error);
      console.log('[AutoWebhook] Attempting to switch to next provider.');
      return this.switchToNextProvider();
    }
  }

  async switchToNextProvider(): Promise<string> {
    const currentProvider = this.getActiveProvider();
    if (this.isSwitching || !currentProvider) {
      return this.webhookUrl;
    }
    this.isSwitching = true;
    this.startAttempts = 0;

    console.log(`[AutoWebhook] Stopping ${currentProvider.name}...`);
    await currentProvider.stop();
    this.healthChecker.stop();

    this.activeProviderIndex = (this.activeProviderIndex + 1) % this.providers.length;
    const newProvider = this.getActiveProvider();

    if (!newProvider) {
      this.isSwitching = false;
      throw new Error('Failed to get next provider.');
    }

    console.log(`[AutoWebhook] Switching to ${newProvider.name}...`);
    this.config.onProviderChange?.(newProvider.name);
    this.emit('providerChanged', newProvider.name);

    try {
      const url = await this.startProvider(newProvider);
      this.isSwitching = false;
      return url;
    } catch (error) {
      this.isSwitching = false;
      console.error(`[AutoWebhook] Failed to switch to provider ${newProvider.name}.`, error);
      if (this.providers.length > 1 && newProvider.name !== currentProvider.name) {
        return this.switchToNextProvider();
      }
      throw error;
    }
  }

  async stop(): Promise<void> {
    this.healthChecker.stop();
    const provider = this.getActiveProvider();
    if (provider) {
      await provider.stop();
    }
  }

  get webhookUrl(): string {
    return this.getActiveProvider()?.currentUrl || '';
  }

  getStatus() {
    const provider = this.getActiveProvider();
    return {
      isRunning: provider?.isRunning() || false,
      currentUrl: this.webhookUrl,
      activeProvider: provider?.name,
      isSwitching: this.isSwitching,
      startAttempts: this.startAttempts,
      healthStatus: this.healthChecker.getStatus(),
    };
  }

  private getActiveProvider(): TunnelProvider | undefined {
    return this.providers[this.activeProviderIndex];
  }
}