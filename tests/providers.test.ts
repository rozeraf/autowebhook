import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { EventEmitter } from 'events';

// Типизированный интерфейс для мок процесса
interface MockProcess extends EventEmitter {
  stdout: EventEmitter;
  stderr: EventEmitter;
  kill: () => void;
}

// Глобальные моки для child_process и axios
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
      // Для localhost.run эмитируем URL в stdout с правильным форматом
      proc.stdout.emit(
        'data',
        Buffer.from('Connect to https://test.lhr.run or https://test.localhost.run\n')
      );
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

// Импорты после мокирования
import { NgrokProvider } from '../src/providers/ngrok';
import { LocalhostRunProvider } from '../src/providers/localhostrun';

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

        const url = await provider.start();

        // Проверяем результат
        expect(url).toBe('https://ngrok.test');
        expect(typeof url).toBe('string');
        expect(url.startsWith('https://')).toBe(true);

        await provider.stop();
      },
      { timeout: 10000 }
    );

    it('should have correct name', () => {
      const provider = new NgrokProvider({ port: 3000 });
      expect(typeof provider.name).toBe('string');
      expect(provider.name).toBe('ngrok');
    });
  });

  describe('LocalhostRunProvider', () => {
    it(
      'should start and resolve with a URL',
      async () => {
        const provider = new LocalhostRunProvider({ port: 3000 });

        const url = await provider.start();

        // Проверяем результат: URL должен начинаться с https:// и содержать .lhr.
        expect(typeof url).toBe('string');
        expect(url.startsWith('https://')).toBe(true);
        expect(url.includes('.lhr.')).toBe(true);

        await provider.stop();
      },
      { timeout: 10000 }
    );

    it('should have correct name', () => {
      const provider = new LocalhostRunProvider({ port: 3000 });
      expect(typeof provider.name).toBe('string');
      expect(provider.name).toBe('localhost.run');
    });
  });
});
