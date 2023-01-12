# nostr-relaypool-ts
A Nostr RelayPool implementation in TypeScript using https://github.com/nbd-wtf/nostr-tools library as a dependency. 

Its main goal is to make it simpler to build a client on top of it than just a dumb RelayPool implementation.

Features (all features are turned on by default, but can be turned off if needed):
  - Caching events: every event searched by id or event of Metadata or Contacts kind are cached.
    Returning cached data can be turned off for each filter
  - Merging filters: separate filters with the same type of query (like asking for different authors with the same
    kinds) are automatically merged for every subscription request to decrease the number of filters,
    as the server usually handles it better.
  - Deleting empty filters: filters with no possible match are deleted, and subscription is not even created if there
    would be no valid event.
  - Duplicate events from cache / different relays are emitted only once
  - If an event with kind 0 / 3 is emitted, older events with the same author and kind are not emitted. The last
    emitted event with that kind and author is always the freshest.

Next prioritized feature for 0.4 release:

The next big usability impovement coming soon will be delayed subscriptions,
that allows clients to request data from different components, and let the RelayPool implementation
merge, deduplicate, prioritize, cache these requests and split the replies to send to each subscription
from the clients.

Installation:

```bash
npm i nostr-relaypool
```

Usage:

```typescript
import { RelayPool } from 'nostr-relaypool'

let relays = ["wss://relay.damus.io",
              "wss://nostr.fmt.wiz.biz",
              "wss://nostr.bongbong.com"];

let relaypool = new RelayPool(relays)

let unsub=relayPool.subscribe([
        { authors: '32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245' },
        { kinds: [0], authors: '0000000035450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245',
        relay: "wss://nostr.sandwich.farm" }
    ], 
    relays,
    (event, isAfterEose, relayURL) => { console.log(event, isAfterEose, relayURL) },
    (events, relayURL) => { console.log(events, relayURL); }
    )
    
relayPool.onerror = (err) => {
    console.log("RelayPool error", err);
}
relayPool.onnotice((notice) => {
    console.log("RelayPool notice", notice);
})

```
<br/>

API documentation:


```typescript
RelayPool(relays:string[] = [], options:{noCache?: boolean} = {})
```

RelayPool constructor connects to the given relays, but it doesn't determine which relays are used for specific subscriptions.

It caches all events and returns filtering id and 0 / 3 kinds with requested pubkeys from cache.

options:
  - noCache: turns off caching of events that is done by default.

<br/>

```typescript
 RelayPool::subscribe(filters: Filter & {relay?: string, noCache?: boolean},
                      relays: string[],
                      onevent: (event: Event & {id: string}, isAfterEose: boolean,
                          relayURL: string | undefined) => void,
                      oneose?: (events, relayURL) => void,
                      options: {allowDuplicateEvents?: boolean, allowOlderEvents?: boolean} = {})
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

- onevent: 
  
  Other RelayPool implementations allow calling onevent multiple times
      on a Subscription class, which was the original design in this library as well, but
      since caching is implemented, it's safer API design to pass onevent inside the
        subscribe call.

  Events that are read from the cache will be called back immediately 
    with relayURL === undefined.

  isAfterEose is true if the event was recieved from a relay after the EOSE message.
  isAfterEose is always false for cached events.

- oneose: called for each EOSE event received from a relay with the events
       that were received from the particular server.

- options:

  - allowDuplicateEvents: by default duplicate events with the same id are filtered out.
        This option removes duplicate event filtering.
  
  - allowOlderEvents: if a subscription emitted an event with kind 0 or 3 (metadata / contacts),
    it doesn't allow emitting older events by default. This option overrides that filter.


Other API functions:
```typescript
RelayPool::publish(event: Event, relays: string[])

RelayPool::onnotice(cb: (msg: string)=>void)

RelayPool::onerror(cb: (msg: string)=>void)
```
