/* global WebSocket */

import {type Event, verifySignature, validateEvent} from 'nostr-tools'
import {type Filter, matchFilters} from 'nostr-tools'

type RelayEvent = 'connect' | 'disconnect' | 'error' | 'notice'

export type Sub = {
  sub: (filters: Filter[], opts: SubscriptionOptions) => Sub
  unsub: () => void
  on: (type: 'event' | 'eose', cb: any) => void
  off: (type: 'event' | 'eose', cb: any) => void
}

type SubscriptionOptions = {
  skipVerification?: boolean
  id?: string
}

export class Relay {
  ws: WebSocket
  url: string
  connected = false
  sendOnConnect:string[] = []
  openSubs: {[id: string]: {filters: Filter[]} & SubscriptionOptions} = {}
  listeners: {
    connect: Array<() => void>
    disconnect: Array<() => void>
    error: Array<() => void>
    notice: Array<(msg: string) => void>
  } = {
    connect: [],
    disconnect: [],
    error: [],
    notice: []
  }
  subListeners: {
    [subid: string]: {
      event: Array<(event: Event) => void>
      eose: Array<() => void>
    }
  } = {}
  pubListeners: {
    [eventid: string]: {
      ok: Array<() => void>
      seen: Array<() => void>
      failed: Array<(reason: string) => void>
    }
   } = {}

  constructor(url: string) {
    this.url = url
    this.ws = new WebSocket(url)
    this.ws.onopen = () => this.#onopen()
    this.ws.onerror = () => this.#onerror
  }

  #onopen() {
      this.connected = true
      for (let subid in this.openSubs) {
          this.trySend(['REQ', subid, ...this.openSubs[subid].filters])
      }
      for (let msg of this.sendOnConnect) {
        this.ws.send(msg)
      }
      this.sendOnConnect = []

      this.listeners.connect.forEach(cb => cb())
    }
   #onerror() {
      this.listeners.error.forEach(cb => cb())
    }
    #onclose() {
      this.connected = false
      this.listeners.disconnect.forEach(cb => cb())
    }

    #onmessage(e: MessageEvent) {
      var data
      try {
        data = JSON.parse(e.data)
      } catch (err) {
        data = e.data
      }

      if (data.length >= 1) {
        switch (data[0]) {
          case 'EVENT':
            if (data.length !== 3) return // ignore empty or malformed EVENT

            let id = data[1]
            let event = data[2]
            if (
              validateEvent(event) &&
              this.openSubs[id] &&
              (this.openSubs[id].skipVerification || verifySignature(event)) &&
              matchFilters(this.openSubs[id].filters, event)
            ) {
              this.openSubs[id]
              ;(this.subListeners[id]?.event || []).forEach(cb => cb(event))
            }
            return
          case 'EOSE': {
            if (data.length !== 2) return // ignore empty or malformed EOSE
            let id = data[1]
            ;(this.subListeners[id]?.eose || []).forEach(cb => cb())
            return
          }
          case 'OK': {
            if (data.length < 3) return // ignore empty or malformed OK
            let id: string = data[1]
            let ok: boolean = data[2]
            let reason: string = data[3] || ''
            if (ok) this.pubListeners[id]?.ok.forEach(cb => cb())
            else this.pubListeners[id]?.failed.forEach(cb => cb(reason))
            return
          }
          case 'NOTICE':
            if (data.length !== 2) return // ignore empty or malformed NOTICE
            let notice = data[1]
            this.listeners.notice.forEach(cb => cb(notice))
            return
        }
      }
    }

  trySend(params: [string, ...any]) {
    let msg = JSON.stringify(params)
    if (this.connected) {
      this.ws.send(msg)
    } else {
      this.sendOnConnect.push(msg)
    }
  }

  sub(
    filters: Filter[],
    {
      skipVerification = false,
      id = Math.random().toString().slice(2)
    }: SubscriptionOptions = {}
  ): Sub {
    let subid = id

    this.openSubs[subid] = {
      id: subid,
      filters,
      skipVerification
    }
    if (this.connected) {
        this.trySend(['REQ', subid, ...filters])
    }

    return {
      sub: (newFilters, newOpts = {}) =>
      this.sub(newFilters || filters, {
          skipVerification: newOpts.skipVerification || skipVerification,
          id: subid
        }),
      unsub: () => {
        delete this.openSubs[subid]
        delete this.subListeners[subid]
        if (this.connected) {
          this.trySend(['CLOSE', subid])
        }
      },
      on: (type: 'event' | 'eose', cb: any): void => {
        this.subListeners[subid] = this.subListeners[subid] || {
          event: [],
          eose: []
        }
        this.subListeners[subid][type].push(cb)
      },
      off: (type: 'event' | 'eose', cb: any): void => {
        let listeners = this.subListeners[subid]
        let idx = listeners[type].indexOf(cb)
        if (idx >= 0) listeners[type].splice(idx, 1)
      }
    }
  }

  return {
    url,
    sub,
    on: (
      type: RelayEvent,
      cb: any
    ): void => {
      listeners[type].push(cb)
      if (type === 'connect' && ws?.readyState === 1) {
        cb()
      }
    },
    off: (
      type: RelayEvent,
      cb: any
    ): void => {
      let index = listeners[type].indexOf(cb)
      if (index !== -1) listeners[type].splice(index, 1)
    },
    publish(event: Event): Pub {
      if (!event.id) throw new Error(`event ${event} has no id`)
      let id = event.id

      var sent = false
      var mustMonitor = false

      trySend(['EVENT', event])
        .then(() => {
          sent = true
          if (mustMonitor) {
            startMonitoring()
            mustMonitor = false
          }
        })
        .catch(() => {})

      const startMonitoring = () => {
        let monitor = sub([{ids: [id]}], {
          id: `monitor-${id.slice(0, 5)}`
        })
        let willUnsub = setTimeout(() => {
          ;(pubListeners[id]?.failed || []).forEach(cb =>
            cb('event not seen after 5 seconds')
          )
          monitor.unsub()
        }, 5000)
        monitor.on('event', () => {
          clearTimeout(willUnsub)
          ;(pubListeners[id]?.seen || []).forEach(cb => cb())
        })
      }

      return {
        on: (type: 'ok' | 'seen' | 'failed', cb: any) => {
          pubListeners[id] = pubListeners[id] || {
            ok: [],
            seen: [],
            failed: []
          }
          pubListeners[id][type].push(cb)

          if (type === 'seen') {
            if (sent) startMonitoring()
            else mustMonitor = true
          }
        },
        off: (type: 'ok' | 'seen' | 'failed', cb: any) => {
          let listeners = pubListeners[id]
          if (!listeners) return
          let idx = listeners[type].indexOf(cb)
          if (idx >= 0) listeners[type].splice(idx, 1)
        }
      }
    },
    connect,
    close(): Promise<void> {
      ws.close()
      return new Promise<void>(resolve => {
        resolveClose = resolve
      })
    },
    status() {
      return this.ws?.readyState ?? 3
    }
  }
}



export class Pub {
  relay: Relay
  event: Event
  constructor(relay: Relay, event: Event) {
    this.relay = relay
    this.event = event
  }
  onevent()
  on(cb: (type: 'ok' | 'seen' | 'failed', cb: any) => void) {

  }
  off(cb: (type: 'ok' | 'seen' | 'failed', cb: any) => void) {

  }
}