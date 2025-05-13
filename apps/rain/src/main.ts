import serveStatic from 'serve-static';
import { type Server, createServer } from 'node:http';
import finalHandler from 'finalhandler';
import { createLoggerInstant } from '@cloud/libs/logger';
import { resolve } from 'node:path';

let server: Server;
const logger = createLoggerInstant("Rain");

process.on('message', (rs: Record<string, any>) => {
  if (!rs['type'] || !rs['data']) return;

  switch (rs['type']) {
    case 'server-start': {
      if (!rs.data.port || !Number.isFinite(rs.data.port)) {
        logger.error('Port is not send');
        process.send({
          type: 'server-start-response',
          data: {
            error: 'Port is not send',
          },
        });
        return;
      }

      if (server) {
        logger.error('Server started');
        process.send({
          type: 'server-start-response',
          data: 'OKE',
        });
        return;
      }

      server = createServer((req, res) => {
        serveStatic(resolve('assets', 'images'), { index: ['index.html', 'index.htm'] })(
          req,
          res,
          finalHandler(req, res)
        );
      });
      server.listen(+rs.data.port, () => {
        logger.info(`Server started at port ${rs.data.port}`);
        process.send({
          type: 'server-start-response',
          data: 'OKE',
        });
      })
    }
  }
});
