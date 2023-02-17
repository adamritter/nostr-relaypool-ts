import {Filter} from "nostr-tools";
import {mergeSimilarAndRemoveEmptyFilters} from "./merge-similar-filters";
import {
  doNotEmitDuplicateEvents,
  doNotEmitOlderEvents,
  matchOnEventFilters,
  type OnEvent,
} from "./on-event-filters";
import {EventCache} from "./event-cache";
import {Event} from "./event";
import {FilterToSubscribe} from "./relay-pool";
import {CallbackReplayer} from "./callback-replayer";

const unique = (arr: string[]) => [...new Set(arr)];

export function groupFiltersByRelayAndEmitCacheHits(
  filters: (Filter & {relay?: string; noCache?: boolean})[],
  relays: string[],
  onEvent: OnEvent,
  options: {
    allowDuplicateEvents?: boolean;
    allowOlderEvents?: boolean;
    logAllEvents?: boolean;
  } = {},
  eventCache?: EventCache
): [OnEvent, Map<string, Filter[]>] {
  let events: Event[] = [];
  if (eventCache) {
    const cachedEventsWithUpdatedFilters =
      eventCache.getCachedEventsWithUpdatedFilters(filters, relays);
    filters = cachedEventsWithUpdatedFilters.filters;
    events = cachedEventsWithUpdatedFilters.events;
  }
  if (options.logAllEvents) {
    onEvent = (event, isEose, url) => {
      console.log("filters", filters, "onEvent", event, isEose, url);
      onEvent(event, isEose, url);
    };
  }
  if (!options.allowDuplicateEvents) {
    onEvent = doNotEmitDuplicateEvents(onEvent);
  }
  if (!options.allowOlderEvents) {
    onEvent = doNotEmitOlderEvents(onEvent);
  }
  for (const event of events) {
    onEvent(event, false, undefined);
  }
  filters = mergeSimilarAndRemoveEmptyFilters(filters);
  onEvent = matchOnEventFilters(onEvent, filters);
  relays = unique(relays);
  const filtersByRelay = getFiltersByRelay(filters, relays);
  return [onEvent, filtersByRelay];
}

function getFiltersByRelay(
  filters: (Filter & {relay?: string})[],
  relays: string[]
): Map<string, Filter[]> {
  const filtersByRelay = new Map<string, Filter[]>();
  const filtersWithoutRelay: Filter[] = [];
  for (const filter of filters) {
    const relay = filter.relay;
    if (relay) {
      const relayFilters = filtersByRelay.get(relay);
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
    for (const relay of relays) {
      const filters = filtersByRelay.get(relay);
      if (filters) {
        filtersByRelay.set(relay, filters.concat(filtersWithoutRelay));
      } else {
        filtersByRelay.set(relay, filtersWithoutRelay);
      }
    }
  }
  return filtersByRelay;
}

function withoutRelay(filter: Filter & {relay?: string}): Filter {
  filter = {...filter};
  delete filter.relay;
  return filter;
}

export function batchFiltersByRelay(
  subscribedFilters: FilterToSubscribe[],
  subscriptionCache?: Map<
    string,
    CallbackReplayer<[Event, boolean, string | undefined], OnEvent>
  >
): [OnEvent, Map<string, Filter[]>, {unsubcb?: () => void}] {
  const filtersByRelay = new Map<string, Filter[]>();
  const onEvents: OnEvent[] = [];
  let counter = 0;
  let unsubOnEoseCounter = 0;
  let allUnsub = {unsubcb: () => {}, unsuboneosecb: () => {}};
  let unsubVirtualSubscription = () => {
    counter--;

    if (counter === 0) {
      allUnsub.unsubcb();
    } else if (unsubOnEoseCounter === 0) {
      allUnsub.unsuboneosecb();
    }
  };
  for (const [
    onEvent,
    filtersByRelayBySub,
    unsub,
    unsubscribeOnEose,
    subscriptionCacheKey,
  ] of subscribedFilters) {
    if (!unsub.unsubcb) {
      continue;
    }
    for (const [relay, filters] of filtersByRelayBySub) {
      const filtersByRelayFilters = filtersByRelay.get(relay);
      if (filtersByRelayFilters) {
        filtersByRelay.set(relay, filtersByRelayFilters.concat(filters));
      } else {
        filtersByRelay.set(relay, filters);
      }
    }
    let onEventWithUnsub: OnEvent = (event, afterEose, url) => {
      if (unsub.unsubcb) {
        onEvent(event, afterEose, url);
      }
    };

    if (subscriptionCache && subscriptionCacheKey) {
      const callbackReplayer: CallbackReplayer<
        [Event, boolean, string | undefined],
        OnEvent
      > = new CallbackReplayer(unsubVirtualSubscription);
      onEvents.push((event, afterEose, url) => {
        callbackReplayer.event(event, afterEose, url);
      });
      let unsubReplayerVirtualSubscription =
        callbackReplayer.sub(onEventWithUnsub);
      subscriptionCache.set(subscriptionCacheKey, callbackReplayer);
      unsub.unsubcb = () => {
        unsub.unsubcb = undefined;
        unsubReplayerVirtualSubscription();
        if (!unsubscribeOnEose) {
          unsubOnEoseCounter--;
        }
      };
    } else {
      onEvents.push(onEventWithUnsub);
      unsub.unsubcb = () => {
        unsub.unsubcb = undefined;
        unsubVirtualSubscription();
        if (!unsubscribeOnEose) {
          unsubOnEoseCounter--;
        }
      };
    }
    counter++;
    if (!unsubscribeOnEose) {
      unsubOnEoseCounter++;
    }
  }

  if (unsubOnEoseCounter === 0) {
    setTimeout(() => {
      allUnsub.unsuboneosecb();
    }, 0);
  } else {
    // console.log("NO unsuboneosecb for ", subscribedFilters);
  }
  const onEvent: OnEvent = (event, afterEose, url) => {
    for (const onEvent of onEvents) {
      onEvent(event, afterEose, url);
    }
  };
  subscribedFilters.length = 0;
  return [onEvent, filtersByRelay, allUnsub];
}
