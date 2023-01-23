// allows sub/unsub and publishing before connection is established.
// Much more refactoring is needed
// Don't rely on Relay interface, it will change (I'll probably delete a lot of code from here, there's no need for
// multiple listeners)

import {type Event, verifySignature, validateEvent} from "nostr-tools";
import {type Filter, matchFilters} from "nostr-tools";
import WebSocket from "isomorphic-ws";
import {getHex64} from "./fakejson";

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
  alreadyHaveEvent?: (id: string) => boolean
): Relay {
  return new RelayC(url, alreadyHaveEvent).relayInit();
}
class RelayC {
  url: string;
  alreadyHaveEvent?: (id: string) => boolean;
  constructor(url: string, alreadyHaveEvent?: (id: string) => boolean) {
    this.url = url;
    this.alreadyHaveEvent = alreadyHaveEvent;
  }
  ws: WebSocket | undefined;
  sendOnConnect: string[] = [];
  openSubs: {[id: string]: {filters: Filter[]} & SubscriptionOptions} = {};
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
    [subid: string]: {
      event: Array<(event: Event) => void>;
      eose: Array<() => void>;
    };
  } = {};
  pubListeners: {
    [eventid: string]: {
      ok: Array<() => void>;
      seen: Array<() => void>;
      failed: Array<(reason: string) => void>;
    };
  } = {};
  connected: boolean = false;

  async trySend(params: [string, ...any]) {
    const msg = JSON.stringify(params);

    if (this.connected) {
      this.ws?.send(msg);
    } else {
      this.sendOnConnect.push(msg);
    }
  }
  resolveClose: (() => void) | undefined = undefined;

  async onclose() {
    this.connected = false;
    this.listeners.disconnect.forEach((cb) => cb());
    this.resolveClose && this.resolveClose();
  }

  async onmessage(e: any) {
    const this2 = this;
    let data;
    let json: string = e.data.toString();
    if (
      !json ||
      (this.alreadyHaveEvent && this.alreadyHaveEvent(getHex64(json, "id")))
    ) {
      return;
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
            this2.openSubs[id] &&
            (this2.openSubs[id].skipVerification || verifySignature(event)) &&
            matchFilters(this2.openSubs[id].filters, event)
          ) {
            this2.openSubs[id];
            (this2.subListeners[id]?.event || []).forEach((cb) => cb(event));
          }
          return;
        case "EOSE": {
          if (data.length !== 2) return; // ignore empty or malformed EOSE
          const id = data[1];
          (this2.subListeners[id]?.eose || []).forEach((cb) => cb());
          return;
        }
        case "OK": {
          if (data.length < 3) return; // ignore empty or malformed OK
          const id: string = data[1];
          const ok: boolean = data[2];
          const reason: string = data[3] || "";
          if (ok) this2.pubListeners[id]?.ok.forEach((cb) => cb());
          else this2.pubListeners[id]?.failed.forEach((cb) => cb(reason));
          return;
        }
        case "NOTICE":
          if (data.length !== 2) return; // ignore empty or malformed NOTICE
          const notice = data[1];
          this2.listeners.notice.forEach((cb) => cb(notice));
          return;
      }
    }
  }
  onopen(opened: () => void) {
    const this2 = this;
    if (this2.resolveClose) {
      this2.resolveClose();
      return;
    }
    this2.connected = true;
    // TODO: Send ephereal messages after subscription, permament before
    for (const subid in this2.openSubs) {
      this2.trySend(["REQ", subid, ...this2.openSubs[subid].filters]);
    }
    for (const msg of this2.sendOnConnect) {
      this.ws?.send(msg);
    }
    this2.sendOnConnect = [];

    this2.listeners.connect.forEach((cb) => cb());
    opened();
  }

  async connectRelay(): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.url);
      this.ws = ws;

      ws.onopen = this.onopen.bind(this, resolve);
      ws.onerror = () => {
        this.listeners.error.forEach((cb) => cb());
        reject();
      };
      ws.onclose = this.onclose.bind(this);
      ws.onmessage = this.onmessage.bind(this);
    });
  }

  async connect(): Promise<void> {
    if (this.ws?.readyState && this.ws.readyState === 1) return; // ws already open
    await this.connectRelay();
  }

  getSub() {
    const this2 = this;
    const sub = (
      filters: Filter[],
      {
        skipVerification = false,
        id = Math.random().toString().slice(2),
      }: SubscriptionOptions = {}
    ): Sub => {
      const subid = id;

      this2.openSubs[subid] = {
        id: subid,
        filters,
        skipVerification,
      };
      if (this2.connected) {
        this2.trySend(["REQ", subid, ...filters]);
      }

      return {
        sub: (newFilters, newOpts = {}) =>
          sub(newFilters || filters, {
            skipVerification: newOpts.skipVerification || skipVerification,
            id: subid,
          }),
        unsub: () => {
          delete this2.openSubs[subid];
          delete this2.subListeners[subid];
          if (this2.connected) {
            this2.trySend(["CLOSE", subid]);
          }
        },
        on: (type: "event" | "eose", cb: any): void => {
          this2.subListeners[subid] = this2.subListeners[subid] || {
            event: [],
            eose: [],
          };
          this2.subListeners[subid][type].push(cb);
        },
        off: (type: "event" | "eose", cb: any): void => {
          const listeners = this2.subListeners[subid];
          const idx = listeners[type].indexOf(cb);
          if (idx >= 0) listeners[type].splice(idx, 1);
        },
      };
    };
    return sub;
  }

  relayInit(): Relay {
    const this2 = this;
    const sub = this.getSub();
    return {
      url: this2.url,
      sub,
      on: (type: RelayEvent, cb: any): void => {
        this2.listeners[type].push(cb);
        if (type === "connect" && this2.ws?.readyState === 1) {
          cb();
        }
      },
      off: (type: RelayEvent, cb: any): void => {
        const index = this2.listeners[type].indexOf(cb);
        if (index !== -1) this2.listeners[type].splice(index, 1);
      },
      publish(event: Event): Pub {
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
          const monitor = sub([{ids: [id]}], {
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
      },
      connect: this2.connect.bind(this2),
      close(): Promise<void> {
        if (this2.connected) {
          this2.ws?.close();
        }
        return new Promise<void>((resolve) => {
          this2.resolveClose = resolve;
        });
      },
      get status() {
        return this2.ws?.readyState ?? 3;
      },
    };
  }
}
