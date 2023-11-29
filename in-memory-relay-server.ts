import {type Event, type Filter, matchFilters, matchFilter} from "nostr-tools";
import {WebSocket, WebSocketServer} from "isomorphic-ws";

const _ = WebSocket; // Importing WebSocket is needed for WebSocketServer to work

export class InMemoryRelayServer {
  events: (Event & {id: string})[] = [];
  auth?: string;
  wss: WebSocketServer;
  subs: Map<string, Filter[]> = new Map();
  connections: Set<WebSocket> = new Set();
  totalSubscriptions = 0;
  constructor(port = 8081, host = "localhost") {
    this.wss = new WebSocketServer({port, host});
    this.wss.on("connection", (ws) => {
      this.connections.add(ws);
      // console.log('connected')
      ws.on("message", (message) => {
        const data = JSON.parse(message.toString());
        // console.log('received: %s', JSON.stringify(data))
        if (data && data[0] === "REQ") {
          const sub = data[1];
          const filters = data.slice(2);
          this.totalSubscriptions++;
          this.subs.set(sub, filters);
          // Go through events in reverse order, look at limits
          const counts = filters.map(() => 0);
          // console.log("data", data, "events", this.events)
          for (let i = this.events.length - 1; i >= 0; i--) {
            const event = this.events[i];
            // console.log("event", event)
            let matched = false;
            for (let j = 0; j < filters.length; j++) {
              let filter = filters[j];
              // console.log("filter", filter, "event", event)
              if (matchFilter(filter, event)) {
                counts[j]++;
                // console.log("j", j, "count", counts[j], "limit", filter.limit)
                if (!filter.limit || counts[j] <= filter.limit) {
                  // console.log("matched j", j, "count", counts[j], "limit", filter.limit)
                  matched = true;
                }
              }
            }
            if (matched) {
              // console.log('sending event to sub %s', sub, JSON.stringify(['EVENT', sub, event]))
              ws.send(JSON.stringify(["EVENT", sub, event]));
            }
          }
          // console.log('sending eose to sub %s', sub, JSON.stringify(['EOSE', sub]))
          ws.send(JSON.stringify(["EOSE", sub]));
        } else if (data && data[0] === "EVENT") {
          // console.log('received event', data[1], data[2])
          const event = data[1];
          this.events.push(event);
          // Reply with OK
          ws.send(JSON.stringify(["OK", event.id, true, ""]));
          for (const [sub, filters] of this.subs) {
            if (matchFilters(filters, event)) {
              // console.log('sending event to sub %s', sub, JSON.stringify(['EVENT', sub, event]))
              ws.send(JSON.stringify(["EVENT", sub, event]));
            }
          }
        } else if (data && data[0] === "CLOSE") {
          const sub = data[1];
          this.subs.delete(sub);
        }
      });
      if (this.auth) {
        ws.send(JSON.stringify(["AUTH", this.auth]));
      }
    });
  }
  async close(): Promise<void> {
    new Promise((resolve) => this.wss.close(resolve));
  }
  clear() {
    this.events = [];
    this.subs = new Map();
    this.totalSubscriptions = 0;
    this.auth = undefined;
  }
  disconnectAll() {
    for (const ws of this.connections) {
      ws.close();
    }
  }
}
