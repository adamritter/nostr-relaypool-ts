/* eslint-env jest */

import 'websocket-polyfill'

import {signEvent, generatePrivateKey, getEventHash, getPublicKey, Event} from 'nostr-tools'
import {RelayPool} from './relay-pool'
import { InMemoryRelayServer } from './in-memory-relay-server'

let relaypool: RelayPool

// let relayurls = ['wss://nostr-dev.wellorder.net/']
// let relayurls2 = ['wss://nostr.v0l.io/']

let relayurls = ['ws://localhost:8083/']
let relayurls2 = ['ws://localhost:8084/']

let _relayServer: InMemoryRelayServer = new InMemoryRelayServer(8083)
let _relayServer2: InMemoryRelayServer = new InMemoryRelayServer(8084)

beforeEach(() => {
  relaypool = new RelayPool(relayurls)
  _relayServer.clear()
  _relayServer2.clear()
})

afterEach(async () => {
    await relaypool.close()
})

afterAll(async () => {
  await _relayServer.close()
  await _relayServer2.close()
})

async function publishAndGetEvent(relays : string[]) : Promise<Event & {id: string}> {
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
  relaypool.publish(event, relays)
  let a = relaypool.getEventById(eventId, relays, Infinity)
  relaypool.sendSubscriptions()
  await a
  // @ts-ignore
  return event
}

test('querying relaypool', async () => {
  let event = await publishAndGetEvent(relayurls)
  expect(event.kind).toEqual(27572)
  var resolve1:(success:boolean)=>void
  var resolve2:(success:boolean)=>void
  let promiseAll = Promise.all([
    new Promise(resolve => {
      resolve1 = resolve
    }),
    new Promise(resolve => {
      resolve2 = resolve
    })
  ])
  relaypool.subscribe([
    {
      kinds: [27572] // Force no caching
    }
  ],
  relayurls,
  (event, afterEose, url) => {
    expect(event).toHaveProperty(
      'id',
      event.id
    )
    expect(afterEose).toBe(false)
    // expect(url).toBe(relayurls[0])
    resolve1(true)
  },
  undefined,
  (events, url) => {
    expect(events).toHaveLength(1)
    if (events && events.length > 0) {
      expect(events[0]).toHaveProperty(
        'id',
        event.id
      )
    }
    expect(url).toBe(relayurls[0])
    resolve2(true)
  })

  return expect(
    promiseAll
  ).resolves.toEqual([true, true])
})

test('listening and publishing', async () => {
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
  event.sig = signEvent(event, sk)

  let resolve2:(success:boolean)=>void

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

  relaypool.publish(event, relayurls)
  return expect(
    new Promise(resolve => {
      resolve2 = resolve
    })
  ).resolves.toEqual(true)
})


test('relay option in filter', async () => {
  let event = await publishAndGetEvent(relayurls)

  var resolve1:(success:boolean)=>void
  var resolve2:(success:boolean)=>void
  let promiseAll = Promise.all([
    new Promise(resolve => {
      resolve1 = resolve
    }),
    new Promise(resolve => {
      resolve2 = resolve
    })
  ])

  relaypool.subscribe([
    {
      kinds: [event.kind],
      relay: relayurls[0],
    }
  ], [],
  (event, afterEose, url) => {
    expect(event).toHaveProperty(
      'id',
      event.id
    )
    expect(afterEose).toBe(false)
    resolve1(true)
  },
  undefined,
  (events, url) => {
    expect(events).toHaveLength(1)
    if (events && events.length > 0) {
      expect(events[0]).toHaveProperty(
        'id',
        event.id
      )
    }
    expect(url).toBe(relayurls[0])
    resolve2(true)
  })

  return expect(promiseAll).resolves.toEqual([true, true])
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
  let event = await publishAndGetEvent(relayurls)

  await expect(new Promise(resolve => {
    relaypool.subscribe([
      {
        kinds: [27572],
        authors: [event.pubkey]
      }
    ], relayurls,
    (event, afterEose, url) => {
      expect(event).toHaveProperty('pubkey', event.pubkey)
      expect(event).toHaveProperty('kind', 27572)
      expect(event).toHaveProperty('content', 'nostr-tools test suite')
      resolve(true)
    })
  })).resolves.toEqual(true)

  await expect(new Promise(resolve => {
    relaypool.subscribe([
      {
        kinds: [27572],
        authors: [event.pubkey]
      }
    ], relayurls,
    (event, afterEose, url) => {
      expect(event).toHaveProperty('pubkey', event.pubkey)
      expect(event).toHaveProperty('kind', 27572)
      expect(event).toHaveProperty('content', 'nostr-tools test suite')
      resolve(true)
    })
    relaypool.publish(event, relayurls)
  })).resolves.toEqual(true)

  let counter = 0
  await expect(new Promise(resolve => {
    relaypool.subscribe([
      {
        // @ts-ignore
        kinds: [27572],
        authors: [event.pubkey],
        noCache: true
      }
    ], [...relayurls, ...relayurls2],
    (event, afterEose, url) => {
      expect(event).toHaveProperty('pubkey', event.pubkey)
      expect(event).toHaveProperty('kind', 27572)
      expect(event).toHaveProperty('content', 'nostr-tools test suite')
      counter += 1
      if (counter === 2) {
        resolve(true)
      }
    }, undefined, undefined, {allowDuplicateEvents: true})
    relaypool.publish(event, relayurls)
    relaypool.publish(event, relayurls2)
  })).resolves.toEqual(true)

  let counter2 = 0
  let thirdOnEvent = new Promise(resolve => {
    relaypool.subscribe([
      {
        // @ts-ignore
        authors: [event.pubkey]
      }
    ], [...relayurls, ...relayurls2],
    (event, afterEose, url) => {
      expect(event).toHaveProperty('pubkey', event.pubkey)
      expect(event).toHaveProperty('kind', 27572)
      expect(event).toHaveProperty('content', 'nostr-tools test suite')
      counter2 += 1
      if (counter2 === 2) {
        resolve(true)
      }
    })
    relaypool.publish(event, relayurls)
    relaypool.publish(event, relayurls2)
  })

  await expect(Promise.race([
    thirdOnEvent,
    new Promise(resolve => setTimeout(() => resolve(-1), 50)) ])).resolves.toEqual(-1)
})


