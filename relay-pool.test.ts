/* eslint-env jest */

import {
  signEvent,
  generatePrivateKey,
  getEventHash,
  getPublicKey,
  Event,
} from "nostr-tools";
import {RelayPool} from "./relay-pool";
import {InMemoryRelayServer} from "./in-memory-relay-server";

let relaypool: RelayPool;

// const relayurls = ['wss://nostr-dev.wellorder.net/']
// const relayurls2 = ['wss://nostr.v0l.io/']

const relayurls = ["ws://localhost:8083/"];
const relayurls2 = ["ws://localhost:8084/"];

let _relayServer: InMemoryRelayServer;
let _relayServer2: InMemoryRelayServer;

beforeAll(() => {
  _relayServer = new InMemoryRelayServer(8083);
  _relayServer2 = new InMemoryRelayServer(8084);
});

beforeEach(() => {
  relaypool = new RelayPool([], {noSubscriptionCache: false});
  _relayServer.clear();
  _relayServer2.clear();
});

afterEach(async () => {
  await relaypool.close();
});

afterAll(async () => {
  await _relayServer.close();
  await _relayServer2.close();
});

function createSignedEvent(
  kind = 27572,
  content = "nostr-tools test suite"
): Event & {id: string} {
  const sk = generatePrivateKey();
  const pk = getPublicKey(sk);
  const event = {
    kind,
    pubkey: pk,
    created_at: Math.floor(Date.now() / 1000),
    tags: [],
    content,
  };
  const eventId = getEventHash(event);
  // @ts-ignore
  event.id = eventId;
  // @ts-ignore
  event.sig = signEvent(event, sk);
  // @ts-ignore
  return event;
}

async function publishAndGetEvent(
  relays: string[],
  kind = 27572,
  content = "nostr-tools test suite"
): Promise<Event & {id: string}> {
  const event = createSignedEvent(kind, content);
  relaypool.publish(event, relays);
  const a = relaypool.getEventById(event.id, relays, Infinity);
  relaypool.sendSubscriptions();
  await a;
  // @ts-ignore
  return event;
}
test("external geteventbyid", async () => {
  const event = await publishAndGetEvent(relayurls);
  var resolve1: (success: boolean) => void;
  var resolve2: (success: boolean) => void;
  const promiseAll = Promise.all([
    new Promise((resolve) => {
      resolve1 = resolve;
    }),
    new Promise((resolve) => {
      resolve2 = resolve;
    }),
  ]);
  relaypool.close();
  relaypool = new RelayPool(relayurls, {
    externalGetEventById: (id) => {
      if (id === event.id) {
        resolve2(true);
        return event;
      }
    },
  });
  expect(event.kind).toEqual(27572);

  relaypool.subscribe(
    [
      {
        kinds: [27572], // Force no caching
      },
    ],
    relayurls,
    (event, afterEose, url) => {
      expect(event).toHaveProperty("id", event.id);
      expect(afterEose).toBe(false);
      // expect(url).toBe(relayurls[0])
      resolve1(true);
    },
    undefined,
    undefined
  );

  return expect(promiseAll).resolves.toEqual([true, true]);
});

test("empty", async () => {
  var resolve2: (success: boolean) => void;
  const promiseAll = Promise.all([
    new Promise((resolve) => {
      resolve2 = resolve;
    }),
  ]);
  relaypool.subscribe(
    [
      {
        kinds: [27572], // Force no caching
      },
    ],
    relayurls,
    (event, afterEose, url) => {},
    undefined,
    (events, url, minCreatedAt) => {
      expect(events).toHaveLength(0);
      expect(minCreatedAt).toBe(Infinity);
      expect(url).toBe(relayurls[0]);
      resolve2(true);
    }
  );

  return expect(promiseAll).resolves.toEqual([true]);
});

