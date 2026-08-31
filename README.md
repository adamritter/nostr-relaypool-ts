# nostr-relaypool-ts

A Nostr RelayPool implementation in TypeScript using the modern `nostr-tools` (v2+) library.

Its main goal is to make it simpler to build a client on top of it than just a dumb RelayPool implementation.

Features:

- **NIP-65 Support:** Fully supports the "Outbox Model". Automatically discovers write relays for authors using `Kind 10002` events.
- **Smart Filter Merging:** Separate filters with the same type of query (like asking for different authors with the same kinds) are automatically merged to decrease the number of subscriptions.
- **Optimized Caching:** 
  - **LRU Event Cache:** Optional in-memory cache with Least Recently Used eviction policy to manage memory usage.
  - **Deduplication:** Duplicate events from different relays are parsed and verified only once.
- **Web Worker Support:** Offload heavy crypto and processing to a background thread for smooth UI performance.
- **Resilience:** Automatic reconnection, signature verification, and robust error handling.

# Installation

```bash
npm i nostr-relaypool
```

# Usage

```typescript
import { RelayPool } from "nostr-relaypool";

const relays = [
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://relay.snort.social",
];

const relayPool = new RelayPool(relays, { useEventCache: true, eventCacheCapacity: 5000 });

// Subscribe to events
const unsub = relayPool.subscribe(
  [
    {
      authors: ["32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245"],
      kinds: [1],
      limit: 10,
    },
  ],
  relays,
  (event, isAfterEose, relayURL) => {
    console.log(`Received event ${event.id} from ${relayURL}`);
  },
  undefined,
  (relayURL, minCreatedAt) => {
    console.log(`EOSE from ${relayURL}`);
  }
);

// NIP-65: Subscribe without specifying relays (uses Outbox Model)
// The pool will automatically find write relays for the author.
relayPool.subscribe(
  [{ authors: ["32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245"], kinds: [1] }],
  undefined, // relays undefined
  (event) => console.log("Event via Outbox:", event.id)
);
```

# Web Worker Support

For high-performance applications, run the RelayPool in a Web Worker to keep your main thread responsive.

See the [complete example](examples/web-worker/README.md).

```typescript
import { RelayPoolWorker } from 'nostr-relaypool';

const worker = new Worker(
  new URL('./node_modules/nostr-relaypool/lib/nostr-relaypool.worker.js', import.meta.url)
);
const relayPool = new RelayPoolWorker(worker);

relayPool.onerror((url, err) => console.error(url, err));
relayPool.subscribe(..., ...);
```

# CLI Example

Two CLI entrypoints live under `examples/cli`: `auto.ts` runs a fully automated flow (connect, fetch, publish, exit) and `manual.ts` keeps a prompt open so you can publish on demand.

- `npm run auto` (alias `npm run start`) executes `examples/cli/auto.ts` with ts-node, hits your local `ws://localhost:8081` relay, logs status changes, collects recent kind 1 notes, publishes one, and stops.
- `npm run manual` starts `examples/cli/manual.ts`, which opens a `nostr>` prompt, prints relay statuses/notices/events, and accepts `help`, `status`, `publish`, and exit commands.
- Override relays or reuse a key by setting `NOSTR_RELAYS="wss://relay.example.org"` and/or `NOSTR_PRIVATE_KEY=<hex-sk>` before running either script.

Read `examples/cli/README.md` for more detail on both workflows.

# API Documentation

## `RelayPool` Constructor

```typescript
new RelayPool(relays?: string[], options?: RelayPoolOptions)
```

**Options:**

- `useEventCache` (boolean): Enable in-memory caching of events.
- `eventCacheCapacity` (number): Maximum number of events to hold in cache before evicting the least recently used. Default: 100,000.
- `logSubscriptions` (boolean): Log subscription details to console.
- `autoReconnect` (boolean): Automatically reconnect to disconnected relays.
- `skipVerification` (boolean): Skip signature verification (faster, but less secure).

## `subscribe`

```typescript
relayPool.subscribe(
  filters: Filter[],
  relays: string[] | undefined,
  onEvent: (event: Event, isAfterEose: boolean, relayURL: string | undefined) => void,
  maxDelayms?: number,
  onEose?: (relayURL: string, minCreatedAt: number) => void,
  options?: SubscriptionOptions
): () => void
```

- **filters**: Standard Nostr filters.
- **relays**: Array of relay URLs. If `undefined` and `authors` are present in filters, the pool will use NIP-65 to discover write relays.
- **maxDelayms**: If set, batches subscriptions created within this window.

## Other Methods

- `publish(event: Event, relays: string[])`: Publish an event to specific relays.
- `getEventById(id: string, relays: string[], maxDelayms: number)`: Fetch a single event.
- `close()`: Close all connections.

# Support

Telegram: @AdamRitter

npub1dcl4zejwr8sg9h6jzl75fy4mj6g8gpdqkfczseca6lef0d5gvzxqvux5ey

---

# DEPRECATED: Experimental API wrapper for RelayPool

The `Author` class and related methods below are deprecated and may be removed in future versions. They are retained for backward compatibility.

```typescript
// ... (Legacy Author API)
```
