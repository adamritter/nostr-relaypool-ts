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

  relaypool.subscribe([
    {
      ids: ['d7dd5eb3ab747e16f8d0212d53032ea2a7cadef53837e5a6c66d42849fcb9027']
    }
  ],
  relayurls,
  (event, afterEose, url) => {
    expect(event).toHaveProperty(
      'id',
      'd7dd5eb3ab747e16f8d0212d53032ea2a7cadef53837e5a6c66d42849fcb9027'
    )
    expect(afterEose).toBe(false)
    expect(url).toBe(relayurls[0])
    resolve1(true)
  },
  (events, url) => {
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

test('listening and publishing', async () => {
  let sk = generatePrivateKey()
  let pk = getPublicKey(sk)
  var resolve2:(success:boolean)=>void

  relaypool.subscribe([
    {
      kinds: [27572],
      authors: [pk]
    }
  ], relayurls,
  event => {
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
    new Promise(resolve => {
      resolve2 = resolve
    })
  ).resolves.toEqual(true)
})


test('relay option in filter', () => {
  var resolve1:(success:boolean)=>void
  var resolve2:(success:boolean)=>void

  relaypool.subscribe([
    {
      ids: ['d7dd5eb3ab747e16f8d0212d53032ea2a7cadef53837e5a6c66d42849fcb9027'],
      relay: relayurls[0]
    }
  ], [],
  (event, afterEose, url) => {
    expect(event).toHaveProperty(
      'id',
      'd7dd5eb3ab747e16f8d0212d53032ea2a7cadef53837e5a6c66d42849fcb9027'
    )
    expect(afterEose).toBe(false)
    expect(url).toBe(relayurls[0])
    resolve1(true)
  },
  (events, url) => {
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

test('cached result', async () => {
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


  relaypool.publish(event, relayurls)


  await expect(new Promise(resolve => {
    relaypool.subscribe([
      {
        kinds: [27572],
        authors: [pk]
      }
    ], relayurls,
    event => {
      expect(event).toHaveProperty('pubkey', pk)
      expect(event).toHaveProperty('kind', 27572)
      expect(event).toHaveProperty('content', 'nostr-tools test suite')
      resolve(true)
    })
  })).resolves.toEqual(true)

  console.log(relaypool.cache)

  let secondOnEvent = new Promise(resolve => {
    relaypool.subscribe([
      {
        // @ts-ignore
        ids: [event.id]
      }
    ], [],
    event => {
      expect(event).toHaveProperty('pubkey', pk)
      expect(event).toHaveProperty('kind', 27572)
      expect(event).toHaveProperty('content', 'nostr-tools test suite')
      resolve(true)
    })
  })

  return expect(secondOnEvent).resolves.toEqual(true)
})

test('remove duplicates', async () => {
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

  relaypool.publish(event, relayurls)


  await expect(new Promise(resolve => {
    relaypool.subscribe([
      {
        kinds: [27572],
        authors: [pk]
      }
    ], relayurls,
    event => {
      expect(event).toHaveProperty('pubkey', pk)
      expect(event).toHaveProperty('kind', 27572)
      expect(event).toHaveProperty('content', 'nostr-tools test suite')
      resolve(true)
    })
  })).resolves.toEqual(true)

  console.log(relaypool.cache)

  let counter = 0
  let secondOnEvent = new Promise(resolve => {
    relaypool.subscribe([
      {
        // @ts-ignore
        ids: [event.id]
      }
    ], relayurls,
    event => {
      expect(event).toHaveProperty('pubkey', pk)
      expect(event).toHaveProperty('kind', 27572)
      expect(event).toHaveProperty('content', 'nostr-tools test suite')
      counter += 1
      if (counter === 2) {
        resolve(true)
      }
    }, undefined, {allowDuplicateEvents: true})
  })

  expect(secondOnEvent).resolves.toEqual(true)


  let counter2 = 0
  let thirdOnEvent = new Promise(resolve => {
    relaypool.subscribe([
      {
        // @ts-ignore
        ids: [event.id]
      }
    ], relayurls,
    event => {
      expect(event).toHaveProperty('pubkey', pk)
      expect(event).toHaveProperty('kind', 27572)
      expect(event).toHaveProperty('content', 'nostr-tools test suite')
      counter2 += 1
      if (counter2 === 2) {
        resolve(true)
      }
    })
  })

  return expect(Promise.race([
    thirdOnEvent,
    new Promise(resolve => setTimeout(() => resolve(-1), 2000)) ])).resolves.toEqual(-1)
})
