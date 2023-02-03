export class CallbackReplayer<
  Args extends any[],
  T extends (...args: Args) => void
> {
  subs: T[] = [];
  events: Args[] = [];
  onunsub: (() => void) | undefined;

  constructor(callback: T, onunsub: () => void) {
    this.onunsub = onunsub;
    // @ts-ignore
    callback((...args: Args) => {
      this.events.push(args);
      this.subs.forEach((sub) => sub(...args));
    });
  }

  sub(callback: T) {
    this.events.forEach((event) => callback(...event));
    this.subs.push(callback);
    return () => {
      this.subs = this.subs.filter((sub) => sub !== callback);
      if (this.subs.length === 0) {
        this.onunsub?.();
        this.onunsub = undefined;
      }
    };
  }
}
