import {
  CustomTransportStrategy,
  IncomingEvent,
  IncomingRequest,
  PacketId,
  Server,
  WritePacket,
} from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import {
  ChildProcessEvents,
  ChildProcessStatus,
} from './events/child-process.event';
import { NO_MESSAGE_HANDLER } from '@nestjs/microservices/constants';
import { isString } from '@nestjs/common/utils/shared.utils';
import { ChildProcessContext } from './context/child-process.context';
import { BaseRpcContext } from '@nestjs/microservices/ctx-host/base-rpc.context';
import { NOT_IN_CHILD_PROCESS } from './constant';
import { firstValueFrom, isObservable } from 'rxjs';

export class ChildProcessTransport
  extends Server<ChildProcessEvents, ChildProcessStatus>
  implements CustomTransportStrategy
{
  public override readonly transportId = Symbol('CHILD_PROCESS');
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
      throw new Error(NOT_IN_CHILD_PROCESS);
    }

    process.once('error', (error) => {
      this._logger.error(error);
      callback(error);
    });

    process.on('message', async (raw) => {
      this._logger.log(
        `[Message Coming] Receive message ${JSON.stringify(raw)}`
      );
      await this.handleMessage(raw);
    });
  }

  public close() {
    process.removeAllListeners('message');
    process.removeAllListeners('close');
    process.removeAllListeners('error');
  }

  /**
   * @param incomingMessage Message send to process
   * @protected
   */
  protected async handleMessage(incomingMessage: any) {
    let packet: IncomingRequest | IncomingEvent;
    const id =
      'id' in incomingMessage && incomingMessage.id
        ? incomingMessage.id
        : undefined;
    const pattern = !isString(incomingMessage.pattern)
      ? JSON.stringify(incomingMessage.pattern)
      : incomingMessage.pattern;

    try {
      packet = await this.deserializer.deserialize(incomingMessage);
    } catch (err) {
      return this.sendToParentMessage({
        id,
        err: err,
        pattern,
      });
    }

    const context: ChildProcessContext = new ChildProcessContext([
      process,
      pattern,
      id,
    ]);

    if ('id' in packet && packet.id == undefined) {
      return this.handleEvent(pattern, packet, context);
    }
    return this.handleIncomingRequest(
      pattern,
      packet as IncomingRequest,
      context
    );
  }

  // Unwrap/Get raw server not really needed
  public unwrap<T>(): T {
    if (!process.send) {
      throw new Error(NOT_IN_CHILD_PROCESS);
    }
    return process as T;
  }

  // Mimic EventEmitter (no-op for this transport, unless you want send events)
  public on(event: any, callback: any): any {
    return process.on(event, callback);
  }

  private async sendToParentMessage(
    data: WritePacket & PacketId & { pattern?: string }
  ) {
    return new Promise<void>((resolve, reject) => {
      process.send?.(
        data,
        null,
        {
          swallowErrors: false,
        },
        (error) => {
          if (error) reject(error);
          resolve();
        }
      );
    });
  }

  private async handleIncomingRequest(
    pattern: string,
    packet: IncomingRequest,
    _: BaseRpcContext
  ) {
    const handler = this.getHandlers().get(packet.pattern);

    if (!handler) {
      return this.sendToParentMessage({
        pattern,
        id: (packet as IncomingRequest).id ?? 'unknown',
        err: NO_MESSAGE_HANDLER,
      });
    }
    try {
      let result = await handler(packet.data);
      if (isObservable(result)) {
        result = await firstValueFrom(result);
      }
      this._logger.log(
        `[Send] id=${packet.id} response data : ${JSON.stringify(result)}`
      );
      return this.sendToParentMessage({
        pattern,
        id: packet.id ?? 'unknown',
        response: result,
      });
    } catch (err: any) {
      this._logger.error(err);
      return this.sendToParentMessage({
        pattern,
        id: packet.id,
        err: err,
      });
    }
  }
}
