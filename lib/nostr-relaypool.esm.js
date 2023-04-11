// merge-similar-filters.ts
import { stringify } from "safe-stable-stringify";
function indexForFilter(filter, key) {
  let new_filter = { ...filter };
  delete new_filter[key];
  return key + stringify(new_filter);
}
function mergeSimilarAndRemoveEmptyFilters(filters) {
  let r = [];
  let indexByFilter = /* @__PURE__ */ new Map();
  for (let filter of filters) {
    let added = false;
    for (let key in filter) {
      if (filter[key] && (["ids", "authors", "kinds"].includes(key) || key.startsWith("#"))) {
        if (filter[key].length === 0) {
          added = true;
          break;
        }
        let index_by = indexForFilter(filter, key);
        let index = indexByFilter.get(index_by);
        if (index !== void 0) {
          let extendedFilter = r[index];
          for (let key2 in extendedFilter) {
            if (key2 !== key) {
              let index_by2 = indexForFilter(extendedFilter, key2);
              indexByFilter.delete(index_by2);
            }
          }
          r[index][key] = [...new Set(r[index][key].concat(filter[key]))];
          added = true;
          break;
        }
      }
    }
    if (!added) {
      for (let key in filter) {
        if (filter[key] && (["ids", "authors", "kinds"].includes(key) || key.startsWith("#"))) {
          let index_by = indexForFilter(filter, key);
          indexByFilter.set(index_by, r.length);
        }
      }
      r.push({ ...filter });
    }
  }
  return r;
}

// relay.ts
import { verifySignature, validateEvent } from "nostr-tools";
import { matchFilters } from "nostr-tools";
import WebSocket from "isomorphic-ws";

// fakejson.ts
function getHex64(json, field) {
  let len = field.length + 3;
  let idx = json.indexOf(`"${field}":`) + len;
  let s = json.slice(idx).indexOf(`"`) + idx + 1;
  return json.slice(s, s + 64);
}
function getSubName(json) {
  let idx = json.indexOf(`"EVENT"`) + 7;
  let sliced = json.slice(idx);
  let idx2 = sliced.indexOf(`"`) + 1;
  let sliced2 = sliced.slice(idx2);
  return sliced2.slice(0, sliced2.indexOf(`"`));
}

