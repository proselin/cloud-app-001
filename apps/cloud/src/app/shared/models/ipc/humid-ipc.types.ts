import { ChannelResponse } from './channel.type';

export type HumidIpcFunction = {
  pullComicByUrl(comicUrl: string): Promise<ChannelResponse>;
};
