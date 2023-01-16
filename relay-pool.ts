import {Event, Filter, Sub} from "nostr-tools";
import {mergeSimilarAndRemoveEmptyFilters} from "./merge-similar-filters";
import {type Relay, relayInit} from "./relay";
import {
  doNotEmitDuplicateEvents,
  doNotEmitOlderEvents,
  matchOnEventFilters,
  type OnEvent,
} from "./on-event-filters";
import {EventCache} from "./event-cache";

let unique = (arr: string[]) => [...new Set(arr)];

function withoutRelay(filter: Filter & {relay?: string}): Filter {
  filter = {...filter};
  delete filter.relay;
  return filter;
}

type OnEose = (
  eventsByThisSub: (Event & {id: string})[] | undefined,
  url: string
) => void;

export class RelayPool {
  relayByUrl: Map<string, Relay>;
  noticecbs: Array<(msg: string) => void>;
  eventCache?: EventCache;
  minMaxDelayms?: number;
  constructor(relays?: string[], options: {noCache?: boolean} = {}) {
    if (!options.noCache) {
      this.eventCache = new EventCache();
    }
    this.relayByUrl = new Map();
    this.noticecbs = [];
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

  #getFiltersByRelay(
    filters: (Filter & {relay?: string})[],
    relays: string[]
  ): Map<string, Filter[]> {
    let filtersByRelay = new Map<string, Filter[]>();
    let filtersWithoutRelay: Filter[] = [];
    for (let filter of filters) {
      let relay = filter.relay;
      if (relay) {
        let relayFilters = filtersByRelay.get(relay);
        if (relayFilters) {
          relayFilters.push(withoutRelay(filter));
        } else {
          filtersByRelay.set(relay, [withoutRelay(filter)]);
        }
      } else {
        filtersWithoutRelay.push(filter);
      }
    }
    if (filtersWithoutRelay.length > 0) {
      for (let relay of relays) {
        let filters = filtersByRelay.get(relay);
        if (filters) {
          filtersByRelay.set(relay, filters.concat(filtersWithoutRelay));
        } else {
          filtersByRelay.set(relay, filtersWithoutRelay);
        }
      }
    }
    return filtersByRelay;
  }

  #handleSubscription(
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

  #handleFiltersByRelay(
    filtersByRelay: Map<string, Filter[]>,
    onEvent: OnEvent,
    onEose?: OnEose
  ): Sub[] {
    let subs = [];
    for (let [relay, filters] of filtersByRelay) {
      let sub = this.#handleSubscription(relay, filters, onEvent, onEose);
      if (sub) {
        subs.push(sub);
      }
    }
    return subs;
  }

  #getCachedDeduplicatedFiltersByRelay(
    filters: (Filter & {relay?: string; noCache?: boolean})[],
    relays: string[],
    onEvent: OnEvent,
    options: {allowDuplicateEvents?: boolean; allowOlderEvents?: boolean} = {}
  ): [OnEvent, Map<string, Filter[]>] {
    let events: (Event & {id: string})[] = [];
    if (this.eventCache) {
      let cachedEventsWithUpdatedFilters =
        this.eventCache.getCachedEventsWithUpdatedFilters(filters, relays);
      filters = cachedEventsWithUpdatedFilters.filters;
      events = cachedEventsWithUpdatedFilters.events;
    }
    if (!options.allowDuplicateEvents) {
      onEvent = doNotEmitDuplicateEvents(onEvent);
    }
    if (!options.allowOlderEvents) {
      onEvent = doNotEmitOlderEvents(onEvent);
    }
    for (let event of events) {
      onEvent(event, false, undefined);
    }
    filters = mergeSimilarAndRemoveEmptyFilters(filters);
    onEvent = matchOnEventFilters(onEvent, filters);
    relays = unique(relays);
    let filtersByRelay = this.#getFiltersByRelay(filters, relays);
    return [onEvent, filtersByRelay];
  }

  filtersToSubscribe: [OnEvent, Map<string, Filter[]>][] = [];
  timer?: ReturnType<typeof setTimeout>;

  sendSubscriptions(onEose?: OnEose) {
    let filtersByRelay = new Map<string, Filter[]>();
    let onEvents: OnEvent[] = [];
    for (let [onEvent, filtersByRelayBySub] of this.filtersToSubscribe) {
      for (let [relay, filters] of filtersByRelayBySub) {
        let filtersByRelayFilters = filtersByRelay.get(relay);
        if (filtersByRelayFilters) {
          filtersByRelay.set(relay, filtersByRelayFilters.concat(filters));
        } else {
          filtersByRelay.set(relay, filters);
        }
      }
      onEvents.push(onEvent);
    }
    this.filtersToSubscribe = [];
    this.timer = undefined;
    let subs: Sub[] = this.#handleFiltersByRelay(
      filtersByRelay,
      (event, afterEose, url) => {
        for (let onEvent of onEvents) {
          onEvent(event, afterEose, url);
        }
      },
      onEose
    );
    return () => {
      for (let sub of subs) {
        sub.unsub();
      }
    };
  }

  #resetTimer(maxDelayms: number) {
    if ((this.minMaxDelayms || Infinity) > maxDelayms) {
      this.minMaxDelayms = maxDelayms;
    }
    if (this.timer) {
      clearTimeout(this.timer);
    }
    if (this.minMaxDelayms && this.minMaxDelayms !== Infinity) {
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
    let [dedupedOnEvent, filtersByRelay] =
      this.#getCachedDeduplicatedFiltersByRelay(
        filters,
        relays,
        onEvent,
        options
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