// relay.ts
function relayInit(url, alreadyHaveEvent, autoReconnect) {
  return new RelayC(url, alreadyHaveEvent, autoReconnect).relayInit();
}
var RelayC = class {
  url;
  alreadyHaveEvent;
  logging = false;
  constructor(url, alreadyHaveEvent, autoReconnect) {
    this.url = url;
    this.alreadyHaveEvent = alreadyHaveEvent;
    this.autoReconnect = autoReconnect;
  }
  autoReconnect;
  ws;
  sendOnConnect = [];
  openSubs = {};
  closedByClient = false;
  listeners = {
    connect: [],
    disconnect: [],
    error: [],
    notice: []
  };
  subListeners = {};
  pubListeners = {};
  incomingMessageQueue = [];
  handleNextInterval;
  #handleNext() {
    if (this.incomingMessageQueue.length === 0) {
      clearInterval(this.handleNextInterval);
      this.handleNextInterval = null;
      return;
    }
    this.#handleMessage({ data: this.incomingMessageQueue.shift() });
  }
  async trySend(params) {
    const msg = JSON.stringify(params);
    if (this.connected) {
      this.ws?.send(msg);
    } else {
      this.sendOnConnect.push(msg);
    }
  }
  resolveClose = void 0;
  async #onclose() {
    if (this.closedByClient) {
      this.listeners.disconnect.forEach((cb) => cb());
      this.resolveClose && this.resolveClose();
    } else {
      if (this.autoReconnect) {
        this.#reconnect();
      }
    }
  }
  reconnectTimeout = 0;
  #reconnect() {
    setTimeout(() => {
      this.reconnectTimeout = Math.max(2e3, this.reconnectTimeout * 3);
      console.log(
        this.url,
        "reconnecting after " + this.reconnectTimeout / 1e3 + "s"
      );
      this.connect();
    }, this.reconnectTimeout);
  }
  async #onmessage(e) {
    this.incomingMessageQueue.push(e.data);
    if (!this.handleNextInterval) {
      this.handleNextInterval = setInterval(() => this.#handleNext(), 0);
    }
  }
  async #handleMessage(e) {
    let data;
    let json = e.data.toString();
    if (!json) {
      return;
    }
    let eventId = getHex64(json, "id");
    let event = this.alreadyHaveEvent?.(eventId);
    if (event) {
      const listener = this.subListeners[getSubName(json)];
      if (!listener) {
        return;
      }
      return listener.event.forEach((cb) => cb(event));
    }
    try {
      data = JSON.parse(json);
    } catch (err) {
      data = e.data;
    }
    if (data.length >= 1) {
      switch (data[0]) {
        case "EVENT":
          if (this.logging) {
            console.log(data);
          }
          if (data.length !== 3)
            return;
          const id = data[1];
          const event2 = data[2];
          if (!this.openSubs[id]) {
            return;
          }
          if (this.openSubs[id].eventIds?.has(eventId)) {
            return;
          }
          this.openSubs[id].eventIds?.add(eventId);
          if (validateEvent(event2) && this.openSubs[id] && (this.openSubs[id].skipVerification || verifySignature(event2)) && matchFilters(this.openSubs[id].filters, event2)) {
            this.openSubs[id];
            (this.subListeners[id]?.event || []).forEach((cb) => cb(event2));
          }
          return;
        case "EOSE": {
          if (data.length !== 2)
            return;
          const id2 = data[1];
          if (this.logging) {
            console.log("EOSE", this.url, id2);
          }
          (this.subListeners[id2]?.eose || []).forEach((cb) => cb());
          return;
        }
        case "OK": {
          if (data.length < 3)
            return;
          const id2 = data[1];
          const ok = data[2];
          const reason = data[3] || "";
          if (ok)
            this.pubListeners[id2]?.ok.forEach((cb) => cb());
          else
            this.pubListeners[id2]?.failed.forEach((cb) => cb(reason));
          return;
        }
        case "NOTICE":
          if (data.length !== 2)
            return;
          const notice = data[1];
          this.listeners.notice.forEach((cb) => cb(notice));
          return;
      }
    }
  }
  #onopen(opened) {
    if (this.resolveClose) {
      this.resolveClose();
      return;
    }
    for (const subid in this.openSubs) {
      if (this.logging) {
        console.log("REQ", this.url, subid, ...this.openSubs[subid].filters);
      }
      this.trySend(["REQ", subid, ...this.openSubs[subid].filters]);
    }
    for (const msg of this.sendOnConnect) {
      if (this.logging) {
        console.log("(Relay msg)", this.url, msg);
      }
      this.ws?.send(msg);
    }
    this.sendOnConnect = [];
    this.listeners.connect.forEach((cb) => cb());
    opened();
  }
  async connectRelay() {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.url);
      this.ws = ws;
      ws.onopen = this.#onopen.bind(this, resolve);
      ws.onerror = (e) => {
        this.listeners.error.forEach((cb) => cb());
        reject(e);
      };
      ws.onclose = this.#onclose.bind(this);
      ws.onmessage = this.#onmessage.bind(this);
    });
  }
  async connect() {
    if (this.ws?.readyState && this.ws.readyState === 1)
      return;
    try {
      await this.connectRelay();
    } catch (err) {
      console.error("Error connecting relay ", this.url);
    }
  }
  relayInit() {
    const this2 = this;
    return {
      url: this2.url,
      sub: this2.sub.bind(this2),
      on: this2.on.bind(this2),
      off: this2.off.bind(this2),
      publish: this2.publish.bind(this2),
      connect: this2.connect.bind(this2),
      close() {
        return this2.close();
      },
      get status() {
        return this2.status;
      },
      relay: this2
    };
  }
  get status() {
    return this.ws?.readyState ?? 3;
  }
  get connected() {
    return this.ws?.readyState === 1;
  }
  close() {
    this.closedByClient = true;
    this.ws?.close();
    return new Promise((resolve) => {
      this.resolveClose = resolve;
    });
  }
  on(type, cb) {
    this.listeners[type].push(cb);
    if (type === "connect" && this.ws?.readyState === 1) {
      cb();
    }
  }
  off(type, cb) {
    const index = this.listeners[type].indexOf(cb);
    if (index !== -1)
      this.listeners[type].splice(index, 1);
  }
  publish(event) {
    const this2 = this;
    if (!event.id)
      throw new Error(`event ${event} has no id`);
    const id = event.id;
    let sent = false;
    let mustMonitor = false;
    this2.trySend(["EVENT", event]).then(() => {
      sent = true;
      if (mustMonitor) {
        startMonitoring();
        mustMonitor = false;
      }
    }).catch(() => {
    });
    const startMonitoring = () => {
      const monitor = this.sub([{ ids: [id] }], {
        id: `monitor-${id.slice(0, 5)}`
      });
      const willUnsub = setTimeout(() => {
        (this2.pubListeners[id]?.failed || []).forEach(
          (cb) => cb("event not seen after 5 seconds")
        );
        monitor.unsub();
      }, 5e3);
      monitor.on("event", () => {
        clearTimeout(willUnsub);
        (this2.pubListeners[id]?.seen || []).forEach((cb) => cb());
      });
    };
    return {
      on: (type, cb) => {
        this2.pubListeners[id] = this2.pubListeners[id] || {
          ok: [],
          seen: [],
          failed: []
        };
        this2.pubListeners[id][type].push(cb);
        if (type === "seen") {
          if (sent)
            startMonitoring();
          else
            mustMonitor = true;
        }
      },
      off: (type, cb) => {
        const listeners = this2.pubListeners[id];
        if (!listeners)
          return;
        const idx = listeners[type].indexOf(cb);
        if (idx >= 0)
          listeners[type].splice(idx, 1);
      }
    };
  }
  sub(filters, opts = {}) {
    const this2 = this;
    const subid = opts.id || Math.random().toString().slice(2);
    const skipVerification = opts.skipVerification || false;
    this2.openSubs[subid] = {
      id: subid,
      filters,
      skipVerification
    };
    if (this2.connected) {
      if (this.logging) {
        console.log("REQ2", this.url, subid, ...filters);
      }
      this2.trySend(["REQ", subid, ...filters]);
    }
    return {
      sub: (newFilters, newOpts = {}) => this.sub(newFilters || filters, {
        skipVerification: newOpts.skipVerification || skipVerification,
        id: subid
      }),
      unsub: () => {
        delete this2.openSubs[subid];
        delete this2.subListeners[subid];
        if (this2.connected) {
          if (this2.logging) {
            console.log("CLOSE", this.url, subid);
          }
          this2.trySend(["CLOSE", subid]);
        }
      },
      on: (type, cb) => {
        this2.subListeners[subid] = this2.subListeners[subid] || {
          event: [],
          eose: []
        };
        this2.subListeners[subid][type].push(cb);
      },
      off: (type, cb) => {
        const listeners = this2.subListeners[subid];
        if (!listeners)
          return;
        const idx = listeners[type].indexOf(cb);
        if (idx >= 0)
          listeners[type].splice(idx, 1);
      }
    };
  }
};

