import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CacheService } from '../common/services/cache.service';
import { PerformanceService } from '../common/services/performance.service';

interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
}

interface DetailedHealthResponse extends HealthResponse {
  memory: {
    used: number;
    free: number;
    total: number;
  };
  cache: {
    totalItems: number;
    totalHits: number;
    totalMisses: number;
    hitRate: number;
    memoryUsage: number;
  };
  performance: {
    averageResponseTime: number;
    totalRequests: number;
    errorRate: number;
    slowestEndpoints: Array<{ endpoint: string; avgDuration: number }>;
    requestsPerMinute: number;
    healthScore: number;
  };
}

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private cacheService: CacheService,
    private performanceService: PerformanceService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2025-07-13T10:30:00.000Z',
        uptime: 3600.5
      }
    }
  })
  healthCheck(): HealthResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('detailed')
  @ApiOperation({ summary: 'Detailed health check with metrics' })
  @ApiResponse({
    status: 200,
    description: 'Detailed health information',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2025-07-13T10:30:00.000Z',
        uptime: 3600.5,
        memory: {
          used: 45.6,
          free: 89.4,
          total: 135.0
        },
        cache: {
          totalItems: 150,
          hitRate: 85.5,
          memoryUsage: 2048
        },
        performance: {
          averageResponseTime: 245,
          requestsPerMinute: 12.5,
          errorRate: 1.2,
          healthScore: 95
        }
      }
    }
  })
  detailedHealthCheck(): DetailedHealthResponse {
    const memoryUsage = process.memoryUsage();
    const cacheStats = this.cacheService.getStats();
    const performanceStats = this.performanceService.getStats();
    const healthScore = this.performanceService.getHealthScore();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
        free: Math.round(((memoryUsage.heapTotal - memoryUsage.heapUsed) / 1024 / 1024) * 100) / 100,
        total: Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100,
      },
      cache: cacheStats,
      performance: {
        ...performanceStats,
        healthScore,
      },
    };
  }

  @Get('cache/stats')
  @ApiOperation({ summary: 'Cache statistics' })
  @ApiResponse({
    status: 200,
    description: 'Cache performance statistics'
  })
  getCacheStats() {
    return this.cacheService.getStats();
  }

  @Get('performance/stats')
  @ApiOperation({ summary: 'Performance statistics' })
  @ApiResponse({
    status: 200,
    description: 'API performance statistics'
  })
  getPerformanceStats() {
    return {
      ...this.performanceService.getStats(),
      healthScore: this.performanceService.getHealthScore(),
    };
  }
}
