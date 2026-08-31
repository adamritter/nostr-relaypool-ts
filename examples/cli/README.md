# CLI Example

This folder now contains two CLI variants.

## Auto mode

`examples/cli/auto.ts` is the automation harness:

- Connects to `ws://localhost:8081` (or relays listed in `NOSTR_RELAYS`).
- Logs connection attempts/status changes every few seconds.
- Fetches a handful of recent kind 1 events, prints any that arrive, publishes a new note, and then closes.
- Run it with:

```bash
npm run auto
```

`npm run start` is an alias for the same command to preserve the previous workflow. You can still override relays/keys:

```bash
NOSTR_PRIVATE_KEY=<hex-sk> NOSTR_RELAYS="wss://relay.example.org" \
  npm run auto
```

## Manual mode

`examples/cli/manual.ts` opens an interactive prompt:

- Opens a `nostr>` prompt showing relay notices and incoming events.
- Commands: `help`, `status`, `publish <text>`, `exit`/`quit`.
- `status` shows every relay’s current ready-state, `publish` signs and publishes a kind 1 note immediately.
- Run it with:

```bash
npm run manual
```

The same environment variables (`NOSTR_PRIVATE_KEY`, `NOSTR_RELAYS`) work for manual mode as well.
