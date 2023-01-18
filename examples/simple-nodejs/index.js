let NostrRelayPool = require("nostr-relaypool");
let RelayPool = NostrRelayPool.RelayPool;

let relayPool = new RelayPool();
relayPool.subscribe(
  [
    {
      authors: [
        "32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245",
      ],
      limit: 20,
    },
  ],
  [
    "wss://relay.damus.io",
    "wss://nostr.fmt.wiz.biz",
    "wss://relay.snort.social",
  ],
  (event) => console.log(event.id)
);