// event-cache.ts
import { Kind } from "nostr-tools";
var EventCache = class {
  eventsById = /* @__PURE__ */ new Map();
  metadataByPubKey = /* @__PURE__ */ new Map();
  contactsByPubKey = /* @__PURE__ */ new Map();
  authorsKindsByPubKey = /* @__PURE__ */ new Map();
  eventsByTags = /* @__PURE__ */ new Map();
  #addEventToAuthorKindsByPubKey(event) {
    const kindsByPubKey = this.authorsKindsByPubKey.get(event.pubkey);
    if (!kindsByPubKey) {
      this.authorsKindsByPubKey.set(
        event.pubkey,
        /* @__PURE__ */ new Map([[event.kind, [event]]])
      );
    } else {
      const events = kindsByPubKey.get(event.kind);
      if (!events) {
        kindsByPubKey.set(event.kind, [event]);
      } else {
        if (event.kind === Kind.Metadata || event.kind === Kind.Contacts) {
          if (event.created_at > events[0].created_at) {
            events[0] = event;
          }
        } else {
          events.push(event);
        }
      }
    }
  }
  #addEventToEventsByTags(event) {
    for (const tag of event.tags) {
      let tag2 = tag[0] + ":" + tag[1];
      const events = this.eventsByTags.get(tag2);
      if (events) {
        events.push(event);
      } else {
        this.eventsByTags.set(tag2, [event]);
      }
    }
  }
  addEvent(event) {
    if (this.getEventById(event.id)) {
      return;
    }
    this.eventsById.set(event.id, event);
    if (event.kind === Kind.Metadata) {
      this.metadataByPubKey.set(event.pubkey, event);
    }
    if (event.kind === Kind.Contacts) {
      this.contactsByPubKey.set(event.pubkey, event);
    }
    this.#addEventToAuthorKindsByPubKey(event);
    this.#addEventToEventsByTags(event);
  }
  getEventById(id) {
    return this.eventsById.get(id);
  }
  hasEventById(id) {
    return this.eventsById.has(id);
  }
  #getCachedEventsByPubKeyWithUpdatedFilter(filter) {
    if (filter.noCache || !filter.authors || !filter.kinds || filter.kinds.find(
      (kind) => kind !== Kind.Contacts && kind !== Kind.Metadata
    ) !== void 0) {
      return void 0;
    }
    const authors = [];
    const events = /* @__PURE__ */ new Set();
    for (const author of filter.authors) {
      let contactEvent;
      if (filter.kinds.includes(Kind.Contacts)) {
        contactEvent = this.contactsByPubKey.get(author);
        if (!contactEvent) {
          authors.push(author);
          continue;
        }
      }
      let metadataEvent;
      if (filter.kinds.includes(Kind.Metadata)) {
        metadataEvent = this.metadataByPubKey.get(author);
        if (!metadataEvent) {
          authors.push(author);
          continue;
        }
      }
      if (contactEvent) {
        events.add(contactEvent);
      }
      if (metadataEvent) {
        events.add(metadataEvent);
      }
    }
    return { filter: { ...filter, authors }, events };
  }
  #getCachedEventsByPubKeyWithUpdatedFilter2(filter) {
    if (filter.noCache || !filter.authors) {
      return void 0;
    }
    const events = /* @__PURE__ */ new Set();
    for (const author of filter.authors) {
      if (filter.kinds) {
        const kindsByPubKey = this.authorsKindsByPubKey.get(author);
        if (kindsByPubKey) {
          for (const kind of filter.kinds) {
            const events2 = kindsByPubKey.get(kind);
            if (events2) {
              for (const event of events2) {
                events.add(event);
              }
            }
          }
        }
      } else {
        const kindsByPubKey = this.authorsKindsByPubKey.get(author);
        if (kindsByPubKey) {
          for (const events2 of kindsByPubKey.values()) {
            for (const event3 of events2) {
              events.add(event3);
            }
          }
        }
      }
    }
    return { filter, events };
  }
  #getCachedEventsByTagsWithUpdatedFilter(filter) {
    if (filter.noCache) {
      return void 0;
    }
    const events = /* @__PURE__ */ new Set();
    for (const tag in filter) {
      if (tag[0] !== "#") {
        continue;
      }
      let tag2 = tag.slice(1) + ":" + filter[tag][0];
      const events2 = this.eventsByTags.get(tag2);
      if (events2) {
        for (const event of events2) {
          events.add(event);
        }
      }
    }
    return { filter, events };
  }
  #getCachedEventsByIdWithUpdatedFilter(filter) {
    if (!filter.ids) {
      return void 0;
    }
    const events = /* @__PURE__ */ new Set();
    const ids = [];
    for (const id of filter.ids) {
      const event = this.getEventById(id);
      if (event) {
        events.add(event);
      } else {
        ids.push(id);
      }
    }
    return { filter: { ...filter, ids }, events };
  }
  getCachedEventsWithUpdatedFilters(filters, relays) {
    const events = /* @__PURE__ */ new Set();
    const new_filters = [];
    for (const filter of filters) {
      const new_data = this.#getCachedEventsByIdWithUpdatedFilter(filter) || this.#getCachedEventsByPubKeyWithUpdatedFilter2(filter) || this.#getCachedEventsByTagsWithUpdatedFilter(filter) || {
        filter,
        events: []
      };
      for (const event of new_data.events) {
        events.add(event);
      }
      new_filters.push(new_data.filter);
    }
    return { filters: new_filters, events: [...events] };
  }
};

