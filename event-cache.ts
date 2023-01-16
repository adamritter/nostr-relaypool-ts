import {Event, Filter, Kind} from "nostr-tools";

export class EventCache {
  eventsById: Map<string, Event & {id: string}> = new Map();
  metadataByPubKey: Map<string, Event & {id: string}> = new Map();
  contactsByPubKey: Map<string, Event & {id: string}> = new Map();

  addEvent(event: Event & {id: string}) {
    this.eventsById.set(event.id, event);
    if (event.kind === Kind.Metadata) {
      this.metadataByPubKey.set(event.pubkey, event);
    }
    if (event.kind === Kind.Contacts) {
      this.contactsByPubKey.set(event.pubkey, event);
    }
  }

  getEventById(id: string): (Event & {id: string}) | undefined {
    return this.eventsById.get(id);
  }

  #getCachedEventsByPubKeyWithUpdatedFilter(
    filter: Filter & {
      relay?: string;
      noCache?: boolean;
      authors: string[];
      kinds: Kind[];
    }
  ): {filter: Filter & {relay?: string}; events: Set<Event & {id: string}>} {
    let authors: string[] = [];
    let events = new Set<Event & {id: string}>();
    for (let author of filter.authors) {
      let contactEvent;
      if (filter.kinds.includes(Kind.Contacts)) {
        contactEvent = this.contactsByPubKey.get(author);
        if (!contactEvent) {
          authors.push(author);
          continue;
        }
      }
      let metadataEvent;
      if (filter.kinds.includes(Kind.Metadata)) {
        metadataEvent = this.metadataByPubKey.get(author);
        if (!metadataEvent) {
          authors.push(author);
          continue;
        }
      }
      if (contactEvent) {
        events.add(contactEvent);
      }
      if (metadataEvent) {
        events.add(metadataEvent);
      }
    }
    return {filter: {...filter, authors}, events};
  }

  #getCachedEventsByIdWithUpdatedFilter(
    filter: Filter & {relay?: string; noCache?: boolean; ids: string[]}
  ): {filter: Filter & {relay?: string}; events: Set<Event & {id: string}>} {
    let events = new Set<Event & {id: string}>();
    let ids: string[] = [];
    for (let id of filter.ids) {
      let event = this.getEventById(id);
      if (event) {
        events.add(event);
      } else {
        ids.push(id);
      }
    }
    return {filter: {...filter, ids}, events};
  }

  getCachedEventsWithUpdatedFilters(
    filters: (Filter & {relay?: string; noCache?: boolean})[],
    relays: string[]
  ): {
    filters: (Filter & {relay?: string})[];
    events: (Event & {id: string})[];
  } {
    let events: Set<Event & {id: string}> = new Set();
    let new_filters: (Filter & {relay?: string})[] = [];
    for (let filter of filters) {
      let new_data = {filter, events: []};
      if (filter.ids) {
        // @ts-ignore
        new_data = this.#getCachedEventsByIdWithUpdatedFilter(filter);
      } else if (
        !filter.noCache &&
        filter.authors &&
        filter.kinds &&
        filter.kinds.find(
          (kind) => kind !== Kind.Contacts && kind !== Kind.Metadata
        ) === undefined
      ) {
        // @ts-ignore
        new_data = this.#getCachedEventsByPubKeyWithUpdatedFilter(filter);
      }
      for (let event of new_data.events) {
        events.add(event);
      }
      new_filters.push(new_data.filter);
    }
    return {filters: new_filters, events: [...events]};
  }
}
