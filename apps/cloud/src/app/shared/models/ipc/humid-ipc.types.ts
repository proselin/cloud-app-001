import { ChannelResponse } from './channel.type';

export type HumidIpcFunction = {
  pullComicByUrl(comicUrl: string): Promise<ChannelResponse>;
  searchComic(searchText: string): Promise<ChannelResponse>;
  getImageFile(fileName: string): Promise<ChannelResponse>;
};
