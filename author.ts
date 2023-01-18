import type {OnEvent, RelayPool} from "./relay-pool";
import {Filter, Kind, type Event} from "nostr-tools";

export class Author {
  pubkey: string;
  relayPool: RelayPool;
  relays: string[];
  constructor(relayPool: RelayPool, relays: string[], pubkey: string) {
    this.pubkey = pubkey;
    this.relayPool = relayPool;
    this.relays = relays;
  }

  metaData(cb: (event: Event) => void, maxDelayms: number): () => void {
    return this.relayPool.subscribe(
      [
        {
          authors: [this.pubkey],
          kinds: [Kind.Metadata],
        },
      ],
      this.relays,
      cb,
      maxDelayms
    );
  }
  subscribe(filter: Filter, cb: OnEvent, maxDelayms: number): () => void {
    return this.relayPool.subscribe(
      [
        {
          authors: [this.pubkey],
          ...filter,
        },
      ],
      this.relays,
      cb,
      maxDelayms
    );
  }

  followsPubkeys(
    cb: (pubkeys: string[]) => void,
    maxDelayms: number
  ): () => void {
    return this.relayPool.subscribe(
      [
        {
          authors: [this.pubkey],
          kinds: [Kind.Contacts],
        },
      ],
      this.relays,
      (event: Event) => {
        let r: string[] = [];
        for (const tag of event.tags) {
          if (tag[0] === "p") {
            r.push(tag[1]);
          }
        }
        cb(r);
      },
      maxDelayms
    );
  }

  // TODO: prioritize relay over other relays for specific authors
  follows(cb: (authors: Author[]) => void, maxDelayms: number): () => void {
    return this.relayPool.subscribe(
      [
        {
          authors: [this.pubkey],
          kinds: [Kind.Contacts],
        },
      ],
      this.relays,
      (event: Event) => {
        let r: Author[] = [];
        for (const tag of event.tags) {
          if (tag[0] === "p") {
            let relays = this.relays;
            if (tag[1]) {
              relays = [tag[1], ...this.relays];
            }
            r.push(new Author(this.relayPool, relays, tag[1]));
          }
        }
        cb(r);
      },
      maxDelayms
    );
  }

  allEvents(cb: OnEvent, limit = 100, maxDelayms: number): () => void {
    return this.relayPool.subscribe(
      [
        {
          authors: [this.pubkey],
          limit,
        },
      ],
      this.relays,
      cb,
      maxDelayms
    );
  }

  referenced(cb: OnEvent, limit = 100, maxDelayms: number): () => void {
    return this.relayPool.subscribe(
      [
        {
          "#p": [this.pubkey],
          limit,
        },
      ],
      this.relays,
      cb,
      maxDelayms
    );
  }
}
