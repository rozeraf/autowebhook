import { EventEmitter } from 'events';
import axios, { AxiosResponse } from 'axios';
import type { AutoWebhookConfig, NgrokApiResponse, TunnelInfo, HealthStatus } from './types.js';

export class NgrokHealthChecker extends EventEmitter {
  private checkInterval: NodeJS.Timeout | undefined;
  private failureCount = 0;
  private readonly config: Required<NonNullable<AutoWebhookConfig['healthCheck']>>;
  private lastSuccessfulCheck = Date.now();

  constructor(config?: AutoWebhookConfig['healthCheck']) {
    super();
    this.config = {
      enabled: true,
      interval: 15000,
      timeout: 5000,
      maxFailures: 3,
      ...config,
    };
  }

  start(currentUrl: string): void {
    if (!this.config.enabled) return;

    this.stop();
    this.checkInterval = setInterval(async () => {
      await this.performHealthCheck(currentUrl);
    }, this.config.interval);
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }
  }

  private async performHealthCheck(currentUrl: string): Promise<void> {
    try {
      const apiResponse: AxiosResponse<NgrokApiResponse> = await axios.get(
        'http://localhost:4040/api/tunnels',
        {
          timeout: this.config.timeout,
        }
      );

      const tunnels: TunnelInfo[] = apiResponse.data.tunnels;
      const activeTunnel = tunnels.find(t => t.public_url === currentUrl);

      if (!activeTunnel) {
        throw new Error('Active tunnel not found in ngrok API');
      }

      await axios.get(currentUrl, {
        timeout: this.config.timeout,
        validateStatus: () => true,
      });

      this.onHealthCheckSuccess();
    } catch (error) {
      this.onHealthCheckFailure(error as Error);
    }
  }

  private onHealthCheckSuccess(): void {
    this.failureCount = 0;
    this.lastSuccessfulCheck = Date.now();
    this.emit('healthy');
  }

  private onHealthCheckFailure(error: Error): void {
    this.failureCount++;
    this.emit('unhealthy', error, this.failureCount);

    if (this.failureCount >= this.config.maxFailures) {
      this.emit('critical', error);
    }
  }

  getStatus(): HealthStatus {
    return {
      isHealthy: this.failureCount < this.config.maxFailures,
      failureCount: this.failureCount,
      lastSuccessfulCheck: this.lastSuccessfulCheck,
      timeSinceLastSuccess: Date.now() - this.lastSuccessfulCheck,
    };
  }
}
