import readline from "node:readline";
import { RelayPool } from "../../lib/nostr-relaypool.esm.js";
import { generateSecretKey, getPublicKey } from "nostr-tools";
import { bytesToHex } from "nostr-tools/utils";
import * as nip19 from "nostr-tools/nip19";
import type { Event, EventTemplate } from "nostr-tools";

const DEFAULT_RELAYS = ["ws://localhost:8081"];

const relays = (process.env.NOSTR_RELAYS ?? DEFAULT_RELAYS.join(","))
  .split(/[,\s]+/)
  .filter(Boolean);
if (relays.length === 0) {
  throw new Error("No relays configured (set NOSTR_RELAYS or rely on defaults)");
}

const privateKey = process.env.NOSTR_PRIVATE_KEY ?? bytesToHex(generateSecretKey());
const publicKey = getPublicKey(privateKey);
const npubKey = nip19.npubEncode(publicKey);

const pool = new RelayPool(relays, {
  autoReconnect: true,
  useEventCache: true,
});

function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
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
    if (previous === status) {
      return;
    }
    log(`Relay ${url} → ${formatRelay(status)}`);
  });
}

const statusInterval = setInterval(trackRelayStatusChanges, 2000);
trackRelayStatusChanges();

let timelineSub: (() => void) | undefined;

function handleEvent(event: Event) {
  const author = nip19.npubEncode(event.pubkey);
  const date = new Date(event.created_at * 1000).toISOString();
  log(`Incoming event ${event.id.slice(0, 8)} from ${author} @ ${date}: ${event.content}`);
}

function setupSubscription() {
  timelineSub = pool.subscribe(
    [{ kinds: [1], limit: 10 }],
    relays,
    handleEvent,
  );
}
setupSubscription();

pool.onnotice((url, msg) => log(`Notice from ${url}: ${msg}`));
pool.onerror((url, err) => log(`Error from ${url}: ${err}`));

function printStatus() {
  pool.getRelayStatuses().forEach(([url, status]) => {
    console.log(`  ${url} → ${formatRelay(status)}`);
  });
}

async function publishNote(content: string) {
  const text = content || `Manual ping @ ${new Date().toISOString()}`;
  const template: EventTemplate = {
    kind: 1,
    created_at: Math.floor(Date.now() / 1000),
    content: text,
    tags: [["client", "nostr-relaypool-cli-manual"]],
    pubkey: publicKey,
  };
  const event = pool.finalizeEvent(template, privateKey);
  pool.publish(event, relays);
  log(`Published event ${event.id} (${text.length} chars)`);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "nostr> ",
});

function printHelp() {
  console.log(`
Commands:
  help               Show this help message
  status             Print current relay statuses
  publish <message>  Publish a kind 1 note with the supplied text
  exit | quit        Close connections and exit
`);
}

log("Manual CLI ready");
console.log(`Signing key: ${npubKey} (set NOSTR_PRIVATE_KEY to reuse)`);
console.log("Type `help` for commands.");
rl.prompt();

rl.on("line", async (line) => {
  const [command, ...rest] = line.trim().split(/\s+/);
  switch (command) {
    case "help":
      printHelp();
      break;
    case "status":
      printStatus();
      break;
    case "publish":
      await publishNote(rest.join(" "));
      break;
    case "exit":
    case "quit":
      await shutdown();
      break;
    case "":
      break;
    default:
      console.log(`unknown command ${command}`);
  }
  rl.prompt();
});

rl.on("close", () => {
  shutdown().catch(() => {});
});

let shuttingDown = false;
async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  log("Shutting down manual CLI");
  clearInterval(statusInterval);
  timelineSub?.();
  await pool.close();
  process.exit(0);
}

process.on("SIGINT", () => {
  shutdown().catch(() => {});
});
process.on("SIGTERM", () => {
  shutdown().catch(() => {});
});
