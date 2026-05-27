import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LRUCache, analysisCacheKey } from '../lib/cache';

describe('LRUCache — basic operations', () => {
  it('returns null for missing key', () => {
    const c = new LRUCache<string>(10, 60_000);
    expect(c.get('x')).toBeNull();
  });

  it('stores and retrieves a value', () => {
    const c = new LRUCache<number>(10, 60_000);
    c.set('a', 42);
    expect(c.get('a')).toBe(42);
  });

  it('size() reflects entries', () => {
    const c = new LRUCache<number>(10, 60_000);
    expect(c.size()).toBe(0);
    c.set('a', 1);
    expect(c.size()).toBe(1);
    c.set('b', 2);
    expect(c.size()).toBe(2);
  });

  it('updating an existing key does not increase size', () => {
    const c = new LRUCache<number>(10, 60_000);
    c.set('a', 1);
    c.set('a', 2);
    expect(c.size()).toBe(1);
    expect(c.get('a')).toBe(2);
  });
});

describe('LRUCache — TTL eviction', () => {
  beforeEach(() => { vi.useFakeTimers(); });

  it('returns value before TTL expires', () => {
    const c = new LRUCache<string>(10, 5_000);
    c.set('k', 'v');
    vi.advanceTimersByTime(4_999);
    expect(c.get('k')).toBe('v');
  });

  it('returns null after TTL expires', () => {
    const c = new LRUCache<string>(10, 5_000);
    c.set('k', 'v');
    vi.advanceTimersByTime(5_001);
    expect(c.get('k')).toBeNull();
  });

  it('evicted entry decreases size', () => {
    const c = new LRUCache<string>(10, 5_000);
    c.set('k', 'v');
    vi.advanceTimersByTime(5_001);
    c.get('k'); // triggers eviction
    expect(c.size()).toBe(0);
  });

  it('10-minute TTL matches analysis cache', () => {
    const c = new LRUCache<string>(20, 10 * 60_000);
    c.set('route', 'data');
    vi.advanceTimersByTime(9 * 60_000 + 59_999);
    expect(c.get('route')).toBe('data');
    vi.advanceTimersByTime(2);
    expect(c.get('route')).toBeNull();
  });
});

describe('LRUCache — max capacity eviction', () => {
  it('evicts oldest entry when max is reached', () => {
    const c = new LRUCache<number>(3, 60_000);
    c.set('a', 1);
    c.set('b', 2);
    c.set('c', 3);
    c.set('d', 4); // 'a' should be evicted
    expect(c.get('a')).toBeNull();
    expect(c.get('b')).toBe(2);
    expect(c.get('c')).toBe(3);
    expect(c.get('d')).toBe(4);
    expect(c.size()).toBe(3);
  });

  it('accessing a key promotes it to MRU position', () => {
    const c = new LRUCache<number>(3, 60_000);
    c.set('a', 1);
    c.set('b', 2);
    c.set('c', 3);
    c.get('a'); // promote 'a' — now 'b' is oldest
    c.set('d', 4); // 'b' should be evicted
    expect(c.get('a')).toBe(1);
    expect(c.get('b')).toBeNull();
    expect(c.get('c')).toBe(3);
    expect(c.get('d')).toBe(4);
  });

  it('max 20 entries matches analysis cache', () => {
    const c = new LRUCache<string>(20, 10 * 60_000);
    for (let i = 0; i < 25; i++) c.set(`k${i}`, `v${i}`);
    expect(c.size()).toBe(20);
    // First 5 entries should be evicted
    for (let i = 0; i < 5; i++) expect(c.get(`k${i}`)).toBeNull();
    for (let i = 5; i < 25; i++) expect(c.get(`k${i}`)).toBe(`v${i}`);
  });

  it('max 100 entries matches autocomplete cache', () => {
    const c = new LRUCache<string[]>(100, 60_000);
    for (let i = 0; i < 105; i++) c.set(`q${i}`, []);
    expect(c.size()).toBe(100);
    for (let i = 0; i < 5; i++) expect(c.get(`q${i}`)).toBeNull();
  });
});

describe('analysisCacheKey', () => {
  it('generates consistent key', () => {
    expect(analysisCacheKey('Paris', 'Lyon', 0, 8))
      .toBe('paris|lyon|0|8');
  });

  it('is case-insensitive', () => {
    expect(analysisCacheKey('PARIS', 'LYON', 0, 8))
      .toBe(analysisCacheKey('paris', 'lyon', 0, 8));
  });

  it('different times produce different keys', () => {
    expect(analysisCacheKey('Paris', 'Lyon', 0, 8))
      .not.toBe(analysisCacheKey('Paris', 'Lyon', 0, 14));
  });

  it('different dates produce different keys', () => {
    expect(analysisCacheKey('Paris', 'Lyon', 0, 8))
      .not.toBe(analysisCacheKey('Paris', 'Lyon', 1, 8));
  });

  it('reverse route produces different key', () => {
    expect(analysisCacheKey('Paris', 'Lyon', 0, 8))
      .not.toBe(analysisCacheKey('Lyon', 'Paris', 0, 8));
  });

  it('trims whitespace', () => {
    expect(analysisCacheKey('  Paris  ', '  Lyon  ', 0, 8))
      .toBe('paris|lyon|0|8');
  });
});
