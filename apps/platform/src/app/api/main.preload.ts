import { contextBridge, ipcRenderer } from 'electron';
contextBridge.exposeInMainWorld('cloudIpcCommon', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  platform: process.platform,
});


contextBridge.exposeInMainWorld('cloudIpcHumid', {
  pullComicByUrl(comicUrl: string){
    return ipcRenderer.invoke('ipc/humid/pull-comic', {comicUrl});
  },
});

