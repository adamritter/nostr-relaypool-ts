import {Event as NostrToolsEvent, Kind} from "nostr-tools";
import {Author} from "./author";
import {RelayPool} from "./relay-pool";

export type {NostrToolsEvent};
export type NostrToolsEventWithId = NostrToolsEvent & {id: string};
import type {OnEvent} from "./on-event-filters";
export class Event implements NostrToolsEventWithId {
  id: string;
  kind: Kind;
  pubkey: string;
  tags: string[][];
  created_at: number;
  content: string;
  relayPool: RelayPool;
  relays: string[];
  sig?: string;

  constructor(
    event: NostrToolsEvent & {id: string},
    relayPool: RelayPool,
    relays: string[]
  ) {
    this.id = event.id;
    this.kind = event.kind;
    this.pubkey = event.pubkey;
    this.tags = event.tags;
    this.created_at = event.created_at;
    this.content = event.content;
    this.relayPool = relayPool;
    this.relays = relays;
  }

  referencedAuthors(): Author[] {
    const r: Author[] = [];
    for (const tag of this.tags) {
      if (tag[0] === "p") {
        r.push(new Author(this.relayPool, this.relays, tag[1]));
      }
    }
    return r;
  }
  referencedEvents(maxDelayms: number): Promise<Event>[] {
    const r: Promise<Event>[] = [];
    for (const tag of this.tags) {
      if (tag[0] === "e") {
        let relays = this.relays;
        if (tag[2]) {
          relays = [tag[2], ...relays];
        }
        r.push(
          this.relayPool
            .getEventById(tag[1], relays, maxDelayms)
            .then((e) => new Event(e, this.relayPool, this.relays))
        );
      }
    }
    return r;
  }

  thread(cb: OnEvent, maxDelayms: number): () => void {
    let relays = this.relays;
    let ids: string[] = [];
    for (const tag of this.tags) {
      if (tag[0] === "e") {
        if (tag[2]) {
          relays = [tag[2], ...relays];
        }
        ids.push(tag[1]);
      }
    }

    return this.relayPool.subscribe(
      [{ids}, {"#e": ids}],
      relays,
      cb,
      maxDelayms
    );
  }
}
