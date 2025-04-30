export type HumidIpcFunction = {
  getComicByUrl(comicUrl: string): Promise<string>
  getAppVersion(): Promise<string>
  platform: string
}
