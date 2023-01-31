/* eslint-env jest */

import {Kind} from "nostr-tools";
import {Event} from "./event";
import {EventCache} from "./event-cache";
import {RelayPool} from "./relay-pool";

describe("EventCache", () => {
  let eventCache: EventCache;
  let event: Event;

  beforeEach(() => {
    eventCache = new EventCache();
    event = new Event(
      {
        id: "1",
        pubkey: "pk",
        kind: Kind.Metadata,
        created_at: 0,
        tags: [],
        content: "",
      },
      new RelayPool(),
      []
    );
  });

  test("addEvent should add event to eventsById", () => {
    eventCache.addEvent(event);
    expect(eventCache.eventsById.get(event.id)).toBe(event);
  });

  test("addEvent should add event to metadataByPubKey if event is metadata", () => {
    eventCache.addEvent(event);
    expect(eventCache.metadataByPubKey.get(event.pubkey)).toBe(event);
  });

  test("addEvent should add event to contactsByPubKey if event is contact", () => {
    event.kind = Kind.Contacts;
    eventCache.addEvent(event);
    expect(eventCache.contactsByPubKey.get(event.pubkey)).toBe(event);
  });

  test("getEventById should return event for given id", () => {
    eventCache.addEvent(event);
    expect(eventCache.getEventById(event.id)).toBe(event);
  });

  test("hasEventById should return true if event with given id exists", () => {
    eventCache.addEvent(event);
    expect(eventCache.hasEventById(event.id)).toBe(true);
  });

  test("getCachedEventsByPubKeyWithUpdatedFilter should return events and filter if all conditions met", () => {
    eventCache.addEvent(event);
    const filter = {
      authors: [event.pubkey],
      kinds: [Kind.Metadata],
      noCache: false,
    };
    const result = eventCache.getCachedEventsWithUpdatedFilters([filter], []);
    expect(result).toEqual({
      filters: [filter],
      events: [event],
    });
  });

  test("getCachedEventsByPubKeyWithUpdatedFilter should return undefined if noCache is true", () => {
    const filter = {
      authors: [event.pubkey],
      kinds: [Kind.Metadata],
      noCache: true,
    };
    const result = eventCache.getCachedEventsWithUpdatedFilters([filter], []);
    expect(result).toStrictEqual({filters: [filter], events: []});
  });

  test("getCachedEventsByPubKeyWithUpdatedFilter should return undefined if authors not specified", () => {
    const filter = {kinds: [Kind.Metadata], noCache: false};
    const result = eventCache.getCachedEventsWithUpdatedFilters([filter], []);
    expect(result).toStrictEqual({filters: [filter], events: []});
  });

  // test('getCachedEventsByPubKeyWithUpdatedFilter should return undefined if kinds not specified', () => {
  //   const filter = { authors: [event.pubkey], noCache: false };
  //   const result = eventCache.#getCachedEventsByPubKey

  test("getCachedEventsByPubKeyWithUpdatedFilter should return events by pubkey", () => {
    eventCache.addEvent(event);
    const filter = {
      authors: ["pk"],
      kinds: [Kind.Metadata, Kind.Contacts],
      noCache: false,
    };
    const result = eventCache.getCachedEventsWithUpdatedFilters([filter], []);
    expect(result).toEqual({events: [event], filters: [filter]});
  });

  test("tags", () => {
    event.tags = [["p", "pk2"]];
    eventCache.addEvent(event);
    const filter = {
      "#p": ["pk2"],
    };
    console.log("tags", eventCache.eventsByTags);
    const result = eventCache.getCachedEventsWithUpdatedFilters([filter], []);
    expect(result).toEqual({events: [event], filters: [filter]});
  });
});
