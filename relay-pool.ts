import {Event, Filter, Sub} from "nostr-tools";
import {mergeSimilarAndRemoveEmptyFilters} from "./merge-similar-filters";
import {type Relay, relayInit} from "./relay";
import {type OnEvent} from "./on-event-filters";
import {EventCache} from "./event-cache";
import {
  batchFiltersByRelay,
  groupFiltersByRelayAndEmitCacheHits,
} from "./group-filters-by-relay";

let unique = (arr: string[]) => [...new Set(arr)];

type OnEose = (
  eventsByThisSub: (Event & {id: string})[] | undefined,
  url: string
) => void;

export class RelayPool {
  relayByUrl: Map<string, Relay> = new Map();
  noticecbs: Array<(msg: string) => void> = [];
  eventCache?: EventCache;
  minMaxDelayms: number = Infinity;
  filtersToSubscribe: [OnEvent, Map<string, Filter[]>][] = [];
  timer?: ReturnType<typeof setTimeout>;

  constructor(relays?: string[], options: {noCache?: boolean} = {}) {
    if (!options.noCache) {
      this.eventCache = new EventCache();
    }
    if (relays) {
      for (let relay of unique(relays)) {
        this.addOrGetRelay(relay);
      }
    }
  }

  addOrGetRelay(relay: string): Relay {
    let relayInstance = this.relayByUrl.get(relay);
    if (relayInstance) {
      return relayInstance;
    }
    relayInstance = relayInit(relay);
    this.relayByUrl.set(relay, relayInstance);
    relayInstance.connect().then(
      (onfulfilled) => {
        relayInstance?.on("notice", (msg: string) => {
          this.noticecbs.forEach((cb) => cb(relay + ": " + msg));
        });
      },
      (onrejected) => {
        console.warn("failed to connect to relay " + relay);
      }
    );
    return relayInstance;
  }

  async close() {
    let promises = [];
    for (let relayInstance of this.relayByUrl.values()) {
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
    let mergedAndRemovedEmptyFilters =
      mergeSimilarAndRemoveEmptyFilters(filters);
    if (mergedAndRemovedEmptyFilters.length === 0) {
      return;
    }
    let instance = this.addOrGetRelay(relay);
    let sub = instance.sub(mergedAndRemovedEmptyFilters);
    let eventsBySub: (Event & {id: string})[] | undefined = [];
    sub.on("event", (event: Event & {id: string}) => {
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
    let subs: Sub[] = [];
    for (let [relay, filters] of filtersByRelay) {
      let sub = this.#subscribeRelay(relay, filters, onEvent, onEose);
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

    let [onEvent, filtersByRelay]: [OnEvent, Map<string, Filter[]>] =
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
    let [dedupedOnEvent, filtersByRelay] = groupFiltersByRelayAndEmitCacheHits(
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
  ): Promise<Event & {id: string}> {
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

  publish(event: Event, relays: string[]) {
    for (let relay of unique(relays)) {
      let instance = this.addOrGetRelay(relay);
      instance.publish(event);
    }
  }
  onnotice(cb: (msg: string) => void) {
    this.noticecbs.push(cb);
  }
  onerror(cb: (msg: string) => void) {
    this.relayByUrl.forEach((relay: Relay, url: string) =>
      relay.on("error", (msg: string) => cb(url + ": " + msg))
    );
  }
  ondisconnect(cb: (msg: string) => void) {
    this.relayByUrl.forEach((relay: Relay, url: string) =>
      relay.on("disconnect", (msg: string) => cb(url + ": " + msg))
    );
  }
}
