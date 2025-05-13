import * as net from 'node:net';
import { ChildProcess, fork } from 'child_process';
import App from '../app';
import { join } from 'path';
import { PlatformLogger } from '../common/logger';

export class RainServiceProcess {
  private instantProcess: ChildProcess;
  private logger = new PlatformLogger();
  constructor() {
    this.findAvailablePort().then((port) => {
      if (App.isDevelopmentMode()) {
        this.instantProcess = fork(join('dist', 'apps', 'rain', 'main.js'), {
          execArgv: ['--inspect-brk=5859'],
        });
      } else {
        this.instantProcess = fork(join('node_modules', 'rain', 'main.js'));
      }
      this.instantProcess.on('server-start-response', (mess) => {
        if (!mess['type'] || !mess['data']) return;
        switch (String(mess['type'])) {
          case 'server-start-response': {
            if ('error' in mess.data) {
              this.logger.error(mess.data['error']);
              return;
            }
            this.logger.log(mess.data);
          }
        }
      });
      this.instantProcess.send(
        {
          type: 'start-server',
          data: {
            port: port,
          },
        },
        (err) => {
          if (err) {
            this.logger.log(err);
            process.exit(1);
          }
        }
      );
    });
  }

  /**
   * Check if a specific port is available
   * @param {number} port - The port to check
   * @returns {Promise<boolean>} - Promise resolving to true if port is available, false otherwise
   */
  private isPortAvailable(port: number): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const server = net.createServer();

      server.once('error', (err) => {
        if ('code' in err && err.code === 'EADDRINUSE') {
          resolve(false); // Port is in use
        } else {
          resolve(false); // Some other error
        }
      });

      server.once('listening', () => {
        // Close the server and resolve as available
        server.close(() => {
          resolve(true); // Port is available
        });
      });

      server.listen(port);
    });
  }

  /**
   * Find an available port starting from the given port and incrementing
   * @param {number} startPort - The port to start checking from
   * @param {number} endPort - The maximum port to check
   * @returns {Promise<number>} - Promise resolving to an available port or -1 if none found
   */
  private async findAvailablePort(startPort = 10000, endPort = 99999) {
    for (let port = startPort; port <= endPort; port++) {
      if (await this.isPortAvailable(port)) {
        return port;
      }
    }
    return -1; // No available port found
  }
}
