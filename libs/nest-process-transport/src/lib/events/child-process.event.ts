type VoidCallback = () => void;
type OnErrorCallback = (error: Error) => void;

export const enum ChildProcessStatus {
  CONNECTED='connected',
  DISCONNECTED='disconnected',
}
export const enum ChildProcessEventsMap {
  ERROR = 'error',
  CONNECT = 'connect',
  CLOSE = 'close',
  MESSAGE = 'message',
}

export type ChildProcessEvents = {
  [ChildProcessEventsMap.ERROR]: OnErrorCallback;
  [ChildProcessEventsMap.CONNECT]: VoidCallback;
  [ChildProcessEventsMap.CLOSE]: VoidCallback;
  [ChildProcessEventsMap.MESSAGE]: VoidCallback;
};
