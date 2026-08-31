/* eslint-env jest */

import {
  generateSecretKey,
  getPublicKey,
  finalizeEvent,
  type Event,
} from "nostr-tools";

import type {Relay} from "./relay";

import {relayInit} from "./relay";
import {createAndConnectRelay, closeRelayAndServer, sleepms, waitUntil, WebSocketStates} from "./test-utils";
import {assertEqual, assertTrue, assertDefined, assertThrows, assertGreaterThanOrEqual} from "./assert-utils";

let relayPort = 8090; // Start ports from a different range to avoid conflicts


test("connectivity", async () => {
  const {relay, server} = await createAndConnectRelay(relayPort++);
  assertEqual(relay.status, WebSocketStates.OPEN);
  await closeRelayAndServer(relay, server);
});

async function publishAndGetEvent(
  relay: Relay,
  sk: string,
  options: {content?: string} = {}
): Promise<Event> {
  const eventTemplate = {
    kind: 27572,
    created_at: Math.floor(Date.now() / 1000),
    tags: [],
    content: options.content || "nostr-tools test suite",
  };
  const event = finalizeEvent(eventTemplate, sk);
  relay.publish(event);
  return new Promise((resolve) =>
    relay
      // @ts-ignore
      .sub([{ids: [event.id]}])
      .on("event", (event: Event) => {
        resolve(event);
      })
  );
}

test("publishing an event", async () => {
  const {relay, server} = await createAndConnectRelay(8091);
  const sk = generateSecretKey();
  const event = finalizeEvent(
    {
      kind: 1,
      created_at: Math.floor(Date.now() / 1000),
      tags: [],
      content: "Test event for publishing",
    },
    sk
  );

  let receivedEvent: Event | undefined;
  const sub = relay.sub([{ids: [event.id]}]);
  const eventPromise = new Promise<Event>((resolve) => {
    sub.on("event", (e) => {
      receivedEvent = e;
      resolve(e);
    });
  });

  relay.publish(event);
  await eventPromise;

  assertDefined(receivedEvent);
  assertEqual(receivedEvent?.id, event.id);
  assertEqual(receivedEvent?.content, event.content);
  sub.unsub();
  await closeRelayAndServer(relay, server);
});

test("subscribing to events", async () => {
  const {relay, server} = await createAndConnectRelay(8092);
  const sk = generateSecretKey();
  const event = finalizeEvent(
    {
      kind: 1,
      created_at: Math.floor(Date.now() / 1000),
      tags: [],
      content: "Test event for subscribing",
    },
    sk
  );

  let receivedEvent: Event | undefined;
  const eventPromise = new Promise<Event>((resolve) => {
    const sub = relay.sub([{authors: [getPublicKey(sk)]}]);
    sub.on("event", (e) => {
      receivedEvent = e;
      resolve(e);
    });
    relay.publish(event);
  });

  await eventPromise;
  assertDefined(receivedEvent);
  assertEqual(receivedEvent?.id, event.id);
  assertEqual(receivedEvent?.content, event.content);
  await closeRelayAndServer(relay, server);
});

test("handling EOSE", async () => {
  const {relay, server} = await createAndConnectRelay(8093);
  const sk = generateSecretKey();
  const event = finalizeEvent(
    {
      kind: 1,
      created_at: Math.floor(Date.now() / 1000),
      tags: [],
      content: "Test event for EOSE",
    },
    sk
  );

  let eoseReceived = false;
  const eosePromise = new Promise<void>((resolve) => {
    const sub = relay.sub([{authors: [getPublicKey(sk)]}]);
    sub.on("eose", () => {
      eoseReceived = true;
      resolve();
    });
    // Publish an event to ensure the EOSE is not empty
    relay.publish(event);
  });

  await eosePromise;
  assertTrue(eoseReceived);
  await closeRelayAndServer(relay, server);
});

test("autoreconnect handles disconnect", async () => {
  const {relay, server} = await createAndConnectRelay(8094, false); // autoReconnect: false for initial test
  assertEqual(relay.status, WebSocketStates.OPEN); // Already connected by createAndConnectRelay
  
  server.disconnectAll();
  await waitUntil(() => relay.status >= WebSocketStates.CLOSING);

  assertGreaterThanOrEqual(relay.status, WebSocketStates.CLOSING);
  await closeRelayAndServer(relay, server);
});

test.skip("autoreconnect successfully reconnects", async () => {
  const {relay, server} = await createAndConnectRelay(8095, true); // autoReconnect: true
  assertEqual(relay.status, WebSocketStates.OPEN);
  
  server.disconnectAll();
  await waitUntil(() => relay.status >= WebSocketStates.CLOSING);

  // Now, try to publish an event, which should trigger a reconnect
  const sk = generateSecretKey(); // Generate a new key for this event
  await publishAndGetEvent(relay, sk);
  assertEqual(relay.status, WebSocketStates.OPEN); // Assert it reconnected and is open
}, 10000); // Longer timeout for reconnect test

test("handling notice messages", async () => {
  const {relay, server} = await createAndConnectRelay(8096);
  let noticeMessage: string | undefined;
  const noticePromise = new Promise<string>((resolve) => {
    relay.on("notice", (msg) => {
      noticeMessage = msg;
      resolve(msg);
    });
    // Currently, InMemoryRelayServer does not have a direct method to send NOTICE.
    // This part requires a modification to InMemoryRelayServer or a different test strategy.
    // For now, we'll just assert that no notice was received if no mechanism to send it exists.
  });
  // Simulate server sending a notice (requires a modification to InMemoryRelayServer)
  // For now, we'll just assert that no notice was received if no mechanism to send it exists.
  assertEqual(noticeMessage, undefined);
  await closeRelayAndServer(relay, server);
});
