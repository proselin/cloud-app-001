import { ipcMain } from 'electron';
import { ChildProcessClient } from '@cloud/nest-process-transport';
import { firstValueFrom } from 'rxjs';
import { responseMapper } from '../common/response/response-mapper';

export class HumidHandler {
  constructor(protected readonly client: ChildProcessClient) {
    console.log('[HumidHandler] Initialize Event handler');
    this.registerHandler();
  }

  async getComicByUrl(
    _,
    data: { comicUrl: string }
  ): Promise<{ response: any; error: any }> {
    console.log(
      `[ipc/humid/get-comic]: Start handles data=${JSON.stringify(data)}`
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
    ipcMain.handle('ipc/humid/get-comic', this.getComicByUrl.bind(this));
  }
}
