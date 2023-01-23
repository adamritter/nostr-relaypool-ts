import {Filter, Kind} from "nostr-tools";
import {Event} from "./event";

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

  hasEventById(id: string): boolean {
    return this.eventsById.has(id);
  }

  #getCachedEventsByPubKeyWithUpdatedFilter(
    filter: Filter & {
      relay?: string;
      noCache?: boolean;
    }
  ):
    | {filter: Filter & {relay?: string}; events: Set<Event & {id: string}>}
    | undefined {
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
    const events = new Set<Event & {id: string}>();
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
  ):
    | {filter: Filter & {relay?: string}; events: Set<Event & {id: string}>}
    | undefined {
    if (!filter.ids) {
      return undefined;
    }

    const events = new Set<Event & {id: string}>();
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
    events: (Event & {id: string})[];
  } {
    const events: Set<Event & {id: string}> = new Set();
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
