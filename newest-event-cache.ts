import {NostrToolsEventWithId} from "./event";
import {RelayPool} from "./relay-pool";

export class NewestEventCache {
  data: Map<string, NostrToolsEventWithId>;
  promises: Map<string, Promise<NostrToolsEventWithId>>;
  relays: string[];
  kind: number;
  relayPool: RelayPool;
  constructor(kind: number, relayPool: RelayPool, relays?: string[]) {
    this.data = new Map();
    this.promises = new Map();
    this.kind = kind;
    this.relayPool = relayPool;
    this.relays = relays || ["wss://us.rbr.bio", "wss://eu.rbr.bio"];
  }

  async get(pubkey: string): Promise<NostrToolsEventWithId> {
    let value = this.data.get(pubkey);
    if (value) {
      return Promise.resolve(value);
    }
    const promise = this.promises.get(pubkey);
    if (promise) {
      return promise;
    }
    return new Promise((resolve, reject) => {
      let tries = 0;
      this.relayPool.subscribe(
        [{kinds: [this.kind], authors: [pubkey]}],
        this.relays,
        (event) => {
          // @ts-ignore
          this.data.set(pubkey, event);
          this.promises.delete(pubkey);
          // @ts-ignore
          resolve(event);
        },
        undefined,
        (relayUrl) => {
          tries++;
          if (tries === this.relays.length) {
            reject();
          }
        }
      );
    });
  }
}
