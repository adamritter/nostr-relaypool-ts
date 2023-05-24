/* eslint-disable no-undef */
// worker.ts
import {RelayPool, type SubscriptionOptions} from "./relay-pool";
import type {Event} from "nostr-tools";

let relayPool: RelayPool;
// eslint-disable-next-line no-spaced-func
let subscriptions = new Map<number, () => void>();

interface MessageData {
  action: string;
  data: any;
}

self.onmessage = (event: MessageEvent<MessageData>) => {
  const {action, data} = event.data;

  switch (action) {
    case "create_relay_pool":
      relayPool = new RelayPool(data.relays, data.options);

      // Set event listeners
      relayPool.onerror((err, relayUrl) => {
        postMessage({type: "error", err, relayUrl});
      });

      relayPool.onnotice((relayUrl, notice) => {
        postMessage({type: "notice", relayUrl, notice});
      });
      break;

    case "subscribe":
      const subscriptionId = data.subscriptionId;
      const unsub = relayPool.subscribe(
        data.filters,
        data.relays,
        (event: Event, isAfterEose: boolean, relayURL: string | undefined) => {
          postMessage({
            type: "event",
            subscriptionId,
            event,
            isAfterEose,
            relayURL,
          });
        },
        data.maxDelayms,
        data.onEose
          ? (relayURL: string, minCreatedAt: number) => {
              postMessage({
                type: "eose",
                subscriptionId,
                relayURL,
                minCreatedAt,
              });
            }
          : undefined,
        data.options as SubscriptionOptions
      );
      subscriptions.set(subscriptionId, unsub);
      postMessage({type: "subscribed", subscriptionId});
      break;

    case "unsubscribe":
      const {subscriptionId: idToUnsubscribe} = data;
      const unsubscribe = subscriptions.get(idToUnsubscribe);
      if (unsubscribe) {
        unsubscribe();
        subscriptions.delete(idToUnsubscribe);
      }
      break;

    case "publish":
      relayPool.publish(data.event, data.relays);
      break;

    case "set_write_relays_for_pub_key":
      relayPool.setWriteRelaysForPubKey(
        data.pubkey,
        data.writeRelays,
        data.created_at
      );
      break;

    case "subscribe_referenced_events":
      const subRefId = data.subscriptionId;
      const unsubRef = relayPool.subscribeReferencedEvents(
        data.event,
        (event: Event, isAfterEose: boolean, relayURL: string | undefined) => {
          postMessage({
            type: "event",
            subscriptionId: subRefId,
            event,
            isAfterEose,
            relayURL,
          });
        },
        data.maxDelayms,
        data.onEose
          ? (relayURL: string, minCreatedAt: number) => {
              postMessage({
                type: "eose",
                subscriptionId: subRefId,
                relayURL,
                minCreatedAt,
              });
            }
          : undefined,
        data.options as SubscriptionOptions
      );
      subscriptions.set(subRefId, unsubRef);
      postMessage({type: "subscribed", subscriptionId: subRefId});
      break;

    case "fetch_and_cache_metadata":
      relayPool.fetchAndCacheMetadata(data.pubkey).then((metadata: Event) => {
        postMessage({type: "metadata", pubkey: data.pubkey, metadata});
      });
      break;

    case "fetch_and_cache_contact_list":
      relayPool
        .fetchAndCacheContactList(data.pubkey)
        .then((contactList: Event) => {
          postMessage({type: "contactList", pubkey: data.pubkey, contactList});
        });
      break;

    case "subscribe_referenced_events_and_prefetch_metadata":
      const subPrefetchId = data.subscriptionId;
      const unsubPrefetch =
        relayPool.subscribeReferencedEventsAndPrefetchMetadata(
          data.event,
          (
            event: Event,
            isAfterEose: boolean,
            relayURL: string | undefined
          ) => {
            postMessage({
              type: "event",
              subscriptionId: subPrefetchId,
              event,
              isAfterEose,
              relayURL,
            });
          },
          data.maxDelayms,
          data.onEose
            ? (relayURL: string, minCreatedAt: number) => {
                postMessage({
                  type: "eose",
                  subscriptionId: subPrefetchId,
                  relayURL,
                  minCreatedAt,
                });
              }
            : undefined,
          data.options as SubscriptionOptions
        );
      subscriptions.set(subPrefetchId, unsubPrefetch);
      postMessage({type: "subscribed", subscriptionId: subPrefetchId});
      break;

    case "set_cached_metadata":
      relayPool.setCachedMetadata(data.pubkey, data.metadata);
      break;

    case "close":
      subscriptions.clear();
      relayPool.close();
      break;

    default:
      console.error("Unknown action:", action);
  }
};

export {}; // This is necessary to make this module a "module" in TypeScript
