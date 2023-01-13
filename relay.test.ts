/* eslint-env jest */

import 'websocket-polyfill'

import {signEvent, generatePrivateKey, getEventHash, getPublicKey, type Relay, type Event} from 'nostr-tools'

import {relayInit} from './relay'
import { InMemoryRelayServer } from './in-memory-relay-server'

let relay:Relay
let _relayServer:InMemoryRelayServer = new InMemoryRelayServer(8089)

beforeEach(() => {
  // relay = relayInit('wss://nostr.v0l.io/')
  relay = relayInit('ws://localhost:8089/')
  relay.connect()
  _relayServer.clear()
})

afterEach(async () => {
  await relay.close()
})

afterAll(async () => {
  await _relayServer.close()
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


async function publishAndGetEvent() : Promise<Event & {id: string}> {
  let sk = generatePrivateKey()
  let pk = getPublicKey(sk)
  let event = {
    kind: 27572,
    pubkey: pk,
    created_at: Math.floor(Date.now() / 1000),
    tags: [],
    content: 'nostr-tools test suite'
  }
  let eventId = getEventHash(event)
  // @ts-ignore
  event.id = eventId
  // @ts-ignore
  event.sig = signEvent(event, sk)
  relay.publish(event)
  // @ts-ignore
  return new Promise(resolve => relay.sub([{ids: [event.id]}]).on('event', (event:Event & {id: string}) => {
    resolve(event)
  }))
}

test('querying', async () => {
  let event : Event & {id: string} = await publishAndGetEvent()
  var resolve1: (success: boolean) => void
  var resolve2: (success: boolean) => void

  let promiseAll = Promise.all([
    new Promise(resolve => {
      resolve(true)
      resolve1 = resolve
    }),
    new Promise(resolve => {
      resolve2 = resolve
      resolve(true)
    })
  ])

  let sub = relay.sub([
    {
      kinds: [event.kind]
    }
  ])
  sub.on('event', (event:Event) => {
    expect(event).toHaveProperty(
      'id',
      event.id
    )
    resolve1(true)
  })
  sub.on('eose', () => {
    resolve2(true)
  })

  return expect(
    promiseAll
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


test('two subscriptions', async () => {
  let sk = generatePrivateKey()
  let pk = getPublicKey(sk)

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

  await expect(new Promise(resolve => {
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
      resolve(true)
    })
  relay.publish(event)
  })).resolves.toEqual(true)


  await expect(new Promise(resolve => {
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
      resolve(true)
    })
    relay.publish(event)
  })).resolves.toEqual(true)
})
