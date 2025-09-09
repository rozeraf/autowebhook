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

// Глобальные моки с правильной настройкой
const mockSpawn = mock((command: string, args: string[], options: any) => {
  const proc = new EventEmitter() as MockProcess;
  proc.stdout = new EventEmitter();
  proc.stderr = new EventEmitter();
  proc.kill = mock(() => {
    proc.emit('exit', 0);
  });

  // Эмулируем различное поведение для разных команд
  setTimeout(() => {
    if (command === 'ngrok') {
      // Для ngrok эмитируем событие spawn, но данные получаем через API
      proc.emit('spawn');
    } else if (command === 'ssh' && args.includes('ssh.localhost.run')) {
      // Для localhost.run эмитируем URL в stdout
      proc.stdout.emit('data', Buffer.from('Connect to https://test.lhr.run\n'));
    }
  }, 10);

  return proc;
});

const mockAxiosGet = mock((url: string) => {
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
});

// Мокируем модули
mock.module('child_process', () => ({
  spawn: mockSpawn,
}));

mock.module('axios', () => ({
  default: {
    get: mockAxiosGet,
  },
}));

describe('Providers', () => {
  beforeEach(() => {
    mockSpawn.mockClear();
    mockAxiosGet.mockClear();
  });

  describe('NgrokProvider', () => {
    it(
      'should start and resolve with a URL',
      async () => {
        const provider = new NgrokProvider({ port: 3000 });

        const urlPromise = provider.start();

        // Ждём немного, чтобы процесс успел запуститься
        await new Promise(resolve => setTimeout(resolve, 100));

        // Проверяем, что spawn был вызван
        expect(mockSpawn).toHaveBeenCalled();

        // Проверяем аргументы вызова
        const lastCall = mockSpawn.mock.calls[mockSpawn.mock.calls.length - 1];
        expect(lastCall[0]).toBe('ngrok');
        expect(lastCall[1]).toEqual(['http', '3000']);
        expect(lastCall[2]).toEqual({
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
        await new Promise(resolve => setTimeout(resolve, 100));

        // Проверяем, что spawn был вызван
        expect(mockSpawn).toHaveBeenCalled();

        // Проверяем аргументы вызова
        const lastCall = mockSpawn.mock.calls[mockSpawn.mock.calls.length - 1];
        expect(lastCall[0]).toBe('ssh');
        expect(lastCall[1]).toEqual(['-R', '80:localhost:3000', 'ssh.localhost.run', '-T', '-n']);
        expect(lastCall[2]).toEqual({
          stdio: ['ignore', 'pipe', 'pipe'],
        });

        const url = await urlPromise;
        expect(url).toBe('https://test.lhr.run');

        await provider.stop();
      },
      { timeout: 5000 }
    );
  });
});
