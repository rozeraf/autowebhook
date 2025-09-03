import { spawn } from 'child_process';
import axios, { AxiosResponse } from 'axios';
import { TunnelProvider } from './base.js';
import type { NgrokApiResponse, TunnelInfo } from '../types.js';

export class NgrokProvider extends TunnelProvider {
  get name() {
    return 'ngrok' as const;
  }

  async start(): Promise<string> {
    return new Promise((resolve, reject) => {
      const args = this.buildNgrokArgs();

      console.log(`[AutoWebhook] Starting ngrok with args:`, args);

      this.process = spawn('ngrok', args, {
        stdio: ['ignore', 'ignore', 'pipe'],
      });

      const timeout = 30000;

      const poller = setInterval(async () => {
        try {
          const tunnels = await this.checkTunnel();
          const httpsTunnel = tunnels.find(t => t.proto === 'https');
          if (httpsTunnel?.public_url) {
            clearInterval(poller);
            clearTimeout(timeoutId);

            const url = httpsTunnel.public_url;
            this.currentUrl = url;
            console.log(`[AutoWebhook] ngrok tunnel ready: ${url}`);
            resolve(url);
          }
        } catch (e) {
          // ngrok API not ready yet, ignore
        }
      }, 1000);

      const timeoutId = setTimeout(() => {
        clearInterval(poller);
        reject(new Error(`Timeout: ngrok failed to provide URL within ${timeout / 1000} seconds`));
      }, timeout);

      this.process.stderr?.on('data', (data: Buffer) => {
        const error = data.toString();
        console.error(`[AutoWebhook] ngrok stderr: ${error}`);
        if (error.includes('failed to start tunnel')) {
          clearInterval(poller);
          clearTimeout(timeoutId);
          reject(new Error(`Failed to start tunnel: ${error}`));
        }
      });

      this.process.on('exit', (code: number | null) => {
        clearInterval(poller);
        this.emit('exit', code);
      });

      this.process.on('error', (error: Error) => {
        clearInterval(poller);
        clearTimeout(timeoutId);
        reject(error);
      });
    });
  }

  private buildNgrokArgs(): string[] {
    const args: string[] = [];
    const ngrokConfig = this.config.ngrok || {};

    if (ngrokConfig.command) {
      args.push(...ngrokConfig.command.split(' '));
    } else {
      args.push('http', (this.config.port || 3000).toString());
    }

    if (ngrokConfig.region) {
      args.push('--region', ngrokConfig.region);
    }

    if (ngrokConfig.subdomain) {
      args.push('--subdomain', ngrokConfig.subdomain);
    }

    if (ngrokConfig.auth) {
      args.push('--auth', ngrokConfig.auth);
    }

    return args;
  }

  async checkTunnel(): Promise<TunnelInfo[]> {
    try {
      const response: AxiosResponse<NgrokApiResponse> = await axios.get(
        'http://localhost:4040/api/tunnels'
      );
      return response.data.tunnels;
    } catch (error) {
      throw new Error(`Failed to check ngrok API: ${error}`);
    }
  }
}
