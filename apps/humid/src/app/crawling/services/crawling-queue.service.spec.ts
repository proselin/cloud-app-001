import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CrawlingQueueService } from './crawling-queue.service';

describe('CrawlingQueueService', () => {
  let service: CrawlingQueueService;

  beforeEach(async () => {
    const mockConfig = {
      get: jest.fn((key: string, defaultValue?: unknown) => {
        const config: Record<string, unknown> = {
          'crawl.image.concurrency': 1,
          'crawl.chapter.concurrency': 1,
          'crawl.queue.log-level': 'info'
        };
        return config[key] ?? defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrawlingQueueService,
        {
          provide: ConfigService,
          useValue: mockConfig,
        },
      ],
    }).compile();

    service = module.get<CrawlingQueueService>(CrawlingQueueService);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    // Wait for all pending tasks to complete or fail
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('queueImageTask', () => {
    it('should queue and process image tasks with concurrency limit of 1', async () => {
      const executionOrder: string[] = [];

      // Create multiple tasks that will track execution order
      const task1 = service.queueImageTask({
        id: 'img-1',
        execute: async () => {
          executionOrder.push('img-1-start');
          await new Promise(resolve => setTimeout(resolve, 100));
          executionOrder.push('img-1-end');
          return 'result1';
        }
      });

      const task2 = service.queueImageTask({
        id: 'img-2',
        execute: async () => {
          executionOrder.push('img-2-start');
          await new Promise(resolve => setTimeout(resolve, 50));
          executionOrder.push('img-2-end');
          return 'result2';
        }
      });

      // Wait for both tasks to complete
      const [result1, result2] = await Promise.all([task1, task2]);

      expect(result1).toBe('result1');
      expect(result2).toBe('result2');

      // Verify tasks executed sequentially (no overlap)
      expect(executionOrder).toEqual([
        'img-1-start',
        'img-1-end',
        'img-2-start',
        'img-2-end'
      ]);
    });

    it('should handle task failures gracefully', async () => {
      const task1 = service.queueImageTask({
        id: 'img-fail',
        execute: async () => {
          throw new Error('Task failed');
        }
      });

      // The task promise should be rejected with the correct error
      await expect(task1).rejects.toThrow('Task failed');

      // Wait for queue processing to complete
      await new Promise(resolve => setTimeout(resolve, 50));
    });
  });

  describe('queueChapterTask', () => {
    it('should queue and process chapter tasks with concurrency limit of 1', async () => {
      const executionOrder: string[] = [];

      const task1 = service.queueChapterTask({
        id: 'chap-1',
        execute: async () => {
          executionOrder.push('chap-1-start');
          await new Promise(resolve => setTimeout(resolve, 100));
          executionOrder.push('chap-1-end');
          return 'chapter1';
        }
      });

      const task2 = service.queueChapterTask({
        id: 'chap-2',
        execute: async () => {
          executionOrder.push('chap-2-start');
          await new Promise(resolve => setTimeout(resolve, 50));
          executionOrder.push('chap-2-end');
          return 'chapter2';
        }
      });

      const [result1, result2] = await Promise.all([task1, task2]);

      expect(result1).toBe('chapter1');
      expect(result2).toBe('chapter2');

      // Verify sequential execution
      expect(executionOrder).toEqual([
        'chap-1-start',
        'chap-1-end',
        'chap-2-start',
        'chap-2-end'
      ]);
    });
  });

  describe('getQueueStatus', () => {
    it('should return correct queue status when no tasks are running', () => {
      const status = service.getQueueStatus();
      expect(status).toEqual({
        imageQueue: {
          pending: 0,
          processing: 0,
          concurrency: 1,
          processingTasks: []
        },
        chapterQueue: {
          pending: 0,
          processing: 0,
          concurrency: 1,
          processingTasks: []
        },
        configuration: {
          imageConcurrency: 1,
          chapterConcurrency: 1,
          logLevel: 'info'
        }
      });
    });

    it('should show current task when image task is running', (done) => {
      // Start a long-running task
      service.queueImageTask({
        id: 'long-img-task',
        execute: async () => {
          await new Promise(resolve => setTimeout(resolve, 200));
          return 'done';
        }
      });

      // Check status immediately
      setTimeout(() => {
        const status = service.getQueueStatus();
        expect(status.imageQueue.processing).toBe(1);
        expect(status.imageQueue.processingTasks).toEqual([{
          id: 'long-img-task',
          type: 'image'
        }]);
        expect(status.chapterQueue.processing).toBe(0);
        expect(status.chapterQueue.processingTasks).toEqual([]);
        done();
      }, 50);
    });
  });

  describe('queue busy status', () => {
    it('should correctly report image queue busy status', (done) => {
      expect(service.isImageQueueBusy()).toBe(false);

      service.queueImageTask({
        id: 'busy-test',
        execute: async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return 'done';
        }
      });

      setTimeout(() => {
        expect(service.isImageQueueBusy()).toBe(true);
        done();
      }, 50);
    });

    it('should correctly report chapter queue busy status', (done) => {
      expect(service.isChapterQueueBusy()).toBe(false);

      service.queueChapterTask({
        id: 'busy-chapter-test',
        execute: async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return 'done';
        }
      });

      setTimeout(() => {
        expect(service.isChapterQueueBusy()).toBe(true);
        done();
      }, 50);
    });
  });

  describe('independent queue processing', () => {
    it('should process image and chapter tasks independently', async () => {
      const executionOrder: string[] = [];

      // Start both image and chapter tasks simultaneously
      const imageTask = service.queueImageTask({
        id: 'img-independent',
        execute: async () => {
          executionOrder.push('img-start');
          await new Promise(resolve => setTimeout(resolve, 100));
          executionOrder.push('img-end');
          return 'img-result';
        }
      });

      const chapterTask = service.queueChapterTask({
        id: 'chap-independent',
        execute: async () => {
          executionOrder.push('chap-start');
          await new Promise(resolve => setTimeout(resolve, 100));
          executionOrder.push('chap-end');
          return 'chap-result';
        }
      });

      await Promise.all([imageTask, chapterTask]);

      // Both should start roughly at the same time (independent processing)
      expect(executionOrder.includes('img-start')).toBe(true);
      expect(executionOrder.includes('chap-start')).toBe(true);
      expect(executionOrder.includes('img-end')).toBe(true);
      expect(executionOrder.includes('chap-end')).toBe(true);
    });
  });
});
