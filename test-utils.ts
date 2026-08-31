// test-utils.ts
import {InMemoryRelayServer} from "./in-memory-relay-server";
import {relayInit, Relay} from "./relay";

// Define WebSocket states explicitly for custom runner
export const WebSocketStates = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
};

export async function createAndConnectRelay(port: number, autoReconnect: boolean = true): Promise<{relay: Relay, server: InMemoryRelayServer}> {
  const server = new InMemoryRelayServer(port);
  const relay = relayInit(`ws://localhost:${port}/`, undefined, autoReconnect);
  await relay.connect();
  // Ensure connection is open before returning
  if (relay.status !== WebSocketStates.OPEN) {
    throw new Error(`Failed to connect to relay ws://localhost:${port}/. Status: ${relay.status}`);
  }
  server.clear(); // Clear events after connection setup
  return {relay, server};
}

export async function closeRelayAndServer(relay: Relay, server: InMemoryRelayServer): Promise<void> {
  await relay.close();
  await server.close();
}

export const sleepms = (timeoutMs: number) =>
  new Promise((resolve) => setTimeout(() => resolve(true), timeoutMs));

// Helper to wait for a condition
export async function waitUntil(condition: () => boolean, timeout = 10000, interval = 50): Promise<void> {
    const startTime = Date.now();
    while (!condition()) {
        if (Date.now() - startTime > timeout) {
            throw new Error(`waitUntil timed out after ${timeout}ms`);
        }
        await new Promise(resolve => setTimeout(resolve, interval));
    }
}