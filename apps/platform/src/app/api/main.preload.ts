import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('cloudIpcCommon', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  platform: process.platform,
});


contextBridge.exposeInMainWorld('cloudIpcHumit', {
  getComicByUrl: (comicUrl: string) => ipcRenderer.invoke('ipc/humit/get-comic', {comicUrl}),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  platform: process.platform,
});
