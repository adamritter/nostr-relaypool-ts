// allows sub/unsub and publishing before connection is established.
// Much more refactoring is needed
// Don't rely on Relay interface, it will change (I'll probably delete a lot of code from here, there's no need for
// multiple listeners)

import {type Event, verifyEvent, validateEvent} from "nostr-tools";
import {type Filter, matchFilters} from "nostr-tools";
import WebSocket from "isomorphic-ws";
import {getHex64, getSubName} from "./fakejson";
import {WebSocketConnection} from "./websocket-connection";
import {RelayEventEmitter} from "./relay-event-emitter";
import {AsyncMessageQueue} from "./async-message-queue";

export type Relay = {
  url: string;
  status: number;
  connectionInfo: string;
  connect: () => Promise<void>;
  close: () => Promise<void>;
  sub: (filters: Filter[], opts?: SubscriptionOptions) => Sub;
  publish: (event: Event) => Pub;
  auth: (event: Event) => Pub;
  on: (
    type: "connect" | "disconnect" | "error" | "notice" | "auth",
    cb: any
  ) => void;
  off: (
    type: "connect" | "disconnect" | "error" | "notice" | "auth",
    cb: any
  ) => void;
};
export type Pub = {
  on: (type: "ok" | "seen" | "failed", cb: any) => void;
  off: (type: "ok" | "seen" | "failed", cb: any) => void;
};
export type Sub = {
  sub: (filters: Filter[], opts: SubscriptionOptions) => Sub;
  unsub: () => void;
  on: (type: "event" | "eose", cb: any) => void;
  off: (type: "event" | "eose", cb: any) => void;
};

type SubscriptionOptions = {
  skipVerification?: boolean;
  id?: string;
  eventIds?: Set<string>;
};
export function relayInit(
  url: string,
  alreadyHaveEvent?: (id: string) => (Event & {id: string}) | undefined,
  autoReconnect?: boolean
): Relay {
  return new RelayC(url, alreadyHaveEvent, autoReconnect).relayInit();
}
class RelayC {
  url: string;
  alreadyHaveEvent?: (id: string) => (Event & {id: string}) | undefined;
  logging: boolean = false;
  private wsConnection: WebSocketConnection;
  private eventEmitter: RelayEventEmitter;
  private messageQueue: AsyncMessageQueue;

  constructor(
    url: string,
    alreadyHaveEvent?: (id: string) => (Event & {id: string}) | undefined,
    autoReconnect?: boolean
  ) {
    this.url = url;
    this.alreadyHaveEvent = alreadyHaveEvent;
    this.autoReconnect = autoReconnect;

    this.eventEmitter = new RelayEventEmitter();
    this.messageQueue = new AsyncMessageQueue(this.handleMessage.bind(this));
    this.wsConnection = new WebSocketConnection(
      url,
      autoReconnect || false,
      {
        open: () => this.eventEmitter.emit("connect", undefined),
        message: (data) => this.messageQueue.push(data),
        error: (e) => this.eventEmitter.emit("error", e),
        close: (e) => this.eventEmitter.emit("disconnect", undefined),
      }
    );
  }
  autoReconnect?: boolean;
  sendOnConnect: string[] = [];
  openSubs: {[id: string]: {filters: Filter[]} & SubscriptionOptions} = {};
  closedByClient: boolean = false;
  subListeners: {
    [subid: string]:
      | {
          event: Array<(event: Event) => void>;
          eose: Array<() => void>;
        }
      | undefined;
  } = {};
  pubListeners: {
    [eventid: string]: {
      ok: Array<() => void>;
      seen: Array<() => void>;
      failed: Array<(reason: string) => void>;
    };
  } = {};

  // Message handling logic (from original #handleMessage)
  private async handleMessage(messageData: any) {
    let data;
    let json: string = messageData.toString();
    if (!json) return;

    // Fast-path for event pre-check
    let eventId = getHex64(json, "id");
    let event = this.alreadyHaveEvent?.(eventId);
    if (event) {
      const listener = this.subListeners[getSubName(json)];
      if (listener) listener.event.forEach((cb) => cb(event));
      return;
    }

    try {
      data = JSON.parse(json);
    } catch (err) {
      this.eventEmitter.emit("error", `Failed to parse JSON from relay: ${err}`);
      return;
    }

    if (data.length >= 1) {
      switch (data[0]) {
        case "EVENT": {
          if (data.length !== 3) return;
          const id = data[1];
          const event = data[2];
          if (!this.openSubs[id]) return;
          if (this.openSubs[id].eventIds?.has(eventId)) return;
          this.openSubs[id].eventIds?.add(eventId);

          if (
            validateEvent(event) &&
            (this.openSubs[id].skipVerification || verifyEvent(event)) &&
            matchFilters(this.openSubs[id].filters, event)
          ) {
            this.subListeners[id]?.event.forEach((cb) => cb(event));
          }
          return;
        }
        case "EOSE": {
          if (data.length !== 2) return;
          const id = data[1];
          this.subListeners[id]?.eose.forEach((cb) => cb());
          return;
        }
        case "OK": {
          if (data.length < 3) return;
          const id: string = data[1];
          const ok: boolean = data[2];
          const reason: string = data[3] || "";
          if (ok) this.pubListeners[id]?.ok.forEach((cb) => cb());
          else this.pubListeners[id]?.failed.forEach((cb) => cb(reason));
          return;
        }
        case "NOTICE": {
          if (data.length !== 2) return;
          const notice = data[1];
          this.eventEmitter.emit("notice", notice);
          return;
        }
        case "AUTH": {
          if (data.length !== 2) return;
          const challenge = data[1];
          this.eventEmitter.emit("auth", challenge);
          return;
        }
        default: {
          // Handle other messages if necessary
        }
      }
    }
  }

