/* eslint-env jest */

import {Event} from "nostr-tools";
import {EventDemultiplexer} from "./event-demultiplexer";

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
    const event: Event & {id: string} = {
      id: "123",
      kind: 1,
      pubkey: "abc",
      tags: [],
      content: "",
      created_at: 0,
    };
    demultiplexer.onEvent(event, true, "https://example.com");
    expect(onEvent).toHaveBeenCalledWith(event, true, "https://example.com");
  });

  test("onEvent method should not call OnEvent callback for event that does not match any subscribed filters", () => {
    const filters = [{ids: ["456"]}];
    const onEvent = jest.fn();
    demultiplexer.subscribe(filters, onEvent);
    const event: Event & {id: string} = {
      id: "123",
      kind: 1,
      pubkey: "abc",
      tags: [],
      content: "",
      created_at: 0,
    };
    demultiplexer.onEvent(event, true, "https://example.com");
    expect(onEvent).not.toHaveBeenCalled();
  });

  test("subscribe method should handle edge cases", () => {
    const filters = [{ids: [""]}];
    const onEvent = jest.fn();
    demultiplexer.subscribe(filters, onEvent);
    const event: Event & {id: string} = {
      id: "",
      kind: 0,
      pubkey: "",
      tags: [],
      content: "",
      created_at: 0,
    };
    demultiplexer.onEvent(event, true, "");
    expect(onEvent).toHaveBeenCalledWith(event, true, "");
  });
});
