import { ipcMain } from 'electron';
import { ChildProcessClient } from '@cloud/libs/nest-process-transport';
import { firstValueFrom } from 'rxjs';
import { responseMapper } from '../common/response/response-mapper';
import { PlatformLogger } from '../common/logger';

export class HumidHandler {
  private logger = new PlatformLogger();

  constructor(protected readonly client: ChildProcessClient) {
    this.logger.log('[HumidHandler] Initialize Event handler');
    this.registerHandler();
  }

  async pullComicByUrl(
    _,
    data: { comicUrl: string }
    //eslint-disable-next-line
  ): Promise<{ response: any; error: any }> {
    this.logger.log(
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

  searchComic(_, {searchText}: {searchText: string}):Promise<{ response: any; error: any }>  {
    this.logger.log(
      `[ipc/humid/pull-comic]: Start handles data=${JSON.stringify(searchText)}`
    );
    return responseMapper(
      firstValueFrom(
        this.client.send('comic:search', {
          searchText,
          time: Date.now(),
        })
      )
    );
  }

  getImageFile(_, {fileName}: {fileName: string}) {
    this.logger.log(
      `[ipc/humid/pull-comic]: Start handles data=${JSON.stringify(fileName)}`
    );
    return responseMapper(
      firstValueFrom(
        this.client.send('file:get-image', {
          fileName: fileName,
          time: Date.now(),
        })
      )
    );
  }

  registerHandler() {
    ipcMain.handle('ipc/humid/pull-comic', this.pullComicByUrl.bind(this));
    ipcMain.handle('ipc/humid/comic-search', this.searchComic.bind(this));
    ipcMain.handle('ipc/humid/get-image', this.getImageFile.bind(this))
  }
}
