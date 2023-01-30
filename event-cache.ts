import {Filter, Kind} from "nostr-tools";
import {Event} from "./event";

export class EventCache {
  eventsById: Map<string, Event> = new Map();
  metadataByPubKey: Map<string, Event> = new Map();
  contactsByPubKey: Map<string, Event> = new Map();

  addEvent(event: Event) {
    this.eventsById.set(event.id, event);
    if (event.kind === Kind.Metadata) {
      this.metadataByPubKey.set(event.pubkey, event);
    }
    if (event.kind === Kind.Contacts) {
      this.contactsByPubKey.set(event.pubkey, event);
    }
  }

  getEventById(id: string): Event | undefined {
    return this.eventsById.get(id);
  }

  hasEventById(id: string): boolean {
    return this.eventsById.has(id);
  }

  #getCachedEventsByPubKeyWithUpdatedFilter(
    filter: Filter & {
      relay?: string;
      noCache?: boolean;
    }
  ): {filter: Filter & {relay?: string}; events: Set<Event>} | undefined {
    if (
      filter.noCache ||
      !filter.authors ||
      !filter.kinds ||
      filter.kinds.find(
        (kind) => kind !== Kind.Contacts && kind !== Kind.Metadata
      ) !== undefined
    ) {
      return undefined;
    }
    const authors: string[] = [];
    const events = new Set<Event>();
    for (const author of filter.authors) {
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
    filter: Filter & {relay?: string; noCache?: boolean}
  ): {filter: Filter & {relay?: string}; events: Set<Event>} | undefined {
    if (!filter.ids) {
      return undefined;
    }

    const events = new Set<Event>();
    const ids: string[] = [];
    for (const id of filter.ids) {
      const event = this.getEventById(id);
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
    events: Event[];
  } {
    const events: Set<Event> = new Set();
    const new_filters: (Filter & {relay?: string})[] = [];
    for (const filter of filters) {
      const new_data = this.#getCachedEventsByIdWithUpdatedFilter(filter) ||
        this.#getCachedEventsByPubKeyWithUpdatedFilter(filter) || {
          filter,
          events: [],
        };
      for (const event of new_data.events) {
        events.add(event);
      }
      new_filters.push(new_data.filter);
    }
    return {filters: new_filters, events: [...events]};
  }
}
