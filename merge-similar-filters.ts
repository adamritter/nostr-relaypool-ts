import {stringify} from "safe-stable-stringify";
import type {Filter} from "nostr-tools";

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
        let new_filter = {...filter};
        // @ts-ignore
        delete new_filter[key];
        let index_by = key + stringify(new_filter);
        let index = indexByFilter.get(index_by);
        if (index !== undefined) {
          // @ts-ignore
          let extendedFilter = r[index];
          // remove all other groupings for r[index]
          for (let key2 in extendedFilter) {
            if (key2 !== key) {
              let new_filter2 = {...extendedFilter};
              // @ts-ignore
              delete new_filter2[key2];
              let index_by2 = key2 + stringify(new_filter2);
              indexByFilter.delete(index_by2);
            }
          }
          // @ts-ignore
          r[index][key] = [...new Set(r[index][key].concat(filter[key]))];
          added = true;
          break;
        }
        indexByFilter.set(index_by, r.length);
      }
    }
    if (!added) {
      r.push(filter);
    }
  }
  return r;
}
