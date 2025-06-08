import { createShake256Hash, runWithConcurrency } from './function';

describe('Utils Functions', () => {
  describe('createShake256Hash', () => {
    it('should create hash from string data', () => {
      const data = 'test string';
      const len = 16;

      const result = createShake256Hash(data, len);

      expect(typeof result).toBe('string');
      expect(result.length).toBe(len * 2); // hex string is 2 chars per byte
      expect(result).toMatch(/^[a-f0-9]+$/); // should be valid hex
    });

    it('should create hash from buffer data', () => {
      const data = Buffer.from('test buffer');
      const len = 32;

      const result = createShake256Hash(data, len);

      expect(typeof result).toBe('string');
      expect(result.length).toBe(len * 2);
      expect(result).toMatch(/^[a-f0-9]+$/);
    });

    it('should create different hashes for different inputs', () => {
      const data1 = 'test1';
      const data2 = 'test2';
      const len = 16;

      const hash1 = createShake256Hash(data1, len);
      const hash2 = createShake256Hash(data2, len);

      expect(hash1).not.toBe(hash2);
    });
    it('should create different length hashes', () => {
      const data = 'test';
      const len1 = 8;
      const len2 = 16;

      const hash1 = createShake256Hash(data, len1);
      const hash2 = createShake256Hash(data, len2);

      expect(hash1.length).toBe(len1 * 2);
      expect(hash2.length).toBe(len2 * 2);
      expect(hash1).not.toBe(hash2);
    });

    it('should handle string data that gets converted', () => {
      const data = 'test string for conversion';
      const len = 16;

      const result = createShake256Hash(data, len);

      expect(typeof result).toBe('string');
      expect(result.length).toBe(len * 2);
      expect(result).toMatch(/^[a-f0-9]+$/);
    });
  });

  describe('runWithConcurrency', () => {
    it('should execute all tasks with concurrency limit', async () => {
      const taskResults = ['result1', 'result2', 'result3', 'result4'];
      const tasks = taskResults.map(
        (result) =>
          new Promise<string>((resolve) =>
            setTimeout(() => resolve(result), 10)
          )
      );
      const limit = 2;

      const results = await runWithConcurrency(tasks, limit);

      expect(results).toHaveLength(taskResults.length);
      expect(results).toEqual(taskResults);
    });
    it('should handle empty task array', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tasks: Promise<any>[] = [];
      const limit = 2;

      const results = await runWithConcurrency(tasks, limit);

      expect(results).toEqual([]);
    });

    it('should handle single task', async () => {
      const expectedResult = 'single result';
      const tasks = [Promise.resolve(expectedResult)];
      const limit = 2;

      const results = await runWithConcurrency(tasks, limit);

      expect(results).toEqual([expectedResult]);
    });

    it('should handle tasks that complete in different orders', async () => {
      const tasks = [
        new Promise<string>((resolve) => setTimeout(() => resolve('slow'), 50)),
        new Promise<string>((resolve) => setTimeout(() => resolve('fast'), 10)),
        new Promise<string>((resolve) =>
          setTimeout(() => resolve('medium'), 30)
        ),
      ];
      const limit = 2;

      const results = await runWithConcurrency(tasks, limit);

      expect(results).toEqual(['slow', 'fast', 'medium']);
    });
    it('should execute tasks with controlled concurrency', async () => {
      const taskResults = ['result1', 'result2', 'result3'];
      const tasks = taskResults.map((result) => Promise.resolve(result));
      const limit = 2;

      const results = await runWithConcurrency(tasks, limit);

      expect(results).toEqual(taskResults);
    });

    it('should handle task rejections', async () => {
      const tasks = [
        Promise.resolve('success'),
        Promise.reject(new Error('failure')),
        Promise.resolve('success2'),
      ];
      const limit = 2;

      // The function should reject when any task rejects
      await expect(runWithConcurrency(tasks, limit)).rejects.toThrow('failure');
    });

    it('should handle limit greater than task count', async () => {
      const taskResults = ['result1', 'result2'];
      const tasks = taskResults.map((result) => Promise.resolve(result));
      const limit = 5; // limit > task count

      const results = await runWithConcurrency(tasks, limit);

      expect(results).toEqual(taskResults);
    });
  });
});
