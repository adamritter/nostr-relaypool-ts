import type {Event} from "nostr-tools";

export class MetadataCache {
  promises: Map<string, Promise<Event>>;
  servers: string[];
  constructor(servers?: string[]) {
    this.promises = new Map();
    this.servers = servers || ["https://us.rbr.bio", "https://eu.rbr.bio"];
  }

  async get(pubkey: string): Promise<Event> {
    const promise = this.promises.get(pubkey);
    if (promise) {
      return promise;
    }
    const rs = [];
    for (let server of this.servers) {
      rs.push(fetchMetadata(server, pubkey));
    }
    const r = Promise.any(rs);
    this.promises.set(pubkey, r);
    return r;
  }
}

async function fetchJSON(url: string) {
  return fetch(url)
    .then((response) => response.json())
    .catch((e) => {
      throw new Error("error fetching " + url + " " + e);
    });
}

function fetchMetadata(server: string, pubkey: string) {
  const url = `${server}/${pubkey}/metadata.json`;
  return fetchJSON(url);
}
