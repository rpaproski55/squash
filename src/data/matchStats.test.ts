import { describe, expect, it } from 'vitest'
import type { Match } from './db'
import { reasonTrends, record } from './matchStats'

const m = (i: number, result: Match['result'], reasons: string[] = []): Match => ({ at: 1000 - i, result, reasons })

describe('match stats', () => {
  it('counts wins and losses', () => {
    expect(record([m(0, 'win'), m(1, 'loss'), m(2, 'win')])).toEqual({ wins: 2, losses: 1 })
  })

  it('compares the last five matches with the five before', () => {
    const matches = [
      m(0, 'loss', ['front']), m(1, 'win', ['t']), m(2, 'loss'), m(3, 'loss'), m(4, 'win'),
      m(5, 'loss', ['front']), m(6, 'loss', ['front']), m(7, 'loss', ['front', 't']), m(8, 'win'), m(9, 'win'),
    ]
    const t = Object.fromEntries(reasonTrends(matches).map((x) => [x.reason.id, x]))
    expect(t.front).toMatchObject({ recent: 1, before: 3, direction: 'better' })
    expect(t.t).toMatchObject({ recent: 1, before: 1, direction: 'same' })
    expect(t.energy).toBeUndefined()
  })

  it('with only a few matches there is nothing to compare yet', () => {
    expect(reasonTrends([m(0, 'loss', ['tin'])])[0]).toMatchObject({ recent: 1, before: null, direction: 'new' })
  })

  it('a reason dropped completely still shows, as better', () => {
    const matches = [...Array.from({ length: 5 }, (_, i) => m(i, 'win')), m(5, 'loss', ['serve'])]
    expect(reasonTrends(matches)[0]).toMatchObject({ recent: 0, before: 1, direction: 'better' })
  })
})
