import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';
import axios from 'axios';
import { HealthChecker } from '../src/health-checker';

const mockAxiosGet = mock(() => Promise.resolve());

mock.module('axios', () => ({
  default: {
    get: mockAxiosGet,
  },
}));

describe('HealthChecker', () => {
  beforeEach(() => {
    mockAxiosGet.mockClear();
  });

  it('should not start if disabled', () => {
    const checker = new HealthChecker({ enabled: false });
    checker.start('http://test.com');
    expect(axios.get).not.toHaveBeenCalled();
  });

  it('should perform a health check on start', done => {
    const checker = new HealthChecker({ interval: 100 });
    checker.start('http://test.com');

    setTimeout(() => {
      expect(axios.get).toHaveBeenCalledWith('http://test.com', expect.any(Object));
      checker.stop();
      done();
    }, 150);
  });

  it("should emit 'healthy' on success", done => {
    const checker = new HealthChecker({ interval: 10 });
    checker.on('healthy', () => {
      checker.stop();
      done();
    });
    checker.start('http://test.com');
  });

  it("should emit 'unhealthy' on failure", done => {
    (axios.get as any).mockImplementation(() => Promise.reject(new Error('Network Error')));
    const checker = new HealthChecker({ interval: 10 });
    checker.on('unhealthy', (error, count) => {
      expect(error).toBeInstanceOf(Error);
      expect(count).toBe(1);
      checker.stop();
      done();
    });
    checker.start('http://test.com');
  });

  it('should emit critical after max failures', done => {
    (axios.get as any).mockImplementation(() => Promise.reject(new Error('Network Error')));
    const checker = new HealthChecker({ interval: 50, maxFailures: 2 });

    checker.on('critical', error => {
      expect(error).toBeInstanceOf(Error);
      checker.stop();
      done();
    });

    checker.start('http://test.com');
  });
});
