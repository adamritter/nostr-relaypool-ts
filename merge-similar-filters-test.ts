/* eslint-env jest */

import { mergeSimilarFilters } from './merge-similar-filters'
import type { Filter } from 'nostr-tools'

test('Merge filters automatically', () => {
    let filters:Filter[] = [{authors: ['pub1'], kinds: [0, 2]},
                                     {ids: ['1']},
                                     {'#p': ['p1', 'p2']},
                                     {authors: ['pub2'], kinds: [0, 2]},
                                     {ids: ['5']},
                                     {'#p': ['p2', 'p3']}
                                    ]

    let result = mergeSimilarFilters(filters)
    expect(result).toEqual([
        {authors: ['pub1', 'pub2'], kinds: [0, 2]},
        {ids: ['1', '5']},
        {'#p': ['p1', 'p2', 'p3']}
    ])
})

test("Don't merge filters using different relays and different ids", () => {
    let filters:(Filter&{relay?: string})[] = [
                                {ids: ['1']},
                                {ids: ['2'], relay: 'wss://nostr-dev.wellorder.net/'},
                            ]

    let result = mergeSimilarFilters(filters)
    expect(result).toEqual(filters)
})
