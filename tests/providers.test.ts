import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import axios from 'axios';
import { NgrokProvider } from '../src/providers/ngrok';
import { LocalhostRunProvider } from '../src/providers/localhostrun';

// Типизированный интерфейс для мок процесса
interface MockProcess extends EventEmitter {
  stdout: EventEmitter;
  stderr: EventEmitter;
  kill: () => void;
}

// Глобальный мок для spawn с правильной эмуляцией процессов
let lastMockProcess: MockProcess | null = null;

mock.module('child_process', () => ({
  spawn: mock((command: string, args: string[]) => {
    const proc = new EventEmitter() as MockProcess;
    proc.stdout = new EventEmitter();
    proc.stderr = new EventEmitter();
    proc.kill = mock(() => {
      proc.emit('exit', 0);
    });

    lastMockProcess = proc;

    // Эмулируем различное поведение для разных команд
    setTimeout(() => {
      if (command === 'ngrok') {
        // Для ngrok не эмитируем данные в stdout/stderr,
        // так как он работает через API
        proc.emit('spawn');
      } else if (command === 'ssh' && args.includes('ssh.localhost.run')) {
        // Для localhost.run эмитируем URL в stdout
        proc.stdout.emit('data', Buffer.from('Connect to https://test.lhr.run'));
      }
    }, 10);

    return proc;
  }),
}));

// Мок для axios с правильным ответом для ngrok API
mock.module('axios', () => ({
  default: {
    get: mock((url: string) => {
      if (url === 'http://localhost:4040/api/tunnels') {
        return Promise.resolve({
          data: {
            tunnels: [
              {
                proto: 'https',
                public_url: 'https://ngrok.test',
                config: { addr: 'http://localhost:3000' },
              },
            ],
          },
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    }),
  },
}));

describe('Providers', () => {
  beforeEach(() => {
    (spawn as any).mockClear();
    (axios.get as any).mockClear();
    lastMockProcess = null;
  });

  describe('NgrokProvider', () => {
    it(
      'should start and resolve with a URL',
      async () => {
        const provider = new NgrokProvider({ port: 3000 });

        // Запускаем провайдер
        const urlPromise = provider.start();

        // Ждём немного, чтобы процесс успел запуститься
        await new Promise(resolve => setTimeout(resolve, 50));

        // Проверяем, что spawn был вызван с правильными аргументами
        expect(spawn).toHaveBeenCalledWith('ngrok', ['http', '3000'], {
          stdio: ['ignore', 'ignore', 'pipe'],
        });

        const url = await urlPromise;
        expect(url).toBe('https://ngrok.test');

        await provider.stop();
      },
      { timeout: 5000 }
    );
  });

  describe('LocalhostRunProvider', () => {
    it(
      'should start and resolve with a URL',
      async () => {
        const provider = new LocalhostRunProvider({ port: 3000 });

        const urlPromise = provider.start();

        // Ждём, чтобы start() успел подписаться на stdout
        await new Promise(resolve => setTimeout(resolve, 50));

        expect(spawn).toHaveBeenCalledWith(
          'ssh',
          ['-R', '80:localhost:3000', 'ssh.localhost.run', '-T', '-n'],
          {
            stdio: ['ignore', 'pipe', 'pipe'],
          }
        );

        const url = await urlPromise;
        expect(url).toBe('https://test.lhr.run');

        await provider.stop();
      },
      { timeout: 5000 }
    );
  });
});
