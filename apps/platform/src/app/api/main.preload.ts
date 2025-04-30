import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('cloudIpcCommon', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  platform: process.platform,
});


contextBridge.exposeInMainWorld('cloudIpcHumid', {
  getComicByUrl: (comicUrl: string) => ipcRenderer.invoke('ipc/humid/get-comic', {comicUrl}),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  platform: process.platform,
});

