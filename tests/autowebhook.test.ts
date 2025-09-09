import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { AutoWebhook } from '../src/autowebhook';
import { HealthChecker } from '../src/health-checker';

const mockHealthChecker = {
  start: mock(() => {}),
  stop: mock(() => {}),
  on: mock(() => {}),
};

mock.module('../src/health-checker', () => ({
  HealthChecker: mock(() => mockHealthChecker),
}));

const mockNgrokProvider = {
  start: mock(() => Promise.resolve('https://ngrok.test')),
  stop: mock(() => Promise.resolve()),
};

mock.module('../src/providers/ngrok', () => ({
  NgrokProvider: mock(() => mockNgrokProvider),
}));

const mockLhrProvider = {
  start: mock(() => Promise.resolve('https://lhr.test')),
  stop: mock(() => Promise.resolve()),
};

mock.module('../src/providers/localhostrun', () => ({
  LocalhostRunProvider: mock(() => mockLhrProvider),
}));

describe('AutoWebhook', () => {
  beforeEach(() => {
    mockHealthChecker.start.mockClear();
    mockHealthChecker.stop.mockClear();
    mockHealthChecker.on.mockClear();
    mockNgrokProvider.start.mockClear();
    mockNgrokProvider.stop.mockClear();
    mockLhrProvider.start.mockClear();
    mockLhrProvider.stop.mockClear();
  });

  it('should instantiate without errors', () => {
    expect(() => new AutoWebhook({ tunnels: [] })).not.toThrow();
  });

  it('should start all tunnels and return URLs', async () => {
    const webhook = new AutoWebhook({
      tunnels: [
        { name: 'ngrok', provider: 'ngrok', port: 3000 },
        { name: 'lhr', provider: 'localhost.run', port: 3001 },
      ],
    });

    const urls = await webhook.start();

    expect(urls).toEqual(['https://ngrok.test', 'https://lhr.test']);
    expect(mockNgrokProvider.start).toHaveBeenCalledTimes(1);
    expect(mockLhrProvider.start).toHaveBeenCalledTimes(1);
    expect(mockHealthChecker.start).toHaveBeenCalledTimes(2);
  });

  it('should stop all tunnels', async () => {
    const webhook = new AutoWebhook({
      tunnels: [{ name: 'ngrok', provider: 'ngrok', port: 3000 }],
    });

    await webhook.start();
    await webhook.stop();

    expect(mockNgrokProvider.stop).toHaveBeenCalledTimes(1);
    expect(mockHealthChecker.stop).toHaveBeenCalledTimes(1);
  });

  it('should restart a tunnel when it goes down', async () => {
    const webhook = new AutoWebhook({
      tunnels: [{ name: 'ngrok', provider: 'ngrok', port: 3000 }],
    });

    await webhook.start();

    const criticalCallback = (mockHealthChecker.on as any).mock.calls.find(
      (call: any) => call[0] === 'critical'
    )[1];

    await criticalCallback(new Error('Tunnel down'));

    expect(mockNgrokProvider.start).toHaveBeenCalledTimes(2);
  });
});
