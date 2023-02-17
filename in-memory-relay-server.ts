import {Event, Filter, matchFilters} from "nostr-tools";
import {WebSocket, WebSocketServer} from "isomorphic-ws";

const _ = WebSocket; // Importing WebSocket is needed for WebSocketServer to work

export class InMemoryRelayServer {
  events: (Event & {id: string})[] = [];
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
          for (const event of this.events) {
            if (matchFilters(filters, event)) {
              // console.log('sending event to sub %s', sub, JSON.stringify(['EVENT', sub, event]))
              ws.send(JSON.stringify(["EVENT", sub, event]));
            }
          }
          // console.log('sending eose to sub %s', sub, JSON.stringify(['EOSE', sub]))
          ws.send(JSON.stringify(["EOSE", sub]));
        } else if (data && data[0] === "EVENT") {
          const event = data[1];
          this.events.push(event);
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
    });
  }
  async close(): Promise<void> {
    new Promise((resolve) => this.wss.close(resolve));
  }
  clear() {
    this.events = [];
    this.subs = new Map();
    this.totalSubscriptions = 0;
  }
  disconnectAll() {
    for (const ws of this.connections) {
      ws.close();
    }
  }
}
