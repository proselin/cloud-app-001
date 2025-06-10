import { ApplyPipe } from './apply.pipe';

describe('ApplyPipe', () => {
  const pipe = new ApplyPipe();

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should call with exact argument', () => {
    const pipe = new ApplyPipe();
    const mockFn = jest.fn().mockImplementation(() => 6);
    const result = pipe.transform(mockFn, 2, 'test');
    expect(mockFn).toHaveBeenCalledWith(2, 'test');
    expect(result).toBe(6);
  });

  it('return the result of the function call with arguments', () => {
    const mockFn = (a: number, b: string) => {
      return `ages ${a} and be ${b}`;
    };
    const result = pipe.transform(mockFn, 42, 'test');
    expect(result).toBe(`ages 42 and be test`);
  });

  it('should return the result of the function call', () => {
    const mockFn = (a: number) => a + 40;
    const result = pipe.transform(mockFn, 2);
    expect(result).toBe(42);
  });

  it('should throw an error if the first argument is not a function', () => {
    expect(() => pipe.transform(null as unknown as () => unknown)).toThrowError(
      'First argument must be a function'
    );
  });
});
