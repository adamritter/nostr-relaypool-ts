// Currently it's just a copy of the Relay code from-nostr tools with a modification
// to allow sub/unsub and publishing before connection is established.
// It needs heavy refactoring and more unit tests to get into a maintainable state.

import {type Event, verifySignature, validateEvent} from "nostr-tools";
import {type Filter, matchFilters} from "nostr-tools";
import WebSocket from "isomorphic-ws";

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
export function relayInit(url: string): Relay {
  return new RelayC(url).relayInit();
}
class RelayC {
  url: string;
  constructor(url: string) {
    this.url = url;
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
    let msg = JSON.stringify(params);

    if (this.connected) {
      this.ws?.send(msg);
    } else {
      this.sendOnConnect.push(msg);
    }
  }
  resolveClose: (() => void) | undefined = undefined;

  relayInit(): Relay {
    let this2 = this;
    let ws = this.ws;
    var pubListeners = this.pubListeners;

    async function connectRelay(): Promise<void> {
      return new Promise((resolve, reject) => {
        ws = new WebSocket(this2.url);
        this2.ws = ws;

        ws.onopen = () => {
          if (this2.resolveClose) {
            this2.resolveClose();
            return;
          }
          this2.connected = true;
          // TODO: Send ephereal messages after subscription, permament before
          for (let subid in this2.openSubs) {
            this2.trySend(["REQ", subid, ...this2.openSubs[subid].filters]);
          }
          for (let msg of this2.sendOnConnect) {
            ws?.send(msg);
          }
          this2.sendOnConnect = [];

          this2.listeners.connect.forEach((cb) => cb());
          resolve();
        };
        ws.onerror = () => {
          this2.listeners.error.forEach((cb) => cb());
          reject();
        };
        ws.onclose = async () => {
          this2.connected = false;
          this2.listeners.disconnect.forEach((cb) => cb());
          this2.resolveClose && this2.resolveClose();
        };

        ws.onmessage = async (e) => {
          var data;
          try {
            data = JSON.parse(e.data.toString());
          } catch (err) {
            data = e.data;
          }

          if (data.length >= 1) {
            switch (data[0]) {
              case "EVENT":
                if (data.length !== 3) return; // ignore empty or malformed EVENT

                let id = data[1];
                let event = data[2];
                if (
                  validateEvent(event) &&
                  this2.openSubs[id] &&
                  (this2.openSubs[id].skipVerification ||
                    verifySignature(event)) &&
                  matchFilters(this2.openSubs[id].filters, event)
                ) {
                  this2.openSubs[id];
                  (this2.subListeners[id]?.event || []).forEach((cb) =>
                    cb(event)
                  );
                }
                return;
              case "EOSE": {
                if (data.length !== 2) return; // ignore empty or malformed EOSE
                let id = data[1];
                (this2.subListeners[id]?.eose || []).forEach((cb) => cb());
                return;
              }
              case "OK": {
                if (data.length < 3) return; // ignore empty or malformed OK
                let id: string = data[1];
                let ok: boolean = data[2];
                let reason: string = data[3] || "";
                if (ok) pubListeners[id]?.ok.forEach((cb) => cb());
                else pubListeners[id]?.failed.forEach((cb) => cb(reason));
                return;
              }
              case "NOTICE":
                if (data.length !== 2) return; // ignore empty or malformed NOTICE
                let notice = data[1];
                this2.listeners.notice.forEach((cb) => cb(notice));
                return;
            }
          }
        };
      });
    }

    async function connect(): Promise<void> {
      if (ws?.readyState && ws.readyState === 1) return; // ws already open
      await connectRelay();
    }

    const sub = (
      filters: Filter[],
      {
        skipVerification = false,
        id = Math.random().toString().slice(2),
      }: SubscriptionOptions = {}
    ): Sub => {
      let subid = id;

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
          let listeners = this2.subListeners[subid];
          let idx = listeners[type].indexOf(cb);
          if (idx >= 0) listeners[type].splice(idx, 1);
        },
      };
    };

    return {
      url: this2.url,
      sub,
      on: (type: RelayEvent, cb: any): void => {
        this2.listeners[type].push(cb);
        if (type === "connect" && ws?.readyState === 1) {
          cb();
        }
      },
      off: (type: RelayEvent, cb: any): void => {
        let index = this2.listeners[type].indexOf(cb);
        if (index !== -1) this2.listeners[type].splice(index, 1);
      },
      publish(event: Event): Pub {
        if (!event.id) throw new Error(`event ${event} has no id`);
        let id = event.id;

        var sent = false;
        var mustMonitor = false;

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
          let monitor = sub([{ids: [id]}], {
            id: `monitor-${id.slice(0, 5)}`,
          });
          let willUnsub = setTimeout(() => {
            (pubListeners[id]?.failed || []).forEach((cb) =>
              cb("event not seen after 5 seconds")
            );
            monitor.unsub();
          }, 5000);
          monitor.on("event", () => {
            clearTimeout(willUnsub);
            (pubListeners[id]?.seen || []).forEach((cb) => cb());
          });
        };

        return {
          on: (type: "ok" | "seen" | "failed", cb: any) => {
            pubListeners[id] = pubListeners[id] || {
              ok: [],
              seen: [],
              failed: [],
            };
            pubListeners[id][type].push(cb);

            if (type === "seen") {
              if (sent) startMonitoring();
              else mustMonitor = true;
            }
          },
          off: (type: "ok" | "seen" | "failed", cb: any) => {
            let listeners = pubListeners[id];
            if (!listeners) return;
            let idx = listeners[type].indexOf(cb);
            if (idx >= 0) listeners[type].splice(idx, 1);
          },
        };
      },
      connect,
      close(): Promise<void> {
        if (this2.connected) {
          ws?.close();
        }
        return new Promise<void>((resolve) => {
          this2.resolveClose = resolve;
        });
      },
      get status() {
        return ws?.readyState ?? 3;
      },
    };
  }
}
