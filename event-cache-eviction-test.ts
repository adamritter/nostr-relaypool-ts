/* eslint-env jest */

import {type Event} from "nostr-tools";
import {Kind} from "./kind";
import {EventCache} from "./event-cache";

describe("EventCache Eviction", () => {
  let eventCache: EventCache;

  const createEvent = (id: string, kind: number = 1): Event => ({
    id,
    pubkey: "pk" + id,
    kind,
    created_at: 0,
    tags: [["t", "tag" + id]],
    content: "content" + id,
    sig: "sig" + id,
  });

  test("should evict oldest event when capacity is reached", () => {
    // Capacity 2
    eventCache = new EventCache(2);
    const event1 = createEvent("1");
    const event2 = createEvent("2");
    const event3 = createEvent("3");

    eventCache.addEvent(event1);
    eventCache.addEvent(event2);
    
    expect(eventCache.hasEventById("1")).toBe(true);
    expect(eventCache.hasEventById("2")).toBe(true);

    // Add 3rd event, should evict 1
    eventCache.addEvent(event3);

    expect(eventCache.hasEventById("1")).toBe(false);
    expect(eventCache.hasEventById("2")).toBe(true);
    expect(eventCache.hasEventById("3")).toBe(true);
  });

  test("accessing event should update recency", () => {
    eventCache = new EventCache(2);
    const event1 = createEvent("1");
    const event2 = createEvent("2");
    const event3 = createEvent("3");

    eventCache.addEvent(event1);
    eventCache.addEvent(event2);
    
    // Access event 1, making it most recent
    eventCache.getEventById("1");

    // Add 3rd event, should evict 2 (LRU)
    eventCache.addEvent(event3);

    expect(eventCache.hasEventById("1")).toBe(true);
    expect(eventCache.hasEventById("2")).toBe(false);
    expect(eventCache.hasEventById("3")).toBe(true);
  });

  test("eviction should cleanup auxiliary maps", () => {
    eventCache = new EventCache(1);
    const event1 = createEvent("1", Kind.Metadata);
    const event2 = createEvent("2", Kind.Metadata);

    eventCache.addEvent(event1);
    expect(eventCache.metadataByPubKey.has(event1.pubkey)).toBe(true);
    
    eventCache.addEvent(event2); // Evicts event1
    
    expect(eventCache.hasEventById("1")).toBe(false);
    expect(eventCache.metadataByPubKey.has(event1.pubkey)).toBe(false);
    expect(eventCache.metadataByPubKey.has(event2.pubkey)).toBe(true);
  });
});
