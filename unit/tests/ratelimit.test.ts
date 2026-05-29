import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRateLimiter } from '../lib/ratelimit';

const NOMINATIM = 'nominatim.openstreetmap.org';

describe('Rate limiter — basic passthrough', () => {
  it('passes through unlimited domains immediately', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response('ok'));
    const fetch = createRateLimiter({}, mockFetch);
    await fetch('https://api.open-meteo.com/data');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('calls fetch for rate-limited domain', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response('ok'));
    const fetch = createRateLimiter(
      { [NOMINATIM]: { minGapMs: 100 } },
      mockFetch
    );
    await fetch(`https://${NOMINATIM}/search?q=Paris`);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

describe('Rate limiter — queuing', () => {
  beforeEach(() => vi.useFakeTimers());

  it('queues a second request if first just fired', async () => {
    let callCount = 0;
    const mockFetch = vi.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve(new Response('ok'));
    });

    const rl = createRateLimiter({ [NOMINATIM]: { minGapMs: 1100 } }, mockFetch);

    const p1 = rl(`https://${NOMINATIM}/search?q=Paris`);
    const p2 = rl(`https://${NOMINATIM}/search?q=Lyon`);

    // First fires immediately (queue was empty, lastCall=0)
    await vi.runAllTimersAsync();
    await p1;
    expect(callCount).toBeGreaterThanOrEqual(1);

    // Second fires after minGapMs
    await vi.advanceTimersByTimeAsync(1200);
    await p2;
    expect(callCount).toBe(2);
  });

  it('fires immediately when enough time has passed', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response('ok'));
    const rl = createRateLimiter({ [NOMINATIM]: { minGapMs: 1100 } }, mockFetch);

    // First call
    const p1 = rl(`https://${NOMINATIM}/search?q=Paris`);
    await vi.runAllTimersAsync();
    await p1;

    // Wait > minGapMs
    await vi.advanceTimersByTimeAsync(1200);

    const t = Date.now();
    const p2 = rl(`https://${NOMINATIM}/search?q=Lyon`);
    await vi.runAllTimersAsync();
    await p2;

    // Should have fired almost immediately (< 50ms wait)
    expect(Date.now() - t).toBeLessThan(50);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('does not apply rate limit to non-listed domains', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response('ok'));
    const rl = createRateLimiter({ [NOMINATIM]: { minGapMs: 1100 } }, mockFetch);

    // Two rapid calls to a non-limited domain
    const p1 = rl('https://api.open-meteo.com/v1/forecast');
    const p2 = rl('https://api.open-meteo.com/v1/air-quality');
    await vi.runAllTimersAsync();
    await Promise.all([p1, p2]);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

describe('Rate limiter — error handling', () => {
  it('propagates fetch errors to caller', async () => {
    vi.useFakeTimers();
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
    const rl = createRateLimiter({ [NOMINATIM]: { minGapMs: 100 } }, mockFetch);
    const p = rl(`https://${NOMINATIM}/search?q=Paris`).catch(e => e);
    await vi.runAllTimersAsync();
    const result = await p;
    expect(result).toBeInstanceOf(Error);
    expect((result as Error).message).toBe('Network error');
  });

  it('processes next queue item after error', async () => {
    vi.useFakeTimers();
    let calls = 0;
    const mockFetch = vi.fn().mockImplementation(() => {
      calls++;
      if (calls === 1) return Promise.reject(new Error('fail'));
      return Promise.resolve(new Response('ok'));
    });
    const rl = createRateLimiter({ [NOMINATIM]: { minGapMs: 100 } }, mockFetch);
    const p1 = rl(`https://${NOMINATIM}/search?q=Paris`).catch(() => 'error');
    const p2 = rl(`https://${NOMINATIM}/search?q=Lyon`);
    await vi.runAllTimersAsync();
    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1).toBe('error');
    expect(r2).toBeInstanceOf(Response);
  });
});
