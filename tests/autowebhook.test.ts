import { describe, it, expect } from 'bun:test';
import { AutoWebhook } from '../src/autowebhook';

describe('AutoWebhook', () => {
  it('should instantiate without errors', () => {
    expect(() => new AutoWebhook({ tunnels: [] })).not.toThrow();
  });
});
