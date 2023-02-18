# nostr-relaypool-ts

A Nostr RelayPool implementation in TypeScript using https://github.com/nbd-wtf/nostr-tools library as a dependency.

Its main goal is to make it simpler to build a client on top of it than just a dumb RelayPool implementation.

Features (all features are turned on by default, but can be turned off if needed):

- Caching events: every event searched by id or event of Metadata or Contacts kind are cached in memory.
  Returning cached data can be turned off for each filter
- Merging filters: separate filters with the same type of query (like asking for different authors with the same
  kinds) are automatically merged for every subscription request to decrease the number of filters,
  as the server usually handles it better.
- Deleting empty filters: filters with no possible match are deleted, and subscription is not even created if there
  would be no valid event.
- Duplicate events from cache / different relays are emitted only once
- If an event with kind 0 / 3 is emitted, older events with the same author and kind are not emitted. The last
  emitted event with that kind and author is always the freshest.
- A big usability impovement implemented (but not yet tested) are delayed subscriptions,
  that allows clients to request data from different components, and let the RelayPool implementation
  merge, deduplicate, prioritize, cache these requests and split the replies to send to each subscription
  from the clients. It needs lots of testing and optimizations to get it to production level, but prototyping is important
  at this stage.
- async getEventById can be used to get one event (which can be cached). It works together well with delayed subscriptions,
  as it's not good to send a subscription for just 1 event.

# Installation:

```bash
npm i nostr-relaypool
```

# Installation for use in NodeJS

```bash
npm i nostr-relaypool ws
```

# Usage:

```typescript
import {RelayPool} from "nostr-relaypool";

let relays = [
  "wss://relay.damus.io",
  "wss://nostr.fmt.wiz.biz",
  "wss://nostr.bongbong.com",
];

let relayPool = new RelayPool(relays);

let unsub = relayPool.subscribe(
  [
    {
      authors: [
        "32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245",
      ],
    },
    {
      kinds: [0],
      authors: [
        "0000000035450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245",
      ],
      relay: "wss://nostr.sandwich.farm",
    },
  ],
  relays,
  (event, isAfterEose, relayURL) => {
    console.log(event, isAfterEose, relayURL);
  },
  undefined,
  (events, relayURL) => {
    console.log(events, relayURL);
  }
);

relayPool.onerror((err, relayUrl) => {
  console.log("RelayPool error", err, " from relay ", relayUrl);
});
relayPool.onnotice((relayUrl, notice) => {
  console.log("RelayPool notice", notice, " from relay ", relayUrl);
});
```

<br/>

# Experimental API wrapper for RelayPool

This is the first taste of an API wrapper that makes RelayPool easier to use. It's experimental (many methods haven't been tested at all) and subject to change significantly.

The first parameter is OnEvent, last parameter is always maxDelayms, and the middle parameter is limit if it's needed.

An unsubscribe function is returned, although it's not implemented yet.

```typescript
const pubkey =
  "32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245";
const relays = [
  "wss://relay.damus.io",
  "wss://nostr.fmt.wiz.biz",
  "wss://relay.snort.social",
];
const relayPool = new RelayPool();
const author = new Author(relayPool, relays, pubkey);
author.metaData(console.log, 0);
author.follows(console.log, 0);
author.followers(console.log, 0);
author.subscribe([{kinds: [Kind.Contacts]}], console.log, 0);
author.allEvents(console.log, 5, 0);
author.referenced(console.log, 5, 0);
author.followers(console.log, 50, 0);
author.sentAndRecievedDMs(console.log, 50, 0);
author.text(console.log, 10, 0);
```

# API documentation:

```typescript
RelayPool(relays:string[] = [], options:{noCache?: boolean, dontLogSubscriptions?: boolean,
          keepSignature?: boolean, skipVerification?: boolean} = {})
```

RelayPool constructor connects to the given relays, but it doesn't determine which relays are used for specific subscriptions.

It caches all events and returns filtering id and 0 / 3 kinds with requested pubkeys from cache.

options:

- noCache: turns off caching of events that is done by default.
- dontLogSubscriptions: turns of logging subscriptions.
  It's on by default as it's just 1 entry per RelayPool subscription, and it can help clients significantly
- keepSignature: keep signatures for events
- skipVerification: skip event signature verification

<br/>

```typescript
 RelayPool::subscribe(filters: Filter & {relay?: string, noCache?: boolean},
                      relays: string[],
                      onEvent: (event: Event & {id: string}, isAfterEose: boolean,
                          relayURL: string | undefined) => void,
                      maxDelayms?: number,
                      onEose?: (events, relayURL, minCreatedAt) => void,
                      options: {allowDuplicateEvents?: boolean, allowOlderEvents?: boolean,
                          logAllEvents?: boolean} = {}
              ) : () => void
```

