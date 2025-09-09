import { EventEmitter } from 'events';
import axios from 'axios';
import type { AutoWebhookConfig, HealthStatus } from './types.js';

export class HealthChecker extends EventEmitter {
  private checkInterval: NodeJS.Timeout | undefined;
  private failureCount = 0;
  private readonly config: Required<NonNullable<AutoWebhookConfig['healthCheck']>>;
  private lastSuccessfulCheck = Date.now();
  private readonly expanded: boolean;

  constructor(config?: AutoWebhookConfig['healthCheck'], expanded = false) {
    super();
    this.config = {
      enabled: true,
      interval: 15000,
      timeout: 5000,
      maxFailures: 3,
      ...config,
    };
    this.expanded = expanded;
  }

  start(currentUrl: string): void {
    if (!this.config.enabled) return;

    if (this.expanded) {
      console.log(
        `[AutoWebhook] Health checker started for ${currentUrl} with interval ${this.config.interval}ms.`
      );
    }

    this.stop();
    this.checkInterval = setInterval(async () => {
      await this.performHealthCheck(currentUrl);
    }, this.config.interval);
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
      if (this.expanded) {
        console.log('[AutoWebhook] Health checker stopped.');
      }
    }
  }

  private async performHealthCheck(currentUrl: string): Promise<void> {
    const startTime = Date.now();
    if (this.expanded) {
      console.log(`[AutoWebhook] Performing health check for ${currentUrl}...`);
    }

    try {
      const publicUrlStartTime = Date.now();
      await axios.get(currentUrl, {
        timeout: this.config.timeout,
        validateStatus: status => status >= 200 && status < 500, // Don't fail on 4xx client errors
      });
      const publicUrlPingTime = Date.now() - publicUrlStartTime;

      if (this.expanded) {
        const totalTime = Date.now() - startTime;
        console.log(`[AutoWebhook] Public URL ping successful (${publicUrlPingTime}ms).`);
        console.log(`[AutoWebhook] Health check successful. Total time: ${totalTime}ms`);
      }

      this.onHealthCheckSuccess();
    } catch (error) {
      if (this.expanded) {
        const totalTime = Date.now() - startTime;
        console.error(
          `[AutoWebhook] Health check failed. Total time: ${totalTime}ms. Error: ${
            (error as Error).message
          }`
        );
      }
      this.onHealthCheckFailure(error as Error);
    }
  }

  private onHealthCheckSuccess(): void {
    if (this.expanded && this.failureCount > 0) {
      console.log('[AutoWebhook] Health check recovered.');
    }
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
