// allows sub/unsub and publishing before connection is established.
// Much more refactoring is needed
// Don't rely on Relay interface, it will change (I'll probably delete a lot of code from here, there's no need for
// multiple listeners)

import {type Event, verifySignature, validateEvent} from "nostr-tools";
import {type Filter, matchFilters} from "nostr-tools";
import WebSocket from "isomorphic-ws";
import {getHex64, getSubName} from "./fakejson";

type RelayEvent = "connect" | "disconnect" | "error" | "notice";

export type Relay = {
  url: string;
  status: number;
  connect: () => Promise<void>;
  close: () => Promise<void>;
  sub: (filters: Filter[], opts?: SubscriptionOptions) => Sub;
  publish: (event: Event) => Pub;
  on: (type: RelayEvent, cb: any) => void;
  off: (type: RelayEvent, cb: any) => void;
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
};
export function relayInit(
  url: string,
  alreadyHaveEvent?: (id: string) => (Event & {id: string}) | undefined,
  dontAutoReconnect?: boolean
): Relay {
  return new RelayC(url, alreadyHaveEvent, dontAutoReconnect).relayInit();
}
class RelayC {
  url: string;
  alreadyHaveEvent?: (id: string) => (Event & {id: string}) | undefined;
  logging: boolean = true;
  constructor(
    url: string,
    alreadyHaveEvent?: (id: string) => (Event & {id: string}) | undefined,
    dontAutoReconnect?: boolean
  ) {
    this.url = url;
    this.alreadyHaveEvent = alreadyHaveEvent;
    this.dontAutoReconnect = dontAutoReconnect;
  }
  dontAutoReconnect?: boolean;
  ws: WebSocket | undefined;
  sendOnConnect: string[] = [];
  openSubs: {[id: string]: {filters: Filter[]} & SubscriptionOptions} = {};
  closedByClient: boolean = false;
  listeners: {
    connect: Array<() => void>;
    disconnect: Array<() => void>;
    error: Array<() => void>;
    notice: Array<(msg: string) => void>;
  } = {
    connect: [],
    disconnect: [],
    error: [],
    notice: [],
  };
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
  incomingMessageQueue: string[] = [];
  handleNextInterval: any;