test("querying relaypool", async () => {
  const event = await publishAndGetEvent(relayurls);
  expect(event.kind).toEqual(27572);
  var resolve1: (success: boolean) => void;
  var resolve2: (success: boolean) => void;
  const promiseAll = Promise.all([
    new Promise((resolve) => {
      resolve1 = resolve;
    }),
    new Promise((resolve) => {
      resolve2 = resolve;
    }),
  ]);
  relaypool.subscribe(
    [
      {
        kinds: [27572], // Force no caching
      },
    ],
    relayurls,
    (event, afterEose, url) => {
      expect(event).toHaveProperty("id", event.id);
      expect(afterEose).toBe(false);
      // expect(url).toBe(relayurls[0])
      resolve1(true);
    },
    undefined,
    (events, url, minCreatedAt) => {
      expect(events).toHaveLength(1);
      if (events && events.length > 0) {
        expect(events[0]).toHaveProperty("id", event.id);
        expect(minCreatedAt).toBe(events[0].created_at);
      }
      expect(url).toBe(relayurls[0]);
      resolve2(true);
    }
  );

  return expect(promiseAll).resolves.toEqual([true, true]);
});

test("listening and publishing", async () => {
  const event = createSignedEvent();

  let resolve2: (success: boolean) => void;

  relaypool.subscribe(
    [
      {
        kinds: [27572],
        authors: [event.pubkey],
      },
    ],
    relayurls,
    (event) => {
      expect(event).toHaveProperty("pubkey", event.pubkey);
      expect(event).toHaveProperty("kind", 27572);
      expect(event).toHaveProperty("content", "nostr-tools test suite");
      resolve2(true);
    }
  );

  relaypool.publish(event, relayurls);
  return expect(
    new Promise((resolve) => {
      resolve2 = resolve;
    })
  ).resolves.toEqual(true);
});

test("relay option in filter", async () => {
  const event = await publishAndGetEvent(relayurls);

  var resolve1: (success: boolean) => void;
  var resolve2: (success: boolean) => void;
  const promiseAll = Promise.all([
    new Promise((resolve) => {
      resolve1 = resolve;
    }),
    new Promise((resolve) => {
      resolve2 = resolve;
    }),
  ]);

  relaypool.subscribe(
    [
      {
        kinds: [event.kind],
        relay: relayurls[0],
      },
    ],
    [],
    (event, afterEose, url) => {
      expect(event).toHaveProperty("id", event.id);
      expect(afterEose).toBe(false);
      resolve1(true);
    },
    undefined,
    (events, url) => {
      expect(events).toHaveLength(1);
      if (events && events.length > 0) {
        expect(events[0]).toHaveProperty("id", event.id);
      }
      expect(url).toBe(relayurls[0]);
      resolve2(true);
    }
  );

  return expect(promiseAll).resolves.toEqual([true, true]);
});

test("cached result", async () => {
  const event = createSignedEvent();
  relaypool.publish(event, relayurls);

  await expect(
    new Promise((resolve) => {
      relaypool.subscribe(
        [
          {
            kinds: [27572],
            authors: [event.pubkey],
          },
        ],
        relayurls,
        (event) => {
          expect(event).toHaveProperty("pubkey", event.pubkey);
          expect(event).toHaveProperty("kind", 27572);
          expect(event).toHaveProperty("content", "nostr-tools test suite");
          resolve(true);
        }
      );
    })
  ).resolves.toEqual(true);

  const secondOnEvent = new Promise((resolve) => {
    relaypool.subscribe(
      [
        {
          // @ts-ignore
          ids: [event.id],
        },
      ],
      [],
      (event) => {
        expect(event).toHaveProperty("pubkey", event.pubkey);
        expect(event).toHaveProperty("kind", 27572);
        expect(event).toHaveProperty("content", "nostr-tools test suite");
        resolve(true);
      }
    );
  });

  return expect(secondOnEvent).resolves.toEqual(true);
});