// author.ts
import { Kind as Kind2 } from "nostr-tools";
var Author = class {
  pubkey;
  relayPool;
  relays;
  constructor(relayPool, relays, pubkey) {
    this.pubkey = pubkey;
    this.relayPool = relayPool;
    this.relays = relays;
  }
  metaData(cb, maxDelayms) {
    return this.relayPool.subscribeEventObject(
      [
        {
          authors: [this.pubkey],
          kinds: [Kind2.Metadata]
        }
      ],
      this.relays,
      cb,
      maxDelayms
    );
  }
  subscribe(filters, cb, maxDelayms) {
    return this.relayPool.subscribeEventObject(
      filters.map((filter) => ({
        authors: [this.pubkey],
        ...filter
      })),
      this.relays,
      cb,
      maxDelayms
    );
  }
  followsPubkeys(cb, maxDelayms) {
    return this.relayPool.subscribeEventObject(
      [
        {
          authors: [this.pubkey],
          kinds: [Kind2.Contacts]
        }
      ],
      this.relays,
      (event) => {
        let r = [];
        for (const tag of event.tags) {
          if (tag[0] === "p") {
            r.push(tag[1]);
          }
        }
        cb(r);
      },
      maxDelayms
    );
  }
  follows(cb, maxDelayms) {
    return this.relayPool.subscribeEventObject(
      [
        {
          authors: [this.pubkey],
          kinds: [Kind2.Contacts]
        }
      ],
      this.relays,
      (event) => {
        let r = [];
        for (const tag of event.tags) {
          if (tag[0] === "p") {
            let relays = this.relays;
            if (tag[1]) {
              relays = [tag[1], ...this.relays || []];
            }
            r.push(new Author(this.relayPool, relays, tag[1]));
          }
        }
        cb(r);
      },
      maxDelayms
    );
  }
  secondFollows(cb, maxDelayms, removeDirectFollows = true) {
    return this.followsPubkeys((pubkeys) => {
      let sfollows = /* @__PURE__ */ new Map();
      for (const pubkey of pubkeys) {
        this.relayPool.subscribeEventObject(
          [
            {
              authors: [pubkey],
              kinds: [Kind2.Contacts]
            }
          ],
          this.relays,
          (event) => {
            let dweight = 1 / event.tags.length;
            for (const tag of event.tags) {
              if (tag[0] === "p") {
                let weight = sfollows.get(tag[1]);
                if (weight) {
                  weight += dweight;
                } else {
                  weight = dweight;
                }
                sfollows.set(tag[1], weight);
              }
            }
            if (removeDirectFollows) {
              for (const pubkey2 of pubkeys) {
                sfollows.delete(pubkey2);
              }
            }
            cb(Array.from(sfollows.entries()).sort((a, b) => b[1] - a[1]));
          },
          maxDelayms
        );
      }
    }, maxDelayms);
  }
  allEvents(cb, limit = 100, maxDelayms) {
    return this.relayPool.subscribe(
      [
        {
          authors: [this.pubkey],
          limit
        }
      ],
      this.relays,
      cb,
      maxDelayms
    );
  }
  referenced(cb, limit = 100, maxDelayms) {
    return this.relayPool.subscribe(
      [
        {
          "#p": [this.pubkey],
          limit
        }
      ],
      this.relays,
      cb,
      maxDelayms
    );
  }
  followers(cb, limit = 100, maxDelayms) {
    return this.relayPool.subscribe(
      [
        {
          "#p": [this.pubkey],
          kinds: [Kind2.Contacts],
          limit
        }
      ],
      this.relays,
      cb,
      maxDelayms
    );
  }
  sentAndRecievedDMs(cb, limit = 100, maxDelayms) {
    return this.relayPool.subscribe(
      [
        {
          authors: [this.pubkey],
          kinds: [Kind2.EncryptedDirectMessage],
          limit
        },
        {
          "#p": [this.pubkey],
          kinds: [Kind2.EncryptedDirectMessage],
          limit
        }
      ],
      this.relays,
      cb,
      maxDelayms
    );
  }
  text(cb, limit = 100, maxDelayms) {
    return this.relayPool.subscribe(
      [
        {
          authors: [this.pubkey],
          kinds: [Kind2.Text],
          limit
        }
      ],
      this.relays,
      cb,
      maxDelayms
    );
  }
};

// event.ts
var EventObject = class {
  id;
  kind;
  pubkey;
  tags;
  created_at;
  content;
  relayPool;
  relays;
  sig;
  constructor(event, relayPool, relays) {
    this.id = event.id;
    this.kind = event.kind;
    this.pubkey = event.pubkey;
    this.tags = event.tags;
    this.created_at = event.created_at;
    this.content = event.content;
    this.relayPool = relayPool;
    this.relays = relays;
    this.sig = event.sig;
  }
  referencedAuthors() {
    const r = [];
    for (const tag of this.tags) {
      if (tag[0] === "p") {
        r.push(new Author(this.relayPool, void 0, tag[1]));
      }
    }
    return r;
  }
  referencedEvents(maxDelayms) {
    const r = [];
    for (const tag of this.tags) {
      if (tag[0] === "e") {
        let relays = this.relays;
        if (tag[2]) {
          relays = [tag[2], ...relays || []];
        }
        r.push(
          this.relayPool.getEventById(tag[1], relays, maxDelayms).then((e) => new EventObject(e, this.relayPool, this.relays))
        );
      }
    }
    return r;
  }
  thread(cb, maxDelayms) {
    let relays = this.relays;
    let ids = [];
    for (const tag of this.tags) {
      if (tag[0] === "e") {
        if (tag[2]) {
          relays = [tag[2], ...relays || []];
        }
        ids.push(tag[1]);
      }
    }
    return this.relayPool.subscribe(
      [{ ids }, { "#e": ids }],
      relays,
      cb,
      maxDelayms
    );
  }
};

