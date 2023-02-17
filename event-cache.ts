import {Filter, Kind} from "nostr-tools";
import {Event} from "./event";

export class EventCache {
  eventsById: Map<string, Event> = new Map();
  metadataByPubKey: Map<string, Event> = new Map();
  contactsByPubKey: Map<string, Event> = new Map();
  authorsKindsByPubKey: Map<string, Map<number, Event[]>> = new Map();
  eventsByTags: Map<string, Event[]> = new Map();

  #addEventToAuthorKindsByPubKey(event: Event) {
    const kindsByPubKey = this.authorsKindsByPubKey.get(event.pubkey);
    if (!kindsByPubKey) {
      this.authorsKindsByPubKey.set(
        event.pubkey,
        new Map([[event.kind, [event]]])
      );
    } else {
      const events = kindsByPubKey.get(event.kind);
      if (!events) {
        kindsByPubKey.set(event.kind, [event]);
      } else {
        if (event.kind === Kind.Metadata || event.kind === Kind.Contacts) {
          if (event.created_at > events[0].created_at) {
            events[0] = event;
          }
        } else {
          events.push(event);
        }
      }
    }
  }

  #addEventToEventsByTags(event: Event) {
    for (const tag of event.tags) {
      let tag2 = tag[0] + ":" + tag[1];
      const events = this.eventsByTags.get(tag2);
      if (events) {
        events.push(event);
      } else {
        this.eventsByTags.set(tag2, [event]);
      }
    }
  }

  addEvent(event: Event) {
    if (this.getEventById(event.id)) {
      return;
    }
    this.eventsById.set(event.id, event);
    if (event.kind === Kind.Metadata) {
      this.metadataByPubKey.set(event.pubkey, event);
    }
    if (event.kind === Kind.Contacts) {
      this.contactsByPubKey.set(event.pubkey, event);
    }
    this.#addEventToAuthorKindsByPubKey(event);
    this.#addEventToEventsByTags(event);
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

  #getCachedEventsByPubKeyWithUpdatedFilter2(
    filter: Filter & {
      relay?: string;
      noCache?: boolean;
    }
  ): {filter: Filter & {relay?: string}; events: Set<Event>} | undefined {
    if (filter.noCache || !filter.authors) {
      return undefined;
    }
    const events = new Set<Event>();
    for (const author of filter.authors) {
      if (filter.kinds) {
        const kindsByPubKey = this.authorsKindsByPubKey.get(author);
        if (kindsByPubKey) {
          for (const kind of filter.kinds) {
            const events2 = kindsByPubKey.get(kind);
            if (events2) {
              for (const event of events2) {
                events.add(event);
              }
            }
          }
        }
      } else {
        const kindsByPubKey = this.authorsKindsByPubKey.get(author);
        if (kindsByPubKey) {
          for (const events2 of kindsByPubKey.values()) {
            for (const event3 of events2) {
              events.add(event3);
            }
          }
        }
      }
    }
    return {filter, events};
  }

  #getCachedEventsByTagsWithUpdatedFilter(
    filter: Filter & {
      relay?: string;
      noCache?: boolean;
    }
  ): {filter: Filter & {relay?: string}; events: Set<Event>} | undefined {
    if (filter.noCache) {
      return undefined;
    }
    const events = new Set<Event>();
    for (const tag in filter) {
      if (tag[0] !== "#") {
        continue;
      }
      // @ts-ignore
      let tag2 = tag.slice(1) + ":" + filter[tag][0];
      const events2 = this.eventsByTags.get(tag2);
      if (events2) {
        for (const event of events2) {
          events.add(event);
        }
      }
    }
    return {filter, events};
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
        // this.#getCachedEventsByPubKeyWithUpdatedFilter(filter) ||
        this.#getCachedEventsByPubKeyWithUpdatedFilter2(filter) ||
        this.#getCachedEventsByTagsWithUpdatedFilter(filter) || {
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
