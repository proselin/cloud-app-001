export function isPromise(value: unknown): value is Promise<unknown> {
  return Boolean(value && typeof value === 'object' && value !== null && 'then' in value && typeof (value as Record<string, unknown>).then === 'function');
}
