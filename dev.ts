import { RelayPool } from "./index.ts";
import { InMemoryRelayServer } from "./in-memory-relay-server.ts";
import type { Relay } from "./relay.ts";

// --- Configuration ---
const LOCAL_PORT = 8081;
const LOCAL_RELAY_URL = `ws://localhost:${LOCAL_PORT}`;
const RELAYS = [
    LOCAL_RELAY_URL,
    "wss://relay.damus.io",
    "wss://nos.lol",
];
const REFRESH_RATE_MS = 200;

// --- State ---
let eventCount = 0;
const LOG_BUFFER_SIZE = 6;
const logs: string[] = [];
const relayStatuses = new Map<string, string>();
const relayInstances = new Map<string, Relay>();
type RelayDebugInfo = {
    attemptCount: number;
    lastAttempt?: string;
    lastReachable?: string;
};
const relayDebugInfo = new Map<string, RelayDebugInfo>();
const relayReadyState = new Map<string, number>();

function pushLog(icon: string, msg: string) {
    const timestamp = new Date().toLocaleTimeString();
    logs.push(`[${timestamp}] ${icon} ${msg}`);
    if (logs.length > LOG_BUFFER_SIZE) logs.shift();
}

function logInfo(msg: string) {
    pushLog("ℹ️", msg);
}

function logWarning(msg: string) {
    pushLog("⚠️", msg);
}

function logError(msg: string) {
    pushLog("❌", msg);
}

function recordConnectionAttempt(url: string) {
    const previous = relayDebugInfo.get(url);
    const attemptCount = (previous?.attemptCount ?? 0) + 1;
    const lastAttempt = new Date().toLocaleTimeString();
    relayDebugInfo.set(url, {
        attemptCount,
        lastAttempt,
        lastReachable: previous?.lastReachable,
    });
    logInfo(`Attempt #${attemptCount} to connect to ${url}`);
}

function recordRelayReachable(url: string) {
    const previous = relayDebugInfo.get(url) ?? {attemptCount: 0};
    const lastReachable = new Date().toLocaleTimeString();
    relayDebugInfo.set(url, {
        attemptCount: previous.attemptCount,
        lastAttempt: previous.lastAttempt,
        lastReachable,
    });
    logInfo(`Relay reachable: ${url} at ${lastReachable}`);
}

function trackRelayState(url: string, relay?: Relay) {
    if (!relay) return;

    const previousState = relayReadyState.get(url);
    const readyState = relay.status;
    if (previousState === undefined && readyState === 1) {
        recordConnectionAttempt(url);
    }
    if (readyState === 0 && previousState !== 0) {
        recordConnectionAttempt(url);
    }
    if (readyState === 1 && previousState !== 1) {
        recordRelayReachable(url);
    }
    relayReadyState.set(url, readyState);
}

function getStatusLabel(relay?: Relay): string {
    if (!relay) return "Unknown";
    switch (relay.status) {
        case 0:
            return "Connecting";
        case 1:
            return "Connected";
        case 2:
            return "Closing";
        case 3:
            return "Disconnected";
        default:
            return "Unknown";
    }
}

function formatRelayDetail(url: string): string {
    const info = relayDebugInfo.get(url);
    if (!info) return "";
    const parts: string[] = [];
    if (info.attemptCount) {
        parts.push(`${info.attemptCount} attempt${info.attemptCount === 1 ? "" : "s"}`);
    }
    if (info.lastAttempt) {
        parts.push(`last try ${info.lastAttempt}`);
    }
    if (info.lastReachable) {
        parts.push(`reachable ${info.lastReachable}`);
    }
    return parts.length ? ` (${parts.join(" | ")})` : "";
}

// --- Initialization ---

// Disable internal logging to keep console clean
const pool = new RelayPool(undefined, {
    logSubscriptions: false,
    logErrorsAndNotices: false,
    useEventCache: true,
});

// --- Start Local Relay ---
const localServer = new InMemoryRelayServer(LOCAL_PORT);
logInfo(`Local Relay Server started on port ${LOCAL_PORT}`);

// Setup Relays

RELAYS.forEach(url => {
    relayStatuses.set(url, "Connecting");
    const relay = pool.addOrGetRelay(url);
    relayInstances.set(url, relay);
    
    relay.on("connect", () => {
        relayStatuses.set(url, "Connected");
        drawDashboard();
    });
    relay.on("error", (err: any) => {
        relayStatuses.set(url, `Error`);
        logError(`${url}: ${err}`);
    });
    relay.on("disconnect", () => {
        relayStatuses.set(url, "Disconnected");
        drawDashboard();
    });
    relay.on("notice", (msg: string) => {
        logWarning(`${url} Notice: ${msg}`);
    });
});

// Subscribe
pool.subscribe(
    [{ kinds: [1], limit: 20 }],
    RELAYS,
    (event) => {
        eventCount++;
        // Don't redraw on every event to avoid flicker, rely on interval
    }
);

// Refresh Loop
setInterval(drawDashboard, REFRESH_RATE_MS);

// Initial Draw
drawDashboard();

// --- Dashboard ---
function drawDashboard() {
    // Clear screen and move to top-left
    process.stdout.write('\x1b[2J\x1b[0;0H');

    console.log("🚀 NostrRelayPool DEV Mode");
    console.log("========================================");
    console.log(`🏠 Local Relay: Running on port ${LOCAL_PORT}`);
    console.log("========================================");
    
    // Stats
    const cacheSize = pool.eventCache?.eventsById.size || 0;
    // @ts-ignore - Accessing internal capacity if available, or just showing size
    const capacity = pool.eventCache?.capacity || "unknown";
    console.log(`📊 Events Received: ${eventCount}  |  💾 Cache Size: ${cacheSize} / ${capacity}`);
    console.log("----------------------------------------");

    // Relays
    console.log("📡 Relays:");
    RELAYS.forEach(url => {
        const relay = relayInstances.get(url);
        trackRelayState(url, relay);
        const status = relayStatuses.get(url) || getStatusLabel(relay);
        let icon = "⚪";
        if (status === "Connected") icon = "✅";
        else if (status.startsWith("Error")) icon = "❌";
        else if (status === "Disconnected") icon = "⚠️";
        else if (status === "Connecting") icon = "⏳";
        
        const info = (status === "Connected" && relay) ? relay.connectionInfo : url;
        const detail = formatRelayDetail(url);

        console.log(` ${icon} ${info} : ${status}${detail}`);
    });
    console.log("----------------------------------------");

    // Recent Logs
    console.log("Recent Logs:");
    if (logs.length === 0) {
        console.log(" (None)");
    } else {
        logs.forEach(l => console.log(l));
    }
    console.log("========================================");
    console.log("Press Ctrl+C to exit.");
}
