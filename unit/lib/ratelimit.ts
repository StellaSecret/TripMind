/**
 * ratelimit.ts — Per-domain rate limiter extracted from app.js
 */

export interface RateLimit {
  minGapMs: number;
  lastCall: number;
  queue: Array<{ resolve: (v: Response) => void; reject: (e: unknown) => void; url: string }>;
}

export type FetchFn = (url: string, opts?: RequestInit) => Promise<Response>;

export function createRateLimiter(limits: Record<string, Pick<RateLimit, 'minGapMs'>>, fetchFn: FetchFn) {
  const state: Record<string, RateLimit> = {};
  for (const [domain, cfg] of Object.entries(limits)) {
    state[domain] = { minGapMs: cfg.minGapMs, lastCall: 0, queue: [] };
  }

  function drainQueue(rl: RateLimit) {
    if (!rl.queue.length) return;
    const item = rl.queue[0];
    const now = Date.now();
    const wait = Math.max(0, rl.minGapMs - (now - rl.lastCall));
    setTimeout(() => {
      rl.lastCall = Date.now();
      fetchFn(item.url)
        .then(item.resolve, item.reject)
        .catch(() => { /* rejection already forwarded to item.reject */ })
        .finally(() => { rl.queue.shift(); drainQueue(rl); });
    }, wait);
  }

  return function rateLimitedFetch(url: string, opts?: RequestInit): Promise<Response> {
    let domain: string;
    try { domain = new URL(url).hostname; } catch { return fetchFn(url, opts); }
    const rl = state[domain];
    if (!rl) return fetchFn(url, opts);
    return new Promise((resolve, reject) => {
      rl.queue.push({ url, opts: opts as RequestInit, resolve, reject } as any);
      if (rl.queue.length === 1) drainQueue(rl);
    });
  };
}
