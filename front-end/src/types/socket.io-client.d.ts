/* eslint-disable @typescript-eslint/no-explicit-any */
declare module "socket.io-client" {
  export interface Socket {
    off: any;
    connected: boolean;
    id: string;
    on(event: string, callback: (...args: unknown[]) => void): this;
    emit(event: string, ...args: unknown[]): this;
    disconnect(): this;
  }

  interface ManagerOptions {
    reconnection?: boolean;
    reconnectionAttempts?: number;
    reconnectionDelay?: number;
    reconnectionDelayMax?: number;
    timeout?: number;
    autoConnect?: boolean;
  }

  interface SocketOptions {
    auth?: Record<string, unknown>;
    transports?: string[];
  }

  function io(
    uri: string,
    opts?: Partial<ManagerOptions & SocketOptions>,
  ): Socket;
  export default io;
}
