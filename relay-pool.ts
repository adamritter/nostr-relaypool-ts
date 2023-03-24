import {Filter, Sub, Event} from "nostr-tools";
import {mergeSimilarAndRemoveEmptyFilters} from "./merge-similar-filters";
import {type Relay, relayInit} from "./relay";
import {OnEventObject, type OnEvent} from "./on-event-filters";
import {EventCache} from "./event-cache";
import {EventObject} from "./event";
import {
  batchFiltersByRelay,
  groupFiltersByRelayAndEmitCacheHits,
} from "./group-filters-by-relay";
import {CallbackReplayer} from "./callback-replayer";
import {WriteRelaysPerPubkey} from "./write-relays";
import {NewestEventCache} from "./newest-event-cache";

const unique = (arr: string[]) => [...new Set(arr)];

export {type OnEvent, type OnEventObject} from "./on-event-filters";
export type OnEose = (relayUrl: string, minCreatedAt: number) => void;
export type OnEventAndMetadata = (event: Event, metadata: Event) => void;
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
  externalGetEventById?: (id: string) => Event | undefined;
  logSubscriptions?: boolean = false;
  dontAutoReconnect?: boolean = false;
  startTime: number = new Date().getTime();
  deleteSignatures?: boolean;
  subscriptionCache?: Map<
    string,
    CallbackReplayer<[Event, boolean, string | undefined], OnEvent>
  >;
  skipVerification?: boolean;
  writeRelays: WriteRelaysPerPubkey;
  metadataCache: NewestEventCache;
  contactListCache: NewestEventCache;

  constructor(
    relays?: string[],
    options: {
      useEventCache?: boolean;
      externalGetEventById?: (id: string) => Event | undefined;
      logSubscriptions?: boolean;
      dontAutoReconnect?: boolean;
      subscriptionCache?: boolean;
      deleteSignatures?: boolean;
      skipVerification?: boolean;
    } = {}
  ) {
    this.externalGetEventById = options.externalGetEventById;
    this.logSubscriptions = options.logSubscriptions;
    this.dontAutoReconnect = options.dontAutoReconnect;
    this.deleteSignatures = options.deleteSignatures;
    this.skipVerification = options.skipVerification;
    this.writeRelays = new WriteRelaysPerPubkey();
    this.metadataCache = new NewestEventCache(0, this);
    this.contactListCache = new NewestEventCache(3, this);
    if (options.useEventCache) {
      this.eventCache = new EventCache();
    }
    if (options.subscriptionCache) {
      this.subscriptionCache = new Map();
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
    eventIds?: Set<string>
  ): Sub | undefined {
    const mergedAndRemovedEmptyFilters =
      mergeSimilarAndRemoveEmptyFilters(filters);
    if (mergedAndRemovedEmptyFilters.length === 0) {
      return;
    }
    const instance = this.addOrGetRelay(relay);
    const sub = instance.sub(mergedAndRemovedEmptyFilters, {
      skipVerification: this.skipVerification,
      eventIds,
    });
    let afterEose = false;
    let minCreatedAt = Infinity;
    sub.on("event", (nostrEvent: Event) => {
      if (nostrEvent.created_at < minCreatedAt) {
        minCreatedAt = nostrEvent.created_at;
      }
      let event = nostrEvent;
      if (!this.deleteSignatures) {
        event.sig = nostrEvent.sig;
      }
      this.eventCache?.addEvent(event);
      onEvent(event, afterEose, relay);
    });
    sub.on("eose", () => {
      onEose?.(relay, minCreatedAt);
      afterEose = true;
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
    minMaxDelayms?: number
  ): () => void {
    if (filtersByRelay.size === 0) {
      return () => {};
    }
    // Merging here is done to make logging more readable.
    filtersByRelay = this.#mergeAndRemoveEmptyFiltersByRelay(filtersByRelay);
    if (this.logSubscriptions) {
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
      const subOnEose: OnEose = (url, minCreatedAt) => {
        if (onEose) {
          onEose(url, minCreatedAt);
        }
        if (unsuboneosecbcalled) {
          subHolder.sub?.unsub();
        } else {
          if (subHolder.sub) {
            eoseSubs.push(subHolder.sub);
          }
        }
      };

      const eventIds = new Set<string>();

      const sub = this.#subscribeRelay(
        relay,
        filters,
        onEvent,
        subOnEose,
        eventIds
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

  async #getRelaysAndSubscribe(
    filters: (Filter & {relay?: string; noCache?: boolean})[],
    onEvent: OnEvent,
    maxDelayms?: number,
    onEose?: OnEose,
    options: SubscriptionOptions = {}
  ) {
    const allAuthors: Set<string> = new Set();
    for (const filter of filters) {
      if (!filter.authors) {
        throw new Error(
          "Authors must be specified if no relays are subscribed"
        );
      }
      for (const author of filter.authors) {
        allAuthors.add(author);
      }
    }
    const promises = [];
    const allAuthorsArray = [];
    for (const author of allAuthors) {
      promises.push(this.writeRelays?.get(author));
      allAuthorsArray.push(author);
    }
    const allRelays: Set<string> = new Set();
    let i = 0;
    for (const promise of promises) {
      const author = allAuthorsArray[i];
      i += 1;
      let relays = await promise;
      if (!Array.isArray(relays)) {
        console.error("Couldn't load relays for author ", author);
        continue;
      }
      for (let relay of relays) {
        allRelays.add(relay);
      }
    }
    return this.subscribe(
      filters,
      Array.from(allRelays),
      onEvent,
      maxDelayms,
      onEose,
      options
    );
  }

  subscribeEventObject(
    filters: (Filter & {relay?: string; noCache?: boolean})[],
    relays: string[] | undefined,
    onEventObject: OnEventObject,
    maxDelayms?: number,
    onEose?: OnEose,
    options: SubscriptionOptions = {}
  ): () => void {
    return this.subscribe(filters, relays, (event, afterEose, url) =>
      onEventObject(new EventObject(event, this, relays), afterEose, url)
    );
  }

  subscribe(
    filters: (Filter & {relay?: string; noCache?: boolean})[],
    relays: string[] | undefined,
    onEvent: OnEvent,
    maxDelayms?: number,
    onEose?: OnEose,
    options: SubscriptionOptions = {}
  ): () => void {
    if (maxDelayms !== undefined && onEose) {
      throw new Error("maxDelayms and onEose cannot be used together");
    }
    if (relays === undefined) {
      const promise = this.#getRelaysAndSubscribe(
        filters,
        onEvent,
        maxDelayms,
        onEose,
        options
      );
      return () => {
        promise.then((x) => {
          x();
        });
      };
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
    if (
      maxDelayms === undefined &&
      onEose &&
      this.filtersToSubscribe.length > 0
    ) {
      this.sendSubscriptions(); // onEose is not yet supported for batched subscriptions
    }
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

  async getEventObjectById(
    id: string,
    relays: string[],
    maxDelayms: number
  ): Promise<EventObject> {
    return this.getEventById(id, relays, maxDelayms).then(
      (event) => new EventObject(event, this, relays)
    );
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
        maxDelayms,
        undefined
        // {unsubscribeOnEose: true}
      );
    });
  }

  publish(event: Event, relays: string[]) {
    for (const relay of unique(relays)) {
      const instance = this.addOrGetRelay(relay);
      instance.publish(event);
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
  setWriteRelaysForPubKey(pubkey: string, writeRelays: string[]) {
    this.writeRelays.data.set(pubkey, writeRelays);
  }
  setCachedMetadata(pubkey: string, metadata: Event) {
    this.metadataCache.data.set(pubkey, metadata);
  }
  setCachedContactList(pubkey: string, contactList: Event) {
    this.contactListCache.data.set(pubkey, contactList);
  }

  subscribeReferencedEvents(
    event: Event,
    onEvent: OnEvent,
    maxDelayms?: number,
    onEose?: OnEose,
    options: SubscriptionOptions = {}
  ): () => void {
    let ids: string[] = [];
    let authors: string[] = [];

    for (const tag of event.tags) {
      if (tag[0] === "p") {
        const pubkey = tag[1];
        if (pubkey.length !== 64) {
          console.log("bad pubkey", pubkey, tag);
          continue;
        }
        authors.push(pubkey);
      }
      if (tag[0] === "e") {
        const id = tag[1];
        ids.push(id);
      }
    }
    if (ids.length === 0) {
      return () => {};
    }
    if (authors.length === 0) {
      console.error("No authors for ids in event", event);
      return () => {};
    }
    return this.subscribe(
      [{ids, authors}],
      undefined,
      onEvent,
      maxDelayms,
      onEose,
      options
    );
  }

  fetchAndCacheMetadata(pubkey: string): Promise<Event> {
    return this.metadataCache.get(pubkey);
  }

  fetchAndCacheContactList(pubkey: string): Promise<Event> {
    return this.contactListCache.get(pubkey);
  }

  subscribeReferencedEventsAndPrefetchMetadata(
    event: Event,
    onEvent: OnEvent,
    maxDelayms?: number,
    onEose?: OnEose,
    options: SubscriptionOptions = {}
  ): () => void {
    for (const tag of event.tags) {
      if (tag[0] === "p") {
        const pubkey = tag[1];
        if (pubkey.length !== 64) {
          console.log("bad pubkey", pubkey, tag);
          continue;
        }
        this.fetchAndCacheMetadata(pubkey);
      }
    }
    return this.subscribeReferencedEvents(
      event,
      onEvent,
      maxDelayms,
      onEose,
      options
    );
  }
}
