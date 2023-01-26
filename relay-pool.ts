import {Filter, getEventHash, Sub} from "nostr-tools";
import {mergeSimilarAndRemoveEmptyFilters} from "./merge-similar-filters";
import {type Relay, relayInit} from "./relay";
import {type OnEvent} from "./on-event-filters";
import {EventCache} from "./event-cache";
import {Event, NostrToolsEvent, NostrToolsEventWithId} from "./event";
import {
  batchFiltersByRelay,
  groupFiltersByRelayAndEmitCacheHits,
} from "./group-filters-by-relay";

const unique = (arr: string[]) => [...new Set(arr)];

export {type OnEvent} from "./on-event-filters";
export type OnEose = (
  eventsByThisSub: Event[] | undefined,
  url: string
) => void;

export class RelayPool {
  relayByUrl: Map<string, Relay> = new Map();
  noticecbs: Array<(url: string, msg: string) => void> = [];
  eventCache?: EventCache;
  minMaxDelayms: number = Infinity;
  filtersToSubscribe: [OnEvent, Map<string, Filter[]>][] = [];
  timer?: ReturnType<typeof setTimeout>;
  externalGetEventById?: (id: string) => NostrToolsEventWithId | undefined;
  dontLogSubscriptions?: boolean = false;
  dontAutoReconnect?: boolean = false;

  constructor(
    relays?: string[],
    options: {
      noCache?: boolean;
      externalGetEventById?: (id: string) => NostrToolsEventWithId | undefined;
      dontLogSubscriptions?: boolean;
      dontAutoReconnect?: boolean;
    } = {}
  ) {
    this.externalGetEventById = options.externalGetEventById;
    this.dontLogSubscriptions = options.dontLogSubscriptions;
    this.dontAutoReconnect = options.dontAutoReconnect;
    if (!options.noCache) {
      this.eventCache = new EventCache();
    }
    if (relays) {
      for (const relay of unique(relays)) {
        this.addOrGetRelay(relay);
      }
    }
  }

  addOrGetRelay(relay: string): Relay {
    const origRelayInstance = this.relayByUrl.get(relay);
    if (origRelayInstance) {
      return origRelayInstance;
    }
    const relayInstance = relayInit(
      relay,
      this.externalGetEventById
        ? this.externalGetEventById
        : this.eventCache
        ? (id) => this.eventCache?.getEventById(id)
        : undefined,
      this.dontAutoReconnect
    );
    this.relayByUrl.set(relay, relayInstance);
    relayInstance.connect().then(
      (onfulfilled) => {
        relayInstance?.on("notice", (relay: string, msg: string) => {
          this.noticecbs.forEach((cb) => cb(relay, msg));
        });
      },
      (onrejected) => {
        console.warn("failed to connect to relay " + relay);
      }
    );
    return relayInstance;
  }

  async close() {
    const promises = [];
    for (const relayInstance of this.relayByUrl.values()) {
      promises.push(relayInstance.close());
    }
    this.relayByUrl.clear();
    return Promise.all(promises);
  }

