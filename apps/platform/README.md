# 🖥️ Platform - Electron Desktop Application

[![Electron](https://img.shields.io/badge/Electron-191970?style=for-the-badge&logo=Electron&logoColor=white)](https://www.electronjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)

**Cross-platform desktop application for comic management**

## 📝 Overview

Platform is a cross-platform Electron desktop application that provides a native desktop experience for the Comic Crawling & Management System. It combines the Cloud (Angular) frontend with the Humid (NestJS) backend in a unified desktop environment, featuring IPC communication, background services, and native OS integration.

## 🚀 Features

### Core Functionality

- **Native Desktop Experience**: Full-featured desktop application
- **Background Services**: Integrated Humid backend service management
- **IPC Bridge**: Seamless communication between frontend and backend
- **Cross-Platform**: Windows, macOS, and Linux support
- **Auto-Updater**: Ready for automatic application updates
- **System Integration**: Native notifications, file system access, and OS features

### Desktop-Specific Features

- **Menu Bar Integration**: Native application menus
- **Tray Icon**: Background operation with system tray
- **Window Management**: Multi-window support with state persistence
- **Keyboard Shortcuts**: Desktop-specific hotkeys
- **File Associations**: Handle comic file types
- **Offline Mode**: Local database and image caching

## 🏗️ Architecture

```text
src/
├── app/
│   ├── app.ts                # Main application class
│   ├── events/               # Event handling
│   │   ├── electron.events.ts
│   │   └── squirrel.events.ts
│   ├── services/             # Backend service management
│   │   ├── humid.service.ts  # Humid backend integration
│   │   └── ipc.service.ts    # IPC communication
│   ├── windows/              # Window management
│   │   ├── main.window.ts    # Main application window
│   │   └── splash.window.ts  # Splash screen
│   └── utils/                # Utility functions
├── assets/                   # Application assets
├── environments/             # Environment configurations
└── main.ts                   # Application entry point
```

## 🛠️ Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Framework** | Electron | Desktop application framework |
| **Language** | TypeScript | Type-safe development |
| **Frontend** | Angular (Cloud app) | Web UI integration |
| **Backend** | NestJS (Humid app) | API service integration |
| **IPC** | Electron IPC | Inter-process communication |
| **Packaging** | electron-builder | Application packaging |
| **Auto-Updater** | electron-updater | Automatic updates |
| **Testing** | Jest | Unit testing |

## 🔧 Main Process Architecture

### Application Bootstrap

```typescript
// main.ts
import { app, BrowserWindow } from 'electron';
import App from './app/app';
import ElectronEvents from './app/events/electron.events';
import SquirrelEvents from './app/events/squirrel.events';

export default class Main {
  static initialize() {
    // Handle Squirrel events (Windows installer)
    if (SquirrelEvents.handleEvents()) {
      app.quit();
      return;
    }
  }

  static bootstrapApp() {
    App.main(app, BrowserWindow);
  }

  static bootstrapAppEvents() {
    ElectronEvents.bootstrapElectronEvents();
    // Initialize auto-updater service
  }
}

// Initialize and start the application
Main.initialize();

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  Main.bootstrapAppEvents();
  
  app.on('ready', () => {
    Main.bootstrapApp();
  });
}
```

### Main Application Class

```typescript
// app/app.ts
import { app, BrowserWindow, Menu, Tray } from 'electron';
import { HumidService } from './services/humid.service';
import { IPCService } from './services/ipc.service';
import { MainWindow } from './windows/main.window';

export default class App {
  private static mainWindow: BrowserWindow;
  private static humidService: HumidService;
  private static ipcService: IPCService;

  public static main(app: Electron.App, browserWindow: typeof BrowserWindow) {
    App.initializeServices();
    App.createMainWindow();
    App.setupApplicationMenu();
    App.setupIPCHandlers();
  }

  private static initializeServices() {
    App.humidService = new HumidService();
    App.ipcService = new IPCService();
  }

  private static createMainWindow() {
    App.mainWindow = MainWindow.create();
  }

  private static setupApplicationMenu() {
    const template = [
      {
        label: 'File',
        submenu: [
          { label: 'New Comic', accelerator: 'CmdOrCtrl+N' },
          { label: 'Open', accelerator: 'CmdOrCtrl+O' },
          { type: 'separator' },
          { label: 'Exit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
        ]
      },
      {
        label: 'View',
        submenu: [
          { label: 'Reload', accelerator: 'CmdOrCtrl+R' },
          { label: 'Toggle DevTools', accelerator: 'F12' }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }
}
```

## 🪟 Window Management

### Main Window

```typescript
// windows/main.window.ts
import { BrowserWindow, screen } from 'electron';
import { join } from 'path';

export class MainWindow {
  static create(): BrowserWindow {
    const electronScreen = screen;
    const size = electronScreen.getPrimaryDisplay().workAreaSize;

    const win = new BrowserWindow({
      x: 0,
      y: 0,
      width: size.width,
      height: size.height,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        allowRunningInsecureContent: false,
        preload: join(__dirname, 'preload.js')
      },
      icon: join(__dirname, '../assets/icon.png'),
      show: false, // Don't show until ready
      titleBarStyle: 'default'
    });

    // Load the Angular application
    if (process.env['NODE_ENV'] === 'development') {
      win.loadURL('http://localhost:4200');
      win.webContents.openDevTools();
    } else {
      win.loadFile(join(__dirname, '../cloud/index.html'));
    }

    // Show window when ready
    win.once('ready-to-show', () => {
      win.show();
      
      if (process.env['NODE_ENV'] === 'development') {
        win.webContents.openDevTools();
      }
    });

    return win;
  }
}
```

### Preload Script

```typescript
// preload.ts
import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Comic management
  searchComics: (query: string) => ipcRenderer.invoke('ipc/humid/comic-search', query),
  getComic: (id: number) => ipcRenderer.invoke('ipc/humid/get-comic', id),
  crawlComic: (url: string) => ipcRenderer.invoke('ipc/humid/pull-comic', url),
  
  // Image management
  getImage: (path: string) => ipcRenderer.invoke('ipc/humid/get-image', path),
  
  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
  closeWindow: () => ipcRenderer.invoke('window-close'),
  
  // Application events
  onUpdateAvailable: (callback: () => void) => {
    ipcRenderer.on('update-available', callback);
  },
  onUpdateDownloaded: (callback: () => void) => {
    ipcRenderer.on('update-downloaded', callback);
  }
});

// TypeScript declaration for the exposed API
declare global {
  interface Window {
    electronAPI: {
      searchComics: (query: string) => Promise<any[]>;
      getComic: (id: number) => Promise<any>;
      crawlComic: (url: string) => Promise<void>;
      getImage: (path: string) => Promise<string>;
      minimizeWindow: () => Promise<void>;
      maximizeWindow: () => Promise<void>;
      closeWindow: () => Promise<void>;
      onUpdateAvailable: (callback: () => void) => void;
      onUpdateDownloaded: (callback: () => void) => void;
    };
  }
}
```

## 🔄 IPC Communication

### IPC Service

```typescript
// services/ipc.service.ts
import { ipcMain, BrowserWindow } from 'electron';
import { HumidService } from './humid.service';

export class IPCService {
  private humidService: HumidService;

  constructor() {
    this.humidService = new HumidService();
    this.setupHandlers();
  }

  private setupHandlers() {
    // Comic management handlers
    ipcMain.handle('ipc/humid/comic-search', async (event, query: string) => {
      try {
        return await this.humidService.searchComics(query);
      } catch (error) {
        console.error('Comic search error:', error);
        throw error;
      }
    });

    ipcMain.handle('ipc/humid/get-comic', async (event, id: number) => {
      try {
        return await this.humidService.getComic(id);
      } catch (error) {
        console.error('Get comic error:', error);
        throw error;
      }
    });

    ipcMain.handle('ipc/humid/pull-comic', async (event, url: string) => {
      try {
        return await this.humidService.crawlComic(url);
      } catch (error) {
        console.error('Crawl comic error:', error);
        throw error;
      }
    });

    ipcMain.handle('ipc/humid/get-image', async (event, path: string) => {
      try {
        return await this.humidService.getImage(path);
      } catch (error) {
        console.error('Get image error:', error);
        throw error;
      }
    });

    // Window control handlers
    ipcMain.handle('window-minimize', (event) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      window?.minimize();
    });

    ipcMain.handle('window-maximize', (event) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window?.isMaximized()) {
        window.unmaximize();
      } else {
        window?.maximize();
      }
    });

    ipcMain.handle('window-close', (event) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      window?.close();
    });
  }
}
```

### Humid Service Integration

```typescript
// services/humid.service.ts
import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';
import axios from 'axios';

export class HumidService {
  private humidProcess: ChildProcess | null = null;
  private readonly humidUrl = 'http://localhost:3000';
  private readonly humidPath = join(__dirname, '../humid/main.js');

  constructor() {
    this.startHumidService();
  }

  private async startHumidService() {
    try {
      // Start the Humid backend service
      this.humidProcess = spawn('node', [this.humidPath], {
        cwd: join(__dirname, '../humid'),
        stdio: 'pipe'
      });

      this.humidProcess.stdout?.on('data', (data) => {
        console.log(`Humid stdout: ${data}`);
      });

      this.humidProcess.stderr?.on('data', (data) => {
        console.error(`Humid stderr: ${data}`);
      });

      this.humidProcess.on('close', (code) => {
        console.log(`Humid process exited with code ${code}`);
      });

      // Wait for service to be ready
      await this.waitForService();
    } catch (error) {
      console.error('Failed to start Humid service:', error);
    }
  }

  private async waitForService(maxRetries = 10): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await axios.get(`${this.humidUrl}/health`);
        console.log('Humid service is ready');
        return;
      } catch (error) {
        console.log(`Waiting for Humid service... (${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    throw new Error('Humid service failed to start');
  }

  async searchComics(query: string): Promise<any[]> {
    const response = await axios.get(`${this.humidUrl}/api/v1/comic/suggest`, {
      params: { q: query }
    });
    return response.data;
  }

  async getComic(id: number): Promise<any> {
    const response = await axios.get(`${this.humidUrl}/api/v1/comic/${id}`);
    return response.data;
  }

  async crawlComic(url: string): Promise<void> {
    await axios.post(`${this.humidUrl}/api/v1/crawl/by-url`, { url });
  }

  async getImage(path: string): Promise<string> {
    const response = await axios.get(`${this.humidUrl}/api/v1/image/${path}`, {
      responseType: 'arraybuffer'
    });
    const base64 = Buffer.from(response.data).toString('base64');
    return `data:image/jpeg;base64,${base64}`;
  }

  stop() {
    if (this.humidProcess) {
      this.humidProcess.kill('SIGTERM');
      this.humidProcess = null;
    }
  }
}
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Python (for native module compilation)
- Platform-specific build tools:
  - **Windows**: Visual Studio Build Tools
  - **macOS**: Xcode Command Line Tools
  - **Linux**: GCC and development headers

### Installation

1. **Navigate to the platform directory:**

```bash
cd apps/platform
```

2. **Install dependencies** (from workspace root):

```bash
npm install
```

### Development

1. **Start in development mode:**

```bash
npx nx serve platform
```

This will:
- Build the Electron application
- Start the Humid backend service
- Launch the Angular frontend
- Open the Electron window

2. **Build for development:**

```bash
npx nx build platform --configuration=development
```

3. **Build for production:**

```bash
npx nx build platform --configuration=production
```

### Packaging

1. **Package for current platform:**

```bash
npx nx package platform
```

2. **Create installers:**

```bash
npx nx make platform
```

This creates platform-specific installers in `dist/executables/`

## 📦 Build Configuration

### electron-builder Configuration

```json
{
  "build": {
    "productName": "Comic Manager",
    "appId": "com.comicmanager.app",
    "directories": {
      "output": "dist/executables"
    },
    "files": [
      "dist/apps/platform/**/*",
      "dist/apps/cloud/**/*",
      "dist/apps/humid/**/*",
      "resources/**/*"
    ],
    "mac": {
      "category": "public.app-category.entertainment",
      "target": [
        {
          "target": "dmg",
          "arch": ["x64", "arm64"]
        }
      ]
    },
    "win": {
      "target": [
        {
          "target": "nsis",
          "arch": ["x64", "ia32"]
        }
      ]
    },
    "linux": {
      "target": [
        {
          "target": "AppImage",
          "arch": ["x64"]
        },
        {
          "target": "deb",
          "arch": ["x64"]
        }
      ]
    }
  }
}
```

### Project Configuration

```json
{
  "name": "platform",
  "targets": {
    "build": {
      "executor": "nx-electron:build",
      "options": {
        "outputPath": "dist/apps/platform",
        "main": "apps/platform/src/main.ts",
        "tsConfig": "apps/platform/tsconfig.app.json",
        "assets": ["apps/platform/src/assets"]
      },
      "dependsOn": ["humid:build"],
      "configurations": {
        "production": {
          "optimization": true,
          "extractLicenses": true,
          "inspect": false
        }
      }
    },
    "serve": {
      "executor": "nx-electron:execute",
      "options": {
        "buildTarget": "platform:build"
      }
    },
    "package": {
      "executor": "nx-electron:package",
      "options": {
        "name": "platform",
        "frontendProject": "cloud",
        "sourcePath": "dist/apps",
        "outputPath": "dist/packages"
      }
    },
    "make": {
      "executor": "nx-electron:make",
      "options": {
        "name": "platform",
        "frontendProject": "cloud",
        "sourcePath": "dist/apps",
        "outputPath": "dist/executables"
      }
    }
  }
}
```

## 🔄 Auto-Updater

### Auto-Update Service

```typescript
// services/auto-updater.service.ts
import { autoUpdater } from 'electron-updater';
import { BrowserWindow, dialog } from 'electron';

export class AutoUpdaterService {
  private mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.initializeAutoUpdater();
  }

  private initializeAutoUpdater() {
    autoUpdater.checkForUpdatesAndNotify();

    autoUpdater.on('checking-for-update', () => {
      console.log('Checking for update...');
    });

    autoUpdater.on('update-available', (info) => {
      console.log('Update available.');
      this.mainWindow.webContents.send('update-available');
    });

    autoUpdater.on('update-not-available', (info) => {
      console.log('Update not available.');
    });

    autoUpdater.on('error', (err) => {
      console.log('Error in auto-updater. ' + err);
    });

    autoUpdater.on('download-progress', (progressObj) => {
      let log_message = "Download speed: " + progressObj.bytesPerSecond;
      log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
      log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
      console.log(log_message);
    });

    autoUpdater.on('update-downloaded', (info) => {
      console.log('Update downloaded');
      this.mainWindow.webContents.send('update-downloaded');
      
      dialog.showMessageBox(this.mainWindow, {
        type: 'info',
        title: 'Update ready',
        message: 'Update downloaded. Application will restart to apply the update.',
        buttons: ['Restart', 'Later']
      }).then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
    });
  }

  checkForUpdates() {
    autoUpdater.checkForUpdatesAndNotify();
  }
}
```

## 🧪 Testing

### Test Structure

```text
src/
├── app/
│   ├── app.spec.ts
│   ├── services/
│   │   ├── humid.service.spec.ts
│   │   └── ipc.service.spec.ts
│   └── windows/
│       └── main.window.spec.ts
```

### Running Tests

```bash
npx nx test platform
```

### Test Examples

```typescript
// app.spec.ts
import { BrowserWindow } from 'electron';
import App from './app';

describe('App', () => {
  let mockApp: any;
  let mockBrowserWindow: any;

  beforeEach(() => {
    mockApp = {
      on: jest.fn(),
      quit: jest.fn()
    };
    mockBrowserWindow = jest.fn();
  });

  it('should initialize main window', () => {
    App.main(mockApp, mockBrowserWindow);
    expect(mockBrowserWindow).toHaveBeenCalled();
  });
});
```

## 🔒 Security

### Security Best Practices

```typescript
// Secure BrowserWindow configuration
const secureDefaults = {
  webPreferences: {
    nodeIntegration: false,          // Don't expose Node.js APIs
    contextIsolation: true,          // Isolate context
    enableRemoteModule: false,       // Disable remote module
    allowRunningInsecureContent: false, // Don't allow insecure content
    webSecurity: true,               // Enable web security
    sandbox: true,                   // Enable sandbox
    preload: join(__dirname, 'preload.js') // Use preload script
  }
};
```

### Content Security Policy

```typescript
// CSP for Electron renderer process
const csp = `
  default-src 'self';
  script-src 'self' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' http://localhost:3000;
`;
```

## 🚀 Deployment

### Platform-Specific Builds

**Windows:**

```bash
npx nx make platform --platform=win32
```

**macOS:**

```bash
npx nx make platform --platform=darwin
```

**Linux:**

```bash
npx nx make platform --platform=linux
```

### Code Signing

```json
{
  "build": {
    "mac": {
      "identity": "Developer ID Application: Your Name (TEAM_ID)"
    },
    "win": {
      "certificateFile": "certificate.p12",
      "certificatePassword": "password"
    }
  }
}
```

### Distribution

The packaged applications can be distributed through:

- **Direct Download**: Host installers on your website
- **App Stores**: Submit to Microsoft Store, Mac App Store
- **Package Managers**: Chocolatey (Windows), Homebrew (macOS), Snap (Linux)
- **Auto-Updater**: Serve updates from your own server

## 🔗 Related Projects

- [Cloud (Angular Frontend)](../cloud/README.md)
- [Humid (NestJS Backend)](../humid/README.md)
- [Logger (Shared Library)](../../libs/shared/back/logger/README.md)

## 🤝 Contributing

1. **Electron Development**: Follow Electron security best practices
2. **IPC Design**: Keep IPC communication minimal and secure
3. **Testing**: Test on all target platforms
4. **Performance**: Monitor memory usage and startup time

## 📚 Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [electron-builder](https://www.electron.build/)
- [Electron Security Guide](https://www.electronjs.org/docs/tutorial/security)
- [Nx Electron Plugin](https://github.com/bennymeg/nx-electron)

---

**Part of the Comic Crawling & Management System monorepo**