// on-event-filters.ts
import { Kind as Kind3, matchFilter } from "nostr-tools";
function doNotEmitDuplicateEvents(onEvent) {
  let event_ids = /* @__PURE__ */ new Set();
  return (event, afterEose, url) => {
    if (event_ids.has(event.id))
      return;
    event_ids.add(event.id);
    onEvent(event, afterEose, url);
  };
}
function doNotEmitOlderEvents(onEvent) {
  let created_at_by_events_kinds = /* @__PURE__ */ new Map();
  return (event, afterEose, url) => {
    if (event.kind === Kind3.Metadata || event.kind === Kind3.Contacts) {
      let event_kind = event.pubkey + " " + event.kind;
      if ((created_at_by_events_kinds.get(event_kind) || 0) > event.created_at)
        return;
      created_at_by_events_kinds.set(event_kind, event.created_at);
    }
    onEvent(event, afterEose, url);
  };
}
function matchOnEventFilters(onEvent, filters) {
  return (event, afterEose, url) => {
    for (let filter of filters) {
      if (matchFilter(filter, event)) {
        onEvent(event, afterEose, url);
        break;
      }
    }
  };
}
function emitEventsOnNextTick(onEvent) {
  return (event, afterEose, url) => {
    setTimeout(() => {
      onEvent(event, afterEose, url);
    }, 0);
  };
}

// callback-replayer.ts
var CallbackReplayer = class {
  subs = [];
  events = [];
  onunsub;
  constructor(onunsub) {
    this.onunsub = onunsub;
  }
  event(...args) {
    this.events.push(args);
    this.subs.forEach((sub) => sub(...args));
  }
  sub(callback) {
    this.events.forEach((event) => callback(...event));
    this.subs.push(callback);
    return () => {
      this.subs = this.subs.filter((sub) => sub !== callback);
      if (this.subs.length === 0) {
        this.onunsub?.();
        this.onunsub = void 0;
      }
    };
  }
};

// group-filters-by-relay.ts
var unique = (arr) => [...new Set(arr)];
function groupFiltersByRelayAndEmitCacheHits(filters, relays, onEvent, options = {}, eventCache) {
  let events = [];
  if (eventCache) {
    const cachedEventsWithUpdatedFilters = eventCache.getCachedEventsWithUpdatedFilters(filters, relays);
    filters = cachedEventsWithUpdatedFilters.filters;
    events = cachedEventsWithUpdatedFilters.events;
  }
  if (options.logAllEvents) {
    const onEventNow = onEvent;
    onEvent = (event, afterEose, url) => {
      onEventNow(event, afterEose, url);
    };
  }
  if (!options.allowDuplicateEvents) {
    onEvent = doNotEmitDuplicateEvents(onEvent);
  }
  if (!options.allowOlderEvents) {
    onEvent = doNotEmitOlderEvents(onEvent);
  }
  for (const event of events) {
    onEvent(event, false, void 0);
  }
  filters = mergeSimilarAndRemoveEmptyFilters(filters);
  onEvent = matchOnEventFilters(onEvent, filters);
  relays = unique(relays);
  const filtersByRelay = getFiltersByRelay(filters, relays);
  return [onEvent, filtersByRelay];
}
function getFiltersByRelay(filters, relays) {
  const filtersByRelay = /* @__PURE__ */ new Map();
  const filtersWithoutRelay = [];
  for (const filter of filters) {
    const relay = filter.relay;
    if (relay) {
      const relayFilters = filtersByRelay.get(relay);
      if (relayFilters) {
        relayFilters.push(withoutRelay(filter));
      } else {
        filtersByRelay.set(relay, [withoutRelay(filter)]);
      }
    } else {
      filtersWithoutRelay.push(filter);
    }
  }
  if (filtersWithoutRelay.length > 0) {
    for (const relay of relays) {
      const filters2 = filtersByRelay.get(relay);
      if (filters2) {
        filtersByRelay.set(relay, filters2.concat(filtersWithoutRelay));
      } else {
        filtersByRelay.set(relay, filtersWithoutRelay);
      }
    }
  }
  return filtersByRelay;
}
function withoutRelay(filter) {
  filter = { ...filter };
  delete filter.relay;
  return filter;
}
function batchFiltersByRelay(subscribedFilters, subscriptionCache) {
  const filtersByRelay = /* @__PURE__ */ new Map();
  const onEvents = [];
  let counter = 0;
  let unsubOnEoseCounter = 0;
  let allUnsub = { unsubcb: () => {
  }, unsuboneosecb: () => {
  } };
  let unsubVirtualSubscription = () => {
    counter--;
    if (counter === 0) {
      allUnsub.unsubcb();
    } else if (unsubOnEoseCounter === 0) {
      allUnsub.unsuboneosecb();
    }
  };
  for (const [
    onEvent2,
    filtersByRelayBySub,
    unsub,
    unsubscribeOnEose,
    subscriptionCacheKey
  ] of subscribedFilters) {
    if (!unsub.unsubcb) {
      continue;
    }
    for (const [relay, filters] of filtersByRelayBySub) {
      const filtersByRelayFilters = filtersByRelay.get(relay);
      if (filtersByRelayFilters) {
        filtersByRelay.set(relay, filtersByRelayFilters.concat(filters));
      } else {
        filtersByRelay.set(relay, filters);
      }
    }
    let onEventWithUnsub = (event, afterEose, url) => {
      if (unsub.unsubcb) {
        onEvent2(event, afterEose, url);
      }
    };
    if (subscriptionCache && subscriptionCacheKey) {
      const callbackReplayer = new CallbackReplayer(unsubVirtualSubscription);
      onEvents.push((event, afterEose, url) => {
        callbackReplayer.event(event, afterEose, url);
      });
      let unsubReplayerVirtualSubscription = callbackReplayer.sub(onEventWithUnsub);
      subscriptionCache.set(subscriptionCacheKey, callbackReplayer);
      unsub.unsubcb = () => {
        unsub.unsubcb = void 0;
        unsubReplayerVirtualSubscription();
        if (!unsubscribeOnEose) {
          unsubOnEoseCounter--;
        }
      };
    } else {
      onEvents.push(onEventWithUnsub);
      unsub.unsubcb = () => {
        unsub.unsubcb = void 0;
        unsubVirtualSubscription();
        if (!unsubscribeOnEose) {
          unsubOnEoseCounter--;
        }
      };
    }
    counter++;
    if (!unsubscribeOnEose) {
      unsubOnEoseCounter++;
    }
  }
  if (unsubOnEoseCounter === 0) {
    setTimeout(() => {
      allUnsub.unsuboneosecb();
    }, 0);
  } else {
  }
  const onEvent = (event, afterEose, url) => {
    for (const onEvent2 of onEvents) {
      onEvent2(event, afterEose, url);
    }
  };
  subscribedFilters.length = 0;
  return [onEvent, filtersByRelay, allUnsub];
}

