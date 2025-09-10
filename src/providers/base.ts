import { EventEmitter } from 'events';
import { ChildProcess } from 'child_process';

export abstract class TunnelProvider extends EventEmitter {
  protected process: ChildProcess | undefined;
  public currentUrl = '';
  protected _name: string;

  constructor(protected config: any) {
    super();
    this._name = '';
  }

  abstract start(): Promise<string>;

  get name(): string {
    return this._name;
  }

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
