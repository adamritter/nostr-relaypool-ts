import type {Filter, Event} from "nostr-tools";
import {mergeSimilarAndRemoveEmptyFilters} from "./merge-similar-filters";
import {type Relay, relayInit, type Sub} from "./relay";
import type {OnEventObject, OnEvent} from "./on-event-filters";
import {EventCache} from "./event-cache";
import {EventObject} from "./event";
import {
  batchFiltersByRelay,
  groupFiltersByRelayAndEmitCacheHits,
} from "./group-filters-by-relay";
import type {CallbackReplayer} from "./callback-replayer";
import {NewestEventCache} from "./newest-event-cache";
import {SubscriptionFilterStateCache} from "./subscription-filter-state-cache";

const unique = (arr: string[]) => [...new Set(arr)];

export {type OnEvent, type OnEventObject} from "./on-event-filters";
export type OnEose = (relayUrl: string, minCreatedAt: number,
  _continue?: (onEose: OnEose)=>void
  ) => void;
export type OnEventAndMetadata = (event: Event, metadata: Event) => void;
export type FilterToSubscribe = [
  onEvent: OnEvent,
  filtersByRelay: Map<string, Filter[]>,
  unsub: {unsubcb?: () => void},
  unsubscribeOnEose?: boolean,
  subscriptionCacheKey?: string,
  maxDelayms?: number,
];

export type SubscriptionOptions = {
  allowDuplicateEvents?: boolean;
  allowOlderEvents?: boolean;
  logAllEvents?: boolean;
  unsubscribeOnEose?: boolean;
  defaultRelays?: string[];
  dontSendOtherFilters?: boolean;
  subscriptionFilterStateCache?: SubscriptionFilterStateCache;
};

function parseJSON(json: string | undefined) {
  if (json) {
    return JSON.parse(json);
  }
}

function registerSubscriptionFilterStateCache(
  filters: (Filter & {
    relay?: string | undefined;
    noCache?: boolean | undefined;
  })[],
  relays: string[],
  SubscriptionFilterStateCache: SubscriptionFilterStateCache,
  onEose: OnEose | undefined,
) : OnEose | undefined {
  let start = Math.round(new Date().getTime() / 1000)

  for (const filter of filters) {
    let strippedFilter = {...filter, relay: undefined, noCache: undefined};
    SubscriptionFilterStateCache.addFilter(strippedFilter);
  }
  if (onEose) {
    return (relay, minCreatedAt, _continue) => {
      for (const filter of filters) {
        let strippedFilter = {...filter, relay: undefined, noCache: undefined};
        if (filter.relay) {
          SubscriptionFilterStateCache.updateFilter(
            strippedFilter,
            filter.until ? filter.until : start,
            minCreatedAt,
            filter.relay,
          );
        } else {
          for (const relay of relays) {
            SubscriptionFilterStateCache.updateFilter(
              strippedFilter,
              filter.until ? filter.until : start,
              minCreatedAt,
              relay,
            );
          }
        }
      }
      onEose(relay, minCreatedAt, _continue);
    }
  } else {
    return undefined
  }
}

export class RelayPool {
  relayByUrl: Map<string, Relay> = new Map();
  noticecbs: Array<(url: string, msg: string) => void> = [];
  errorcbs: Array<(url: string, err: string) => void> = [];
  authcbs: Array<(relay: Relay, challenge: string) => void> = [];
  eventCache?: EventCache;
  minMaxDelayms: number = Infinity;
  filtersToSubscribe: FilterToSubscribe[] = [];
  timer?: ReturnType<typeof setTimeout>;
  externalGetEventById?: (id: string) => Event | undefined;
  logSubscriptions?: boolean = false;
  autoReconnect?: boolean = false;
  startTime: number = new Date().getTime();
  deleteSignatures?: boolean;
  subscriptionCache?: Map<
    string,
    CallbackReplayer<[Event, boolean, string | undefined], OnEvent>
  >;
  skipVerification?: boolean;
  writeRelays: NewestEventCache;
  metadataCache: NewestEventCache;
  contactListCache: NewestEventCache;
  logErrorsAndNotices?: boolean;
  errorsAndNoticesInterval: any;

