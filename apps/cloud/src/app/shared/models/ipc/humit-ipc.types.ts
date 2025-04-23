export type HumitIpcFunction = {
  getComicByUrl(commicUrl: string): Promise<void>
  getAppVersion(): Promise<string>
  platform: string
}
