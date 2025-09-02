import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import axios, { AxiosResponse } from 'axios';
import { NgrokHealthChecker } from './health-checker.js';
import type { AutoWebhookConfig, TunnelInfo, NgrokApiResponse } from './types.js';

export class AutoWebhook extends EventEmitter {
  private ngrokProcess: ChildProcess | undefined;
  private currentUrl: string = '';
  private healthChecker: NgrokHealthChecker;
  private isRestarting = false;
  private startAttempts = 0;
  private readonly maxStartAttempts = 5;
  
  private readonly config: Required<Omit<AutoWebhookConfig, 'healthCheck'>> & {
    healthCheck: AutoWebhookConfig['healthCheck'];
  };

  constructor(config: AutoWebhookConfig = {}) {
    super();
    
    this.config = {
      port: 3000,
      command: '',
      region: 'eu',
      subdomain: '',
      auth: '',
      onUrlChange: () => {},
      onError: () => {},
      onRestart: () => {},
      healthCheck: config.healthCheck,
      ...config
    };

    this.healthChecker = new NgrokHealthChecker(this.config.healthCheck);
    this.setupHealthChecker();
  }

  private setupHealthChecker(): void {
    this.healthChecker.on('critical', async (error: Error) => {
      if (!this.isRestarting) {
        console.warn(`[AutoWebhook] Health check critical failure: ${error.message}`);
        await this.restart();
      }
    });

    this.healthChecker.on('unhealthy', (error: Error, failureCount: number) => {
      console.warn(`[AutoWebhook] Health check failed (${failureCount}): ${error.message}`);
    });
  }

  async start(): Promise<string> {
    if (this.ngrokProcess) {
      console.warn('[AutoWebhook] Already running');
      return this.currentUrl;
    }

    try {
      const url = await this.startNgrokProcess();
      this.startAttempts = 0;
      return url;
    } catch (error) {
      throw error;
    }
  }

  private async startNgrokProcess(): Promise<string> {
    return new Promise((resolve, reject) => {
      const args = this.buildNgrokArgs();
      
      console.log(`[AutoWebhook] Starting ngrok with args:`, args);
      
      this.ngrokProcess = spawn('ngrok', args, {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let urlFound = false;

      this.ngrokProcess.stdout?.on('data', (data: Buffer) => {
        const output = data.toString();
        
        if (!urlFound) {
          const url = this.extractUrlFromOutput(output);
          if (url) {
            urlFound = true;
            this.currentUrl = url;
            this.config.onUrlChange(url);
            this.healthChecker.start(url);
            this.emit('ready', url);
            console.log(`[AutoWebhook] Tunnel ready: ${url}`);
            resolve(url);
          }
        }
      });

      this.ngrokProcess.stderr?.on('data', (data: Buffer) => {
        const error = data.toString();
        console.error(`[AutoWebhook] ngrok stderr: ${error}`);
        
        if (error.includes('failed to start tunnel')) {
          reject(new Error(`Failed to start tunnel: ${error}`));
        }
      });

      this.ngrokProcess.on('exit', (code: number | null) => {
        console.log(`[AutoWebhook] ngrok process exited with code ${code}`);
        this.ngrokProcess = undefined;
        this.healthChecker.stop();
        
        if (!this.isRestarting && code !== 0) {
          this.emit('error', new Error(`ngrok exited with code ${code}`));
          this.handleUnexpectedExit().catch(console.error);
        }
      });

      this.ngrokProcess.on('error', (error: Error) => {
        console.error(`[AutoWebhook] ngrok process error:`, error);
        this.config.onError(error);
        this.emit('error', error);
        reject(error);
      });

      setTimeout(() => {
        if (!urlFound) {
          reject(new Error('Timeout: ngrok failed to provide URL within 30 seconds'));
        }
      }, 30000);
    });
  }

  private buildNgrokArgs(): string[] {
    const args: string[] = [];
    
    if (this.config.command) {
      args.push(...this.config.command.split(' '));
    } else {
      args.push('http', this.config.port.toString());
    }

    if (this.config.region) {
      args.push('--region', this.config.region);
    }

    if (this.config.subdomain) {
      args.push('--subdomain', this.config.subdomain);
    }

    if (this.config.auth) {
      args.push('--auth', this.config.auth);
    }

    return args;
  }

  private extractUrlFromOutput(output: string): string | null {
    const urlMatch = output.match(/https:\/\/[a-f0-9]+\.ngrok(?:-free)?\.(?:app|io)/);
    return urlMatch ? urlMatch[0] : null;
  }

  private async handleUnexpectedExit(): Promise<void> {
    if (this.startAttempts < this.maxStartAttempts) {
      console.log(`[AutoWebhook] Attempting to restart (attempt ${this.startAttempts + 1}/${this.maxStartAttempts})`);
      await this.restart();
    } else {
      console.error(`[AutoWebhook] Max restart attempts reached (${this.maxStartAttempts})`);
      this.emit('maxRestartsReached');
    }
  }

  async restart(): Promise<string> {
    if (this.isRestarting) {
      console.log('[AutoWebhook] Restart already in progress');
      return this.currentUrl;
    }

    this.isRestarting = true;
    this.startAttempts++;
    
    console.log('[AutoWebhook] Restarting ngrok tunnel...');
    this.config.onRestart();
    this.emit('restarting');

    try {
      await this.stop();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newUrl = await this.startNgrokProcess();
      this.emit('restarted', newUrl);
      
      return newUrl;
    } catch (error) {
      console.error('[AutoWebhook] Restart failed:', error);
      throw error;
    } finally {
      this.isRestarting = false;
    }
  }

  async stop(): Promise<void> {
    this.healthChecker.stop();
    
    if (this.ngrokProcess) {
      return new Promise<void>((resolve) => {
        const process = this.ngrokProcess!;
        
        process.on('exit', () => {
          this.ngrokProcess = undefined;
          resolve();
        });

        process.kill('SIGTERM');
        
        setTimeout(() => {
          if (this.ngrokProcess) {
            process.kill('SIGKILL');
          }
        }, 5000);
      });
    }
  }

  get webhookUrl(): string {
    return this.currentUrl;
  }

  getStatus() {
    return {
      isRunning: !!this.ngrokProcess,
      currentUrl: this.currentUrl,
      isRestarting: this.isRestarting,
      startAttempts: this.startAttempts,
      healthStatus: this.healthChecker.getStatus()
    };
  }

  async checkTunnel(): Promise<TunnelInfo[]> {
    try {
      const response: AxiosResponse<NgrokApiResponse> = await axios.get('http://localhost:4040/api/tunnels');
      return response.data.tunnels;
    } catch (error) {
      throw new Error(`Failed to check ngrok API: ${error}`);
    }
  }
}