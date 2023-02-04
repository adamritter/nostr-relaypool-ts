/* eslint-env jest */

import {CallbackReplayer} from "./callback-replayer";

// Tests for CallbackReplayer
describe("CallbackReplayer", () => {
  test("should call callback with all events", () => {
    const unsub = jest.fn();
    const replayer = new CallbackReplayer(unsub);
    // @ts-ignore
    const unsub1 = replayer.sub((a, b) => {
      expect(a).toBe(1);
      expect(b).toBe(2);
    });
    // @ts-ignore
    const unsub2 = replayer.sub((a, b) => {
      expect(a).toBe(1);
      expect(b).toBe(2);
    });
    replayer.event(1, 2);
    unsub1();
    expect(unsub).not.toBeCalled();
    unsub2();
    expect(unsub).toBeCalled();
  });
});
