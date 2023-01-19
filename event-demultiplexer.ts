import {Filter, matchFilter} from "nostr-tools";
import {OnEvent} from "./on-event-filters";
import {Event} from "./event";

export class EventDemultiplexer {
  filterAndOnEventByEvent: Map<string, [Filter, OnEvent][]> = new Map();
  #addEventUsingEventKey(
    event: Event,
    afterEose: boolean,
    url: string | undefined,
    eventKey: string
  ) {
    const filterAndOnEvent = this.filterAndOnEventByEvent.get(eventKey);
    if (filterAndOnEvent) {
      for (const [filter, onEvent] of filterAndOnEvent) {
        if (matchFilter(filter, event)) {
          onEvent(event, afterEose, url);
        }
      }
    }
  }

  onEvent(event: Event, afterEose: boolean, url: string | undefined) {
    this.#addEventUsingEventKey(event, afterEose, url, `ids:${event.id}`);
    this.#addEventUsingEventKey(
      event,
      afterEose,
      url,
      `authors:${event.pubkey}`
    );
    for (const tag of event.tags) {
      this.#addEventUsingEventKey(
        event,
        afterEose,
        url,
        `#${tag[0]}:${tag[1]}`
      );
    }
    this.#addEventUsingEventKey(event, afterEose, url, `kinds:${event.kind}`);
    this.#addEventUsingEventKey(event, afterEose, url, "");
  }

  subscribe(filters: Filter[], onEvent: OnEvent) {
    for (const filter of filters) {
      let added = false;
      for (const key of ["ids", "authors", ...filterTags(filter), "kinds"]) {
        if (key in filter) {
          // @ts-ignore
          for (const value of filter[key]) {
            const eventKey = `${key}:${value}`;
            const filterAndOnEvent = this.filterAndOnEventByEvent.get(eventKey);
            if (filterAndOnEvent) {
              filterAndOnEvent.push([filter, onEvent]);
            } else {
              this.filterAndOnEventByEvent.set(eventKey, [[filter, onEvent]]);
            }
          }
          added = true;
          break;
        }
      }
      if (!added) {
        const eventKey = "";
        const filterAndOnEvent = this.filterAndOnEventByEvent.get(eventKey);
        if (filterAndOnEvent) {
          filterAndOnEvent.push([filter, onEvent]);
        } else {
          this.filterAndOnEventByEvent.set(eventKey, [[filter, onEvent]]);
        }
      }
    }
  }
}

const filterTags = (filter: Filter): string[] =>
  Object.keys(filter).filter((key) => key.startsWith("#"));
