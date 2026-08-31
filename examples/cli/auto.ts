import { RelayPool } from "../../lib/nostr-relaypool.esm.js";
import { generateSecretKey, getPublicKey } from "nostr-tools";
import { bytesToHex } from "nostr-tools/utils";
import type { Event, EventTemplate } from "nostr-tools";
import * as nip19 from "nostr-tools/nip19";

const DEFAULT_RELAYS = ["ws://localhost:8081"];

const relays = (process.env.NOSTR_RELAYS ?? DEFAULT_RELAYS.join(","))
  .split(/[,\s]+/)
  .filter(Boolean);
if (relays.length === 0) {
  throw new Error("No relays configured (set RELAYS env var or rely on defaults)");
}

const privateKey = process.env.NOSTR_PRIVATE_KEY ?? bytesToHex(generateSecretKey());
const publicKey = getPublicKey(privateKey);
const npubKey = nip19.npubEncode(publicKey);

const pool = new RelayPool(relays, {
  autoReconnect: true,
  useEventCache: true,
});

function log(message: string) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

function formatRelay(status: number) {
  switch (status) {
    case 0:
      return "connecting";
    case 1:
      return "connected";
    case 2:
      return "closing";
    case 3:
      return "disconnected";
    default:
      return "unknown";
  }
}

const lastRelayStatuses = new Map<string, number>();

function trackRelayStatusChanges() {
  const statuses = pool.getRelayStatuses();
  statuses.forEach(([url, status]) => {
    const previous = lastRelayStatuses.get(url);
    lastRelayStatuses.set(url, status);
    const label = formatRelay(status);
    log(`[status] ${url} → ${label}`);
    if (previous === status) {
      return;
    }
    if (status === 0) {
      log(`Attempting connection to ${url}`);
    } else if (status === 1) {
      log(`Connected to ${url}`);
    } else if (status === 3) {
      log(`Disconnected from ${url}`);
    } else if (status === 2) {
      log(`Closing connection to ${url}`);
    }
  });
}

trackRelayStatusChanges();
const statusInterval = setInterval(trackRelayStatusChanges, 2000);

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function printIncomingEvent(event: Event) {
  const author = nip19.npubEncode(event.pubkey);
  const date = new Date(event.created_at * 1000).toISOString();
  log(`Incoming event ${event.id.slice(0, 8)} from ${author} @ ${date}: ${event.content}`);
}

async function run() {
  log("Simple Nostr automation starting");
  console.log(`Signing key: ${npubKey} (set NOSTR_PRIVATE_KEY to reuse)`);
  console.log(`Target relays: ${relays.join(", ")}`);

  let collected = 0;
  const subscription = pool.subscribe(
    [{ kinds: [1], limit: 5 }],
    relays,
    (event) => {
      printIncomingEvent(event);
      collected++;
    },
  );
  await sleep(3500);
  subscription?.();
  log(`Collected ${collected} event(s) from relays`);

  const template: EventTemplate = {
    kind: 1,
    created_at: Math.floor(Date.now() / 1000),
    content: `Auto-publish from nostr-relaypool-ts @ ${new Date().toISOString()}`,
    tags: [["client", "nostr-relaypool-cli-auto"]],
    pubkey: publicKey,
  };
  const event = pool.finalizeEvent(template, privateKey);
  pool.publish(event, relays);
  log(`Published event ${event.id}`);
  await sleep(2500);

  await shutdown();
}

let shuttingDown = false;
async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  log("Shutting down automation");
  clearInterval(statusInterval);
  await pool.close();
  process.exit(0);
}

process.on("SIGINT", () => {
  shutdown().catch(() => {});
});
process.on("SIGTERM", () => {
  shutdown().catch(() => {});
});

run().catch((err) => {
  console.error("Automation failed:", err);
  shutdown().catch(() => {});
});
