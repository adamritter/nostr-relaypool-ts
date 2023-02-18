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
import {CallbackReplayer} from "./callback-replayer";

const unique = (arr: string[]) => [...new Set(arr)];

export {type OnEvent} from "./on-event-filters";
export type OnEose = (
  eventsByThisSub: Event[] | undefined,
  url: string,
  minCreatedAt: number
) => void;

export type FilterToSubscribe = [
  onEvent: OnEvent,
  filtersByRelay: Map<string, Filter[]>,
  unsub: {unsubcb?: () => void},
  unsubscribeOnEose?: boolean,
  subscriptionCacheKey?: string,
  maxDelayms?: number
];

export type SubscriptionOptions = {
  allowDuplicateEvents?: boolean;
  allowOlderEvents?: boolean;
  logAllEvents?: boolean;
  unsubscribeOnEose?: boolean;
};

export class RelayPool {
  relayByUrl: Map<string, Relay> = new Map();
  noticecbs: Array<(url: string, msg: string) => void> = [];
  eventCache?: EventCache;
  minMaxDelayms: number = Infinity;
  filtersToSubscribe: FilterToSubscribe[] = [];
  timer?: ReturnType<typeof setTimeout>;
  externalGetEventById?: (id: string) => NostrToolsEventWithId | undefined;
  dontLogSubscriptions?: boolean = false;
  dontAutoReconnect?: boolean = false;
  startTime: number = new Date().getTime();
  keepSignature?: boolean;
  subscriptionCache?: Map<
    string,
    CallbackReplayer<[Event, boolean, string | undefined], OnEvent>
  >;
  skipVerification?: boolean;

  constructor(
    relays?: string[],
    options: {
      noCache?: boolean;
      externalGetEventById?: (id: string) => NostrToolsEventWithId | undefined;
      dontLogSubscriptions?: boolean;
      dontAutoReconnect?: boolean;
      noSubscriptionCache?: boolean;
      keepSignature?: boolean;
      skipVerification?: boolean;
    } = {}
  ) {
    this.externalGetEventById = options.externalGetEventById;
    this.dontLogSubscriptions = options.dontLogSubscriptions;
    this.dontAutoReconnect = options.dontAutoReconnect;
    this.keepSignature = options.keepSignature;
    this.skipVerification = options.skipVerification;
    if (!options.noCache) {
      this.eventCache = new EventCache();
    }
    // Don't enable subscription cache by default yet
    if (options.noSubscriptionCache === false) {
      this.subscriptionCache = new Map();
      console.log("subscription cache enabled");
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
        relayInstance?.on("notice", (msg: string) => {
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

  removeRelay(url: string) {
    const relay = this.relayByUrl.get(url);
    if (relay) {
      relay.close();
      this.relayByUrl.delete(url);
    }
  }

  #subscribeRelay(
    relay: string,
    filters: Filter[],
    onEvent: OnEvent,
    onEose?: OnEose,
    dontStoreEventsBySub?: boolean
  ): Sub | undefined {
    const mergedAndRemovedEmptyFilters =
      mergeSimilarAndRemoveEmptyFilters(filters);
    if (mergedAndRemovedEmptyFilters.length === 0) {
      return;
    }
    const instance = this.addOrGetRelay(relay);
    const sub = instance.sub(mergedAndRemovedEmptyFilters, { skipVerification: this.skipVerification });
    let eventsBySub: Event[] | undefined = [];
    let minCreatedAt = Infinity;
    sub.on("event", (nostrEvent: NostrToolsEventWithId) => {
      if (nostrEvent.created_at < minCreatedAt) {
        minCreatedAt = nostrEvent.created_at;
      }
      let event = new Event(
        nostrEvent,
        this,
        Array.from(this.relayByUrl.keys())
      );
      if (this.keepSignature) {
        event.sig = nostrEvent.sig;
      }
      this.eventCache?.addEvent(event);
      if (onEose && !dontStoreEventsBySub) {
        eventsBySub?.push(event);
      }
      onEvent(event, eventsBySub === undefined, relay);
    });
    sub.on("eose", () => {
      onEose?.(eventsBySub, relay, minCreatedAt);
      eventsBySub = undefined;
    });

    return sub;
  }

  #mergeAndRemoveEmptyFiltersByRelay(
    filtersByRelay: Map<string, Filter[]>
  ): Map<string, Filter[]> {
    const mergedAndRemovedEmptyFiltersByRelay = new Map();
    for (const [relay, filters] of filtersByRelay) {
      const mergedAndRemovedEmptyFilters =
        mergeSimilarAndRemoveEmptyFilters(filters);
      if (mergedAndRemovedEmptyFilters.length > 0) {
        mergedAndRemovedEmptyFiltersByRelay.set(
          relay,
          mergedAndRemovedEmptyFilters
        );
      }
    }
    return mergedAndRemovedEmptyFiltersByRelay;
  }

  #subscribeRelays(
    filtersByRelay: Map<string, Filter[]>,
    onEvent: OnEvent,
    onEose?: OnEose,
    unsub: {unsubcb?: () => void; unsuboneosecb?: () => void} = {},
    minMaxDelayms?: number,
    dontStoreEventsBySub?: boolean
  ): () => void {
    if (filtersByRelay.size === 0) {
      return () => {};
    }
    // Merging here is done to make logging more readable.
    filtersByRelay = this.#mergeAndRemoveEmptyFiltersByRelay(filtersByRelay);
    if (!this.dontLogSubscriptions) {
      console.log(
        "RelayPool at ",
        new Date().getTime() - this.startTime,
        " subscribing to relays, minMaxDelayms=",
        minMaxDelayms,
        filtersByRelay
      );
    }
    const subs: Sub[] = [];
    let unsuboneosecbcalled = false;
    let eoseSubs: Sub[] = [];
    unsub.unsuboneosecb = () => {
      unsuboneosecbcalled = true;
      eoseSubs.forEach((sub) => sub.unsub());
    };
    for (const [relay, filters] of filtersByRelay) {
      let subHolder: {sub?: Sub} = {};
      const subOnEose: OnEose = (events, url, minCreatedAt) => {
        if (onEose) {
          onEose(events, url, minCreatedAt);
        }
        if (unsuboneosecbcalled) {
          subHolder.sub?.unsub();
        } else {
          if (subHolder.sub) {
            eoseSubs.push(subHolder.sub);
          }
        }
      };

      const sub = this.#subscribeRelay(
        relay,
        filters,
        onEvent,
        subOnEose,
        !onEose || dontStoreEventsBySub
      );
      if (sub) {
        subHolder.sub = sub;
        subs.push(sub);
      }
    }
    const allUnsub = () => subs.forEach((sub) => sub.unsub());
    unsub.unsubcb = () => {
      allUnsub();
      delete unsub.unsubcb;
    };
    return allUnsub;
  }

