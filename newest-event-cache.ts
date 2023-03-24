import {Event} from "nostr-tools";
import {RelayPool} from "./relay-pool";

export class NewestEventCache {
  data: Map<string, Event>;
  promises: Map<string, Promise<Event>>;
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

  async get(pubkey: string): Promise<Event> {
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
          if (this.relays.includes(relayUrl)) {
            tries++;
          }
          if (tries === this.relays.length) {
            this.promises.delete(pubkey);
            reject(
              `Can't find data2 for ${pubkey} with kind ${
                this.kind
              } on RelayInfoServers ${this.relays.join(",")}, ${tries} tries`
            );
          }
        }
      );
    });
  }
}
