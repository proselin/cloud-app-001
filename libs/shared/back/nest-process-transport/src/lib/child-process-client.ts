import { ChildProcess, Serializable } from 'child_process';
import {
  ClientProxy,
  PacketId,
  ReadPacket,
  WritePacket,
} from '@nestjs/microservices';
import { Logger, LoggerService } from '@nestjs/common';
import { v4 } from 'uuid';
import { isObject } from '@nestjs/common/utils/shared.utils';
import { Serializer } from '@nestjs/microservices/interfaces/serializer.interface';
import { Deserializer } from '@nestjs/microservices/interfaces/deserializer.interface';

export interface ChildProcessClientOptions {
  serializer?: Serializer;
  deserializer?: Deserializer;
  logger?: LoggerService;
}

export class ChildProcessClient extends ClientProxy {
  private logger: LoggerService;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  private pendingEventListeners: { event: string; callBack: Function }[];
  private connected = false;

  constructor(
    private childProcess: ChildProcess,
    private options?: ChildProcessClientOptions
  ) {
    super();
    this.pendingEventListeners = [];
    this.logger = options?.logger ?? new Logger();
    this.initializeSerializer(options);
    this.initializeDeserializer(options);
  }

  override async connect(): Promise<void> {
    if (!this.connected) {
      this.pendingEventListeners.forEach(({ event, callBack }) => {
        //eslint-disable-next-line
        this.childProcess.on(event, (...args: any[]) => {
          callBack(...args);
        });
      });
      this.pendingEventListeners = [];
      this.registerErrorEventListener();
      this.childProcess.on('message', this.createResponseCallback());
      this.connected = true;
    }
    return Promise.resolve();
  }

  override close() {
    this.childProcess.disconnect();
    this.childProcess.removeAllListeners('message');
    this.childProcess.removeAllListeners('error');
  }

  override unwrap<T = ChildProcess>(): T {
    if (!this.childProcess.connected)
      throw new Error('Unable to connect to child process');
    return this.childProcess as T;
  }

  protected override publish(
    packet: ReadPacket,
    callback: (packet: WritePacket) => void
  ): () => void {
    try {
      packet.pattern = this.normalizePattern(packet.pattern);
      const packetSend = this.assignPacketId(packet);
      const serializedPacket = this.serializer.serialize(packetSend);
      this.routingMap.set(packetSend.id, callback);
      this.logger.log(
        `Send Message id=${packetSend.id} data=${JSON.stringify(
          serializedPacket
        )}`
      );
      this.childProcess.send(serializedPacket, (error) => {
        if (error) {
          this.logger.error(error);
          throw error;
        }
      });
      return () => {
        this.routingMap.delete(packetSend.id);
      };
    } catch (err) {
      this.logger.log('Send error', err);
      callback({ err });
      return () => {
        /**/
      };
    }
  }

  protected override async dispatchEvent<T = void>(
    packet: ReadPacket
  ): Promise<T> {
    try {
      packet.pattern = this.normalizePattern(packet.pattern);
      const packetSend = this.assignPacketId(packet);
      const serializedPacket = this.serializer.serialize(packetSend);
      this.logger.log(
        `Send Message id=${packetSend.id} data=${JSON.stringify(
          serializedPacket
        )}`
      );
      this.childProcess.send(serializedPacket, (error) => {
        if (error) {
          this.logger.error(error);
          throw error;
        }
      });
    } catch (err) {
      this.logger.log('Send error', err);
    }
    return void 0 as T;
  }

  //eslint-disable-next-line
  override on(event: string, callback: (...args: any[]) => void) {
    this.logger.log(`Start Listening to event ${event}`);
    //eslint-disable-next-line
    this.childProcess.on(event, (...args: any[]) => {
      callback(...args);
    });
  }

  private registerErrorEventListener() {
    this.childProcess.on('error', (err) => {
      this.logger.error(err);
    });
  }

  createResponseCallback() {
    return async (data: Serializable) => {
      this.logger.log("Received a message");
      const { err, response, isDisposed, id } = this.deserializer.deserialize(data) as any;
      if (err) {
        this.logger.error(`Received error on id:${id} error ${JSON.stringify(err)}`);
      }
      if (response && isObject(response) && "type" in response && response.type != "Buffer") {
        this.logger.log(`Received response on id:${id} ${JSON.stringify(response)}`);
      }else if(isObject(response) && "type" in response && response.type == "Buffer") {
        this.logger.log(`Received a response buffer on id:${id}`);
      }
      const callback = this.routingMap.get(id);
      if (!callback) {
        return;
      }
      if (isDisposed || err) {
        return callback({
          err,
          response,
          isDisposed: true,
        });
      }
      callback({
        err,
        response,
      });
    };
  }

  override assignPacketId(packet: ReadPacket): ReadPacket & PacketId {
    const id = v4();
    return Object.assign(packet, { id });
  }
}
