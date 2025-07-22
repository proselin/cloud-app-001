import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { runWithConcurrency } from '../../utils';

export interface QueuedTask<T = unknown> {
  id: string;
  type: 'image' | 'chapter';
  execute: () => Promise<T>;
  priority?: number; // lower number = higher priority
}

@Injectable()
export class CrawlingQueueService {
  private readonly logger = new Logger(CrawlingQueueService.name);

  private imageQueue: QueuedTask[] = [];
  private chapterQueue: QueuedTask[] = [];

  private currentImageTasks: QueuedTask[] = [];
  private currentChapterTasks: QueuedTask[] = [];

  private processingImages = false;
  private processingChapters = false;

  private readonly chapterConcurrency: number;
  private readonly imageConcurrency: number;
  private readonly logLevel: string;

  constructor(private configService: ConfigService) {
    this.chapterConcurrency = this.configService.get<number>('crawl.chapter.concurrency', 1);
    this.imageConcurrency = this.configService.get<number>('crawl.image.concurrency', 1);
    this.logLevel = this.configService.get<string>('crawl.queue.log-level', 'info');

    this.logger.log(`Initializing CrawlingQueueService with chapter concurrency: ${this.chapterConcurrency}, image concurrency: ${this.imageConcurrency}`);
  }  /**
   * Queues an image crawling task
   */
  queueImageTask<T>(task: Omit<QueuedTask<T>, 'type'>): Promise<T> {
    return new Promise((resolve, reject) => {
      const queuedTask: QueuedTask<T> = {
        ...task,
        type: 'image',
        execute: async () => {
          try {
            const result = await task.execute();
            resolve(result);
            return result;
          } catch (error) {
            reject(error);
            throw error;
          }
        }
      };

      if (this.logLevel === 'debug') {
        this.logger.debug(`Queuing image task: ${task.id}`);
      }

      // Add task to queue sorted by priority (lower number = higher priority)
      this.imageQueue.push(queuedTask);
      this.imageQueue.sort((a, b) => (a.priority || 0) - (b.priority || 0));

      // Process queue if not already processing
      if (!this.processingImages) {
        this.processImageQueue();
      }
    });
  }

  /**
   * Queues a chapter crawling task
   */
  queueChapterTask<T>(task: Omit<QueuedTask<T>, 'type'>): Promise<T> {
    return new Promise((resolve, reject) => {
      const queuedTask: QueuedTask<T> = {
        ...task,
        type: 'chapter',
        execute: async () => {
          try {
            const result = await task.execute();
            resolve(result);
            return result;
          } catch (error) {
            reject(error);
            throw error;
          }
        }
      };

      if (this.logLevel === 'debug') {
        this.logger.debug(`Queuing chapter task: ${task.id}`);
      }

      // Add task to queue sorted by priority (lower number = higher priority)
      this.chapterQueue.push(queuedTask);
      this.chapterQueue.sort((a, b) => (a.priority || 0) - (b.priority || 0));

      // Process queue if not already processing
      if (!this.processingChapters) {
        this.processChapterQueue();
      }
    });
  }

  private async processImageQueue(): Promise<void> {
    if (this.processingImages || this.imageQueue.length === 0) {
      return;
    }

    this.processingImages = true;

    try {
      // Get tasks to process (up to concurrency limit)
      const tasksToProcess = this.imageQueue.splice(0, this.imageConcurrency);
      this.currentImageTasks = [...tasksToProcess];

      if (this.logLevel === 'debug') {
        this.logger.debug(`Processing ${tasksToProcess.length} image tasks with concurrency ${this.imageConcurrency}`);
      }

      // Process tasks with concurrency limit using the existing runWithConcurrency utility
      await runWithConcurrency(
        tasksToProcess.map(task =>
          task.execute().then(result => {
            if (this.logLevel === 'debug') {
              this.logger.debug(`Image task ${task.id} completed successfully`);
            }
            // Remove from current tasks
            this.currentImageTasks = this.currentImageTasks.filter(t => t.id !== task.id);
            return result;
          }).catch(error => {
            this.logger.error(`Image task ${task.id} failed:`, error);
            // Remove from current tasks
            this.currentImageTasks = this.currentImageTasks.filter(t => t.id !== task.id);
            // Don't re-throw - the original task promise is already rejected
            return null; // Return null to indicate failure without throwing
          })
        ),
        this.imageConcurrency
      );

    } finally {
      this.processingImages = false;

      // Continue processing if there are more tasks
      if (this.imageQueue.length > 0) {
        this.processImageQueue();
      }
    }
  }

  private async processChapterQueue(): Promise<void> {
    if (this.processingChapters || this.chapterQueue.length === 0) {
      return;
    }

    this.processingChapters = true;

    try {
      // Get tasks to process (up to concurrency limit)
      const tasksToProcess = this.chapterQueue.splice(0, this.chapterConcurrency);
      this.currentChapterTasks = [...tasksToProcess];

      if (this.logLevel === 'debug') {
        this.logger.debug(`Processing ${tasksToProcess.length} chapter tasks with concurrency ${this.chapterConcurrency}`);
      }

      // Process tasks with concurrency limit using the existing runWithConcurrency utility
      await runWithConcurrency(
        tasksToProcess.map(task =>
          task.execute().then(result => {
            if (this.logLevel === 'debug') {
              this.logger.debug(`Chapter task ${task.id} completed successfully`);
            }
            // Remove from current tasks
            this.currentChapterTasks = this.currentChapterTasks.filter(t => t.id !== task.id);
            return result;
          }).catch(error => {
            this.logger.error(`Chapter task ${task.id} failed:`, error);
            // Remove from current tasks
            this.currentChapterTasks = this.currentChapterTasks.filter(t => t.id !== task.id);
            // Don't re-throw - the original task promise is already rejected
            return null; // Return null to indicate failure without throwing
          })
        ),
        this.chapterConcurrency
      );

    } finally {
      this.processingChapters = false;

      // Continue processing if there are more tasks
      if (this.chapterQueue.length > 0) {
        this.processChapterQueue();
      }
    }
  }

  /**
   * Gets the current status of the crawling queues
   */
  getQueueStatus() {
    return {
      imageQueue: {
        pending: this.imageQueue.length,
        processing: this.currentImageTasks.length,
        concurrency: this.imageConcurrency,
        processingTasks: this.currentImageTasks.map(task => ({
          id: task.id,
          type: task.type
        }))
      },
      chapterQueue: {
        pending: this.chapterQueue.length,
        processing: this.currentChapterTasks.length,
        concurrency: this.chapterConcurrency,
        processingTasks: this.currentChapterTasks.map(task => ({
          id: task.id,
          type: task.type
        }))
      },
      configuration: {
        imageConcurrency: this.imageConcurrency,
        chapterConcurrency: this.chapterConcurrency,
        logLevel: this.logLevel
      }
    };
  }

  /**
   * Checks if the image queue is currently processing tasks
   */
  isImageQueueBusy(): boolean {
    return this.processingImages || this.currentImageTasks.length > 0;
  }

  /**
   * Checks if the chapter queue is currently processing tasks
   */
  isChapterQueueBusy(): boolean {
    return this.processingChapters || this.currentChapterTasks.length > 0;
  }
}
