import { spawn } from 'child_process';
import { TunnelProvider } from './base.js';

export class LocalhostRunProvider extends TunnelProvider {
  get name() {
    return 'localhost.run' as const;
  }

  async start(): Promise<string> {
    return new Promise((resolve, reject) => {
      const port = this.config.port || 3000;
      const args = ['-R', `80:localhost:${port}`, 'ssh.localhost.run', '-T', '-n'];

      console.log(`[AutoWebhook] Starting localhost.run with args: ssh ${args.join(' ')}`);

      this.process = spawn('ssh', args, {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let urlFound = false;

      const onData = (data: Buffer) => {
        const output = data.toString();
        const match = output.match(/(https?:\/\/[a-zA-Z0-9-]+\.lhr\.(life|run))/);

        if (match && match[1]) {
          if (!urlFound) {
            urlFound = true;
            this.currentUrl = match[1];
            console.log(`[AutoWebhook] localhost.run tunnel ready: ${this.currentUrl}`);
            resolve(this.currentUrl);
          }
        }
      };

      this.process.stdout?.on('data', onData);
      this.process.stderr?.on('data', onData); // URL can be in stderr

      const timeout = 30000;
      const timeoutId = setTimeout(() => {
        if (!urlFound) {
          reject(new Error(`Timeout: localhost.run failed to provide URL within ${timeout / 1000} seconds`));
        }
      }, timeout);

      this.process.on('exit', code => {
        clearTimeout(timeoutId);
        this.emit('exit', code);
        if (!urlFound) {
          reject(new Error(`localhost.run process exited with code ${code} before providing a URL.`));
        }
      });

      this.process.on('error', err => {
        clearTimeout(timeoutId);
        reject(err);
      });
    });
  }
}
