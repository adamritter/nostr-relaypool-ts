import type {Event} from "nostr-tools";
import {OnEose, OnEvent, SubscriptionOptions} from "./relay-pool";

export class RelayPoolWorker {
  // eslint-disable-next-line no-undef
  private worker: Worker;
  private subscriptionCallbacks = new Map<
    number | string,
    {onEvent: OnEvent; onEose?: OnEose}
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
    return new Promise((resolve) => {
      const listener = (event: MessageEvent) => {
        if (event.data.type === "metadata" && event.data.pubkey === pubkey) {
          this.worker.removeEventListener("message", listener);
          resolve(event.data.metadata);
        }
      };

      this.worker.addEventListener("message", listener);
      this.worker.postMessage({
        action: "fetch_and_cache_metadata",
        data: {pubkey},
      });
    });
  }

  fetchAndCacheContactList(pubkey: string): Promise<string[]> {
    return new Promise((resolve) => {
      const listener = (event: MessageEvent) => {
        if (event.data.type === "contactList" && event.data.pubkey === pubkey) {
          this.worker.removeEventListener("message", listener);
          resolve(event.data.contactList);
        }
      };

      this.worker.addEventListener("message", listener);
      this.worker.postMessage({
        action: "fetch_and_cache_contact_list",
        data: {pubkey},
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
}
