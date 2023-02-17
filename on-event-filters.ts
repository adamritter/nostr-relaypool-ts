import {Filter, Kind, matchFilter} from "nostr-tools";
import {Event} from "./event";
export type OnEventArgs = [
  event: Event,
  afterEose: boolean,
  url: string | undefined
];
export type OnEvent = (
  event: Event,
  afterEose: boolean,
  url: string | undefined
) => void;

export function doNotEmitDuplicateEvents(onEvent: OnEvent): OnEvent {
  let event_ids = new Set();
  return (event: Event, afterEose: boolean, url: string | undefined) => {
    if (event_ids.has(event.id)) return;
    event_ids.add(event.id);
    onEvent(event, afterEose, url);
  };
}

export function doNotEmitOlderEvents(onEvent: OnEvent): OnEvent {
  let created_at_by_events_kinds = new Map();
  return (event: Event, afterEose: boolean, url: string | undefined) => {
    if (event.kind === Kind.Metadata || event.kind === Kind.Contacts) {
      let event_kind = event.pubkey + " " + event.kind;
      if ((created_at_by_events_kinds.get(event_kind) || 0) > event.created_at)
        return;
      created_at_by_events_kinds.set(event_kind, event.created_at);
    }
    onEvent(event, afterEose, url);
  };
}

export function matchOnEventFilters(
  onEvent: OnEvent,
  filters: Filter[]
): OnEvent {
  return (event: Event, afterEose: boolean, url: string | undefined) => {
    for (let filter of filters) {
      if (matchFilter(filter, event)) {
        onEvent(event, afterEose, url);
        break;
      }
    }
  };
}

export function emitEventsOnNextTick(onEvent: OnEvent): OnEvent {
  return (event: Event, afterEose: boolean, url: string | undefined) => {
    setTimeout(() => {
      onEvent(event, afterEose, url);
    }, 0);
  };
}
