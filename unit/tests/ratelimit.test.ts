import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

  it('forwards opts for passthrough domains', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response('ok'));
    const fetch = createRateLimiter({}, mockFetch);
    const opts = { headers: { 'X-Test': '1' } };
    await fetch('https://api.open-meteo.com/data', opts);
    expect(mockFetch).toHaveBeenCalledWith('https://api.open-meteo.com/data', opts);
  });
});

describe('Rate limiter — queuing', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

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

  it('strictly enforces minGapMs between successive calls', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response('ok'));
    const rl = createRateLimiter({ [NOMINATIM]: { minGapMs: 1000 } }, mockFetch);

    // First call fires immediately (fresh limiter), recording lastCall ≈ t0
    const p1 = rl(`https://${NOMINATIM}/a`);
    await vi.advanceTimersByTimeAsync(0);
    await p1;
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Second call is queued and must not fire until 1000ms have passed
    const p2 = rl(`https://${NOMINATIM}/b`);
    await vi.advanceTimersByTimeAsync(900);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(150); // gap fully elapsed
    await p2;
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('forwards opts for queued limited requests', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response('ok'));
    const rl = createRateLimiter({ [NOMINATIM]: { minGapMs: 100 } }, mockFetch);
    const url = `https://${NOMINATIM}/search?q=Paris`;
    const opts = { headers: { 'X-Test': '1' } };

    const p = rl(url, opts);
    await vi.runAllTimersAsync();
    await p;

    expect(mockFetch).toHaveBeenCalledWith(url, opts);
  });

  it('rejects already-aborted queued requests without fetching', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response('ok'));
    const rl = createRateLimiter({ [NOMINATIM]: { minGapMs: 100 } }, mockFetch);
    const controller = new AbortController();
    controller.abort();
    const result = await rl(`https://${NOMINATIM}/search?q=Paris`, { signal: controller.signal })
      .catch((e) => e);
    const next = rl(`https://${NOMINATIM}/search?q=Lyon`);

    await vi.runAllTimersAsync();
    await next;

    expect(result).toBeInstanceOf(DOMException);
    expect((result as DOMException).name).toBe('AbortError');
    expect((result as DOMException).message).toBe('Aborted');
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(`https://${NOMINATIM}/search?q=Lyon`, undefined);
  });

  it('rejects requests aborted while waiting and drains the next item', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response('ok'));
    const rl = createRateLimiter({ [NOMINATIM]: { minGapMs: 1000 } }, mockFetch);

    const first = rl(`https://${NOMINATIM}/a`);
    await vi.runAllTimersAsync();
    await first;

    const controller = new AbortController();
    const aborted = rl(`https://${NOMINATIM}/b`, { signal: controller.signal }).catch((e) => e);
    const next = rl(`https://${NOMINATIM}/c`);
    controller.abort();

    await vi.runAllTimersAsync();
    const result = await aborted;
    await next;

    expect(result).toBeInstanceOf(DOMException);
    expect((result as DOMException).name).toBe('AbortError');
    expect((result as DOMException).message).toBe('Aborted');
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenLastCalledWith(`https://${NOMINATIM}/c`, undefined);
  });
});

describe('Rate limiter — error handling', () => {
  afterEach(() => vi.useRealTimers());

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
