#!/usr/bin/env node

import {build, context} from "esbuild";

const watch = process.argv.includes("--watch");

let common = {
  entryPoints: ["index.ts"],
  bundle: true,
  sourcemap: "external",
};

const configs = [
  {
    ...common,
    outfile: "lib/nostr-relaypool.esm.js",
    format: "esm",
    packages: "external",
    external: ["node:*"],
    platform: "browser",
  },
  {
    ...common,
    outfile: "lib/nostr-relaypool.cjs",
    format: "cjs",
    packages: "external",
    external: ["node:*"],
    platform: "node",
  },
  {
    ...common,
    outfile: "lib/nostr-relaypool.bundle.js",
    format: "iife",
    globalName: "NostrRelayPool",
    define: {
      window: "self",
      global: "self",
      process: '{"env": {}}',
    },
    external: ["node:*"],
    platform: "browser",
  },
  {
    ...common,
    outfile: "lib/nostr-relaypool.worker.js",
    format: "esm",
    target: "es2018",
    loader: {
      ".ts": "ts",
    },
    entryPoints: ["relay-pool.worker.ts"],
    external: ["@nostr/core", "node:*"],
    platform: "browser",
  },
];

async function run() {
  for (const config of configs) {
    if (watch) {
      const ctx = await context(config);
      await ctx.watch();
      console.log(`watching ${config.outfile}...`);
    } else {
      await build(config);
      console.log(`${config.outfile} build success.`);
    }
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
