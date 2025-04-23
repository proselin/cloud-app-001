import { CustomTransportStrategy, Server } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { ProcessMessage, ProcessResponse } from './message.types';
import { PostProcessSchema } from './message.schema';

export class ChildProcessTransport extends Server implements CustomTransportStrategy {
  public override readonly transportId = Symbol('PROCESS');
  protected isManuallyTerminated = false;
  private readonly _logger = new Logger('ServerProcess');

  constructor(private readonly options?: Record<string, any>) {
    super();
  }

  public listen(
    callback: (err?: unknown, ...optionalParams: unknown[]) => void
  ) {
    if (!process.send) {
      throw new Error(
        'Not running as a nested/child process (process.send missing)'
      );
    }

    process.on('message', async (raw) => {
      this._logger.log(`[Message Comming] Receive message ${JSON.stringify(raw)}`)
      await this.handleMessage(raw, callback);
    });
    callback();
  }

  public close() {
    process.removeAllListeners('message');
    this.isManuallyTerminated = true;
  }

  /**
   * @param raw
   * @param callback
   * @protected
   */
  //eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  protected async handleMessage(raw: any, callback: Function) {
    let packet: ProcessMessage;
    try {
      packet = PostProcessSchema.parse(raw);
    } catch (err: any) {
      process.send?.({
        id: raw?.id ?? 'unknown',
        err: {
          message: 'Invalid message format',
          details: err.errors,
        },
      });
      return;
    }

    const route = this.getRouteFromPattern(packet.pattern);
    const handler = this.getHandlerByPattern(route);

    if (!handler) {
      process.send?.({ id: packet.id, err: 'NO_MESSAGE_HANDLER' });
      return;
    }

    try {
      // context can be enhanced if you wish
      const result = await handler(packet.data) as ProcessResponse;
      if (!packet.isEvent) {
        process.send?.({ id: packet.id, response: result });
      }
    } catch (err: any) {
      process.send?.({ id: packet.id, err: err });
    }
  }

  // Unwrap/Get raw server not really needed
  public unwrap<T>(): T {
    return undefined as any;
  }

  // Mimic EventEmitter (no-op for this transport, unless you want send events)
  public on(event: any, callback: any): any {
    /* no-op */
  }
}
