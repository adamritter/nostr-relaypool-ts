/* eslint-env jest */

import {jest} from "@jest/globals";

jest.setTimeout(15000); // Global test timeout

import {
  generateSecretKey,
  getPublicKey,
  finalizeEvent,
  type Event,
} from "nostr-tools";
import {InMemoryRelayServer} from "./in-memory-relay-server";
import {SubscriptionFilterStateCache} from "./subscription-filter-state-cache";
import {createAndConnectRelay, closeRelayAndServer, sleepms, waitUntil, WebSocketStates} from "./test-utils";
import {Kind} from "./kind";
import {assertEqual, assertTrue, assertDefined, assertThrows, assertNotEqual, assertGreaterThanOrEqual} from "./assert-utils";

const mockGetZapEndpoint = jest.fn();
const mockMakeZapRequest = jest.fn();
let RelayPool: typeof import("./relay-pool").RelayPool;

describe("RelayPool Advanced Features", () => {

  beforeAll(async () => {
    await jest.unstable_mockModule("nostr-tools/nip57", async () => {
      const actual = await jest.requireActual("nostr-tools/nip57");
      return {
        ...actual,
        getZapEndpoint: mockGetZapEndpoint,
        makeZapRequest: mockMakeZapRequest,
      };
    });
    RelayPool = (await import("./relay-pool")).RelayPool;
  });

  // Helper to get a unique port for each server instance
  function getUniquePort(): number {
    return Math.floor(Math.random() * 1000) + 8100; // Ports from 8100-9099
  }


  // Mock makeZapRequest to return a simple event template
  mockMakeZapRequest.mockImplementation((params) => {
    return {
      kind: 9734, // ZapRequest kind
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ["p", params.profile],
        ["amount", (params.amount || 0).toString()],
        ["relays", ...(params.relays || [])],
        ...(params.event ? [["e", params.event]] : []),
      ],
      content: params.comment || "",
    };
  });

  // Helper to publish an event and ensure it's in a server
  async function publishAndEnsureEvent(relaypool: RelayPool, server: InMemoryRelayServer, event: Event, relays: string[]): Promise<void> {
    relaypool.publish(event, relays);
    await waitUntil(() => server.events.some(e => e.id === event.id));
  }


  test("filter merging and deduplication", async () => {
    const port1 = getUniquePort();
    const port2 = getUniquePort();
    const server1 = new InMemoryRelayServer(port1);
    const server2 = new InMemoryRelayServer(port2);
    const relaypool = new RelayPool([], {
      subscriptionCache: true,
      useEventCache: true,
    });
    relaypool.addOrGetRelay(`ws://localhost:${port1}/`);
    relaypool.addOrGetRelay(`ws://localhost:${port2}/`);

    const sk = generateSecretKey();
    const event = finalizeEvent(
      {
        kind: Kind.Text,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: "Test event for merging",
      },
      sk
    );
    relaypool.publish(event, [`ws://localhost:${port1}/`, `ws://localhost:${port2}/`]);

    let receivedEventsCount = 0;
    const eventPromise = new Promise<void>((resolve) => {
      relaypool.subscribe(
        [{authors: [getPublicKey(sk)]}],
        [`ws://localhost:${port1}/`, `ws://localhost:${port2}/`],
        (e) => {
          receivedEventsCount++;
          // Should only receive it once due to deduplication
          assertEqual(receivedEventsCount, 1);
          assertEqual(e.id, event.id);
          resolve();
        },
        0
      );
    });
    await eventPromise;
    assertEqual(receivedEventsCount, 1);
    await relaypool.close();
    await server1.close();
    await server2.close();
  });

  test("NIP-65 Relay Discovery (Kind 10002)", async () => {
    const port1 = getUniquePort();
    const port2 = getUniquePort();
    const server1 = new InMemoryRelayServer(port1);
    const server2 = new InMemoryRelayServer(port2);
    const relaypool = new RelayPool([], {
      subscriptionCache: true,
      useEventCache: true,
    });
    relaypool.addOrGetRelay(`ws://localhost:${port1}/`); // Add server1 to pool
    relaypool.addOrGetRelay(`ws://localhost:${port2}/`); // Add server2 to pool

    const authorSk = generateSecretKey();
    const authorPk = getPublicKey(authorSk);
    const targetRelayUrl = `ws://localhost:${port1}/`;
    const discoveryRelayUrl = `ws://localhost:${port2}/`;

    // 1. Publish NIP-65 relay list event for the author to the discovery relay
    const relayListEvent = finalizeEvent(
      {
        kind: Kind.RelayList,
        created_at: Math.floor(Date.now() / 1000),
        tags: [["r", targetRelayUrl, "write"]],
        content: "",
      },
      authorSk,
    );
    await publishAndEnsureEvent(relaypool, server2, relayListEvent, [discoveryRelayUrl]);

    // Override metadataCache.relays for this test to look at discoveryRelay
    // @ts-ignore
    relaypool.writeRelays.relays = [discoveryRelayUrl];

    // 2. Publish a test event to the target relay
    const testEvent = finalizeEvent(
      {
        kind: Kind.Text,
        created_at: Math.floor(Date.now() / 1000) + 10,
        tags: [],
        content: "Hello NIP-65!",
      },
      authorSk,
    );
    await publishAndEnsureEvent(relaypool, server1, testEvent, [targetRelayUrl]);

    // 3. Subscribe to the author's events without specifying relays
    // It should discover the targetRelayUrl via NIP-65
    let receivedEvent: Event | undefined;
    await new Promise<void>((resolve) => {
      relaypool.subscribe(
        [{authors: [authorPk], kinds: [Kind.Text]}],
        undefined, // Relays undefined to trigger NIP-65 discovery
        (e) => {
          receivedEvent = e;
          resolve();
        },
        0, // Immediate subscription
      );
    });

    assertDefined(receivedEvent);
    assertEqual(receivedEvent?.id, testEvent.id);
    await relaypool.close();
    await server1.close();
    await server2.close();
  }, 20000); // Extended timeout for NIP-65 test

  test("NIP-42 Authentication Flow", async () => {
    const sk = generateSecretKey();
    const pk = getPublicKey(sk);
    const authRelayPort = getUniquePort();
    const authServer = new InMemoryRelayServer(authRelayPort);
    authServer.auth = "test-challenge";

    const relaypool = new RelayPool([], {
      subscriptionCache: true,
      useEventCache: true,
    });
    relaypool.addOrGetRelay(`ws://localhost:${authRelayPort}/`); // Add relay to pool

    let onAuthCalled = false;
    const authPromise = new Promise<void>((resolve) => {
      relaypool.onauth((r, challenge) => {
        assertEqual(r.url, `ws://localhost:${authRelayPort}/`);
        assertEqual(challenge, "test-challenge");
        relaypool.authenticate(`ws://localhost:${authRelayPort}/`, challenge, sk as any);
        onAuthCalled = true;
        resolve();
      });
    });

    // Trigger connection/auth by trying to publish (or subscribe)
    const event = finalizeEvent({kind: Kind.Text, created_at: Math.floor(Date.now()/1000), tags: [], content: "Auth test"}, sk);
    relaypool.publish(event, [`ws://localhost:${authRelayPort}/`]);

    await authPromise;
    assertTrue(onAuthCalled);

    await relaypool.close();
    await authServer.close();
  }, 15000); // Extended timeout for auth test

  test("NIP-57 Zap Flow", async () => {
    const zapperSk = generateSecretKey();
    const zappeeSk = generateSecretKey();
    const zappeePk = getPublicKey(zappeeSk);
    const amountSats = 1000;
    const comment = "Great content!";
    const targetRelayPort = getUniquePort();
    const targetServer = new InMemoryRelayServer(targetRelayPort);

    const relaypool = new RelayPool([], {
      subscriptionCache: true,
      useEventCache: true,
    });
    relaypool.addOrGetRelay(`ws://localhost:${targetRelayPort}/`); // Add target relay to pool
    
    // Setup zappee's metadata with LNURL
    const zappeeMetadataEvent = finalizeEvent(
      {
        kind: Kind.Metadata,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: JSON.stringify({
          name: "zappee",
          lud16: `test@test.com` // Mock LUD16 for the test
        }),
      },
      zappeeSk
    );
    
    // Publish zappee's metadata to the relay
    await publishAndEnsureEvent(relaypool, targetServer, zappeeMetadataEvent, [`ws://localhost:${targetServer.port}/`]);
  
    // Override metadataCache.relays for this test to look at targetRelay
    // @ts-ignore
    relaypool.metadataCache.relays = [`ws://localhost:${targetServer.port}/`];

    // Configure the mock implementations for this test
    mockGetZapEndpoint.mockImplementation(async (metadata) => {
      return "http://localhost:8080/zap_callback"; // Directly return the mock callback URL
    });
  
    // Mock global.fetch for the final invoice request
    const mockFetch = jest.spyOn(global, 'fetch').mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      if (url.startsWith("http://localhost:8080/zap_callback")) { // Match URL with query parameters
        return Promise.resolve(new Response(JSON.stringify({
          pr: "lnbc1invoice..." // Mock invoice
        })));
      }
      // Fallback for unmatched calls, return a valid Response object with an error
      return Promise.resolve(new Response(JSON.stringify({ error: `Mocked fetch: unexpected URL: ${url}` }), { status: 404 }));
    });
  
    const { zapRequestEvent, invoice } = await relaypool.zap(
      zapperSk as any, // Private key of the zapper (string)
      zappeePk, // Pubkey of the zappee
      amountSats,
      comment,
    );
  
    assertDefined(zapRequestEvent);
    assertEqual(zapRequestEvent.kind, Kind.ZapRequest);
    assertEqual(zapRequestEvent.pubkey, getPublicKey(zapperSk));
    assertEqual(invoice, "lnbc1invoice...");    
    
    // Publish the zap request event through the pool
    relaypool.publish(zapRequestEvent, [`ws://localhost:${targetServer.port}/`]);
  
    // Verify the zap request event is received by the mock relay
    let receivedZapEvent: Event | undefined;
    await new Promise<void>((resolve) => {
      const sub = relaypool.subscribe(
        [{ ids: [zapRequestEvent.id] }],
        [`ws://localhost:${targetServer.port}/`],
        (e) => {
          receivedZapEvent = e;
          resolve();
        },
        0, // Immediate subscription
      );
    });
  
    assertDefined(receivedZapEvent);
    assertEqual(receivedZapEvent?.id, zapRequestEvent.id);
  
    mockFetch.mockRestore();
    mockGetZapEndpoint.mockReset();

    await relaypool.close();
    await targetServer.close();
  }, 15000); // Extended timeout

  test("NIP-50 Search Flow", async () => {
    const authorSk = generateSecretKey();
    const authorPk = getPublicKey(authorSk);
    const searchTerm = "awesome nostr";
    const targetRelayPort = getUniquePort();
    const targetServer = new InMemoryRelayServer(targetRelayPort);

    const relaypool = new RelayPool([], {
      subscriptionCache: true,
      useEventCache: true,
    });
    relaypool.addOrGetRelay(`ws://localhost:${targetRelayPort}/`); // Add target relay to pool

    const searchEvent = finalizeEvent(
      {
        kind: Kind.Text,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: `This is an ${searchTerm} event.`,
      },
      authorSk,
    );

    // Publish the search event to the relay
    await publishAndEnsureEvent(relaypool, targetServer, searchEvent, [`ws://localhost:${targetServer.port}/`]);

    // Subscribe using the search method
    let receivedSearchEvent: Event | undefined;
    await new Promise<void>((resolve) => {
      const sub = relaypool.search(
        searchTerm,
        [`ws://localhost:${targetServer.port}/`],
        (e) => {
          receivedSearchEvent = e;
          resolve();
        },
        0, // Immediate subscription
      );
    });

    assertDefined(receivedSearchEvent);
    assertEqual(receivedSearchEvent?.id, searchEvent.id);
    assertTrue(receivedSearchEvent?.content.includes(searchTerm) || false);

    await relaypool.close();
    await targetServer.close();
  }, 15000); // Extended timeout for search test

  test("EventCache LRU eviction", async () => {
    const capacity = 2;
    const targetRelayPort = getUniquePort();
    const targetServer = new InMemoryRelayServer(targetRelayPort);

    const relaypool = new RelayPool([], {
      subscriptionCache: true,
      useEventCache: true,
      eventCacheCapacity: capacity,
    });
    relaypool.addOrGetRelay(`ws://localhost:${targetRelayPort}/`); // Add target relay to pool

    // Subscribe to all text events so the relay echoes them back and they get cached
    relaypool.subscribe(
        [{kinds: [Kind.Text]}],
        [`ws://localhost:${targetRelayPort}/`],
        (e) => {}, // No-op callback, we just want the side effect of caching
        0
    );

    const event1 = finalizeEvent({kind: Kind.Text, created_at: 1, tags: [], content: "Event 1"}, generateSecretKey());
    const event2 = finalizeEvent({kind: Kind.Text, created_at: 2, tags: [], content: "Event 2"}, generateSecretKey());
    const event3 = finalizeEvent({kind: Kind.Text, created_at: 3, tags: [], content: "Event 3"}, generateSecretKey());

    // Add events - event1 should be evicted when event3 is added
    relaypool.publish(event1, [`ws://localhost:${targetRelayPort}/`]);
    relaypool.publish(event2, [`ws://localhost:${targetRelayPort}/`]);
    await waitUntil(() => relaypool.eventCache?.hasEventById(event2.id) || false); // Ensure event2 is in cache

    relaypool.publish(event3, [`ws://localhost:${targetRelayPort}/`]);
    await waitUntil(() => relaypool.eventCache?.hasEventById(event3.id) || false); // Ensure event3 is in cache

    // Check cache status
    assertEqual(relaypool.eventCache?.hasEventById(event1.id), false); // event1 should be evicted
    assertEqual(relaypool.eventCache?.hasEventById(event2.id), true);
    assertEqual(relaypool.eventCache?.hasEventById(event3.id), true);

    // Access event2 to make it most recent
    relaypool.getEventById(event2.id, [`ws://localhost:${targetRelayPort}/`], 0);

    const event4 = finalizeEvent({kind: Kind.Text, created_at: 4, tags: [], content: "Event 4"}, generateSecretKey());
    relaypool.publish(event4, [`ws://localhost:${targetRelayPort}/`]);
    await waitUntil(() => relaypool.eventCache?.hasEventById(event4.id) || false); // Ensure event4 is in cache

    assertEqual(relaypool.eventCache?.hasEventById(event3.id), false); // event3 should be evicted (LRU)
    assertEqual(relaypool.eventCache?.hasEventById(event2.id), true);
    assertEqual(relaypool.eventCache?.hasEventById(event4.id), true);
    await relaypool.close();
    await targetServer.close();
  }, 15000); // Extended timeout

  test("RelayPool closes all connections", async () => {
    const port1 = getUniquePort();
    const port2 = getUniquePort();
    const server1 = new InMemoryRelayServer(port1);
    const server2 = new InMemoryRelayServer(port2);

    const relaypool = new RelayPool([], {
      subscriptionCache: true,
      useEventCache: true,
    });
    relaypool.addOrGetRelay(`ws://localhost:${port1}/`);
    relaypool.addOrGetRelay(`ws://localhost:${port2}/`);

    await relaypool.close(); // Close the pool

    // Explicitly close servers as well
    await server1.close();
    await server2.close();
  });
});
