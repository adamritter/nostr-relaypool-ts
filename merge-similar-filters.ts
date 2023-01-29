import {stringify} from "safe-stable-stringify";
import type {Filter} from "nostr-tools";

function indexForFilter(filter: Filter, key: string): string {
  let new_filter = {...filter};
  // @ts-ignore
  delete new_filter[key];
  return key + stringify(new_filter);
}

export function mergeSimilarAndRemoveEmptyFilters(filters: Filter[]): Filter[] {
  let r = [];
  let indexByFilter = new Map<string, number>();
  for (let filter of filters) {
    let added = false;
    for (let key in filter) {
      if (
        // @ts-ignore
        filter[key] &&
        (["ids", "authors", "kinds"].includes(key) || key.startsWith("#"))
      ) {
        // @ts-ignore
        if (filter[key].length === 0) {
          added = true;
          break;
        }
        let index_by = indexForFilter(filter, key);
        let index = indexByFilter.get(index_by);
        if (index !== undefined) {
          // @ts-ignore
          let extendedFilter = r[index];
          // remove all other groupings for r[index]
          for (let key2 in extendedFilter) {
            if (key2 !== key) {
              let index_by2 = indexForFilter(extendedFilter, key2);
              indexByFilter.delete(index_by2);
            }
          }
          // @ts-ignore
          r[index][key] = [...new Set(r[index][key].concat(filter[key]))];
          added = true;
          break;
        }
      }
    }
    if (!added) {
      for (let key in filter) {
        if (
          // @ts-ignore
          filter[key] &&
          (["ids", "authors", "kinds"].includes(key) || key.startsWith("#"))
        ) {
          let index_by = indexForFilter(filter, key);
          indexByFilter.set(index_by, r.length);
        }
      }
      r.push(filter);
    }
  }
  return r;
}