  constructor(
    relays?: string[],
    options: {
      useEventCache?: boolean;
      externalGetEventById?: (id: string) => Event | undefined;
      logSubscriptions?: boolean;
      autoReconnect?: boolean;
      subscriptionCache?: boolean;
      deleteSignatures?: boolean;
      skipVerification?: boolean;
      logErrorsAndNotices?: boolean;
    } = {},
  ) {
    this.externalGetEventById = options.externalGetEventById;
    this.logSubscriptions = options.logSubscriptions;
    this.autoReconnect = options.autoReconnect;
    this.deleteSignatures = options.deleteSignatures;
    this.skipVerification = options.skipVerification;
    this.writeRelays = new NewestEventCache(10003, this, undefined, true);
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

    this.logErrorsAndNotices = options.logErrorsAndNotices ?? true;

    this.onnotice((url, msg) => {
      this.errorsAndNotices.push({
        type: "notice",
        url,
        msg,
        time: Date.now() - this.startTime,
      });
    });
    this.onerror((url, msg) => {
      this.errorsAndNotices.push({
        type: "error",
        url,
        msg,
        time: Date.now() - this.startTime,
      });
    });
    this.errorsAndNoticesInterval = setInterval(
      () => this.#maybeLogErrorsAndNotices(),
      1000 * 10,
    );
  }
  errorsAndNotices: {
    type: string;
    url: string;
    msg: string | Error;
    time: number;
  }[] = [];

