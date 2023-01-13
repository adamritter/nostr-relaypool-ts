import { Event, Filter, matchFilters } from 'nostr-tools'
import { WebSocket, WebSocketServer } from 'ws'

let _ = WebSocket // Importing WebSocket is needed for WebSocketServer to work

export class InMemoryRelayServer {
  events: (Event & {id: string})[] = []
  wss: WebSocketServer
  subs: Map<string, Filter[]> = new Map()
  constructor(port = 8081, host = 'localhost') {
    this.wss = new WebSocketServer({ port, host })
    this.wss.on('connection', (ws) => {
      // console.log('connected')
      ws.on('message', (message) => {
        let data = JSON.parse(message.toString())
        // console.log('received: %s', JSON.stringify(data))
        if (data && data[0] === 'REQ') {
          let sub = data[1]
          let filters = data.slice(2)
          this.subs.set(sub, filters)
          for (let event of this.events) {
            if (matchFilters(filters, event)) {
              // console.log('sending event to sub %s', sub, JSON.stringify(['EVENT', sub, event]))
              ws.send(JSON.stringify(['EVENT', sub, event]))
            }
          }
          // console.log('sending eose to sub %s', sub, JSON.stringify(['EOSE', sub]))
          ws.send(JSON.stringify(['EOSE', sub]))
        } else if (data && data[0] === 'EVENT') {
          let event = data[1]
          this.events.push(event)
          for (let [sub, filters] of this.subs) {
            if (matchFilters(filters, event)) {
              // console.log('sending event to sub %s', sub, JSON.stringify(['EVENT', sub, event]))
              ws.send(JSON.stringify(['EVENT', sub, event]))
            }
          }
        } else if (data && data[0] === 'CLOSE') {
          let sub = data[1]
          this.subs.delete(sub)
        }
      })
    })
  }
  async close() : Promise<void> {
    new Promise((resolve) => this.wss.close(resolve))
  }
  clear() {
    this.events = []
    this.subs = new Map()
  }
}
