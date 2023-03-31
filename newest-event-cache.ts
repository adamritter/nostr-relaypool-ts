import {Event, Filter} from "nostr-tools";
import {RelayPool} from "./relay-pool";

export class NewestEventCache {
  data: Map<string, Event>;
  promises: Map<string, Promise<Event>>;
  relays: string[];
  kind: number;
  relayPool: RelayPool;
  useps: boolean;
  constructor(
    kind: number,
    relayPool: RelayPool,
    relays?: string[],
    useps?: boolean
  ) {
    this.data = new Map();
    this.promises = new Map();
    this.kind = kind;
    this.relayPool = relayPool;
    this.relays = relays || ["wss://us.rbr.bio", "wss://eu.rbr.bio"];
    this.useps = useps || false;
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
      const filter: Filter = this.useps
        ? {kinds: [this.kind], "#p": [pubkey]}
        : {kinds: [this.kind], authors: [pubkey]};
      this.relayPool.subscribe(
        [filter],
        this.relays,
        (event) => {
          this.data.set(pubkey, event);
          this.promises.delete(pubkey);
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
