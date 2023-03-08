export class WriteRelaysPerPubkey {
  data: Map<string, string[]>;
  promises: Map<string, Promise<string[]>>;
  servers: string[];
  constructor(servers?: string[]) {
    this.data = new Map();
    this.promises = new Map();
    this.servers = servers || ["https://us.rbr.bio", "https://eu.rbr.bio"];
  }

  async get(pubkey: string): Promise<string[]> {
    let value = this.data.get(pubkey);
    if (value) {
      return Promise.resolve(value);
    }
    const promise = this.promises.get(pubkey);
    if (promise) {
      return promise;
    }
    const rs = [];
    for (let server of this.servers) {
      rs.push(fetchWriteRelays(server, pubkey));
    }
    const r = firstGoodPromise(rs);
    r.then((x) => {
      this.data.set(pubkey, x);
      this.promises.delete(pubkey);
    });
    this.promises.set(pubkey, r);
    return r;
  }
}

function fetchWriteRelays(server: string, pubkey: string): Promise<string[]> {
  const url = `${server}/${pubkey}/writerelays.json`;
  return fetchJSON(url);
}

async function fetchJSON(url: string) {
  return fetch(url)
    .then((response) => response.json())
    .catch((e) => {
      throw new Error("error fetching " + url + " " + e);
    });
}

function firstGoodPromise<T>(promises: Promise<T>[]): Promise<T> {
  return new Promise((resolve, reject) => {
    let rejects: any[] = [];
    promises.forEach((p) => {
      p.then(resolve).catch((rej) => {
        rejects.push(rej);
        if (rejects.length === promises.length) {
          reject(rejects);
        }
      });
    });
  });
}
