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

let relaypool = new RelayPool(relays)

let sub=relayPool.sub([{
    authors: '32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245'
  }], relays)

sub.onevent((event, isAfterEose, relayURL) =>
    console.log(event, isAfterEose, relayURL))

// Called for each relay with the events that were received from the particular server
sub.oneose((events, relayURL) =>
    { console.log(events, relayURL) })
```
