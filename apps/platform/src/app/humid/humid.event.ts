import { ipcMain } from 'electron';
import App from '../app';
import { firstValueFrom } from 'rxjs';

ipcMain.handle('ipc/humid/get-comic', async (event, { comicUrl }) => {
  console.log('[ipc/humid/get-comic]: Start handle');
  return firstValueFrom(App.AppHumid.client.send('hello', {}))
});


export class HumidEvent {
  static bootstrapHumitEvents(): Electron.IpcMain {
    return ipcMain;
  }
}