  public async connect(): Promise<void> {
    await this.wsConnection.connect();
    // After successful connection, send queued messages and subscriptions
    for (const subid in this.openSubs) {
      if (this.logging) {
        console.log("REQ", this.url, subid, ...this.openSubs[subid].filters);
      }
      this.wsConnection.send(JSON.stringify(["REQ", subid, ...this.openSubs[subid].filters]));
    }
    for (const msg of this.sendOnConnect) {
      if (this.logging) {
        console.log("(Relay msg)", this.url, msg);
      }
      this.wsConnection.send(msg);
    }
    this.sendOnConnect = [];
  }

  public close(): Promise<void> {
    return this.wsConnection.close();
  }

  public on(type: "connect" | "disconnect" | "error" | "notice" | "auth", cb: any): void {
    this.eventEmitter.on(type, cb);
  }

  public off(type: "connect" | "disconnect" | "error" | "notice" | "auth", cb: any): void {
    this.eventEmitter.off(type, cb);
  }

  public publish(event: Event): Pub {
    return this.sendEvent("EVENT", event);
  }

  public auth(event: Event): Pub {
    return this.sendEvent("AUTH", event);
  }

  private sendEvent(type: "EVENT" | "AUTH", event: Event): Pub {
    if (!event.id) throw new Error(`event ${event} has no id`);
    const id = event.id;

    let sent = false;
    let mustMonitor = false;

    this.trySend([type, event])
      .then(() => {
        sent = true;
        if (mustMonitor) {
          this.startMonitoring(id);
          mustMonitor = false;
        }
      })
      .catch(() => {});

    return {
      on: (type: "ok" | "seen" | "failed", cb: any) => {
        this.pubListeners[id] = this.pubListeners[id] || {
          ok: [],
          seen: [],
          failed: [],
        };
        this.pubListeners[id][type].push(cb);

        if (type === "seen") {
          if (sent) this.startMonitoring(id);
          else mustMonitor = true;
        }
      },
      off: (type: "ok" | "seen" | "failed", cb: any) => {
        const listeners = this.pubListeners[id];
        if (!listeners) return;
        const idx = listeners[type].indexOf(cb);
        if (idx >= 0) listeners[type].splice(idx, 1);
      },
    };
  }

  private startMonitoring(id: string) {
    const monitor = this.sub([{ids: [id]}], {
      id: `monitor-${id.slice(0, 5)}`,
    });
    const willUnsub = setTimeout(() => {
      (this.pubListeners[id]?.failed || []).forEach((cb) =>
        cb("event not seen after 5 seconds")
      );
      monitor.unsub();
    }, 5000);
    monitor.on("event", () => {
      clearTimeout(willUnsub);
      (this.pubListeners[id]?.seen || []).forEach((cb) => cb());
    });
  }

  get status(): number {
    return this.wsConnection.readyState;
  }

  get connected(): boolean {
    return this.wsConnection.isConnected;
  }

  get connectionInfo(): string {
    return this.wsConnection.connectionInfo;
  }

  async trySend(params: [string, ...any]) {
    const msg = JSON.stringify(params);

    if (this.connected) {
      this.wsConnection.send(msg);
    } else {
      this.sendOnConnect.push(msg);
    }
  }

  sub(filters: Filter[], opts: SubscriptionOptions = {}): Sub {
    const subid = opts.id || Math.random().toString().slice(2);
    const skipVerification = opts.skipVerification || false;

    this.openSubs[subid] = {
      id: subid,
      filters,
      skipVerification,
    };
    if (this.connected) {
      if (this.logging) {
        console.log("REQ2", this.url, subid, ...filters);
      }
      this.trySend(["REQ", subid, ...filters]);
    }

    return {
      sub: (newFilters, newOpts = {}) =>
        this.sub(newFilters || filters, {
          skipVerification: newOpts.skipVerification || skipVerification,
          id: subid,
        }),
      unsub: () => {
        delete this.openSubs[subid];
        delete this.subListeners[subid];
        if (this.connected) {
          if (this.logging) {
            console.log("CLOSE", this.url, subid);
          }
          this.trySend(["CLOSE", subid]);
        }
      },
      on: (type: "event" | "eose", cb: any): void => {
        this.subListeners[subid] = this.subListeners[subid] || {
          event: [],
          eose: [],
        };
        this.subListeners[subid]![type].push(cb);
      },
      off: (type: "event" | "eose", cb: any): void => {
        const listeners = this.subListeners[subid];

        if (!listeners) return;

        const idx = listeners[type].indexOf(cb);
        if (idx >= 0) listeners[type].splice(idx, 1);
      },
    };
  }
  relayInit(): Relay {
    const this2 = this;
    return {
      url: this2.url,
      sub: this2.sub.bind(this2),
      on: this2.on.bind(this2),
      off: this2.off.bind(this2),
      auth: this2.auth.bind(this2),
      publish: this2.publish.bind(this2),
      connect: this2.connect.bind(this2),
      close(): Promise<void> {
        return this2.close();
      },
      get status() {
        return this2.status;
      },
      get connectionInfo() {
        return this2.connectionInfo;
      },
      // @ts-ignore
      relay: this2,
    };
  }
}