  #subscribeRelay(
    relay: string,
    filters: Filter[],
    onEvent: OnEvent,
    onEose?: OnEose
  ): Sub | undefined {
    const mergedAndRemovedEmptyFilters =
      mergeSimilarAndRemoveEmptyFilters(filters);
    if (mergedAndRemovedEmptyFilters.length === 0) {
      return;
    }
    const instance = this.addOrGetRelay(relay);
    const sub = instance.sub(mergedAndRemovedEmptyFilters);
    let eventsBySub: Event[] | undefined = [];
    sub.on("event", (nostrEvent: NostrToolsEventWithId) => {
      let event = new Event(
        nostrEvent,
        this,
        Array.from(this.relayByUrl.keys())
      );
      this.eventCache?.addEvent(event);
      eventsBySub?.push(event);
      onEvent(event, eventsBySub === undefined, relay);
    });
    if (onEose) {
      sub.on("eose", () => {
        onEose(eventsBySub, relay);
        eventsBySub = undefined;
      });
    }
    return sub;
  }

  #subscribeRelays(
    filtersByRelay: Map<string, Filter[]>,
    onEvent: OnEvent,
    onEose?: OnEose
  ): () => void {
    if (filtersByRelay.size === 0) {
      return () => {};
    }
    if (!this.dontLogSubscriptions) {
      console.log("RelayPool subscribing to relays", filtersByRelay);
    }
    const subs: Sub[] = [];
    for (const [relay, filters] of filtersByRelay) {
      const sub = this.#subscribeRelay(relay, filters, onEvent, onEose);
      if (sub) {
        subs.push(sub);
      }
    }
    return () => subs.forEach((sub) => sub.unsub());
  }

  sendSubscriptions(onEose?: OnEose) {
    clearTimeout(this.timer);
    this.timer = undefined;
    this.minMaxDelayms = Infinity;

    const [onEvent, filtersByRelay]: [OnEvent, Map<string, Filter[]>] =
      batchFiltersByRelay(this.filtersToSubscribe);
    this.filtersToSubscribe = [];

    return this.#subscribeRelays(filtersByRelay, onEvent, onEose);
  }

  #resetTimer(maxDelayms: number) {
    if (this.minMaxDelayms > maxDelayms) {
      this.minMaxDelayms = maxDelayms;
    }

    clearTimeout(this.timer);
    this.timer = undefined;

    if (this.minMaxDelayms !== Infinity) {
      this.timer = setTimeout(() => {
        this.sendSubscriptions();
      }, this.minMaxDelayms);
    }
  }

  subscribe(
    filters: (Filter & {relay?: string; noCache?: boolean})[],
    relays: string[],
    onEvent: OnEvent,
    maxDelayms?: number,
    onEose?: OnEose,
    options: {allowDuplicateEvents?: boolean; allowOlderEvents?: boolean} = {}
  ): () => void {
    if (maxDelayms && onEose) {
      throw new Error("maxDelayms and onEose cannot be used together");
    }
    const [dedupedOnEvent, filtersByRelay] =
      groupFiltersByRelayAndEmitCacheHits(
        filters,
        relays,
        onEvent,
        options,
        this.eventCache
      );
    this.filtersToSubscribe.push([dedupedOnEvent, filtersByRelay]);
    if (maxDelayms) {
      this.#resetTimer(maxDelayms);
      return () => {};
    }
    return this.sendSubscriptions(onEose);
  }

  async getEventById(
    id: string,
    relays: string[],
    maxDelayms: number
  ): Promise<Event> {
    return new Promise((resolve, reject) => {
      this.subscribe(
        [{ids: [id]}],
        relays,
        (event) => {
          resolve(event);
        },
        maxDelayms
      );
    });
  }

  publish(event: NostrToolsEvent, relays: string[]) {
    const eventWithId = {...event, id: getEventHash(event)};
    for (const relay of unique(relays)) {
      const instance = this.addOrGetRelay(relay);
      instance.publish(eventWithId);
    }
  }

  onnotice(cb: (url: string, msg: string) => void) {
    this.noticecbs.push(cb);
  }

  onerror(cb: (url: string, msg: string) => void) {
    this.relayByUrl.forEach((relay: Relay, url: string) =>
      relay.on("error", (msg: string) => cb(url, msg))
    );
  }
  ondisconnect(cb: (url: string, msg: string) => void) {
    this.relayByUrl.forEach((relay: Relay, url: string) =>
      relay.on("disconnect", (msg: string) => cb(url, msg))
    );
  }
  getRelayStatuses(): [url: string, staus: number][] {
    return Array.from(this.relayByUrl.entries())
      .map(
        ([url, relay]: [string, Relay]) =>
          [url, relay.status] as [string, number]
      )
      .sort();
  }
}
