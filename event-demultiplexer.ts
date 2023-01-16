import {Filter, Event, matchFilter} from "nostr-tools";
import {OnEvent} from "./on-event-filters";

export class EventDemultiplexer {
  filterAndOnEventByEvent: Map<string, [Filter, OnEvent][]> = new Map();
  #addEventUsingEventKey(
    event: Event & {id: string},
    afterEose: boolean,
    url: string | undefined,
    eventKey: string
  ) {
    let filterAndOnEvent = this.filterAndOnEventByEvent.get(eventKey);
    if (filterAndOnEvent) {
      for (let [filter, onEvent] of filterAndOnEvent) {
        if (matchFilter(filter, event)) {
          onEvent(event, afterEose, url);
        }
      }
    }
  }

  onEvent(
    event: Event & {id: string},
    afterEose: boolean,
    url: string | undefined
  ) {
    this.#addEventUsingEventKey(event, afterEose, url, `ids:${event.id}`);
    this.#addEventUsingEventKey(
      event,
      afterEose,
      url,
      `authors:${event.pubkey}`
    );
    for (let tag of event.tags) {
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
    for (let filter of filters) {
      let added = false;
      for (let key of ["ids", "authors", ...filterTags(filter), "kinds"]) {
        if (key in filter) {
          // @ts-ignore
          for (let value of filter[key]) {
            let eventKey = `${key}:${value}`;
            let filterAndOnEvent = this.filterAndOnEventByEvent.get(eventKey);
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
        let eventKey = "";
        let filterAndOnEvent = this.filterAndOnEventByEvent.get(eventKey);
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
