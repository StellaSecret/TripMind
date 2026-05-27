/**
 * cache.ts — LRU cache extracted from app.js (ANALYSIS_CACHE + AC_CACHE)
 * Generic so both autocomplete and analysis caches can be tested from one impl.
 */

export interface CacheEntry<T> {
  data: T;
  ts: number;
}

export class LRUCache<T> {
  private store: Record<string, CacheEntry<T>> = {};
  private keys: string[] = [];
  private readonly max: number;
  private readonly ttlMs: number;

  constructor(max: number, ttlMs: number) {
    this.max = max;
    this.ttlMs = ttlMs;
  }

  get(k: string): T | null {
    const entry = this.store[k];
    if (!entry) return null;
    if (Date.now() - entry.ts > this.ttlMs) {
      delete this.store[k];
      this.keys = this.keys.filter(x => x !== k);
      return null;
    }
    // LRU: move to end on access
    this.keys = this.keys.filter(x => x !== k);
    this.keys.push(k);
    return entry.data;
  }

  set(k: string, data: T): void {
    if (this.store[k]) {
      this.keys = this.keys.filter(x => x !== k);
    } else if (this.keys.length >= this.max) {
      const oldest = this.keys.shift()!;
      delete this.store[oldest];
    }
    this.keys.push(k);
    this.store[k] = { data, ts: Date.now() };
  }

  size(): number { return this.keys.length; }

  has(k: string): boolean { return this.get(k) !== null; }
}

/** Build the analysis cache key (mirrors app.js ANALYSIS_CACHE.key()) */
export function analysisCacheKey(orig: string, dest: string, offset: number, hour: number): string {
  return [orig.toLowerCase().trim(), dest.toLowerCase().trim(), offset, hour].join('|');
}
