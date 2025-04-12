export interface Extractor<T> {
  extract(): T | Promise<T>;
}
