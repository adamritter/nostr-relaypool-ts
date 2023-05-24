import type {OnEvent, OnEventObject, RelayPool} from "./relay-pool";
import {type Filter, Kind} from "nostr-tools";
import type {EventObject} from "./event";

export class Author {
  pubkey: string;
  relayPool: RelayPool;
  relays: string[] | undefined;
  constructor(
    relayPool: RelayPool,
    relays: string[] | undefined,
    pubkey: string
  ) {
    this.pubkey = pubkey;
    this.relayPool = relayPool;
    this.relays = relays;
  }

  metaData(cb: (event: EventObject) => void, maxDelayms: number): () => void {
    return this.relayPool.subscribeEventObject(
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
  subscribe(
    filters: Filter[],
    cb: OnEventObject,
    maxDelayms: number
  ): () => void {
    return this.relayPool.subscribeEventObject(
      filters.map((filter) => ({
        authors: [this.pubkey],
        ...filter,
      })),
      this.relays,
      cb,
      maxDelayms
    );
  }

  followsPubkeys(
    cb: (pubkeys: string[]) => void,
    maxDelayms: number
  ): () => void {
    return this.relayPool.subscribeEventObject(
      [
        {
          authors: [this.pubkey],
          kinds: [Kind.Contacts],
        },
      ],
      this.relays,
      (event: EventObject) => {
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
    return this.relayPool.subscribeEventObject(
      [
        {
          authors: [this.pubkey],
          kinds: [Kind.Contacts],
        },
      ],
      this.relays,
      (event: EventObject) => {
        let r: Author[] = [];
        for (const tag of event.tags) {
          if (tag[0] === "p") {
            let relays = this.relays;
            if (tag[1]) {
              relays = [tag[1], ...(this.relays || [])];
            }
            r.push(new Author(this.relayPool, relays, tag[1]));
          }
        }
        cb(r);
      },
      maxDelayms
    );
  }

  secondFollows(
    cb: (pubkeysWithWeight: [string, number][]) => void,
    maxDelayms: number,
    removeDirectFollows = true
  ): () => void {
    return this.followsPubkeys((pubkeys) => {
      let sfollows = new Map<string, number>();
      for (const pubkey of pubkeys) {
        this.relayPool.subscribeEventObject(
          [
            {
              authors: [pubkey],
              kinds: [Kind.Contacts],
            },
          ],
          this.relays,
          (event: EventObject) => {
            let dweight = 1.0 / event.tags.length;
            for (const tag of event.tags) {
              if (tag[0] === "p") {
                let weight = sfollows.get(tag[1]);
                if (weight) {
                  weight += dweight;
                } else {
                  weight = dweight;
                }
                sfollows.set(tag[1], weight);
              }
            }
            if (removeDirectFollows) {
              for (const pubkey of pubkeys) {
                sfollows.delete(pubkey);
              }
            }
            cb(Array.from(sfollows.entries()).sort((a, b) => b[1] - a[1]));
          },
          maxDelayms
        );
      }
    }, maxDelayms);
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

  followers(cb: OnEvent, limit = 100, maxDelayms: number): () => void {
    return this.relayPool.subscribe(
      [
        {
          "#p": [this.pubkey],
          kinds: [Kind.Contacts],
          limit,
        },
      ],
      this.relays,
      cb,
      maxDelayms
    );
  }

  sentAndRecievedDMs(cb: OnEvent, limit = 100, maxDelayms: number): () => void {
    return this.relayPool.subscribe(
      [
        {
          authors: [this.pubkey],
          kinds: [Kind.EncryptedDirectMessage],
          limit,
        },
        {
          "#p": [this.pubkey],
          kinds: [Kind.EncryptedDirectMessage],
          limit,
        },
      ],
      this.relays,
      cb,
      maxDelayms
    );
  }
  text(cb: OnEvent, limit = 100, maxDelayms: number): () => void {
    return this.relayPool.subscribe(
      [
        {
          authors: [this.pubkey],
          kinds: [Kind.Text],
          limit,
        },
      ],
      this.relays,
      cb,
      maxDelayms
    );
  }
}
