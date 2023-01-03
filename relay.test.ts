/* eslint-env jest */

import 'websocket-polyfill'

import {signEvent, generatePrivateKey, getEventHash, getPublicKey, type Relay, type Event} from 'nostr-tools'

import {relayInit} from './relay'

let relay:Relay

beforeEach(() => {
  relay = relayInit('wss://nostr-dev.wellorder.net/')
  relay.connect()
})

afterEach(async () => {
  await relay.close()
})

test('connectivity', () => {
  return expect(
    new Promise(resolve => {
      relay.on('connect', () => {
        resolve(true)
      })
      relay.on('error', () => {
        resolve(false)
      })
    })
  ).resolves.toBe(true)
})

test('querying', () => {
  var resolve1: (success: boolean) => void
  var resolve2: (success: boolean) => void

  let sub = relay.sub([
    {
      ids: ['d7dd5eb3ab747e16f8d0212d53032ea2a7cadef53837e5a6c66d42849fcb9027']
    }
  ])
  sub.on('event', (event:Event) => {
    expect(event).toHaveProperty(
      'id',
      'd7dd5eb3ab747e16f8d0212d53032ea2a7cadef53837e5a6c66d42849fcb9027'
    )
    resolve1(true)
  })
  sub.on('eose', () => {
    resolve2(true)
  })

  return expect(
    Promise.all([
      new Promise(resolve => {
        resolve1 = resolve
      }),
      new Promise(resolve => {
        resolve2 = resolve
      })
    ])
  ).resolves.toEqual([true, true])
})

test('listening (twice) and publishing', async () => {
  let sk = generatePrivateKey()
  let pk = getPublicKey(sk)
  var resolve1: (success: boolean) => void
  var resolve2: (success: boolean) => void

  let sub = relay.sub([
    {
      kinds: [27572],
      authors: [pk]
    }
  ])

  sub.on('event', (event:Event) => {
    expect(event).toHaveProperty('pubkey', pk)
    expect(event).toHaveProperty('kind', 27572)
    expect(event).toHaveProperty('content', 'nostr-tools test suite')
    resolve1(true)
  })
  sub.on('event', (event:Event) => {
    expect(event).toHaveProperty('pubkey', pk)
    expect(event).toHaveProperty('kind', 27572)
    expect(event).toHaveProperty('content', 'nostr-tools test suite')
    resolve2(true)
  })

  let event = {
    kind: 27572,
    pubkey: pk,
    created_at: Math.floor(Date.now() / 1000),
    tags: [],
    content: 'nostr-tools test suite'
  }
  // @ts-ignore
  event.id = getEventHash(event)
  // @ts-ignore
  event.sig = await signEvent(event, sk)

  relay.publish(event)
  return expect(
    Promise.all([
      new Promise(resolve => {
        resolve1 = resolve
      }),
      new Promise(resolve => {
        resolve2 = resolve
      })
    ])
  ).resolves.toEqual([true, true])
})
