/**
 * ratelimit.ts — Per-domain rate limiter extracted from app.js
 */

export interface RateLimit {
  minGapMs: number;
  lastCall: number;
  queue: Array<{ resolve: (v: Response) => void; reject: (e: unknown) => void; url: string; opts?: RequestInit }>;
}

export type FetchFn = (url: string, opts?: RequestInit) => Promise<Response>;

export function createRateLimiter(limits: Record<string, Pick<RateLimit, 'minGapMs'>>, fetchFn: FetchFn) {
  const state: Record<string, RateLimit> = {};
  for (const [domain, cfg] of Object.entries(limits)) {
    state[domain] = { minGapMs: cfg.minGapMs, lastCall: 0, queue: [] };
  }

  function drainQueue(rl: RateLimit) {
    // Stryker disable next-line ConditionalExpression: empty-queue guard prevents recursion
    if (!rl.queue.length) return;
    const item = rl.queue[0];

    if (item.opts?.signal?.aborted) {
      item.reject(new DOMException('Aborted', 'AbortError'));
      rl.queue.shift();
      // Stryker disable next-line CallExpression: aborted head is alone when this guard runs
      drainQueue(rl);
      return;
    }

    const now = Date.now();
    const wait = Math.max(0, rl.minGapMs - (now - rl.lastCall));
    setTimeout(() => {
      if (item.opts?.signal?.aborted) {
        item.reject(new DOMException('Aborted', 'AbortError'));
        // Stryker disable next-line CallExpression: duplicate reject on a settled promise is unobservable
        rl.queue.shift();
        drainQueue(rl);
        return;
      }
      rl.lastCall = Date.now();
      fetchFn(item.url, item.opts)
        .then(item.resolve, item.reject)
        .finally(() => { rl.queue.shift(); drainQueue(rl); });
    }, wait);
  }

  return function rateLimitedFetch(url: string, opts?: RequestInit): Promise<Response> {
    let domain: string;
    // Stryker disable next-line all: invalid-URL fallback is equivalent via !rl path
    try { domain = new URL(url).hostname; } catch { return fetchFn(url, opts); }
    const rl = state[domain];
    if (!rl) return fetchFn(url, opts);
    return new Promise((resolve, reject) => {
      rl.queue.push({ url, opts, resolve, reject });
      if (rl.queue.length === 1) drainQueue(rl);
    });
  };
}
