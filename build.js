#!/usr/bin/env node

import { build } from 'esbuild'

let common = {
  entryPoints: ['index.ts'],
  bundle: true,
  sourcemap: 'external'
}

build({
    ...common,
    outfile: 'lib/nostr-relaypool.esm.js',
    format: 'esm',
    packages: 'external'
  })
  .then(() => console.log('esm build success.'))

build({
    ...common,
    outfile: 'lib/nostr-relaypool.cjs',
    format: 'cjs',
    packages: 'external'
  })
  .then(() => console.log('cjs build success.'))

build({
    ...common,
    outfile: 'lib/nostr-relaypool.bundle.js',
    format: 'iife',
    globalName: 'NostrRelayPool',
    define: {
      window: 'self',
      global: 'self',
      process: '{"env": {}}'
    }
  })
  .then(() => console.log('standalone build success.'))
