import { ClientProxy, ReadPacket, WritePacket } from '@nestjs/microservices';

class ChildProcessClient extends ClientProxy {
  override connect(): Promise<any> {
      return Promise.resolve();
  }
  override close() {/**/}
  override unwrap<T = never>(): T {
    throw new Error('Method not implemented.');
  }
  protected override publish(
    packet: ReadPacket,
    callback: (packet: WritePacket) => void
  ): () => void {
    throw new Error('Method not implemented.');
  }
  protected override dispatchEvent<T = any>(packet: ReadPacket): Promise<T> {
    throw new Error('Method not implemented.');
  }
}