test("remove duplicates", async () => {
  const event = await publishAndGetEvent(relayurls);

  await expect(
    new Promise((resolve) => {
      relaypool.subscribe(
        [
          {
            kinds: [27572],
            authors: [event.pubkey],
          },
        ],
        relayurls,
        (event, afterEose, url) => {
          expect(event).toHaveProperty("pubkey", event.pubkey);
          expect(event).toHaveProperty("kind", 27572);
          expect(event).toHaveProperty("content", "nostr-tools test suite");
          resolve(true);
        }
      );
    })
  ).resolves.toEqual(true);

  await expect(
    new Promise((resolve) => {
      relaypool.subscribe(
        [
          {
            kinds: [27572],
            authors: [event.pubkey],
          },
        ],
        relayurls,
        (event, afterEose, url) => {
          expect(event).toHaveProperty("pubkey", event.pubkey);
          expect(event).toHaveProperty("kind", 27572);
          expect(event).toHaveProperty("content", "nostr-tools test suite");
          resolve(true);
        }
      );
      relaypool.publish(event, relayurls);
    })
  ).resolves.toEqual(true);

  let counter = 0;
  await expect(
    new Promise((resolve) => {
      relaypool.subscribe(
        [
          {
            // @ts-ignore
            kinds: [27572],
            authors: [event.pubkey],
            noCache: true,
          },
        ],
        [...relayurls, ...relayurls2],
        (event, afterEose, url) => {
          expect(event).toHaveProperty("pubkey", event.pubkey);
          expect(event).toHaveProperty("kind", 27572);
          expect(event).toHaveProperty("content", "nostr-tools test suite");
          counter += 1;
          if (counter === 2) {
            resolve(true);
          }
        },
        undefined,
        undefined,
        {allowDuplicateEvents: true}
      );
      relaypool.publish(event, relayurls);
      relaypool.publish(event, relayurls2);
    })
  ).resolves.toEqual(true);

  let counter2 = 0;
  const thirdOnEvent = new Promise((resolve) => {
    relaypool.subscribe(
      [
        {
          // @ts-ignore
          authors: [event.pubkey],
        },
      ],
      [...relayurls, ...relayurls2],
      (event, afterEose, url) => {
        expect(event).toHaveProperty("pubkey", event.pubkey);
        expect(event).toHaveProperty("kind", 27572);
        expect(event).toHaveProperty("content", "nostr-tools test suite");
        counter2 += 1;
        if (counter2 === 2) {
          resolve(true);
        }
      }
    );
    relaypool.publish(event, relayurls);
    relaypool.publish(event, relayurls2);
  });

  await expect(
    Promise.race([
      thirdOnEvent,
      new Promise((resolve) => setTimeout(() => resolve(-1), 50)),
    ])
  ).resolves.toEqual(-1);
});

test("cache authors", async () => {
  let event = createSignedEvent();
  let pk = event.pubkey;

  await expect(
    new Promise((resolve) => {
      relaypool.subscribe(
        [
          {
            kinds: [27572],
            authors: [pk],
          },
        ],
        relayurls2,
        (event, afterEose, url) => {
          expect(event).toHaveProperty("pubkey", pk);
          expect(event).toHaveProperty("kind", 27572);
          expect(event).toHaveProperty("content", "nostr-tools test suite");
          resolve(true);
        }
      );
      // @ts-ignore
      relaypool.publish(event, relayurls2);
    })
  ).resolves.toEqual(true);

  return expect(
    new Promise((resolve) => {
      relaypool.subscribe(
        [
          {
            kinds: [27572],
            authors: [pk],
          },
        ],
        relayurls2,
        (event, afterEose, url) => {
          expect(event).toHaveProperty("pubkey", pk);
          expect(event).toHaveProperty("kind", 27572);
          expect(event).toHaveProperty("content", "nostr-tools test suite");
          expect(url).toEqual(undefined);
          resolve(true);
        }
      );
    })
  ).resolves.toEqual(true);
});

test("kind3", async () => {
  let event = createSignedEvent(3);
  relaypool.publish(event, relayurls);
  let pk = event.pubkey;

  await expect(
    new Promise((resolve) => {
      relaypool.subscribe(
        [
          {
            kinds: [3],
            authors: [pk],
          },
        ],
        relayurls,
        (event) => {
          expect(event).toHaveProperty("pubkey", pk);
          expect(event).toHaveProperty("kind", 3);
          expect(event).toHaveProperty("content", "nostr-tools test suite");
          resolve(true);
        }
      );
    })
  ).resolves.toEqual(true);

  const secondOnEvent = new Promise((resolve) => {
    relaypool.subscribe(
      [
        {
          // @ts-ignore
          ids: [event.id],
        },
      ],
      [],
      (event) => {
        expect(event).toHaveProperty("pubkey", pk);
        expect(event).toHaveProperty("kind", 3);
        expect(event).toHaveProperty("content", "nostr-tools test suite");
        resolve(true);
      }
    );
  });

  return expect(secondOnEvent).resolves.toEqual(true);
});

