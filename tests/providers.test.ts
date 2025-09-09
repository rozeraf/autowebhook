import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { NgrokProvider } from '../src/providers/ngrok';
import { LocalhostRunProvider } from '../src/providers/localhostrun';

mock.module('child_process', () => ({
  spawn: mock(() => {
    const emitter = new EventEmitter();
    (emitter as any).stdout = new EventEmitter();
    (emitter as any).stderr = new EventEmitter();
    (emitter as any).kill = mock(() => {});
    return emitter;
  }),
}));

describe('Providers', () => {
  beforeEach(() => {
    (spawn as any).mockClear();
  });

  describe('NgrokProvider', () => {
    it('should start and resolve with a URL', async () => {
      const provider = new NgrokProvider({ port: 3000 });
      const urlPromise = provider.start();

      // Mock the ngrok API call
      mock.module('axios', () => ({
        default: {
          get: mock(() =>
            Promise.resolve({
              data: {
                tunnels: [
                  {
                    proto: 'https',
                    public_url: 'https://test.ngrok.io',
                    config: { addr: 'http://localhost:3000' },
                  },
                ],
              },
            })
          ),
        },
      }));

      const url = await urlPromise;
      expect(url).toBe('https://test.ngrok.io');
      provider.stop();
    });
  });

  describe('LocalhostRunProvider', () => {
    it('should start and resolve with a URL', async () => {
      const provider = new LocalhostRunProvider({ port: 3000 });
      const urlPromise = provider.start();

      const process = (spawn as any).mock.results[0].value;
      process.stdout.emit('data', Buffer.from('Connect to https://test.lhr.run'));

      const url = await urlPromise;
      expect(url).toBe('https://test.lhr.run');
      provider.stop();
    });
  });
});
