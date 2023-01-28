/* eslint-env jest */

import {mergeSimilarAndRemoveEmptyFilters} from "./merge-similar-filters";
import type {Filter} from "nostr-tools";

test("Merge filters automatically", () => {
  let filters: Filter[] = [
    {authors: ["pub1"], kinds: [0, 2]},
    {ids: ["1"]},
    {"#p": ["p1", "p2"]},
    {authors: ["pub2"], kinds: [0, 2]},
    {ids: ["5"]},
    {"#p": ["p2", "p3"]},
  ];

  let result = mergeSimilarAndRemoveEmptyFilters(filters);
  expect(result).toEqual([
    {authors: ["pub1", "pub2"], kinds: [0, 2]},
    {ids: ["1", "5"]},
    {"#p": ["p1", "p2", "p3"]},
  ]);
});

test("Don't merge filters using different relays and different ids", () => {
  let filters: (Filter & {relay?: string})[] = [
    {ids: ["1"]},
    {ids: ["2"], relay: "wss://nostr-dev.wellorder.net/"},
  ];

  let result = mergeSimilarAndRemoveEmptyFilters(filters);
  expect(result).toEqual(filters);
});

test("Remove empty filters", () => {
  let filters: (Filter & {relay?: string})[] = [
    {ids: []},
    {authors: [], relay: "wss://nostr-dev.wellorder.net/"},
  ];

  let result = mergeSimilarAndRemoveEmptyFilters(filters);
  expect(result).toEqual([]);
});

test("concat error", () => {
  let filters: (Filter & {relay?: string})[] = [
    {
      authors: [
        "00000000827ffaa94bfea288c3dfce4422c794fbb96625b6b31e9049f729d700",
      ],
      kinds: [0, 3],
    },
    {
      kinds: [1, 6, 7],
      "#e": [
        "692e7e4b3aa182c35c4346932e4daeb3554fa7e5854244222a0688a405cba107",
      ],
    },
    {
      authors: [
        "887645fef0ce0c3c1218d2f5d8e6132a19304cdc57cd20281d082f38cfea0072",
      ],
      kinds: [0, 3],
    },
    {
      kinds: [1, 6, 7],
      "#e": [
        "8914e1ea4774091b9bb5439d6eef2e4eb95064d618ded5ef473d2e976b782a22",
      ],
    },
    {
      authors: [
        "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d",
      ],
      kinds: [0, 3],
    },
    {
      kinds: [1, 6, 7],
      "#e": [
        "7b91e4aa186780422ffa16671f8e19af7d58281a4a78bd74cfdb56742dae4945",
      ],
    },
    {
      authors: [
        "887645fef0ce0c3c1218d2f5d8e6132a19304cdc57cd20281d082f38cfea0072",
      ],
      kinds: [0, 3],
    },
    {
      kinds: [1, 6, 7],
      "#e": [
        "984acbcbdd9fba397d4537a20d0f2a4dd0bc9a6278e35465f2e3b109087d7ece",
      ],
    },
    {
      authors: [
        "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d",
      ],
      kinds: [0, 3],
    },
    {
      kinds: [1, 6, 7],
      "#e": [
        "7e0e1feef76aa793be725fe5f0f2534c13ea8b8b40c995ea91f70a638aad0eab",
      ],
    },
    {
      authors: [
        "887645fef0ce0c3c1218d2f5d8e6132a19304cdc57cd20281d082f38cfea0072",
      ],
      kinds: [0, 3],
    },
    {
      kinds: [1, 6, 7],
      "#e": [
        "0e329a10e7c2cbce3a206a76a4b4c932426902b3fbb548ae042ca0f38e011ef2",
      ],
    },
    {
      authors: [
        "63fe6318dc58583cfe16810f86dd09e18bfd76aabc24a0081ce2856f330504ed",
      ],
      kinds: [0, 3],
    },
    {
      kinds: [1, 6, 7],
      "#e": [
        "18f19a4e982bc1058aab98692ad1bb2eb3ac214a21bcd37676ad5d588fc0dd5d",
      ],
    },
    {
      authors: [
        "63fe6318dc58583cfe16810f86dd09e18bfd76aabc24a0081ce2856f330504ed",
      ],
      kinds: [0, 3],
    },
    {
      kinds: [1, 6, 7],
      "#e": [
        "39b9e6dc5a539debac289c36cb887d90d13d85ed3371d2f1233b9c34c025c4a5",
      ],
    },
    {
      authors: [
        "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d",
      ],
      kinds: [0, 3],
    },
    {
      kinds: [1, 6, 7],
      "#e": [
        "b48d5c8ebac25830779d22f654213f993d939c8159fa53248d3ec69a48a7f20b",
      ],
    },
    {
      authors: [
        "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d",
      ],
      kinds: [0, 3],
    },
    {
      kinds: [1, 6, 7],
      "#e": [
        "04a2825b574a818ee48701f70bd875f8a0c8f7cb07a7286baab0e96577b107f1",
      ],
    },
    {
      authors: [
        "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d",
      ],
      kinds: [0, 3],
    },
    {
      kinds: [1, 6, 7],
      "#e": [
        "d72af132bad9d332c469195cc80b084da54be085cabc33d911d371d64894c033",
      ],
    },
    {
      authors: [
        "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d",
      ],
      kinds: [0, 3],
    },
    {
      kinds: [1, 6, 7],
      "#e": [
        "09c646ebfdcba8f31701ec9a74af65bd230d2c6aeff8388b3cf3171797af2e95",
      ],
    },
    {
      authors: [
        "63fe6318dc58583cfe16810f86dd09e18bfd76aabc24a0081ce2856f330504ed",
      ],
      kinds: [0, 3],
    },
    {
      kinds: [1, 6, 7],
      "#e": [
        "8fda8ee4d719dfeab389ba13f4e46addcb65dc9ff7ffdd48875ad5889dceb118",
      ],
    },
    {
      authors: [
        "887645fef0ce0c3c1218d2f5d8e6132a19304cdc57cd20281d082f38cfea0072",
      ],
      kinds: [0, 3],
    },
    {
      kinds: [1, 6, 7],
      "#e": [
        "467ea9860198b370b6867102685fb3accf55a592a710806ad938a0fed0879b44",
      ],
    },
    {
      kinds: [1, 6, 7],
      "#e": [
        "fb2f0cd0b53557bcc85be2b3430d4c443d907a064968a1485aaa3d39bb010196",
      ],
    },
    {
      authors: [
        "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d",
      ],
      kinds: [0, 3],
    },
    {
      kinds: [1, 6, 7],
      "#e": [
        "7e0e1feef76aa793be725fe5f0f2534c13ea8b8b40c995ea91f70a638aad0eab",
      ],
    },
    {
      authors: [
        "00000000827ffaa94bfea288c3dfce4422c794fbb96625b6b31e9049f729d700",
      ],
      kinds: [0, 3],
    },
    {
      authors: [
        "00000000827ffaa94bfea288c3dfce4422c794fbb96625b6b31e9049f729d700",
      ],
      kinds: [0, 3],
    },
    {
      authors: [
        "887645fef0ce0c3c1218d2f5d8e6132a19304cdc57cd20281d082f38cfea0072",
      ],
      kinds: [0, 3],
    },
    {
      authors: [
        "887645fef0ce0c3c1218d2f5d8e6132a19304cdc57cd20281d082f38cfea0072",
      ],
      kinds: [0, 3],
    },
  ];
  let _result = mergeSimilarAndRemoveEmptyFilters(filters);
  expect(_result.length).toBe(2);
});