  sendSubscriptions(onEose?: OnEose) {
    clearTimeout(this.timer);
    this.timer = undefined;
    let minMaxDelayms = this.minMaxDelayms;
    this.minMaxDelayms = Infinity;

    const [onEvent, filtersByRelay, unsub]: [
      OnEvent,
      Map<string, Filter[]>,
      {unsubcb?: () => void; unsuboneosecb?: () => void}
    ] = batchFiltersByRelay(this.filtersToSubscribe, this.subscriptionCache);

    let allUnsub = this.#subscribeRelays(
      filtersByRelay,
      onEvent,
      onEose,
      unsub,
      minMaxDelayms // For logging
    );

    return allUnsub;
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
    options: SubscriptionOptions = {}
  ): () => void {
    if (maxDelayms !== undefined && onEose) {
      throw new Error("maxDelayms and onEose cannot be used together");
    }
    let subscriptionCacheKey: string | undefined;
    if (options.unsubscribeOnEose && !onEose) {
      subscriptionCacheKey = JSON.stringify([filters, relays]);
      const cachedSubscription =
        this.subscriptionCache?.get(subscriptionCacheKey);
      if (cachedSubscription) {
        return cachedSubscription.sub(onEvent);
      }
    }
    const [dedupedOnEvent, filtersByRelay] =
      groupFiltersByRelayAndEmitCacheHits(
        filters,
        relays,
        onEvent,
        options,
        this.eventCache
      );
    let unsub: {unsubcb?: () => void} = {unsubcb: () => {}};
    this.filtersToSubscribe.push([
      dedupedOnEvent,
      filtersByRelay,
      unsub,
      options.unsubscribeOnEose,
      subscriptionCacheKey,
      maxDelayms,
    ]);
    if (maxDelayms === undefined) {
      return this.sendSubscriptions(onEose);
    } else {
      this.#resetTimer(maxDelayms);
      return () => {
        unsub.unsubcb?.();
        delete unsub.unsubcb;
      };
    }
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