test('cache authors', async () => {
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
    relaypool.subscribe([
      {
        kinds: [27572],
        authors: [pk]
      }
    ], relayurls2,
    (event, afterEose, url) => {
      expect(event).toHaveProperty('pubkey', pk)
      expect(event).toHaveProperty('kind', 27572)
      expect(event).toHaveProperty('content', 'nostr-tools test suite')
      resolve(true)
    })
    relaypool.publish(event, relayurls2)
  })).resolves.toEqual(true)

  return expect(new Promise(resolve => {
    relaypool.subscribe([
      {
        kinds: [27572],
        authors: [pk]
      }
    ], relayurls2,
    (event, afterEose, url) => {
      expect(event).toHaveProperty('pubkey', pk)
      expect(event).toHaveProperty('kind', 27572)
      expect(event).toHaveProperty('content', 'nostr-tools test suite')
      expect(url).toEqual(relayurls2[0])
      resolve(true)
    })
    relaypool.publish(event, relayurls2)
  })).resolves.toEqual(true)
})

test('kind3', async () => {
  let sk = generatePrivateKey()
  let pk = getPublicKey(sk)

  let event = {
    kind: 3,
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
        kinds: [3],
        authors: [pk]
      }
    ], relayurls,
    event => {
      expect(event).toHaveProperty('pubkey', pk)
      expect(event).toHaveProperty('kind', 3)
      expect(event).toHaveProperty('content', 'nostr-tools test suite')
      resolve(true)
    })
  })).resolves.toEqual(true)

  let secondOnEvent = new Promise(resolve => {
    relaypool.subscribe([
      {
        // @ts-ignore
        ids: [event.id]
      }
    ], [],
    event => {
      expect(event).toHaveProperty('pubkey', pk)
      expect(event).toHaveProperty('kind', 3)
      expect(event).toHaveProperty('content', 'nostr-tools test suite')
      resolve(true)
    })
  })

  return expect(secondOnEvent).resolves.toEqual(true)
})


test('kind0', async () => {
  let sk = generatePrivateKey()
  let pk = getPublicKey(sk)

  let event = {
    kind: 0,
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
        kinds: [0],
        authors: [pk]
      }
    ], relayurls,
    event => {
      expect(event).toHaveProperty('pubkey', pk)
      expect(event).toHaveProperty('kind', 0)
      expect(event).toHaveProperty('content', 'nostr-tools test suite')
      resolve(true)
    })
  })).resolves.toEqual(true)

  let secondOnEvent = new Promise(resolve => {
    relaypool.subscribe([
      {
        // @ts-ignore
        ids: [event.id]
      }
    ], [],
    event => {
      expect(event).toHaveProperty('pubkey', pk)
      expect(event).toHaveProperty('kind', 0)
      expect(event).toHaveProperty('content', 'nostr-tools test suite')
      resolve(true)
    })
  })

  return expect(secondOnEvent).resolves.toEqual(true)
})
