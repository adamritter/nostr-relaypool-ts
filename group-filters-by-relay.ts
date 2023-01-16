import {Event, Filter} from "nostr-tools";
import {mergeSimilarAndRemoveEmptyFilters} from "./merge-similar-filters";
import {
  doNotEmitDuplicateEvents,
  doNotEmitOlderEvents,
  matchOnEventFilters,
  type OnEvent,
} from "./on-event-filters";
import {EventCache} from "./event-cache";

let unique = (arr: string[]) => [...new Set(arr)];

export function groupFiltersByRelayAndEmitCacheHits(
  filters: (Filter & {relay?: string; noCache?: boolean})[],
  relays: string[],
  onEvent: OnEvent,
  options: {allowDuplicateEvents?: boolean; allowOlderEvents?: boolean} = {},
  eventCache?: EventCache
): [OnEvent, Map<string, Filter[]>] {
  let events: (Event & {id: string})[] = [];
  if (eventCache) {
    let cachedEventsWithUpdatedFilters =
      eventCache.getCachedEventsWithUpdatedFilters(filters, relays);
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
  let filtersByRelay = getFiltersByRelay(filters, relays);
  return [onEvent, filtersByRelay];
}

function getFiltersByRelay(
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

function withoutRelay(filter: Filter & {relay?: string}): Filter {
  filter = {...filter};
  delete filter.relay;
  return filter;
}

export function batchFiltersByRelay(
  subscribedFilters: [OnEvent, Map<string, Filter[]>][]
): [OnEvent, Map<string, Filter[]>] {
  let filtersByRelay = new Map<string, Filter[]>();
  let onEvents: OnEvent[] = [];
  for (let [onEvent, filtersByRelayBySub] of subscribedFilters) {
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
  let onEvent: OnEvent = (event, afterEose, url) => {
    for (let onEvent of onEvents) {
      onEvent(event, afterEose, url);
    }
  };
  return [onEvent, filtersByRelay];
}
