import { ipcMain } from 'electron';
import { ChildProcessClient } from '@cloud/libs/nest-process-transport';
import { firstValueFrom } from 'rxjs';
import { responseMapper } from '../common/response/response-mapper';

export class HumidHandler {
  constructor(protected readonly client: ChildProcessClient) {
    console.log('[HumidHandler] Initialize Event handler');
    this.registerHandler();
  }

  async pullComicByUrl(
    _,
    data: { comicUrl: string }
    //eslint-disable-next-line
  ): Promise<{ response: any; error: any }> {
    console.log(
      `[ipc/humid/pull-comic]: Start handles data=${JSON.stringify(data)}`
    );
    return responseMapper(
      firstValueFrom(
        this.client.send('crawling-by-url', {
          comicUrl: data.comicUrl,
          time: Date.now(),
        })
      )
    );
  }

  registerHandler() {
    ipcMain.handle('ipc/humid/pull-comic', this.pullComicByUrl.bind(this));
  }
}
