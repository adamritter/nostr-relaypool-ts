// Cancellable<OnEvent> is perfect for this.
export type Cancellable<Process> = (process: Process) => () => void;
export type Callback<Args extends any[]> = (...args: Args) => void;

export class CancellableCallbackReplayer<Args extends any[]> {
  events: Args[] = [];
  unsubAll?: () => void;
  subs: Set<Callback<Args>> = new Set();
  constructor(cancellableCallback: Cancellable<Callback<Args>>) {
    this.unsubAll = cancellableCallback((...args: Args) => {
      this.events.push(args);
      for (let sub of this.subs) {
        sub(...args);
      }
    });
  }
  sub(): Cancellable<Callback<Args>> {
    return (callback: Callback<Args>) => {
      this.subs.add(callback);
      this.events.forEach((arg) => callback(...arg));
      return () => {
        this.subs.delete(callback);
        if (this.subs.size === 0) {
          this.unsubAll?.();
          this.unsubAll = undefined;
        }
      };
    };
  }
}
export class CallbackReplayer<
  Args extends any[],
  T extends (...args: Args) => void
> {
  subs: T[] = [];
  events: Args[] = [];
  onunsub: (() => void) | undefined;

  constructor(onunsub: (() => void) | undefined) {
    this.onunsub = onunsub;
  }

  event(...args: Args) {
    this.events.push(args);
    this.subs.forEach((sub) => sub(...args));
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
