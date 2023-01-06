# nostr-relaypool-ts
A Nostr RelayPool implementation in TypeScript using only https://github.com/nbd-wtf/nostr-tools library as a dependency 

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

// let relaypool = new RelayPool() is also correct, as relayPool.sub / pub automatically connects to the servers.
let relaypool = new RelayPool(relays)

// If you pass relay to a filter, it will be requested only from that relay.
// Filters that don't have relay set will be sent to the passed relays.
// There will be at most 1 subscription created for each relay even if it's passed multiple times
//    in relay / relays.
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
