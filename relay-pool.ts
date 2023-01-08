import { Event, Filter, Kind, Sub } from 'nostr-tools'
import { mergeSimilarAndRemoveEmptyFilters } from './merge-similar-filters'
import {type Relay, relayInit} from './relay'

let unique = (arr:string[]) => [...new Set(arr)]

function withoutRelay(filter: Filter & {relay?: string}) : Filter {
    filter = {...filter}
    delete filter.relay
    return filter
}

type Cache = {
    eventsById: Map<string, Event & {id: string}>
    metadataByPubKey: Map<string, Event & {id: string}>
    contactsByPubKey: Map<string, Event & {id: string}>
}
export class RelayPool {
    relayByUrl: Map<string, Relay>
    noticecbs: Array<(msg: string)=>void>
    cache?: Cache
    constructor(relays?: string[], options : {noCache?: boolean} = {}) {
        if (!options.noCache) {
            this.cache = {
                eventsById: new Map(),
                metadataByPubKey: new Map(),
                contactsByPubKey: new Map()
            }
        }
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

    #getCachedEventsByIdWithUpdatedFilter(filter: Filter & {relay?: string, noCache?: boolean, ids: string[]}) :
            {filter: Filter & {relay?: string}, events: Set<(Event & {id: string})>} {
        let events = new Set<(Event & {id: string})>()
        let ids: string[] = []
        for (let id of filter.ids) {
            let event = this.cache?.eventsById.get(id)
            if (event) {
                events.add(event)
            } else {
                ids.push(id)
            }
        }
        return {filter: {...filter, ids}, events}
    }

    #getCachedEventsByPubKeyWithUpdatedFilter(filter: Filter & {relay?: string, noCache?: boolean, authors: string[], kinds: Kind[]}) :
        {filter: Filter & {relay?: string}, events: Set<(Event & {id: string})>} {
        let authors: string[] = []
        let events = new Set<(Event & {id: string})>()
        for (let author of filter.authors) {
            let contactEvent
            if (filter.kinds.find(kind => kind === Kind.Contacts)) {
                contactEvent = this.cache?.contactsByPubKey.get(author)
                if (!contactEvent) {
                    authors.push(author)
                    continue
                }
            }
            let metadataEvent
            if (filter.kinds.find(kind => kind === Kind.Metadata)) {
                let metadataEvent = this.cache?.metadataByPubKey.get(author)
                if (!metadataEvent) {
                    authors.push(author)
                    continue
                }
            }
            if (contactEvent) {
                events.add(contactEvent)
            }
            if (metadataEvent) {
                events.add(metadataEvent)
            }
        }
        return {filter: {...filter, authors}, events}
    }

    getCachedEventsWithUpdatedFilters(filters: (Filter & {relay?: string, noCache?: boolean})[],
            relays: string[]) :
            {filters: (Filter & {relay?: string})[], events: (Event & {id: string})[]} {
        if (!this.cache) {
            return {filters, events: []}
        }
        let events : Set<(Event & {id: string})> = new Set()
        let new_filters: (Filter & {relay?: string})[] = []
        for (let filter of filters) {
            let new_data = {filter, events: []}
            if (filter.ids) {
                // @ts-ignore
                new_data = this.#getCachedEventsByIdWithUpdatedFilter(filter)
            } else if (!filter.noCache && filter.authors && filter.kinds &&
                    !filter.kinds.find(kind => kind !== Kind.Contacts && kind !== Kind.Metadata)) {
                // @ts-ignore
                new_data = this.#getCachedEventsByPubKeyWithUpdatedFilter(filter)
            }
            for (let event of new_data.events) {
                events.add(event)
            }
            new_filters.push(new_data.filter)
        }
        return {filters: new_filters, events: [...events]}
    }

    #getFiltersByRelay(filters: (Filter & {relay?: string})[], relays: string[]) : Map<string, Filter[]> {
        let filtersByRelay = new Map<string, Filter[]>()
        let filtersWithoutRelay : Filter[] = []
        for (let filter of filters) {
            let relay = filter.relay
            if (relay) {
                let relayFilters = filtersByRelay.get(relay)
                if (relayFilters) {
                    relayFilters.push(withoutRelay(filter))
                } else {
                    filtersByRelay.set(relay, [withoutRelay(filter)])
                }
            } else {
                filtersWithoutRelay.push(filter)
            }
        }
        if (filtersWithoutRelay.length > 0) {
            for (let relay of relays) {
                let filters = filtersByRelay.get(relay)
                if (filters) {
                    filtersByRelay.set(relay, filters.concat(filtersWithoutRelay))
                } else {
                    filtersByRelay.set(relay, filtersWithoutRelay)
                }
            }
        }
        return filtersByRelay
    }

    sub(filters:(Filter&{relay?:string})[], relays:string[]) {
        let cachedEventsWithUpdatedFilters = this.getCachedEventsWithUpdatedFilters(filters, relays)
        filters = cachedEventsWithUpdatedFilters.filters
        filters = mergeSimilarAndRemoveEmptyFilters(filters)
        relays = unique(relays)
        let filtersByRelay = this.#getFiltersByRelay(filters, relays)

        let relays_for_subs = []
        let subs = []
        for (let [relay, filters] of filtersByRelay) {
            let mergedAndRemovedEmptyFilters = mergeSimilarAndRemoveEmptyFilters(filters)
            if (mergedAndRemovedEmptyFilters.length === 0) {
                continue
            }
            let instance = this.addOrGetRelay(relay)
            subs.push(instance.sub(mergedAndRemovedEmptyFilters))
            relays_for_subs.push(relay)
        }
        return new RelayPoolSubscription(subs, relays_for_subs, this.cache,
                cachedEventsWithUpdatedFilters.events)
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
    cache?: Cache
    cachedEvents?: (Event&{id:string})[]
    constructor(subscriptions:Sub[], urls: string[], cache?: Cache, cachedEvents?: (Event&{id:string})[]) {
        this.subscriptions = subscriptions
        this.eventsBySub = new Map()
        this.urlsBySub = new Map()
        this.cache = cache
        this.cachedEvents = cachedEvents
        for (let i = 0; i < subscriptions.length; i++) {
            this.urlsBySub.set(subscriptions[i], urls[i])
        }
    }
    onevent(cb: (event: Event & {id: string}, afterEose: boolean, url:string|null)=>void) : ()=>void {
        for (let event of this.cachedEvents || []) {
            cb(event, false, null)
        }
        this.subscriptions.forEach(subscription => {
            this.eventsBySub.set(subscription, [])
            subscription.on('event', (event: Event & {id: string}) => {
                if (this.cache) {
                    this.cache.eventsById.set(event.id, event)
                    if (event.kind === Kind.Metadata) {
                        this.cache.metadataByPubKey.set(event.pubkey, event)
                    }
                    if (event.kind === Kind.Contacts) {
                        this.cache.contactsByPubKey.set(event.pubkey, event)
                    }
                }
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
