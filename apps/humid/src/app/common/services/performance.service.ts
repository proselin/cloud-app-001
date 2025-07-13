import { Injectable, Logger } from '@nestjs/common';

export interface PerformanceMetric {
  method: string;
  endpoint: string;
  duration: number;
  timestamp: number;
  statusCode?: number;
  error?: string;
}

export interface PerformanceStats {
  averageResponseTime: number;
  totalRequests: number;
  errorRate: number;
  slowestEndpoints: Array<{ endpoint: string; avgDuration: number }>;
  requestsPerMinute: number;
}

@Injectable()
export class PerformanceService {
  private readonly logger = new Logger(PerformanceService.name);
  private readonly metrics: PerformanceMetric[] = [];
  private readonly MAX_METRICS = 10000; // Keep last 10k metrics

  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.splice(0, this.metrics.length - this.MAX_METRICS);
    }

    // Log slow requests
    if (metric.duration > 5000) { // 5 seconds
      this.logger.warn(
        `Slow request detected: ${metric.method} ${metric.endpoint} took ${metric.duration}ms`
      );
    }
  }

  getStats(timeWindowMinutes = 30): PerformanceStats {
    const cutoffTime = Date.now() - (timeWindowMinutes * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoffTime);

    if (recentMetrics.length === 0) {
      return {
        averageResponseTime: 0,
        totalRequests: 0,
        errorRate: 0,
        slowestEndpoints: [],
        requestsPerMinute: 0,
      };
    }

    const totalDuration = recentMetrics.reduce((sum, m) => sum + m.duration, 0);
    const errorCount = recentMetrics.filter(m => m.error || (m.statusCode && m.statusCode >= 400)).length;

    // Group by endpoint for slowest endpoints analysis
    const endpointGroups = new Map<string, number[]>();
    recentMetrics.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`;
      if (!endpointGroups.has(key)) {
        endpointGroups.set(key, []);
      }
      const durations = endpointGroups.get(key);
      if (durations) {
        durations.push(metric.duration);
      }
    });

    const slowestEndpoints = Array.from(endpointGroups.entries())
      .map(([endpoint, durations]) => ({
        endpoint,
        avgDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 5); // Top 5 slowest

    return {
      averageResponseTime: Math.round(totalDuration / recentMetrics.length),
      totalRequests: recentMetrics.length,
      errorRate: Math.round((errorCount / recentMetrics.length) * 100 * 100) / 100,
      slowestEndpoints,
      requestsPerMinute: Math.round((recentMetrics.length / timeWindowMinutes) * 100) / 100,
    };
  }

  getHealthScore(): number {
    const stats = this.getStats(10); // Last 10 minutes

    if (stats.totalRequests === 0) return 100;

    let score = 100;

    // Penalize high error rates
    score -= stats.errorRate * 2;

    // Penalize slow response times
    if (stats.averageResponseTime > 1000) {
      score -= Math.min(50, (stats.averageResponseTime - 1000) / 100);
    }

    return Math.max(0, Math.round(score));
  }

  clearMetrics(): void {
    this.metrics.length = 0;
    this.logger.debug('Performance metrics cleared');
  }
}
