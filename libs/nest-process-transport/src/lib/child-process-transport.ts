import {
  CustomTransportStrategy,
  IncomingRequest,
  Server,
} from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { ProcessResponse } from './message.types';

export class ChildProcessTransport
  extends Server
  implements CustomTransportStrategy
{
  public override readonly transportId = Symbol('PROCESS');
  protected isManuallyTerminated = false;
  private readonly _logger = new Logger('ServerProcess');

  constructor(private readonly options?: Record<string, any>) {
    super();
    this.initializeDeserializer(options);
    this.initializeSerializer(options);
  }

  public listen(
    callback: (err?: unknown, ...optionalParams: unknown[]) => void
  ) {
    if (!process.send) {
      throw new Error(
        'Not running as a nested/child process (process.send missing)'
      );
    }
    this._logger.log('Start Listening');
    process.on('message', async (raw) => {
      this._logger.log(
        `[Message Coming] Receive message ${JSON.stringify(raw)}`
      );
      await this.handleMessage(raw);
    });
    callback();
  }

  public close() {
    process.removeAllListeners('message');
    this.isManuallyTerminated = true;
  }

  /**
   * @param raw
   * @protected
   */
  protected async handleMessage(raw: any) {
    let packet: IncomingRequest;
    try {
      packet = (await this.deserializer.deserialize(raw)) as IncomingRequest;
      this._logger.log("Deserialize packet" + JSON.stringify(packet));
    } catch (err) {
      process.send?.({
        id: raw?.id ?? 'unknown',
        err: {
          message: 'Invalid message format',
          details: err,
        },
      });
      return;
    }

    this._logger.log("Route", packet);
    const handler = this.getHandlers().get(packet.pattern);

    if (!handler) {
      process.send?.({ id: packet.id, err: 'NO_HANDLER' });
      return;
    }

    try {
      // context can be enhanced if you wish
      const result = (await handler(packet.data)) as ProcessResponse;
      this._logger.log(
        `[Send] id=${packet.id} response data : ${JSON.stringify(result)}`
      );
      process.send?.({
        id: packet.id,
        pattern: packet.pattern,
        response: result,
      });
    } catch (err: any) {
      process.send?.({ id: packet.id, err: err });
    }
  }

  // Unwrap/Get raw server not really needed
  public unwrap<T>(): T {
    return process as T;
  }

  // Mimic EventEmitter (no-op for this transport, unless you want send events)
  public on(event: any, callback: any): any {
    return process.on(event, callback);
  }
}