// newest-event-cache.ts
var NewestEventCache = class {
  data;
  promises;
  relays;
  kind;
  relayPool;
  useps;
  constructor(kind, relayPool, relays, useps) {
    this.data = /* @__PURE__ */ new Map();
    this.promises = /* @__PURE__ */ new Map();
    this.kind = kind;
    this.relayPool = relayPool;
    this.relays = relays || ["wss://us.rbr.bio", "wss://eu.rbr.bio"];
    this.useps = useps || false;
  }
  async get(pubkey) {
    let value = this.data.get(pubkey);
    if (value) {
      return Promise.resolve(value);
    }
    const promise = this.promises.get(pubkey);
    if (promise) {
      return promise;
    }
    return new Promise((resolve, reject) => {
      let tries = 0;
      const filter = this.useps ? { kinds: [this.kind], "#p": [pubkey] } : { kinds: [this.kind], authors: [pubkey] };
      this.relayPool.subscribe(
        [filter],
        this.relays,
        (event) => {
          this.data.set(pubkey, event);
          this.promises.delete(pubkey);
          resolve(event);
        },
        void 0,
        (relayUrl) => {
          if (this.relays.includes(relayUrl)) {
            tries++;
          }
          if (tries === this.relays.length) {
            this.promises.delete(pubkey);
            reject(
              `Can't find data2 for ${pubkey} with kind ${this.kind} on RelayInfoServers ${this.relays.join(",")}, ${tries} tries`
            );
          }
        }
      );
    });
  }
};

