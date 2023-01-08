import type { Event, Filter, Sub } from 'nostr-tools'
import { mergeSimilarFilters } from './merge-similar-filters'
import {type Relay, relayInit} from './relay'

let unique = (arr:string[]) => [...new Set(arr)]
export class RelayPool {
    relayByUrl: Map<string, Relay>
    noticecbs: Array<(msg: string)=>void>
    constructor(relays?: string[]) {
        this.relayByUrl = new Map()
        this.noticecbs = []
        if (relays) {
            for (let relay of unique(relays)) {
                this.addOrGetRelay(relay)
            }
        }
    }
    addOrGetRelay(relay: string) : Relay {
        let relayInstance = this.relayByUrl.get(relay)
        if (relayInstance) {
            return relayInstance
        }
        relayInstance = relayInit(relay)
        this.relayByUrl.set(relay, relayInstance)
        relayInstance.connect().then(onfulfilled => {
            relayInstance?.on('notice', (msg: string) => {
                this.noticecbs.forEach((cb) => cb(relay + ': ' + msg))
            })
        }, onrejected => {
            console.warn('failed to connect to relay ' + relay)
        })
        return relayInstance
    }

    close() {
        for (let relayInstance of this.relayByUrl.values()) {
            relayInstance.close()
        }
        this.relayByUrl.clear()
    }

    sub(filters:(Filter&{relay?:string})[], relays:string[]) {
        filters = mergeSimilarFilters(filters)
        relays = unique(relays)
        let subs = []
        let filtersByRelay = new Map<string, Filter[]>()
        let filtersWithoutRelay : Filter[] = []
        for (let filter of filters) {
            let relay = filter.relay
            if (relay) {
                let filters = filtersByRelay.get(relay)
                if (filters) {
                    // @ts-ignore
                    filters.push({...filter, relay: undefined})
                } else {
                    // @ts-ignore
                    filtersByRelay.set(relay, [{...filter, relay: undefined}])
                }
            } else {
                filtersWithoutRelay.push(filter)
            }
        }
        let relays_for_subs = []

        for (let relay of relays) {
            let filters = filtersByRelay.get(relay)
            if (!filters && filtersWithoutRelay.length > 0) {
                let instance = this.addOrGetRelay(relay)
                let mergedFiltersWithoutRelay = mergeSimilarFilters(filtersWithoutRelay)
                subs.push(instance.sub(mergedFiltersWithoutRelay))
                relays_for_subs.push(relay)
            }
        }
        for (let [relay, filters] of filtersByRelay) {
            let instance = this.addOrGetRelay(relay)
            if (relays.includes(relay)) {
                filters = filters.concat(filtersWithoutRelay)
            }
            subs.push(instance.sub(mergeSimilarFilters(filters)))
            relays_for_subs.push(relay)
        }
        return new RelayPoolSubscription(subs, relays_for_subs)
    }

    publish(event: Event, relays: string[]) {
        for (let relay of unique(relays)) {
            let instance = this.addOrGetRelay(relay)
            instance.publish(event)
        }
    }
    onnotice(cb: (msg: string)=>void) {
        this.noticecbs.push(cb)
    }
    onerror(cb: (msg: string)=>void) {
        this.relayByUrl.forEach((relay: Relay, url: string) =>
            relay.on('error', (msg: string) => cb(url + ': ' + msg)))
    }
    ondisconnect(cb: (msg: string)=>void) {
        this.relayByUrl.forEach((relay: Relay, url: string) =>
             relay.on('disconnect', (msg: string) =>
                cb(url + ': ' + msg)))
    }
}

export class RelayPoolSubscription {
    subscriptions: Sub[]
    eventsBySub: Map<Sub, (Event&{id:string})[]>
    urlsBySub: Map<Sub, string>
    constructor(subscriptions:Sub[], urls: string[]) {
        this.subscriptions = subscriptions
        this.eventsBySub = new Map()
        this.urlsBySub = new Map()
        for (let i = 0; i < subscriptions.length; i++) {
            this.urlsBySub.set(subscriptions[i], urls[i])
        }
    }
    onevent(cb: (event: Event & {id: string}, afterEose: boolean, url:string)=>void) : ()=>void {
        this.subscriptions.forEach(subscription => {
            this.eventsBySub.set(subscription, [])
            subscription.on('event', (event: Event & {id: string}) => {
                let eventsByThisSub = this.eventsBySub.get(subscription)
                if (eventsByThisSub) {
                    eventsByThisSub.push(event)
                }
                // @ts-ignore
                cb(event, eventsByThisSub === undefined, this.urlsBySub.get(subscription))
            })
        })
        return () => {
            this.subscriptions.forEach(subscription => subscription.off('event', cb))
        }
    }
    oneose(cb: (eventsByThisSub: (Event&{id: string})[]|undefined, url:string)=>void) : ()=>void {
        this.subscriptions.forEach(subscription => subscription.on('eose', () => {
            let eventsByThisSub = this.eventsBySub.get(subscription)
            this.eventsBySub.delete(subscription)
            // @ts-ignore
            cb(eventsByThisSub, this.urlsBySub.get(subscription))
        }))
        return () => {
            this.subscriptions.forEach(subscription => subscription.off('eose', cb))
        }
    }
    unsub() {
      this.subscriptions.forEach(subscription => subscription.unsub())
    }
}
