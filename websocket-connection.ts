// websocket-connection.ts
import WebSocket from "isomorphic-ws";

type WebSocketEvents = {
  open: () => void;
  message: (data: any) => void;
  error: (event: Event) => void;
  close: (event: CloseEvent) => void;
};

export class WebSocketConnection {
  private ws: WebSocket | undefined;
  private autoReconnect: boolean;
  private reconnectTimeout: number = 0;
  private events: WebSocketEvents;
  private closedByClient: boolean = false;
  private resolveClose: (() => void) | undefined = undefined;
  private url: string;
  private connectionPromise: Promise<void> | undefined;
  private reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  private pendingMessages: string[] = [];

  constructor(url: string, autoReconnect: boolean, events: WebSocketEvents) {
    this.url = url;
    this.autoReconnect = autoReconnect;
    this.events = events;
  }

  public async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    if (this.connectionPromise) return this.connectionPromise;

    this.connectionPromise = this.connectRelay()
      .then(() => {
        this.connectionPromise = undefined;
      })
      .catch((err) => {
        this.connectionPromise = undefined;
        throw err;
      });

    return this.connectionPromise;
  }

  private async connectRelay(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(this.url);
        this.ws = ws;
      } catch (err) {
        reject(err);
        return;
      }

      this.ws.onopen = () => {
        this.reconnectTimeout = 0;
        this.events.open();
        this.flushPendingMessages();
        resolve();
      };
      this.ws.onerror = (e) => {
        this.events.error(e);
        reject(e);
      };
      this.ws.onclose = (e) => this.handleClose(e);
      this.ws.onmessage = (e) => this.events.message(e.data);
    });
  }

  public close(): Promise<void> {
    this.closedByClient = true;
    clearTimeout(this.reconnectTimer);

    if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
      return Promise.resolve();
    }

    if (this.ws.readyState === WebSocket.CLOSING && this.resolveClose) {
       return new Promise<void>(resolve => {
           const oldResolve = this.resolveClose;
           this.resolveClose = () => { oldResolve?.(); resolve(); };
       });
    }

    this.ws.close();
    return new Promise<void>((resolve) => {
      this.resolveClose = resolve;
    });
  }

  public send(message: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(message);
      return;
    }

    this.pendingMessages.push(message);
    if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
      this.connect().catch(() => {});
    }
  }

  private flushPendingMessages(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    while (this.pendingMessages.length) {
      const msg = this.pendingMessages.shift();
      if (msg) {
        this.ws.send(msg);
      }
    }
  }

  public get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  public get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  public get connectionInfo(): string {
    // @ts-ignore - Accessing internal _socket for Node.js environments
    const socket = this.ws?._socket;
    if (socket && socket.remoteAddress && socket.remotePort) {
      return `${socket.remoteAddress}:${socket.remotePort}`;
    }
    return this.url;
  }

  private handleClose(event: CloseEvent): void {
    // Always resolve the promise if it exists
    this.resolveClose?.();
    this.resolveClose = undefined; // Clear it to prevent multiple calls

    if (this.closedByClient) {
      this.events.close(event); // Emit close event for intentional closes
    } else {
      // Unintentional close, attempt reconnect
      if (this.autoReconnect) {
        this.reconnect();
      }
      this.events.close(event); // Emit close event for unintentional closes as well
    }
    this.closedByClient = false; // Reset for next connection attempt
  }

  private reconnect(): void {
    this.reconnectTimeout = Math.max(2000, this.reconnectTimeout * 3); // Exponential backoff
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((err) => {
        console.error(`Failed to reconnect to ${this.url}: ${err}`);
        this.reconnect(); // Retry reconnection
      });
    }, this.reconnectTimeout);
  }
}
