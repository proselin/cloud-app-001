import { ipcMain } from "electron";
import { HumitController } from "./connect";
import App from "../app";

ipcMain.handle("ipc/humit/get-comic", async (event, { comicUrl }) => {
  console.log('[ipc/humit/get-comic]: Start handle')

  
  // Simulate fetching comic data
  App.AppHumit.instantProcess.on('message', (raw) => {
    console.log('Received', raw);
  })

  App.AppHumit.instantProcess.send('hello', (error) => {
    if(error) {
      console.error("[ipc/humit/get-comic]: Send error", error)
      return;
    }
    console.log("[ipc/humit/get-comic]: Send Success!!")
  })
  // return comicData;
});


export class HumitEvent {
  static bootstrapHumitEvents(): Electron.IpcMain {
    return ipcMain;
  }
}
