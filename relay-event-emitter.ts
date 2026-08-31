// relay-event-emitter.ts
type Callback<T> = (data: T) => void;

type RelayEventMap = {
  connect: undefined;
  disconnect: undefined;
  error: any; // WebSocket ErrorEvent, or custom error message
  notice: string;
  auth: string; // challenge string
  message: string; // Raw WebSocket message data
};

export class RelayEventEmitter {
  private listeners: {
    [K in keyof RelayEventMap]?: Callback<RelayEventMap[K]>[]
  } = {};

  public on<K extends keyof RelayEventMap>(event: K, callback: Callback<RelayEventMap[K]>): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(callback);
  }

  public off<K extends keyof RelayEventMap>(event: K, callback: Callback<RelayEventMap[K]>): void {
    if (!this.listeners[event]) {
      return;
    }
    this.listeners[event] = this.listeners[event]!.filter(cb => cb !== callback);
  }

  public emit<K extends keyof RelayEventMap>(event: K, data: RelayEventMap[K]): void {
    if (this.listeners[event]) {
      this.listeners[event]!.forEach(callback => callback(data));
    }
  }
}