  #handleNext() {
    if (this.incomingMessageQueue.length === 0) {
      clearInterval(this.handleNextInterval);
      this.handleNextInterval = null;
      return;
    }
    this.#handleMessage({data: this.incomingMessageQueue.shift()});
  }

  async trySend(params: [string, ...any]) {
    const msg = JSON.stringify(params);

    if (this.connected) {
      this.ws?.send(msg);
    } else {
      this.sendOnConnect.push(msg);
    }
  }
  resolveClose: (() => void) | undefined = undefined;

  async #onclose() {
    if (this.closedByClient) {
      this.listeners.disconnect.forEach((cb) => cb());
      this.resolveClose && this.resolveClose();
    } else {
      if (!this.dontAutoReconnect) {
        this.#reconnect();
      }
    }
  }
  reconnectTimeout: number = 0;
  #reconnect() {
    setTimeout(() => {
      this.reconnectTimeout = Math.max(2000, this.reconnectTimeout * 3);
      console.log(
        this.url,
        "reconnecting after " + this.reconnectTimeout / 1000 + "s"
      );
      this.connect();
    }, this.reconnectTimeout);
  }

  async #onmessage(e: any) {
    this.incomingMessageQueue.push(e.data);
    if (!this.handleNextInterval) {
      this.handleNextInterval = setInterval(() => this.#handleNext(), 0);
    }
  }

  async #handleMessage(e: any) {
    let data;
    let json: string = e.data.toString();
    if (!json) {
      return;
    }
    let event =
      this.alreadyHaveEvent && this.alreadyHaveEvent(getHex64(json, "id"));
    if (event) {
      const listener = this.subListeners[getSubName(json)];

      if (!listener) {
        return;
      }

      return listener.event.forEach((cb) =>
        // @ts-ignore
        cb(event)
      );
    }
    try {
      data = JSON.parse(json);
    } catch (err) {
      data = e.data;
    }

    if (data.length >= 1) {
      switch (data[0]) {
        case "EVENT":
          if (data.length !== 3) return; // ignore empty or malformed EVENT

          const id = data[1];
          const event = data[2];
          if (
            validateEvent(event) &&
            this.openSubs[id] &&
            (this.openSubs[id].skipVerification || verifySignature(event)) &&
            matchFilters(this.openSubs[id].filters, event)
          ) {
            this.openSubs[id];
            (this.subListeners[id]?.event || []).forEach((cb) => cb(event));
          }
          return;
        case "EOSE": {
          if (data.length !== 2) return; // ignore empty or malformed EOSE
          const id = data[1];
          if (this.logging) {
            console.log("EOSE", this.url, id);
          }
          (this.subListeners[id]?.eose || []).forEach((cb) => cb());
          return;
        }
        case "OK": {
          if (data.length < 3) return; // ignore empty or malformed OK
          const id: string = data[1];
          const ok: boolean = data[2];
          const reason: string = data[3] || "";
          if (ok) this.pubListeners[id]?.ok.forEach((cb) => cb());
          else this.pubListeners[id]?.failed.forEach((cb) => cb(reason));
          return;
        }
        case "NOTICE":
          if (data.length !== 2) return; // ignore empty or malformed NOTICE
          const notice = data[1];
          this.listeners.notice.forEach((cb) => cb(notice));
          return;
      }
    }
  }
  #onopen(opened: () => void) {
    if (this.resolveClose) {
      this.resolveClose();
      return;
    }
    // console.log("#onopen setting reconnectTimeout to 0");
    // this.reconnectTimeout = 0;
    // TODO: Send ephereal messages after subscription, permament before
    for (const subid in this.openSubs) {
      if (this.logging) {
        console.log("REQ", this.url, subid, ...this.openSubs[subid].filters);
      }
      this.trySend(["REQ", subid, ...this.openSubs[subid].filters]);
    }
    for (const msg of this.sendOnConnect) {
      if (this.logging) {
        console.log("(Relay msg)", this.url, msg);
      }
      this.ws?.send(msg);
    }
    this.sendOnConnect = [];

    this.listeners.connect.forEach((cb) => cb());
    opened();
  }

  async connectRelay(): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.url);
      this.ws = ws;

      ws.onopen = this.#onopen.bind(this, resolve);
      ws.onerror = (e) => {
        this.listeners.error.forEach((cb) => cb());
        reject(e);
      };
      ws.onclose = this.#onclose.bind(this);
      ws.onmessage = this.#onmessage.bind(this);
    });
  }

  async connect(): Promise<void> {
    if (this.ws?.readyState && this.ws.readyState === 1) return; // ws already open
    try {
      await this.connectRelay();
    } catch (err) {
      console.log("connectRelay ", this.url, " error ", err);
    }
  }

  relayInit(): Relay {
    const this2 = this;
    return {
      url: this2.url,
      sub: this2.sub.bind(this2),
      on: this2.on.bind(this2),
      off: this2.off.bind(this2),
      publish: this2.publish.bind(this2),
      connect: this2.connect.bind(this2),
      close(): Promise<void> {
        return this2.close();
      },
      get status() {
        return this2.status;
      },
      // @ts-ignore
      relay: this2,
    };
  }
  get status() {
    return this.ws?.readyState ?? 3;
  }
  get connected() {
    return this.ws?.readyState === 1;
  }
  close(): Promise<void> {
    this.closedByClient = true;
    this.ws?.close();
    return new Promise<void>((resolve) => {
      this.resolveClose = resolve;
    });
  }
  on(type: RelayEvent, cb: any) {
    this.listeners[type].push(cb);
    if (type === "connect" && this.ws?.readyState === 1) {
      cb();
    }
  }

  off(type: RelayEvent, cb: any) {
    const index = this.listeners[type].indexOf(cb);
    if (index !== -1) this.listeners[type].splice(index, 1);
  }

  publish(event: Event): Pub {
    const this2 = this;
    if (!event.id) throw new Error(`event ${event} has no id`);
    const id = event.id;

    let sent = false;
    let mustMonitor = false;

    this2
      .trySend(["EVENT", event])
      .then(() => {
        sent = true;
        if (mustMonitor) {
          startMonitoring();
          mustMonitor = false;
        }
      })
      .catch(() => {});

    const startMonitoring = () => {
      const monitor = this.sub([{ids: [id]}], {
        id: `monitor-${id.slice(0, 5)}`,
      });
      const willUnsub = setTimeout(() => {
        (this2.pubListeners[id]?.failed || []).forEach((cb) =>
          cb("event not seen after 5 seconds")
        );
        monitor.unsub();
      }, 5000);
      monitor.on("event", () => {
        clearTimeout(willUnsub);
        (this2.pubListeners[id]?.seen || []).forEach((cb) => cb());
      });
    };

    return {
      on: (type: "ok" | "seen" | "failed", cb: any) => {
        this2.pubListeners[id] = this2.pubListeners[id] || {
          ok: [],
          seen: [],
          failed: [],
        };
        this2.pubListeners[id][type].push(cb);

        if (type === "seen") {
          if (sent) startMonitoring();
          else mustMonitor = true;
        }
      },
      off: (type: "ok" | "seen" | "failed", cb: any) => {
        const listeners = this2.pubListeners[id];
        if (!listeners) return;
        const idx = listeners[type].indexOf(cb);
        if (idx >= 0) listeners[type].splice(idx, 1);
      },
    };
  }

  sub(filters: Filter[], opts: SubscriptionOptions = {}): Sub {
    const this2 = this;
    const subid = opts.id || Math.random().toString().slice(2);
    const skipVerification = opts.skipVerification || false;

    this2.openSubs[subid] = {
      id: subid,
      filters,
      skipVerification,
    };
    if (this2.connected) {
      if (this.logging) {
        console.log("REQ2", this.url, subid, ...filters);
      }
      this2.trySend(["REQ", subid, ...filters]);
    }

    return {
      sub: (newFilters, newOpts = {}) =>
        this.sub(newFilters || filters, {
          skipVerification: newOpts.skipVerification || skipVerification,
          id: subid,
        }),
      unsub: () => {
        delete this2.openSubs[subid];
        delete this2.subListeners[subid];
        if (this2.connected) {
          if (this2.logging) {
            console.log("CLOSE", this.url, subid);
          }
          this2.trySend(["CLOSE", subid]);
        }
      },
      on: (type: "event" | "eose", cb: any): void => {
        this2.subListeners[subid] = this2.subListeners[subid] || {
          event: [],
          eose: [],
        };
        this2.subListeners[subid]![type].push(cb);
      },
      off: (type: "event" | "eose", cb: any): void => {
        const listeners = this2.subListeners[subid];

        if (!listeners) return;

        const idx = listeners[type].indexOf(cb);
        if (idx >= 0) listeners[type].splice(idx, 1);
      },
    };
  }
}
