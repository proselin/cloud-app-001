import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';

interface CacheItem<T = unknown> {
  data: T;
  expiry: number;
  hits: number;
  createdAt: number;
}

export interface CacheStats {
  totalItems: number;
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  memoryUsage: number;
}

@Injectable()
export class CacheService {
  private readonly cache = new Map<string, CacheItem>();
  private readonly DEFAULT_TTL = 300000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 1000;
  private readonly logger = new Logger(CacheService.name);
  private cleanupInterval: NodeJS.Timeout;
  private stats = {
    hits: 0,
    misses: 0,
  };

  constructor() {
    // Cleanup expired items every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 300000);
  }

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    // Check cache size limit
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictLeastRecentlyUsed();
    }

    const expiry = Date.now() + ttl;
    this.cache.set(key, {
      data,
      expiry,
      hits: 0,
      createdAt: Date.now()
    });

    this.logger.debug(`Cache SET: ${key} (TTL: ${ttl}ms)`);
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) {
      this.stats.misses++;
      this.logger.debug(`Cache MISS: ${key}`);
      return null;
    }

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      this.stats.misses++;
      this.logger.debug(`Cache EXPIRED: ${key}`);
      return null;
    }

    // Update hit count and stats
    item.hits++;
    this.stats.hits++;
    this.logger.debug(`Cache HIT: ${key} (hits: ${item.hits})`);

    return item.data as T;
  }

  generateKey(prefix: string, params: Record<string, unknown>): string {
    const paramString = JSON.stringify(params, Object.keys(params).sort());
    const hash = createHash('md5').update(paramString).digest('hex');
    return `${prefix}:${hash.substring(0, 16)}`;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.logger.debug(`Cache DELETE: ${key}`);
    }
    return deleted;
  }

  clearPattern(pattern: string): number {
    let cleared = 0;
    const regex = new RegExp(pattern.replace('*', '.*'));

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        cleared++;
      }
    }

    this.logger.debug(`Cache CLEAR PATTERN: ${pattern} (cleared: ${cleared})`);
    return cleared;
  }

  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
    this.logger.debug(`Cache CLEAR ALL (cleared: ${size})`);
  }

  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

    // Calculate approximate memory usage
    let memoryUsage = 0;
    for (const [key, item] of this.cache.entries()) {
      memoryUsage += key.length * 2; // UTF-16 characters
      memoryUsage += JSON.stringify(item.data).length * 2;
      memoryUsage += 32; // metadata overhead
    }

    return {
      totalItems: this.cache.size,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      memoryUsage: Math.round(memoryUsage / 1024), // Convert to KB
    };
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Cache cleanup completed (removed: ${cleaned} expired items)`);
    }
  }

  private evictLeastRecentlyUsed(): void {
    let lruKey = '';
    let oldestTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.createdAt < oldestTime) {
        oldestTime = item.createdAt;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
      this.logger.debug(`Cache LRU eviction: ${lruKey}`);
    }
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}
