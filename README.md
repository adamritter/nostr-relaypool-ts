# nostr-relaypool-ts
A Nostr RelayPool implementation in TypeScript using https://github.com/nbd-wtf/nostr-tools library as a dependency 

Installation:

```bash
npm i nostr-relaypool
```

Usage:

```typescript
import { RelayPool } from 'nostr-relaypool'

// RelayPool(relays:string[] = [], options:{noCache?: boolean} = {})
// RelayPool constructor connects to the given relays, but it doesn't determine which relays are used for specific
//    subscriptions.
// It caches all events and returns filtering id and 0 / 3 kinds with requested pubkeys from cache.
//
// options:
//   - noCache: turns off caching that of events that is done by default.
let relays = ["wss://relay.damus.io",
              "wss://nostr.fmt.wiz.biz",
              "wss://nostr.bongbong.com"];

let relaypool = new RelayPool(relays)

// RelayPool::sub(filters: Filter & {relay?: string, noCache?: boolean}, relays: string[]) : Subscription
//
// If you set the relay property of a filter, that filter will be requested only from that relay.
// Filters that don't have relay set will be sent to the relays passed inside the relays parameter.
// There will be at most 1 subscription created for each relay even if it's passed multiple times
//    in relay / relays.
//
// The implementation finds filters in the subscriptions that only differ in 1 key and
//    merges them both on RelayPool level and Relay level.
// The merging algorithm is linear in input size (not accidental O(n^2)).
// It also removes empty filters that are guaranteed to not match any events.
// 
// noCache inside a filter instructs relayPool to never return
//   cached results for that specific filter, but get them from a subscription.
// (maybe refresh or revalidate would be a better name, but noCache was selected
//   as it's defined in the Cache-Control header of the HTTP standard).
// It may only be useful if kinds 0, 3 are requested.

let sub=relayPool.sub([
    { authors: '32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245' },
    { kinds: [0], authors: '0000000035450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245',
       relay: "wss://nostr.sandwich.farm" }
    ], relays)

sub.onevent((event, isAfterEose, relayURL) =>
    { console.log(event, isAfterEose, relayURL) })

// Called for each relay with the events that were received from the particular server
sub.oneose((events, relayURL) =>
    { console.log(events, relayURL) })
```
