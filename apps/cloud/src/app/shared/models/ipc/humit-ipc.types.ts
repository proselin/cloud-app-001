export type HumitIpcFunction = {
  getComicByUrl(comicUrl: string): Promise<string>
  getAppVersion(): Promise<string>
  platform: string
}