test("kind0", async () => {
  let event = createSignedEvent(0);
  relaypool.publish(event, relayurls);
  let pk = event.pubkey;
  await expect(
    new Promise((resolve) => {
      relaypool.subscribe(
        [
          {
            kinds: [0],
            authors: [pk],
          },
        ],
        relayurls,
        (event) => {
          expect(event).toHaveProperty("pubkey", pk);
          expect(event).toHaveProperty("kind", 0);
          expect(event).toHaveProperty("content", "nostr-tools test suite");
          resolve(true);
        }
      );
    })
  ).resolves.toEqual(true);

  const secondOnEvent = new Promise((resolve) => {
    relaypool.subscribe(
      [
        {
          // @ts-ignore
          ids: [event.id],
        },
      ],
      [],
      (event) => {
        expect(event).toHaveProperty("pubkey", pk);
        expect(event).toHaveProperty("kind", 0);
        expect(event).toHaveProperty("content", "nostr-tools test suite");
        resolve(true);
      }
    );
  });

  await expect(secondOnEvent).resolves.toEqual(true);

  const thirdOnEvent = new Promise((resolve) => {
    relaypool.subscribe(
      [
        {
          kinds: [0],
          authors: [pk],
        },
      ],
      [],
      (event) => {
        expect(event).toHaveProperty("pubkey", pk);
        expect(event).toHaveProperty("kind", 0);
        expect(event).toHaveProperty("content", "nostr-tools test suite");
        resolve(true);
      }
    );
  });

  return expect(thirdOnEvent).resolves.toEqual(true);
});

test("getRelayStatuses", async () => {
  let event = createSignedEvent(0);
  relaypool.publish(event, relayurls);
  expect(relaypool.getRelayStatuses()).toEqual([[relayurls[0], 0]]);
});

test("nounsub", async () => {
  let event = createSignedEvent(0);
  relaypool.publish(event, relayurls);

  let p2 = new Promise((resolve2) => {
    new Promise((resolve1) => {
      let counter = 0;
      let _sub1 = relaypool.subscribe(
        filtersByKind(event),
        relayurls,
        (event) => {
          expect(event).toHaveProperty("kind", 0);
          counter++;
          if (counter === 1) {
            let event2 = createSignedEvent(0);
            relaypool.publish(event2, relayurls);
          } else if (counter === 2) {
            resolve2(true);
          }
        }
      );
    });
  });
  await expect(p2).resolves.toEqual(true);
});

test("unsub", async () => {
  let event = createSignedEvent(0);
  relaypool.publish(event, relayurls);

  let p2 = new Promise((resolve2) => {
    new Promise((resolve1) => {
      let counter = 0;
      let sub1 = relaypool.subscribe(
        filtersByKind(event),
        relayurls,
        (event) => {
          expect(event).toHaveProperty("kind", 0);
          counter++;
          if (counter === 1) {
            sub1();
            let event2 = createSignedEvent(0);
            relaypool.publish(event2, relayurls);
          } else if (counter === 2) {
            resolve2(true);
          }
        }
      );
    });
  });
  await expect(
    Promise.race([
      p2,
      new Promise((resolve) => {
        setTimeout(() => resolve(false), 50);
      }),
    ])
  ).resolves.toEqual(false);
});

test("delay_nounsub", async () => {
  let event = createSignedEvent(0);
  relaypool.publish(event, relayurls);

  let p2 = new Promise((resolve2) => {
    new Promise((resolve1) => {
      let counter = 0;
      let _sub1 = relaypool.subscribe(
        filtersByKind(event),
        relayurls,
        (event) => {
          expect(event).toHaveProperty("kind", 0);
          counter++;
          if (counter === 1) {
            let event2 = createSignedEvent(0);
            relaypool.publish(event2, relayurls);
          } else if (counter === 2) {
            resolve2(true);
          }
        },
        0
      );
    });
  });
  await expect(
    Promise.race([
      p2,
      new Promise((resolve) => {
        setTimeout(() => resolve(false), 50);
      }),
    ])
  ).resolves.toEqual(true);
});

test("delay_unsub", async () => {
  let event = createSignedEvent(0);
  relaypool.publish(event, relayurls);

  let p2 = new Promise((resolve2) => {
    new Promise((resolve1) => {
      let counter = 0;
      let sub1 = relaypool.subscribe(
        filtersByKind(event),
        relayurls,
        (event) => {
          expect(event).toHaveProperty("kind", 0);
          counter++;
          if (counter === 1) {
            sub1();
            let event2 = createSignedEvent(0);
            relaypool.publish(event2, relayurls);
          } else if (counter === 2) {
            resolve2(true);
          }
        },
        0
      );
    });
  });
  await expect(
    Promise.race([
      p2,
      new Promise((resolve) => {
        setTimeout(() => resolve(false), 50);
      }),
    ])
  ).resolves.toEqual(false);
});