// relay-pool.ts
var unique2 = (arr) => [...new Set(arr)];
function parseJSON(json) {
  if (json) {
    return JSON.parse(json);
  }
}
var RelayPool = class {
  relayByUrl = /* @__PURE__ */ new Map();
  noticecbs = [];
  eventCache;
  minMaxDelayms = Infinity;
  filtersToSubscribe = [];
  timer;
  externalGetEventById;
  logSubscriptions = false;
  autoReconnect = false;
  startTime = new Date().getTime();
  deleteSignatures;
  subscriptionCache;
  skipVerification;
  writeRelays;
  metadataCache;
  contactListCache;
  constructor(relays, options = {}) {
    this.externalGetEventById = options.externalGetEventById;
    this.logSubscriptions = options.logSubscriptions;
    this.autoReconnect = options.autoReconnect;
    this.deleteSignatures = options.deleteSignatures;
    this.skipVerification = options.skipVerification;
    this.writeRelays = new NewestEventCache(10003, this, void 0, true);
    this.metadataCache = new NewestEventCache(0, this);
    this.contactListCache = new NewestEventCache(3, this);
    if (options.useEventCache) {
      this.eventCache = new EventCache();
    }
    if (options.subscriptionCache) {
      this.subscriptionCache = /* @__PURE__ */ new Map();
    }
    if (relays) {
      for (const relay of unique2(relays)) {
        this.addOrGetRelay(relay);
      }
    }
  }
  addOrGetRelay(relay) {
    const origRelayInstance = this.relayByUrl.get(relay);
    if (origRelayInstance) {
      return origRelayInstance;
    }
    const relayInstance = relayInit(
      relay,
      this.externalGetEventById ? this.externalGetEventById : this.eventCache ? (id) => this.eventCache?.getEventById(id) : void 0,
      this.autoReconnect
    );
    this.relayByUrl.set(relay, relayInstance);
    relayInstance.connect().then(
      (onfulfilled) => {
        relayInstance?.on("notice", (msg) => {
          this.noticecbs.forEach((cb) => cb(relay, msg));
        });
      },
      (onrejected) => {
        console.warn("failed to connect to relay " + relay);
      }
    );
    return relayInstance;
  }
  async close() {
    const promises = [];
    for (const relayInstance of this.relayByUrl.values()) {
      promises.push(relayInstance.close());
    }
    this.relayByUrl.clear();
    return Promise.all(promises);
  }
  removeRelay(url) {
    const relay = this.relayByUrl.get(url);
    if (relay) {
      relay.close();
      this.relayByUrl.delete(url);
    }
  }
  #subscribeRelay(relay, filters, onEvent, onEose, eventIds) {
    const mergedAndRemovedEmptyFilters = mergeSimilarAndRemoveEmptyFilters(filters);
    if (mergedAndRemovedEmptyFilters.length === 0) {
      return;
    }
    const instance = this.addOrGetRelay(relay);
    const sub = instance.sub(mergedAndRemovedEmptyFilters, {
      skipVerification: this.skipVerification,
      eventIds
    });
    let afterEose = false;
    let minCreatedAt = Infinity;
    sub.on("event", (nostrEvent) => {
      if (nostrEvent.created_at < minCreatedAt) {
        minCreatedAt = nostrEvent.created_at;
      }
      let event = nostrEvent;
      if (!this.deleteSignatures) {
        event.sig = nostrEvent.sig;
      }
      this.eventCache?.addEvent(event);
      onEvent(event, afterEose, relay);
    });
    sub.on("eose", () => {
      onEose?.(relay, minCreatedAt);
      afterEose = true;
    });
    return sub;
  }
  #mergeAndRemoveEmptyFiltersByRelay(filtersByRelay) {
    const mergedAndRemovedEmptyFiltersByRelay = /* @__PURE__ */ new Map();
    for (const [relay, filters] of filtersByRelay) {
      const mergedAndRemovedEmptyFilters = mergeSimilarAndRemoveEmptyFilters(filters);
      if (mergedAndRemovedEmptyFilters.length > 0) {
        mergedAndRemovedEmptyFiltersByRelay.set(
          relay,
          mergedAndRemovedEmptyFilters
        );
      }
    }
    return mergedAndRemovedEmptyFiltersByRelay;
  }
  #subscribeRelays(filtersByRelay, onEvent, onEose, unsub = {}, minMaxDelayms) {
    if (filtersByRelay.size === 0) {
      return () => {
      };
    }
    filtersByRelay = this.#mergeAndRemoveEmptyFiltersByRelay(filtersByRelay);
    if (this.logSubscriptions) {
      console.log(
        "RelayPool at ",
        new Date().getTime() - this.startTime,
        " subscribing to relays, minMaxDelayms=",
        minMaxDelayms,
        filtersByRelay
      );
    }
    const subs = [];
    let unsuboneosecbcalled = false;
    let eoseSubs = [];
    unsub.unsuboneosecb = () => {
      unsuboneosecbcalled = true;
      eoseSubs.forEach((sub) => sub.unsub());
    };
    for (const [relay, filters] of filtersByRelay) {
      let subHolder = {};
      const subOnEose = (url, minCreatedAt) => {
        if (onEose) {
          onEose(url, minCreatedAt);
        }
        if (unsuboneosecbcalled) {
          subHolder.sub?.unsub();
        } else {
          if (subHolder.sub) {
            eoseSubs.push(subHolder.sub);
          }
        }
      };
      const eventIds = /* @__PURE__ */ new Set();
      const sub = this.#subscribeRelay(
        relay,
        filters,
        onEvent,
        subOnEose,
        eventIds
      );
      if (sub) {
        subHolder.sub = sub;
        subs.push(sub);
      }
    }
    const allUnsub = () => subs.forEach((sub) => sub.unsub());
    unsub.unsubcb = () => {
      allUnsub();
      delete unsub.unsubcb;
    };
    return allUnsub;
  }
  sendSubscriptions(onEose) {
    clearTimeout(this.timer);
    this.timer = void 0;
    let minMaxDelayms = this.minMaxDelayms;
    this.minMaxDelayms = Infinity;
    const [onEvent, filtersByRelay, unsub] = batchFiltersByRelay(this.filtersToSubscribe, this.subscriptionCache);
    let allUnsub = this.#subscribeRelays(
      filtersByRelay,
      onEvent,
      onEose,
      unsub,
      minMaxDelayms
    );
    return allUnsub;
  }
  #resetTimer(maxDelayms) {
    if (this.minMaxDelayms > maxDelayms) {
      this.minMaxDelayms = maxDelayms;
    }
    clearTimeout(this.timer);
    this.timer = void 0;
    if (this.minMaxDelayms !== Infinity) {
      this.timer = setTimeout(() => {
        this.sendSubscriptions();
      }, this.minMaxDelayms);
    }
  }
  async #getRelaysAndSubscribe(filters, onEvent, maxDelayms, onEose, options = {}) {
    const allAuthors = /* @__PURE__ */ new Set();
    for (const filter of filters) {
      if (filter.authors) {
        for (const author of filter.authors) {
          allAuthors.add(author);
        }
      } else {
        if (!options.defaultRelays) {
          throw new Error(
            "Authors must be specified if no relays are subscribed and no default relays are specified."
          );
        }
      }
    }
    const promises = [];
    const allAuthorsArray = [];
    for (const author of allAuthors) {
      promises.push(
        this.writeRelays?.get(author).then((event) => parseJSON(event?.content))
      );
      allAuthorsArray.push(author);
    }
    const allRelays = /* @__PURE__ */ new Set();
    let i = 0;
    for (const promise of promises) {
      const author = allAuthorsArray[i];
      i += 1;
      let relays = await promise;
      if (!Array.isArray(relays)) {
        console.error("Couldn't load relays for author ", author);
        continue;
      }
      for (let relay of relays) {
        allRelays.add(relay);
      }
    }
    let allRelaysArray = Array.from(allRelays);
    if (allRelaysArray.length === 0) {
      if (options.defaultRelays) {
        allRelaysArray = options.defaultRelays;
      }
    }
    return this.subscribe(
      filters,
      allRelaysArray,
      onEvent,
      maxDelayms,
      onEose,
      options
    );
  }
  subscribeEventObject(filters, relays, onEventObject, maxDelayms, onEose, options = {}) {
    return this.subscribe(
      filters,
      relays,
      (event, afterEose, url) => onEventObject(new EventObject(event, this, relays), afterEose, url)
    );
  }
  subscribe(filters, relays, onEvent, maxDelayms, onEose, options = {}) {
    if (maxDelayms !== void 0 && onEose) {
      throw new Error("maxDelayms and onEose cannot be used together");
    }
    if (relays === void 0) {
      const promise = this.#getRelaysAndSubscribe(
        filters,
        onEvent,
        maxDelayms,
        onEose,
        options
      );
      return () => {
        promise.then((x) => {
          x();
        });
      };
    }
    let subscriptionCacheKey;
    if (options.unsubscribeOnEose && !onEose) {
      subscriptionCacheKey = JSON.stringify([filters, relays]);
      const cachedSubscription = this.subscriptionCache?.get(subscriptionCacheKey);
      if (cachedSubscription) {
        return cachedSubscription.sub(onEvent);
      }
    }
    const [dedupedOnEvent, filtersByRelay] = groupFiltersByRelayAndEmitCacheHits(
      filters,
      relays,
      onEvent,
      options,
      this.eventCache
    );
    let unsub = { unsubcb: () => {
    } };
    if (maxDelayms === void 0 && onEose && this.filtersToSubscribe.length > 0) {
      this.sendSubscriptions();
    }
    this.filtersToSubscribe.push([
      dedupedOnEvent,
      filtersByRelay,
      unsub,
      options.unsubscribeOnEose,
      subscriptionCacheKey,
      maxDelayms
    ]);
    if (maxDelayms === void 0) {
      return this.sendSubscriptions(onEose);
    } else {
      this.#resetTimer(maxDelayms);
      return () => {
        unsub.unsubcb?.();
        delete unsub.unsubcb;
      };
    }
  }
  async getEventObjectById(id, relays, maxDelayms) {
    return this.getEventById(id, relays, maxDelayms).then(
      (event) => new EventObject(event, this, relays)
    );
  }
  async getEventById(id, relays, maxDelayms) {
    return new Promise((resolve, reject) => {
      this.subscribe(
        [{ ids: [id] }],
        relays,
        (event) => {
          resolve(event);
        },
        maxDelayms,
        void 0
      );
    });
  }
  publish(event, relays) {
    for (const relay of unique2(relays)) {
      const instance = this.addOrGetRelay(relay);
      instance.publish(event);
    }
  }
  onnotice(cb) {
    this.noticecbs.push(cb);
  }
  onerror(cb) {
    this.relayByUrl.forEach(
      (relay, url) => relay.on("error", (msg) => cb(url, msg))
    );
  }
  ondisconnect(cb) {
    this.relayByUrl.forEach(
      (relay, url) => relay.on("disconnect", (msg) => cb(url, msg))
    );
  }
  getRelayStatuses() {
    return Array.from(this.relayByUrl.entries()).map(
      ([url, relay]) => [url, relay.status]
    ).sort();
  }
  setWriteRelaysForPubKey(pubkey, writeRelays, created_at) {
    const event = {
      created_at,
      pubkey: "",
      id: "",
      sig: "",
      content: JSON.stringify(writeRelays),
      kind: 2,
      tags: [["p", pubkey]]
    };
    this.writeRelays.data.set(pubkey, event);
  }
  setCachedMetadata(pubkey, metadata) {
    this.metadataCache.data.set(pubkey, metadata);
  }
  setCachedContactList(pubkey, contactList) {
    this.contactListCache.data.set(pubkey, contactList);
  }
  subscribeReferencedEvents(event, onEvent, maxDelayms, onEose, options = {}) {
    let ids = [];
    let authors = [];
    for (const tag of event.tags) {
      if (tag[0] === "p") {
        const pubkey = tag[1];
        if (pubkey.length !== 64) {
          console.log("bad pubkey", pubkey, tag);
          continue;
        }
        authors.push(pubkey);
      }
      if (tag[0] === "e") {
        const id = tag[1];
        ids.push(id);
      }
    }
    if (ids.length === 0) {
      return () => {
      };
    }
    if (authors.length === 0) {
      if (options.defaultRelays) {
        return this.subscribe(
          [{ ids }],
          options.defaultRelays,
          onEvent,
          maxDelayms,
          onEose,
          options
        );
      } else {
        console.error("No authors for ids in event", event);
        return () => {
        };
      }
    }
    return this.subscribe(
      [{ ids, authors }],
      void 0,
      onEvent,
      maxDelayms,
      onEose,
      options
    );
  }
  fetchAndCacheMetadata(pubkey) {
    return this.metadataCache.get(pubkey);
  }
  fetchAndCacheContactList(pubkey) {
    return this.contactListCache.get(pubkey);
  }
  subscribeReferencedEventsAndPrefetchMetadata(event, onEvent, maxDelayms, onEose, options = {}) {
    for (const tag of event.tags) {
      if (tag[0] === "p") {
        const pubkey = tag[1];
        if (pubkey.length !== 64) {
          console.log("bad pubkey", pubkey, tag);
          continue;
        }
        this.fetchAndCacheMetadata(pubkey);
      }
    }
    return this.subscribeReferencedEvents(
      event,
      onEvent,
      maxDelayms,
      onEose,
      options
    );
  }
};

// collect.ts
var binarySearch = function(a, target) {
  var l = 0, h = a.length - 1, m, comparison;
  let comparator = function(a2, b) {
    return a2.created_at - b.created_at;
  };
  while (l <= h) {
    m = l + h >>> 1;
    comparison = comparator(a[m], target);
    if (comparison < 0) {
      l = m + 1;
    } else if (comparison > 0) {
      h = m - 1;
    } else {
      return m;
    }
  }
  return ~l;
};
var binaryInsert = function(a, target) {
  const duplicate = true;
  var i = binarySearch(a, target);
  if (i >= 0) {
    if (!duplicate) {
      return i;
    }
  } else {
    i = ~i;
  }
  a.splice(i, 0, target);
  return i;
};
function collect(onEvents, skipSort = false) {
  let events = [];
  return (event, afterEose, url) => {
    if (skipSort) {
      events.push(event);
    } else {
      binaryInsert(events, event);
    }
    onEvents(events);
  };
}
export {
  Author,
  RelayPool,
  collect,
  emitEventsOnNextTick
};
