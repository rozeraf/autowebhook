import { EventEmitter } from 'events';
import { ChildProcess } from 'child_process';

export abstract class TunnelProvider extends EventEmitter {
  protected process: ChildProcess | undefined;
  public currentUrl = '';

  constructor(protected config: any) {
    super();
  }

  abstract start(): Promise<string>;
  abstract get name(): string;

  public isRunning(): boolean {
    return !!this.process;
  }

  async stop(): Promise<void> {
    if (this.process) {
      return new Promise<void>(resolve => {
        const proc = this.process!;

        proc.on('exit', () => {
          this.process = undefined;
          resolve();
        });

        proc.kill('SIGTERM');

        setTimeout(() => {
          if (this.process) {
            proc.kill('SIGKILL');
          }
        }, 5000);
      });
    }
  }
}