  #maybeLogErrorsAndNotices() {
    if (!this.errorsAndNotices.length) {
      return;
    }
    if (!this.logErrorsAndNotices) {
      this.errorsAndNotices = [];
      return;
    }
    if (this.errorsAndNotices.length > 5) {
      console.groupCollapsed(
        "RelayPool errors and notices with " +
          this.errorsAndNotices.length +
          " entries",
      );
    } else {
      console.group("RelayPool errors and notices");
    }
    console.table(this.errorsAndNotices.map((e) => ({...e, msg: e.msg})));
    console.groupEnd();
    this.errorsAndNotices = [];
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
      this.autoReconnect,
    );
    this.relayByUrl.set(relay, relayInstance);
    relayInstance.connect().then(
      (onfulfilled) => {
        relayInstance?.on("notice", (msg: string) => {
          this.noticecbs.forEach((cb) => cb(relay, msg));
        });
        relayInstance?.on("auth", (msg: string) => {
          this.authcbs.forEach((cb) => cb(relayInstance, msg));
        });
      },
      (onrejected) => {
        this.errorcbs.forEach((cb) => cb(relay, onrejected));
      },
    );
    return relayInstance;
  }

  async close() {
    const promises = [];
    for (const relayInstance of this.relayByUrl.values()) {
      promises.push(relayInstance.close());
    }
    this.relayByUrl.clear();
    clearInterval(this.errorsAndNoticesInterval);
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
    eventIds?: Set<string>,
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
    filtersByRelay: Map<string, Filter[]>,
  ): Map<string, Filter[]> {
    const mergedAndRemovedEmptyFiltersByRelay = new Map();
    for (const [relay, filters] of filtersByRelay) {
      const mergedAndRemovedEmptyFilters = mergeSimilarAndRemoveEmptyFilters(
        mergeSimilarAndRemoveEmptyFilters(filters),
      );
      if (mergedAndRemovedEmptyFilters.length > 0) {
        mergedAndRemovedEmptyFiltersByRelay.set(
          relay,
          mergedAndRemovedEmptyFilters,
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
  ): () => void {
    if (filtersByRelay.size === 0) {
      return () => {};
    }
    // Merging here is done to make logging more readable.
    filtersByRelay = this.#mergeAndRemoveEmptyFiltersByRelay(filtersByRelay);
    if (this.logSubscriptions) {
      // console.log(
      //   "RelayPool subscribeRelays: at time",
      //   new Date().getTime() - this.startTime,
      //   "ms, minMaxDelayms=",
      //   minMaxDelayms,
      //   ", filtersByRelay: ",
      //   filtersByRelay
      // );
      console.group("RelayPool subscribeRelays");
      console.log(
        "at time",
        new Date().getTime() - this.startTime,
        "ms, minMaxDelayms=",
        minMaxDelayms,
      );
      const flattenedFilters: any = {};
      for (const [relay, filters] of filtersByRelay) {
        let i = 0;
        for (const filter of filters) {
          const filter2: any = {...filter};
          if (filter2.authors) {
            filter2.authors = filter2.authors.join();
            filter2["authors.length"] = filter?.authors?.length;
          }
          if (filter2.kinds) {
            filter2.kinds = filter2.kinds.join();
          }
          if (filter2.ids) {
            filter2.ids = filter2.ids.join();
            filter2["ids.length"] = filter?.ids?.length;
          }
          if (filter2["#e"]) {
            filter2["#e"] = filter2["#e"].join();
            filter2["#e.length"] = filter["#e"]!.length;
          }
          if (filter2["#p"]) {
            filter2["#p"] = filter2["#p"].join();
            filter2["#p.length"] = filter["#p"]!.length;
          }
          flattenedFilters[relay + " " + i] = filter2;
          i++;
        }
      }

      if (Object.keys(flattenedFilters).length > 3) {
        console.groupCollapsed(
          Object.keys(flattenedFilters).length +
            " filters to " +
            filtersByRelay.size +
            " relays",
        );
      }
      console.table(flattenedFilters);
      if (Object.keys(flattenedFilters).length > 3) {
        console.groupEnd();
      }
      console.groupEnd();
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
      const subOnEose: OnEose = (url, minCreatedAt, _continue) => {
        if (onEose) {
          onEose(url, minCreatedAt, _continue);
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
        eventIds,
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

  sendSubscriptions(onEose?: OnEose, filtersToSubscribe?: FilterToSubscribe[]) {
    clearTimeout(this.timer);
    this.timer = undefined;
    let minMaxDelayms = this.minMaxDelayms;
    this.minMaxDelayms = Infinity;

    const [onEvent, filtersByRelay, unsub]: [
      OnEvent,
      Map<string, Filter[]>,
      {unsubcb?: () => void; unsuboneosecb?: () => void},
    ] = batchFiltersByRelay(
      filtersToSubscribe || this.filtersToSubscribe,
      this.subscriptionCache,
    );

    let allUnsub = this.#subscribeRelays(
      filtersByRelay,
      onEvent,
      onEose,
      unsub,
      minMaxDelayms, // For logging
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
    options: SubscriptionOptions = {},
  ) {
    const allAuthors: Set<string> = new Set();
    for (const filter of filters) {
      if (filter.authors) {
        for (const author of filter.authors) {
          allAuthors.add(author);
        }
      } else {
        if (!options.defaultRelays) {
          throw new Error(
            "Authors must be specified if no relays are subscribed and no default relays are specified.",
          );
        }
      }
    }
    const promises = [];
    const allAuthorsArray = [];
    for (const author of allAuthors) {
      promises.push(
        this.writeRelays
          ?.get(author)
          .then((event) => parseJSON(event?.content))
          .catch(() => options?.defaultRelays || []),
      );
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
    let allRelaysArray = Array.from(allRelays);
    if (allRelaysArray.length === 0) {
      if (options.defaultRelays) {
        allRelaysArray = options.defaultRelays;
      }
    }
    // if (this.logSubscriptions) {
    //   console.log(
    //     "getRelaysAndSubscribe",
    //     "filters=",
    //     filters,
    //     "allRelaysArray=",
    //     allRelaysArray,
    //     "maxDelayms=",
    //     maxDelayms,
    //     "options=",
    //     options
    //   );
    // }

    return this.subscribe(
      filters,
      allRelaysArray,
      onEvent,
      maxDelayms,
      onEose,
      options,
    );
  }

  subscribeEventObject(
    filters: (Filter & {relay?: string; noCache?: boolean})[],
    relays: string[] | undefined,
    onEventObject: OnEventObject,
    maxDelayms?: number,
    onEose?: OnEose,
    options: SubscriptionOptions = {},
  ): () => void {
    return this.subscribe(filters, relays, (event, afterEose, url) =>
      onEventObject(new EventObject(event, this, relays), afterEose, url),
    );
  }

  subscribe(
    filters: (Filter & {relay?: string; noCache?: boolean})[],
    relays: string[] | undefined,
    onEvent: OnEvent,
    maxDelayms?: number,
    onEose?: OnEose,
    options: SubscriptionOptions = {},
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
        options,
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
    // continue_
    if (onEose) {
      let oldOnEose = onEose!;
      onEose = (relayUrl: string, minCreatedAt: number) => {
        oldOnEose(relayUrl, minCreatedAt, (onEose: OnEose) => {
          this.subscribe(
            filters.map(
              (filter) =>
                ({
                  ...filter,
                  until: minCreatedAt - 1,
                } as Filter),
            ),
            [relayUrl],
            onEvent,
            maxDelayms,
            onEose,
            options,
          );
        });
      }
    }
    // Register SubscriptionFilterStateCache
    if (options.subscriptionFilterStateCache) {
      onEose = registerSubscriptionFilterStateCache(
        filters,
        relays,
        options.subscriptionFilterStateCache,
        onEose,
      );
    }

    const [dedupedOnEvent, filtersByRelay] =
      groupFiltersByRelayAndEmitCacheHits(
        filters,
        relays,
        onEvent,
        options,
        this.eventCache,
      );
    let unsub: {unsubcb?: () => void} = {unsubcb: () => {}};
    if (
      maxDelayms === undefined &&
      onEose &&
      this.filtersToSubscribe.length > 0 &&
      !options.dontSendOtherFilters
    ) {
      this.sendSubscriptions(); // onEose is not yet supported for batched subscriptions
    }
    const newFilters: FilterToSubscribe = [
      dedupedOnEvent,
      filtersByRelay,
      unsub,
      options.unsubscribeOnEose,
      subscriptionCacheKey,
      maxDelayms,
    ];
    if (options.dontSendOtherFilters) {
      return this.sendSubscriptions(onEose, [newFilters]);
    }

    this.filtersToSubscribe.push(newFilters);
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
    maxDelayms: number,
  ): Promise<EventObject> {
    return this.getEventById(id, relays, maxDelayms).then(
      (event) => new EventObject(event, this, relays),
    );
  }

  async getEventById(
    id: string,
    relays: string[],
    maxDelayms: number,
  ): Promise<Event> {
    return new Promise((resolve, reject) => {
      this.subscribe(
        [{ids: [id]}],
        relays,
        (event) => {
          resolve(event);
        },
        maxDelayms,
        undefined,
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
      relay.on("error", (msg: string) => cb(url, msg)),
    );
    this.errorcbs.push(cb);
  }
  ondisconnect(cb: (url: string, msg: string) => void) {
    this.relayByUrl.forEach((relay: Relay, url: string) =>
      relay.on("disconnect", (msg: string) => cb(url, msg)),
    );
  }
  onauth(cb: (relay: Relay, challenge: string) => void) {
    this.authcbs.push(cb);
  }
  getRelayStatuses(): [url: string, staus: number][] {
    return Array.from(this.relayByUrl.entries())
      .map(
        ([url, relay]: [string, Relay]) =>
          [url, relay.status] as [string, number],
      )
      .sort();
  }
  setWriteRelaysForPubKey(
    pubkey: string,
    writeRelays: string[],
    created_at: number,
  ) {
    const event: Event = {
      created_at,
      pubkey: "",
      id: "",
      sig: "",
      content: JSON.stringify(writeRelays),
      // @ts-ignore
      kind: 10003,
      tags: [["p", pubkey]],
    };
    this.writeRelays.data.set(pubkey, event);
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
    options: SubscriptionOptions = {},
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
      if (options.defaultRelays) {
        return this.subscribe(
          [{ids}],
          options.defaultRelays,
          onEvent,
          maxDelayms,
          onEose,
          options,
        );
      } else {
        console.error("No authors for ids in event", event);
        return () => {};
      }
    }
    if (this.logSubscriptions) {
      // console.log("subscribeReferencedEvents0: ", ids, authors);
    }
    return this.subscribe(
      [{ids, authors}],
      undefined,
      onEvent,
      maxDelayms,
      onEose,
      options,
    );
  }

  fetchAndCacheMetadata(pubkey: string): Promise<Event> {
    return this.metadataCache.get(pubkey).catch((e) => {
      this.errorsAndNotices.push({
        type: "error",
        msg: `Error fetching metadata for ${pubkey}: ${e}`,
        time: Date.now() - this.startTime,
        url: "",
      });

      throw new Error(`Error fetching metadata for ${pubkey}: ${e}`);
    });
  }

  fetchAndCacheContactList(pubkey: string): Promise<Event> {
    return this.contactListCache.get(pubkey).catch((e) => {
      this.errorsAndNotices.push({
        type: "error",
        msg: `Error fetching contact list for ${pubkey}: ${e}`,
        time: Date.now() - this.startTime,
        url: "",
      });
      throw new Error(`Error fetching contact list for ${pubkey}: ${e}`);
    });
  }

  subscribeReferencedEventsAndPrefetchMetadata(
    event: Event,
    onEvent: OnEvent,
    maxDelayms?: number,
    onEose?: OnEose,
    options: SubscriptionOptions = {},
  ): () => void {
    for (const tag of event.tags) {
      if (tag[0] === "p") {
        const pubkey = tag[1];
        if (pubkey.length !== 64) {
          console.log("bad pubkey", pubkey, tag);
          continue;
        }
        this.fetchAndCacheMetadata(pubkey).catch((e) => {
          this.errorsAndNotices.push({
            type: "error",
            url: "",
            msg: `Error fetching metadata for ${pubkey}: ${e}`,
            time: Date.now() - this.startTime,
          });
        });
      }
    }
    return this.subscribeReferencedEvents(
      event,
      onEvent,
      maxDelayms,
      onEose,
      options,
    );
  }

  reconnect() {
    this.relayByUrl.forEach((relay: Relay) => {
      relay.connect().catch((e) => {
        this.errorsAndNotices.push({
          type: "error",
          msg: `Error reconnecting to ${relay.url}: ${e}`,
          time: Date.now() - this.startTime,
          url: relay.url,
        });
      });
    });
  }
}
