/* eslint-env jest */

import {RelayPool} from "./relay-pool";
import {Author} from "./author";
import {Kind} from "nostr-tools";

jest.setTimeout(5000);
const pubkey =
  "32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245";
const relays = [
  "wss://relay.damus.io",
  "wss://nostr.fmt.wiz.biz",
  "wss://relay.snort.social",
];
const _events = [
  {
    id: "bd72d02cbc5e4eca98cef001d9850e816c31d2bf9287f7eb433026c8f81c551f",
    pubkey: "32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245",
    created_at: 1673549387,
    kind: 0,
    tags: [],
    content:
      '{"banner":"https:\\/\\/pbs.twimg.com\\/profile_banners\\/9918032\\/1531711830\\/600x200","website":"https:\\/\\/jb55.com","lud06":"lnurl1dp68gurn8ghj7um9dej8xct5wvhxcmmv9uh8wetvdskkkmn0wahz7mrww4excup0df3r2dg3mj444","nip05":"jb55@jb55.com","picture":"https:\\/\\/cdn.jb55.com\\/img\\/red-me.jpg","display_name":"Will 🔮⚡️","about":"damus.io author. bitcoin and nostr dev","name":"jb55"}',
    sig: "fcc1826acf94d57c2eaebbd8a810240a83a172bb9853f2b90784ab0f2722355716204d4e7fe5a0447594fbde3d708484477eec6a544a11b21cc91dead9343c3d",
  },
];

test("metaData", () => {
  const relayPool = new RelayPool();
  const author = new Author(relayPool, relays, pubkey);
  return new Promise((resolve) => {
    const unsubscribe = author.metaData((event) => {
      unsubscribe();
      expect(event.kind).toBe(Kind.Metadata);
      expect(event.pubkey).toBe(pubkey);
      expect(JSON.parse(event.content).nip05).toBe("jb55@jb55.com");
      resolve(event);
    }, 0);
  });
});

test("followsPubkeys", () => {
  const relayPool = new RelayPool();
  const author = new Author(relayPool, relays, pubkey);
  author.subscribe([{kinds: [Kind.Contacts]}], console.log, 0);
  return new Promise((resolve) => {
    const unsubscribe = author.followsPubkeys((pubkeys) => {
      unsubscribe();
      expect(
        pubkeys.includes(
          "6cad545430904b84a8101c5783b65043f19ae29d2da1076b8fc3e64892736f03"
        )
      ).toBe(true);
      resolve(true);
    }, 0);
  });
});

test("followsAuthors", () => {
  const relayPool = new RelayPool();
  const author = new Author(relayPool, relays, pubkey);
  author.subscribe([{kinds: [Kind.Contacts]}], console.log, 0);
  return new Promise((resolve) => {
    const unsubscribe = author.follows((authors) => {
      unsubscribe();
      expect(
        authors
          .map((author) => author.pubkey)
          .includes(
            "6cad545430904b84a8101c5783b65043f19ae29d2da1076b8fc3e64892736f03"
          )
      ).toBe(true);
      resolve(true);
    }, 0);
  });
});

test("allEvents", () => {
  const relayPool = new RelayPool();
  const author = new Author(relayPool, relays, pubkey);
  author.subscribe([{kinds: [Kind.Contacts]}], console.log, 0);
  return new Promise((resolve) => {
    const unsubscribe = author.allEvents(
      (events) => {
        unsubscribe();
        expect(events.pubkey).toBe(pubkey);
        resolve(true);
      },
      2,
      0
    );
  });
});

test("referenced", () => {
  const relayPool = new RelayPool();
  const author = new Author(relayPool, relays, pubkey);
  return new Promise((resolve) => {
    const unsubscribe = author.referenced(
      (events) => {
        unsubscribe();
        expect(events.tags.map((tag) => tag[1]).includes(pubkey)).toBe(true);
        resolve(true);
      },
      2,
      0
    );
  });
});

test("followers", () => {
  const relayPool = new RelayPool();
  const author = new Author(relayPool, relays, pubkey);
  return new Promise((resolve) => {
    const unsubscribe = author.referenced(
      (events) => {
        unsubscribe();
        expect(events.pubkey !== pubkey).toBe(true);
        expect(events.kind).toBe(Kind.Contacts);
        expect(events.tags.map((tag) => tag[1]).includes(pubkey)).toBe(true);
        resolve(true);
      },
      2,
      0
    );
  });
});