test("unsubscribeOnEose", async () => {
  let relayServer = new InMemoryRelayServer(8099);
  let event = createSignedEvent();
  relaypool = new RelayPool([], {noCache: true});
  relaypool.publish(event, ["ws://localhost:8099/"]);
  expect(relayServer.subs.size).toEqual(0);

  await new Promise((resolve) => {
    let sub = relaypool.subscribe(
      filtersByKind(event),
      ["ws://localhost:8099/"],
      (event) => {
        expect(event).toHaveProperty("kind", event.kind);
        sub();
        setTimeout(() => resolve(true), 50);
      }
    );
  });

  expect(_relayServer.subs.size).toEqual(0);

  let found = false;
  let p2;
  let p = new Promise((resolve) => {
    p2 = new Promise((resolve2) => {
      let _sub = relaypool.subscribe(
        filtersByKind(event),
        ["ws://localhost:8099/"],
        (event) => {
          expect(event).toHaveProperty("kind", event.kind);
          found = true;
          resolve(true);
        },
        undefined,
        () => resolve2(true),
        {unsubscribeOnEose: true}
      );
    });
  });
  await expect(p).resolves.toEqual(true);
  await expect(p2).resolves.toEqual(true);
  expect(found).toEqual(true);
  await sleepms(50);
  expect(relayServer.subs.size).toEqual(0);
  relayServer.close();
});

const filtersByAuthor = (event: Event) => [{authors: [event.pubkey]}];
const filtersByKind = (event: Event) => [{kinds: [event.kind]}];
const sleepms = (timeoutMs: number) =>
  new Promise((resolve) => setTimeout(() => resolve(true), timeoutMs));

// const subscribePromise = (
//   relaypool: RelayPool,
//   filters: Filter[],
//   relays: string[],
//   onEventPromise: (resolve: (value: any) => void) => OnEvent,
//   maxDelayms?: number | undefined,
//   onEosePromise?: (resolve: (value: any) => void) => OnEose,
//   options?: SubscriptionOptions
// ) =>
//   new Promise((resolve) =>
//     relaypool.subscribe(
//       filters,
//       relays,
//       onEventPromise(resolve),
//       maxDelayms,
//       onEosePromise?.(resolve),
//       options
//     )
//   );

test("subscriptionCache", async () => {
  let event = createSignedEvent();
  relaypool.publish(event, relayurls);
  expect(_relayServer.totalSubscriptions).toEqual(0);

  await new Promise((resolve) => {
    relaypool.subscribe(filtersByKind(event), relayurls, (event) => {
      resolve(true);
    });
  });

  await new Promise((resolve) => {
    relaypool.subscribe(
      filtersByAuthor(event),
      relayurls,
      (event) => {
        resolve(true);
      },
      undefined,
      undefined,
      {unsubscribeOnEose: true}
    );
  });
  await new Promise((resolve) => {
    relaypool.subscribe(
      filtersByAuthor(event),
      relayurls,
      (event) => {
        resolve(true);
      },
      undefined,
      undefined,
      {unsubscribeOnEose: true}
    );
  });
  await sleepms(10);
  expect(_relayServer.totalSubscriptions).toEqual(2);
});

// jest -t 'pool memory' --testTimeout 1000000 --logHeapUsage
//  PASS  ./relay-pool.test.ts (92.9 s, 348 MB heap size)
test.skip("pool memory usage", async () => {
  console.log("creating new relaypool");
  relaypool = new RelayPool(relayurls, {
    noCache: true,
    dontLogSubscriptions: true,
  });
  relaypool.relayByUrl.forEach((relay) => {
    // @ts-ignore
    relay.relay.logging = false;
  });
  await publishAndGetEvent(relayurls, 100, "x".repeat(20 * 1024 * 1024));

  for (let i = 0; i < 300; i++) {
    await new Promise((resolve) => {
      const unsub = relaypool.subscribe([{}], relayurls, (event) => {
        unsub();
        resolve(true);
      });
    });
  }
});
