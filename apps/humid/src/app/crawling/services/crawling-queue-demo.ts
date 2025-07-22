/**
 * Demo script to showcase configurable concurrency in CrawlingQueueService
 *
 * This demonstrates how the crawling queue can be configured via environment variables:
 * - crawling.image.concurrency: Controls max concurrent image crawling tasks (default: 1)
 * - crawling.chapter.concurrency: Controls max concurrent chapter crawling tasks (default: 1)
 * - crawling.queue.logLevel: Controls logging verbosity (default: 'info')
 *
 * Example usage:
 * Set environment variables in .env:
 * CRAWLING_IMAGE_CONCURRENCY=3
 * CRAWLING_CHAPTER_CONCURRENCY=5
 * CRAWLING_QUEUE_LOG_LEVEL=debug
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CrawlingQueueService } from './crawling-queue.service';

@Injectable()
export class CrawlingQueueDemo {
  private readonly logger = new Logger(CrawlingQueueDemo.name);

  constructor(
    private configService: ConfigService,
    private crawlingQueue: CrawlingQueueService
  ) {}

  async demonstrateConcurrency() {
    this.logger.log('=== CrawlingQueueService Concurrency Demo ===');

    // Show current configuration
    const config = {
      imageConcurrency: this.configService.get<number>('crawl.image.concurrency', 1),
      chapterConcurrency: this.configService.get<number>('crawl.chapter.concurrency', 1),
      logLevel: this.configService.get<string>('crawl.queue.log-level', 'info')
    };

    this.logger.log('Current Configuration:', config);

    // Show queue status
    const initialStatus = this.crawlingQueue.getQueueStatus();
    this.logger.log('Initial Queue Status:', JSON.stringify(initialStatus, null, 2));

    // Queue multiple image tasks to demonstrate concurrency
    this.logger.log(`\n=== Queuing ${config.imageConcurrency * 2} Image Tasks ===`);
    const imageTasks = [];
    for (let i = 0; i < config.imageConcurrency * 2; i++) {
      imageTasks.push(
        this.crawlingQueue.queueImageTask({
          id: `demo-image-${i}`,
          execute: async () => {
            this.logger.log(`Processing image task ${i}`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate work
            this.logger.log(`Completed image task ${i}`);
            return `image-result-${i}`;
          }
        })
      );
    }

    // Queue multiple chapter tasks to demonstrate independent processing
    this.logger.log(`\n=== Queuing ${config.chapterConcurrency * 2} Chapter Tasks ===`);
    const chapterTasks = [];
    for (let i = 0; i < config.chapterConcurrency * 2; i++) {
      chapterTasks.push(
        this.crawlingQueue.queueChapterTask({
          id: `demo-chapter-${i}`,
          execute: async () => {
            this.logger.log(`Processing chapter task ${i}`);
            await new Promise(resolve => setTimeout(resolve, 800)); // Simulate work
            this.logger.log(`Completed chapter task ${i}`);
            return `chapter-result-${i}`;
          }
        })
      );
    }

    // Show queue status with tasks queued
    const queuedStatus = this.crawlingQueue.getQueueStatus();
    this.logger.log('\nQueue Status with Tasks Queued:', JSON.stringify(queuedStatus, null, 2));

    // Wait for all tasks to complete
    this.logger.log('\n=== Waiting for tasks to complete ===');
    const [imageResults, chapterResults] = await Promise.all([
      Promise.all(imageTasks),
      Promise.all(chapterTasks)
    ]);

    this.logger.log('\n=== Results ===');
    this.logger.log('Image Results:', imageResults);
    this.logger.log('Chapter Results:', chapterResults);

    // Show final queue status
    const finalStatus = this.crawlingQueue.getQueueStatus();
    this.logger.log('\nFinal Queue Status:', JSON.stringify(finalStatus, null, 2));

    this.logger.log('\n=== Demo Complete ===');
    this.logger.log(`Successfully processed ${imageResults.length} image tasks and ${chapterResults.length} chapter tasks`);
    this.logger.log(`Image concurrency limit: ${config.imageConcurrency}`);
    this.logger.log(`Chapter concurrency limit: ${config.chapterConcurrency}`);
  }
}
