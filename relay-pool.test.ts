/* eslint-env jest */

import 'websocket-polyfill'

import {signEvent, generatePrivateKey, getEventHash, getPublicKey} from 'nostr-tools'
import {RelayPool} from './relay-pool'

let relaypool: RelayPool

let relayurls = ['wss://nostr-dev.wellorder.net/']

beforeEach(() => {
  relaypool = new RelayPool(relayurls)
})

afterEach(async () => {
    relaypool.close()
})

test('querying', () => {
  var resolve1:(success:boolean)=>void
  var resolve2:(success:boolean)=>void

  let sub = relaypool.sub([
    {
      ids: ['d7dd5eb3ab747e16f8d0212d53032ea2a7cadef53837e5a6c66d42849fcb9027']
    }
  ], relayurls)
  sub.onevent((event, afterEose, url) => {
    expect(event).toHaveProperty(
      'id',
      'd7dd5eb3ab747e16f8d0212d53032ea2a7cadef53837e5a6c66d42849fcb9027'
    )
    expect(afterEose).toBe(false)
    expect(url).toBe(relayurls[0])
    resolve1(true)
  })
  sub.oneose((events, url) => {
    expect(events).toHaveLength(1)
    if (events && events.length > 0) {
      expect(events[0]).toHaveProperty(
        'id',
        'd7dd5eb3ab747e16f8d0212d53032ea2a7cadef53837e5a6c66d42849fcb9027'
      )
    }
    expect(url).toBe(relayurls[0])
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
  var resolve1:(success:boolean)=>void
  var resolve2:(success:boolean)=>void

  let sub = relaypool.sub([
    {
      kinds: [27572],
      authors: [pk]
    }
  ], relayurls)

  sub.onevent(event => {
    expect(event).toHaveProperty('pubkey', pk)
    expect(event).toHaveProperty('kind', 27572)
    expect(event).toHaveProperty('content', 'nostr-tools test suite')
    resolve1(true)
  })
  sub.onevent(event => {
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

  relaypool.publish(event, relayurls)
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


test('relay option in filter', () => {
  var resolve1:(success:boolean)=>void
  var resolve2:(success:boolean)=>void

  let sub = relaypool.sub([
    {
      ids: ['d7dd5eb3ab747e16f8d0212d53032ea2a7cadef53837e5a6c66d42849fcb9027'],
      relay: relayurls[0]
    }
  ], [])
  sub.onevent((event, afterEose, url) => {
    expect(event).toHaveProperty(
      'id',
      'd7dd5eb3ab747e16f8d0212d53032ea2a7cadef53837e5a6c66d42849fcb9027'
    )
    expect(afterEose).toBe(false)
    expect(url).toBe(relayurls[0])
    resolve1(true)
  })
  sub.oneose((events, url) => {
    expect(events).toHaveLength(1)
    if (events && events.length > 0) {
      expect(events[0]).toHaveProperty(
        'id',
        'd7dd5eb3ab747e16f8d0212d53032ea2a7cadef53837e5a6c66d42849fcb9027'
      )
    }
    expect(url).toBe(relayurls[0])
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
