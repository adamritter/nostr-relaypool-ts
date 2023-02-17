/* eslint-env jest */

import {
  CallbackReplayer,
  CancellableCallbackReplayer,
} from "./callback-replayer";

describe("CallbackReplayer", () => {
  test("should call callback with all events", () => {
    const unsub = jest.fn();
    const replayer = new CallbackReplayer(unsub);
    const unsub1 = replayer.sub((a, b) => {
      expect(a).toBe(1);
      expect(b).toBe(2);
    });
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

describe("CancellableCallbackReplayer", () => {
  test("should call callback with all events", () => {
    let unsub = jest.fn();
    let onevent: ((a: number, b: number) => void) | undefined;
    const cc = (onevent_: (a: number, b: number) => void) => {
      onevent = onevent_;
      return unsub;
    };
    const replayer: CancellableCallbackReplayer<[number, number]> =
      new CancellableCallbackReplayer(cc);
    expect(onevent).toBeDefined();
    const unsub1 = replayer.sub()((a, b) => {
      expect(a).toBe(1);
      expect(b).toBe(2);
    });
    const unsub2 = replayer.sub()((a, b) => {
      expect(a).toBe(1);
      expect(b).toBe(2);
    });
    onevent?.(1, 2);
    unsub1();
    expect(unsub).not.toBeCalled();
    unsub2();
    expect(unsub).toBeCalled();
  });
});