Creates a subscription to a list of filters and sends them to a pool of relays if
new data is required from those relays.

- filters:

  If the relay property of a filter is set, that filter will be requested only from that relay.
  Filters that don't have relay set will be sent to the relays passed inside
  the relays parameter. There will be at most 1 subscription created for each relay
  even if it's passed multiple times in relay / relays.

  The implementation finds filters in the subscriptions that only differ in 1 key and
  merges them both on RelayPool level and Relay level.
  The merging algorithm is linear in input size (not accidental O(n^2)).
  It also removes empty filters that are guaranteed to not match any events.

  noCache inside a filter instructs relayPool to never return
  cached results for that specific filter, but get them from a subscription.
  (maybe refresh or revalidate would be a better name, but noCache was selected
  as it's defined in the Cache-Control header of the HTTP standard).
  It may only be useful if kinds 0, 3 are requested.

  If no real work would be done by a relay (all filters are satisfied from cache or empty) the subscription will not be sent
  (but the cached events will be provided instantly using the onEvent callback).

- relays: Events for filters that have no relay field set will be requested from
  all the specified relays.

- onEvent:

  Other RelayPool implementations allow calling onevent multiple times
  on a Subscription class, which was the original design in this library as well, but
  since caching is implemented, it's safer API design to pass onevent inside the
  subscribe call.

  Events that are read from the cache will be called back immediately
  with relayURL === undefined.

  isAfterEose is true if the event was recieved from a relay after the EOSE message.
  isAfterEose is always false for cached events.

- maxDelayms: Adding maxDelay option delays sending subscription requests, batching them and matching them after the events come back.

It's called maxDelay instead of delay, as subscribing with a maxDelay of 100ms and later subscribing with infinity time will reset the timer to 100ms delay.

The first implementation uses matchFilter (O(n^2)) for redistributing events that can be easily optimized if the abstraction is successful.

If it's used, the returned function doesn't do anything. It can't be used together with onEose.

- onEose: called for each EOSE event received from a relay with the events
  that were received from the particular server. Can't be used together with maxDelayms

  minCreatedAt contains the smallest created_at seen or Infinity if there were no events in the subscription.

- options:

  - allowDuplicateEvents: by default duplicate events with the same id are filtered out.
    This option removes duplicate event filtering.

  - allowOlderEvents: if a subscription emitted an event with kind 0 or 3 (metadata / contacts),
    it doesn't allow emitting older events by default. This option overrides that filter.

  - logAllEvents: Log all events that are sent back to separate subscriptions. It can be a lot of events,
    so this option is only advised for application development, especially debugging.

Return value:

Returns a function that stops sending more data with the onEvent callback. When all virtual subscriptions are unsubscribed,
an unsubscribe request is sent to all relays.

```typescript
 RelayPool::sendSubscriptions(onEose?: (events, relayURL) => void) : () => void
```

Sends subscriptions queued up with delayed subscriptions. It can be used after all subscriptions are requested (with some delay or Infinite delay).

```typescript
  async getEventById(id: string, relays: string[], maxDelayms: number) : Promise<Event&{id: string}> {
```

Gets one event by event id. Many similar subscriptions should be batched together. It is useful inside a component when many components are rendered.

Other API functions:

```typescript
RelayPool::publish(event: Event, relays: string[])

RelayPool::onnotice(cb: (url: string, msg: string) => void)

RelayPool::onerror(cb: (url: string, msg: string) => void)

new Author(relayPool: RelayPool, relays: string[], pubkey: string)

Author::metaData(cb: (event: Event) => void, maxDelayms: number): () => void

Author::subscribe(filters: Filter[], cb: OnEvent, maxDelayms: number): () => void

Author::followsPubkeys(cb: (pubkeys: string[]) => void, maxDelayms: number): () => void

Author::follows(cb: (authors: Author[]) => void, maxDelayms: number): () => void

Author::allEvents(cb: OnEvent, limit = 100, maxDelayms: number): () => void

Author::referenced(cb: OnEvent, limit = 100, maxDelayms: number): () => void

Author::followers(cb: OnEvent, limit = 100, maxDelayms: number): () => void

Author::sentAndRecievedDMs(cb: OnEvent, limit = 100, maxDelayms: number): () => void

Author::text(cb: OnEvent, limit = 100, maxDelayms: number): () => void

collect(onEvents: (events: Event[]) => void): OnEvent  // Keeps events array sorted by created_at

```

# Support:

Telegram: @AdamRitter

npub1dcl4zejwr8sg9h6jzl75fy4mj6g8gpdqkfczseca6lef0d5gvzxqvux5ey
