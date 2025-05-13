import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('cloudIpcCommon', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  platform: process.platform,
});


contextBridge.exposeInMainWorld('cloudIpcHumid', {
  pullComicByUrl(comicUrl: string){
    return ipcRenderer.invoke('ipc/humid/pull-comic', {comicUrl});
  },
  searchComic(searchText?: string) {
    return ipcRenderer.invoke('ipc/humid/comic-search', {searchText});
  },
  getImageFile(fileName: string) {
    return ipcRenderer.invoke('ipc/humid/get-image', {fileName})
  }
});


