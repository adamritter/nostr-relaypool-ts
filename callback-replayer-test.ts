/* eslint-env jest */

import {CallbackReplayer} from "./callback-replayer";

// Tests for CallbackReplayer
describe("CallbackReplayer", () => {
  test("should call callback with all events", () => {
    const callback = jest.fn();
    const unsub = jest.fn();
    const replayer = new CallbackReplayer(callback, unsub);
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
    callback(1, 2);
    unsub1();
    expect(unsub).not.toBeCalled();
    unsub2();
    expect(unsub).toBeCalled();
  });
});
