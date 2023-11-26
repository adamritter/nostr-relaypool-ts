//   A simple subscription filter state cache can first just record filters that were called and the time of calling.
//   The simplest ,,continue on next start'' would just set an ,,until'' time for time of calling.
//   Time of calling must be rounded down to 5 minutes for example for easier batching.
//   After that a restore functionality can just call and update the time of calling while extending the event cache.
//   TODO: handling pagination, though most of it has to be done in RelayPool class.


import {Event, Filter, matchFilter} from "nostr-tools";
import stableStringify from "safe-stable-stringify";

// FilterInfo contains start and end. multiple intervals for the same filter are boring.
// Defaults should be [-Infinity, Infinity]
type FilterInfo = Map<string, [number, number]>;
//   For ,,continue'' support for non-batched events onEose server last timestamps must be recorded as well.
export class SubscriptionFilterStateCache {
  filters: Map<string, Filter> = new Map();
  filterInfo: Map<string, FilterInfo> = new Map();
  filtersByEventId: Map<string, Set<string>> = new Map();
  addFilter(filter: Filter) {
    let filterString = stableStringify(filter);
    if (!this.filterInfo.has(filterString)) {
      this.filterInfo.set(filterString, new Map());
      this.filters.set(filterString, filter);
    }
  }
  // updateFilter should be called on onEose with last event time.
  updateFilter(filter: Filter, start: number, end: number, relay: string) {
    let filterString = stableStringify(filter);
    if (!this.filterInfo.has(filterString)) {
      this.filterInfo.set(filterString, new Map());
      this.filters.set(filterString, filter);
    }
    let filterInfo = this.filterInfo.get(filterString)!;
    let time = filterInfo.get(relay) || [-Infinity, Infinity];
    if (end < time[0]) {
      // No overlap
      time = [start, end];
    } else {
      if (start > time[0]) {
        time[0] = start;
      }
      if (end < time[1]) {
        time[1] = end;
      }
    }
    filterInfo.set(relay, time);
  }
  // this is probably bad design, looking at filter call and onEose should be probably enough
  // this should still probably get the filters
  updateFilters(event: Event, relay: string) {
    // Get matching filters
    let filterStrings = this.filtersByEventId.get(event.id);
    if (!filterStrings) {
      filterStrings = new Set();
      for (let filterString of this.filterInfo.keys()) {
        if (matchFilter(this.filters.get(filterString)!, event)) {
          filterStrings.add(filterString);
        }
      }
      this.filtersByEventId.set(event.id, filterStrings);
    }
    // update matching filters
    for (let filterString of filterStrings) {
      if (!this.filterInfo.has(filterString)) {
        this.filterInfo.set(filterString, new Map());
      }
      let filterInfo = this.filterInfo.get(filterString)!;
      let time = filterInfo.get(relay) || [-Infinity, Infinity];
      if (event.created_at < time[1]) {
        time[1] = event.created_at;
      }
      if (event.created_at > time[0]) {
        time[0] = event.created_at;
      }

      filterInfo.set(relay, time);
    }
  }
}
