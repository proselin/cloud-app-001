import { Module, Global } from '@nestjs/common';
import { CacheService } from './services/cache.service';
import { PerformanceService } from './services/performance.service';

@Global()
@Module({
  providers: [CacheService, PerformanceService],
  exports: [CacheService, PerformanceService],
})
export class CommonModule {}
