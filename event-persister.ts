// import {Event} from "./event";
// import {EventCache} from "./event-cache";

// export function persistCache(
//   cache: EventCache,
//   pubkey: string,
//   follows: string[],
//   capacity: number = 4000000
// ) {
//   let events: Event[] = [];
//   let kindsEvents = cache.authorsKindsByPubKey.get(pubkey);
//   if (kindsEvents) {
//     let mycapacity = capacity * 0.4;
//     let sizes: [number, number][] = Array.from(kindsEvents).map((e, i) => [
//       i,
//       JSON.stringify(e).length,
//     ]);
//     sizes.sort((a, b) => b[1] - a[1]);
//     let s = sizes.length;
//     for (const [i, l] of sizes) {
//       let allowedCapacity = mycapacity / s;
//       let kindEvents: Event = kindsEvents.get(i);
//       if (kindEvents) {
//         let ke: Event[] = kindEvents;
//         if (l < allowedCapacity) {
//           events = events.concat(kindEvents);
//           mycapacity -= l;
//         } else {
//           let partialEvents = kindEvents.slice(
//             0,
//             kindEvents.length * Math.floor(allowedCapacity / l)
//           );
//           events = events.concat(partialEvents);
//         }
//       }
//     }
//   }
// }
