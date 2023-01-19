/* eslint-env jest */

import {Filter, matchFilter} from "nostr-tools";
import {EventDemultiplexer} from "./event-demultiplexer";
import {Event, NostrToolsEventWithId} from "./event";
import {RelayPool} from "./relay-pool";

let eventFrom = (event: NostrToolsEventWithId) =>
  new Event(event, new RelayPool(), []);
describe("EventDemultiplexer", () => {
  let demultiplexer: EventDemultiplexer;

  beforeEach(() => {
    demultiplexer = new EventDemultiplexer();
  });

  test("subscribe method should add filter and OnEvent to filterAndOnEventByEvent map", () => {
    const filters = [{ids: ["123"]}];
    const onEvent = jest.fn();
    demultiplexer.subscribe(filters, onEvent);
    expect(demultiplexer.filterAndOnEventByEvent.get("ids:123")).toEqual([
      [filters[0], onEvent],
    ]);
  });

  test("onEvent method should call OnEvent callback for event that matches subscribed filter", () => {
    const filters = [{ids: ["123"]}];
    const onEvent = jest.fn();
    demultiplexer.subscribe(filters, onEvent);
    const event: Event = eventFrom({
      id: "123",
      kind: 1,
      pubkey: "abc",
      tags: [],
      content: "",
      created_at: 0,
    });
    demultiplexer.onEvent(event, true, "https://example.com");
    expect(onEvent).toHaveBeenCalledWith(event, true, "https://example.com");
  });

  test("onEvent method should not call OnEvent callback for event that does not match any subscribed filters", () => {
    const filters = [{ids: ["456"]}];
    const onEvent = jest.fn();
    demultiplexer.subscribe(filters, onEvent);
    const event: Event = eventFrom({
      id: "123",
      kind: 1,
      pubkey: "abc",
      tags: [],
      content: "",
      created_at: 0,
    });
    demultiplexer.onEvent(event, true, "https://example.com");
    expect(onEvent).not.toHaveBeenCalled();
  });

  test("subscribe method should handle edge cases", () => {
    const filters = [{ids: [""]}];
    const onEvent = jest.fn();
    demultiplexer.subscribe(filters, onEvent);
    const event: Event = eventFrom({
      id: "",
      kind: 0,
      pubkey: "",
      tags: [],
      content: "",
      created_at: 0,
    });
    demultiplexer.onEvent(event, true, "");
    expect(onEvent).toHaveBeenCalledWith(event, true, "");
  });

  test.skip("many filters", () => {
    const time = new Date().getTime();
    let counter = 0;
    const onEvent = () => {
      counter++;
    };
    for (let i = 0; i < 2000; i++) {
      demultiplexer.subscribe([{ids: ["" + i * 3]}], onEvent);
    }
    const event: Event = eventFrom({
      id: "123",
      kind: 1,
      pubkey: "abc",
      tags: [],
      content: "",
      created_at: 0,
    });
    for (let i = 0; i < 2000; i++) {
      demultiplexer.onEvent(
        eventFrom({...event, id: "" + i * 2}),
        true,
        "https://example.com"
      );
    }
    expect(new Date().getTime() - time).toBeLessThan(5);
    expect(counter).toBe(667);
  });

  test.skip("many filters using matchFilter", () => {
    const time = new Date().getTime();
    let counter = 0;
    const filters: Filter[] = [];
    for (let i = 0; i < 2000; i++) {
      filters.push({ids: ["" + i * 3]});
    }
    const event: Event = eventFrom({
      id: "123",
      kind: 1,
      pubkey: "abc",
      tags: [],
      content: "",
      created_at: 0,
    });
    for (let i = 0; i < 2000; i++) {
      const e = {...event, id: "" + i * 2};
      for (const filter of filters) {
        if (matchFilter(filter, e)) {
          counter++;
        }
      }
    }
    expect(new Date().getTime() - time).toBeGreaterThan(20);
    expect(counter).toBe(667);
  });
});
