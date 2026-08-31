import type {Event} from "nostr-tools";
import type {OnEose, OnEvent, SubscriptionOptions} from "./relay-pool";

export class RelayPoolWorker {
  // eslint-disable-next-line no-undef
  private worker: Worker;
  private subscriptionCallbacks = new Map<
    number | string,
    {onEvent: OnEvent; onEose?: OnEose}
  >();
  private errorcbs: Array<(url: string, err: string) => void> = [];
  private noticecbs: Array<(url: string, msg: string) => void> = [];
  private pendingRequests = new Map<
    string,
    {resolve: (data: any) => void; reject: (err: any) => void}
  >();

  constructor(
    // eslint-disable-next-line no-undef
    worker: Worker,
    relays: string[] = [],
    options: {
      useEventCache?: boolean;
      logSubscriptions?: boolean;
      deleteSignatures?: boolean;
      skipVerification?: boolean;
      autoReconnect?: boolean;
    } = {}
  ) {
    this.worker = worker;
    this.worker.onmessage = this.handleWorkerMessage.bind(this);
    this.worker.postMessage({
      action: "create_relay_pool",
      data: {relays, options},
    });
  }

  private handleWorkerMessage(event: MessageEvent) {
    const {type, subscriptionId, ...rest} = event.data;

    if (type === "event" || type === "eose") {
      const callbacks = this.subscriptionCallbacks.get(subscriptionId);

      if (callbacks) {
        if (type === "event") {
          callbacks.onEvent(rest.event, rest.isAfterEose, rest.relayURL);
        } else if (type === "eose" && callbacks.onEose) {
          callbacks.onEose(rest.relayURL, rest.minCreatedAt);
        }
      }
    } else if (type === "subscribed") {
      // Do nothing
    } else if (type === "metadata") {
      const key = `metadata:${rest.pubkey}:${rest.requestId}`;
      const pending = this.pendingRequests.get(key);
      if (pending) {
        pending.resolve(rest.metadata);
        this.pendingRequests.delete(key);
      }
    } else if (type === "contactList") {
      const key = `contactList:${rest.pubkey}:${rest.requestId}`;
      const pending = this.pendingRequests.get(key);
      if (pending) {
        pending.resolve(rest.contactList);
        this.pendingRequests.delete(key);
      }
    } else if (type === "error") {
      this.errorcbs.forEach((cb) => cb(rest.relayUrl, rest.err));
    } else if (type === "notice") {
      this.noticecbs.forEach((cb) => cb(rest.relayUrl, rest.notice));
    } else {
      console.warn("Unhandled message from worker:", event.data);
    }
  }

  subscribe(
    filters: any,
    relays: string[] | undefined,
    onEvent: OnEvent,
    maxDelayms?: number,
    onEose?: OnEose,
    options: SubscriptionOptions = {}
  ): () => void {
    const subscriptionId = Math.random().toString(36).slice(2, 9);

    this.subscriptionCallbacks.set(subscriptionId, {onEvent, onEose});

    this.worker.postMessage({
      action: "subscribe",
      data: {
        filters,
        relays,
        maxDelayms,
        onEose: !!onEose,
        options,
        subscriptionId,
      },
    });

    return () => {
      this.subscriptionCallbacks.delete(subscriptionId);
      this.worker.postMessage({action: "unsubscribe", data: {subscriptionId}});
    };
  }

  publish(event: Event, relays: string[]) {
    this.worker.postMessage({action: "publish", data: {event, relays}});
  }

  setWriteRelaysForPubKey(pubkey: string, writeRelays: string[]) {
    this.worker.postMessage({
      action: "set_write_relays_for_pub_key",
      data: {pubkey, writeRelays},
    });
  }

  subscribeReferencedEvents(
    event: Event,
    onEvent: OnEvent,
    maxDelayms?: number,
    onEose?: OnEose,
    options: SubscriptionOptions = {}
  ): () => void {
    const subscriptionId = Math.random().toString(36).slice(2, 9);

    this.subscriptionCallbacks.set(subscriptionId, {onEvent, onEose});

    this.worker.postMessage({
      action: "subscribe_referenced_events",
      data: {event, maxDelayms, onEose: !!onEose, options, subscriptionId},
    });

    return () => {
      this.subscriptionCallbacks.delete(subscriptionId);
      this.worker.postMessage({action: "unsubscribe", data: {subscriptionId}});
    };
  }

  fetchAndCacheMetadata(pubkey: string): Promise<Event> {
    const requestId = Math.random().toString(36).slice(2, 9);
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(`metadata:${pubkey}:${requestId}`, {
        resolve,
        reject,
      });
      this.worker.postMessage({
        action: "fetch_and_cache_metadata",
        data: {pubkey, requestId},
      });
    });
  }

  fetchAndCacheContactList(pubkey: string): Promise<Event> {
    const requestId = Math.random().toString(36).slice(2, 9);
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(`contactList:${pubkey}:${requestId}`, {
        resolve,
        reject,
      });
      this.worker.postMessage({
        action: "fetch_and_cache_contact_list",
        data: {pubkey, requestId},
      });
    });
  }

  subscribeReferencedEventsAndPrefetchMetadata(
    event: Event,
    onEvent: OnEvent,
    maxDelayms?: number,
    onEose?: OnEose,
    options: SubscriptionOptions = {}
  ): () => void {
    const subscriptionId = Math.random().toString(36).slice(2, 9);

    this.subscriptionCallbacks.set(subscriptionId, {onEvent, onEose});

    this.worker.postMessage({
      action: "subscribe_referenced_events_and_prefetch_metadata",
      data: {event, maxDelayms, onEose: !!onEose, options, subscriptionId},
    });

    return () => {
      this.subscriptionCallbacks.delete(subscriptionId);
      this.worker.postMessage({action: "unsubscribe", data: {subscriptionId}});
    };
  }

  setCachedMetadata(pubkey: string, metadata: Event) {
    this.worker.postMessage({
      action: "set_cached_metadata",
      data: {pubkey, metadata},
    });
  }

  close() {
    this.worker.postMessage({action: "close"});
  }

  onerror(cb: (url: string, msg: string) => void) {
    this.errorcbs.push(cb);
  }

  onnotice(cb: (url: string, msg: string) => void) {
    this.noticecbs.push(cb);
  }
}
