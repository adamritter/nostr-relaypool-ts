/* eslint-env jest */

import {
  signEvent,
  generatePrivateKey,
  getEventHash,
  getPublicKey,
  type Relay,
  type Event,
} from "nostr-tools";

import {relayInit} from "./relay";
import {InMemoryRelayServer} from "./in-memory-relay-server";
import WebSocket from "ws";

let relay: Relay;
let _relayServer: InMemoryRelayServer;

beforeAll(() => {
  _relayServer = new InMemoryRelayServer(8089);
});
beforeEach(() => {
  relay = relayInit("ws://localhost:8089/");
  relay.connect();
  _relayServer.clear();
});

afterEach(async () => {
  await relay.close();
});

afterAll(async () => {
  await _relayServer.close();
});

test("connectivity", () => {
  return expect(
    new Promise((resolve) => {
      relay.on("connect", () => {
        resolve(true);
      });
      relay.on("error", () => {
        resolve(false);
      });
    })
  ).resolves.toBe(true);
});

async function publishAndGetEvent(
  options: {content?: string} = {}
): Promise<Event & {id: string}> {
  const sk = generatePrivateKey();
  const pk = getPublicKey(sk);
  const event = {
    kind: 27572,
    pubkey: pk,
    created_at: Math.floor(Date.now() / 1000),
    tags: [],
    content: options.content || "nostr-tools test suite",
  };
  const eventId = getEventHash(event);
  // @ts-ignore
  event.id = eventId;
  // @ts-ignore
  event.sig = signEvent(event, sk);
  // console.log("publishing event", event);
  relay.publish(event);
  return new Promise((resolve) =>
    relay
      // @ts-ignore
      .sub([{ids: [event.id]}])
      .on("event", (event: Event & {id: string}) => {
        resolve(event);
      })
  );
}

test("querying", async () => {
  const event: Event & {id: string} = await publishAndGetEvent();
  var resolve1: (success: boolean) => void;
  var resolve2: (success: boolean) => void;

  const promiseAll = Promise.all([
    new Promise((resolve) => {
      resolve(true);
      resolve1 = resolve;
    }),
    new Promise((resolve) => {
      resolve2 = resolve;
      resolve(true);
    }),
  ]);

  const sub = relay.sub([
    {
      kinds: [event.kind],
    },
  ]);
  sub.on("event", (event: Event) => {
    expect(event).toHaveProperty("id", event.id);
    resolve1(true);
  });
  sub.on("eose", () => {
    resolve2(true);
  });

  return expect(promiseAll).resolves.toEqual([true, true]);
});

test("listening (twice) and publishing", async () => {
  const sk = generatePrivateKey();
  const pk = getPublicKey(sk);
  var resolve1: (success: boolean) => void;
  var resolve2: (success: boolean) => void;

  const sub = relay.sub([
    {
      kinds: [27572],
      authors: [pk],
    },
  ]);

  sub.on("event", (event: Event) => {
    expect(event).toHaveProperty("pubkey", pk);
    expect(event).toHaveProperty("kind", 27572);
    expect(event).toHaveProperty("content", "nostr-tools test suite");
    resolve1(true);
  });
  sub.on("event", (event: Event) => {
    expect(event).toHaveProperty("pubkey", pk);
    expect(event).toHaveProperty("kind", 27572);
    expect(event).toHaveProperty("content", "nostr-tools test suite");
    resolve2(true);
  });

  const event = {
    kind: 27572,
    pubkey: pk,
    created_at: Math.floor(Date.now() / 1000),
    tags: [],
    content: "nostr-tools test suite",
  };
  // @ts-ignore
  event.id = getEventHash(event);
  // @ts-ignore
  event.sig = signEvent(event, sk);

  relay.publish(event);
  return expect(
    Promise.all([
      new Promise((resolve) => {
        resolve1 = resolve;
      }),
      new Promise((resolve) => {
        resolve2 = resolve;
      }),
    ])
  ).resolves.toEqual([true, true]);
});

test("two subscriptions", async () => {
  const sk = generatePrivateKey();
  const pk = getPublicKey(sk);

  const event = {
    kind: 27572,
    pubkey: pk,
    created_at: Math.floor(Date.now() / 1000),
    tags: [],
    content: "nostr-tools test suite",
  };
  // @ts-ignore
  event.id = getEventHash(event);
  // @ts-ignore
  event.sig = signEvent(event, sk);

  await expect(
    new Promise((resolve) => {
      const sub = relay.sub([
        {
          kinds: [27572],
          authors: [pk],
        },
      ]);

      sub.on("event", (event: Event) => {
        expect(event).toHaveProperty("pubkey", pk);
        expect(event).toHaveProperty("kind", 27572);
        expect(event).toHaveProperty("content", "nostr-tools test suite");
        resolve(true);
      });
      relay.publish(event);
    })
  ).resolves.toEqual(true);

  await expect(
    new Promise((resolve) => {
      const sub = relay.sub([
        {
          kinds: [27572],
          authors: [pk],
        },
      ]);

      sub.on("event", (event: Event) => {
        expect(event).toHaveProperty("pubkey", pk);
        expect(event).toHaveProperty("kind", 27572);
        expect(event).toHaveProperty("content", "nostr-tools test suite");
        resolve(true);
      });
      relay.publish(event);
    })
  ).resolves.toEqual(true);
});

test("autoreconnect", async () => {
  expect(relay.status).toBe(WebSocket.CONNECTING);
  await publishAndGetEvent();
  expect(relay.status).toBe(WebSocket.OPEN);
  _relayServer.disconnectAll();
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(relay.status).toBeGreaterThanOrEqual(WebSocket.CLOSING);
  await publishAndGetEvent();
});

// jest -t 'relay memory' --testTimeout 1000000 --logHeapUsage
//  PASS  ./relay.test.ts (93.914 s, 480 MB heap size)
test.skip("relay memory usage", async () => {
  // @ts-ignore
  relay.relay.logging = false;

  await publishAndGetEvent({content: "x".repeat(20 * 1024 * 1024)});

  for (let i = 0; i < 300; i++) {
    await new Promise((resolve) => {
      const sub = relay.sub([{}]);
      sub.on("event", (event: Event) => {
        sub.unsub();
        resolve(true);
      });
    });
  }
});
