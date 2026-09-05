import { describe, expect, it } from 'vitest'
import type { GameData } from '../types'
import {
  chargeRangeOf,
  collectPriceGroups,
  identify,
  nearestPrices,
  priceOf,
} from './identify'

const game: GameData = {
  id: 'test',
  name: 'テストゲーム',
  shortName: 'テスト',
  priceModifiers: { blessed: 1.2, cursed: 0.87 },
  rounding: 'floor',
  categories: [
    { id: 'kusa', name: '草', hasCharges: false },
    { id: 'staff', name: '杖', hasCharges: true },
  ],
  items: [
    { name: '薬草', category: 'kusa', buy: 40, sell: 15 },
    { name: '弟切草', category: 'kusa', buy: 100, sell: 40 },
    { name: '毒消し草', category: 'kusa', buy: 100, sell: 40 },
    {
      name: 'かなしばりの杖',
      category: 'staff',
      buy: 800,
      sell: 300,
      buyPerCharge: 100,
      sellPerCharge: 40,
      chargeMin: 3,
      chargeMax: 6,
    },
  ],
  dungeons: [
    { id: 'd1', name: '試練の穴', itemPool: ['薬草', 'かなしばりの杖'] },
  ],
}

describe('priceOf', () => {
  it('通常状態は基本価格そのまま', () => {
    expect(priceOf(game, game.items[0], 'buy', 'normal')).toBe(40)
    expect(priceOf(game, game.items[0], 'sell', 'normal')).toBe(15)
  })
  it('祝福/呪いは倍率適用+floor', () => {
    expect(priceOf(game, game.items[0], 'buy', 'blessed')).toBe(48)
    expect(priceOf(game, game.items[0], 'buy', 'cursed')).toBe(34) // 40*0.87=34.8
  })
  it('回数変動は base + n*perCharge', () => {
    expect(priceOf(game, game.items[3], 'buy', 'normal', 5)).toBe(1300)
    expect(priceOf(game, game.items[3], 'sell', 'normal', 3)).toBe(420)
  })
})

describe('chargeRangeOf', () => {
  it('回数変動しないアイテムは null', () => {
    expect(chargeRangeOf(game.items[0])).toBeNull()
  })

  it('回数変動アイテムは chargeMin〜chargeMax を返す', () => {
    expect(chargeRangeOf(game.items[3])).toEqual([3, 6])
  })
})

describe('identify', () => {
  it('買値の完全一致で複数候補を返す', () => {
    const m = identify(game, { price: 100, priceType: 'buy' })
    expect(m.map((x) => x.item.name)).toEqual(['弟切草', '毒消し草'])
    expect(m.every((x) => x.state === 'normal')).toBe(true)
  })
  it('杖は回数ごとの価格で一致し回数を返す', () => {
    const m = identify(game, { price: 1100, priceType: 'buy', category: 'staff' })
    expect(m).toHaveLength(1)
    expect(m[0].charges).toBe(3)
  })
  it('回数範囲外の価格は一致しない', () => {
    // 回数2 (800+200=1000) は chargeMin=3 未満なので候補なし
    expect(identify(game, { price: 1000, priceType: 'buy', category: 'staff' })).toHaveLength(0)
    // 回数6 (1400) は上限で一致
    expect(identify(game, { price: 1400, priceType: 'buy', category: 'staff' })).toHaveLength(1)
  })
  it('祝福/呪い価格でも一致し状態を返す', () => {
    const blessed = identify(game, { price: 48, priceType: 'buy' })
    expect(blessed).toHaveLength(1)
    expect(blessed[0].state).toBe('blessed')
    const cursed = identify(game, { price: 34, priceType: 'buy' })
    expect(cursed[0].state).toBe('cursed')
  })
  it('カテゴリで絞り込める', () => {
    const m = identify(game, { price: 100, priceType: 'buy', category: 'staff' })
    expect(m).toHaveLength(0)
  })
  it('ダンジョンで絞り込める', () => {
    const m = identify(game, { price: 100, priceType: 'buy', dungeonId: 'd1' })
    expect(m).toHaveLength(0) // 弟切草・毒消し草はd1に出ない
    const m2 = identify(game, { price: 40, priceType: 'buy', dungeonId: 'd1' })
    expect(m2.map((x) => x.item.name)).toEqual(['薬草'])
  })
  it('売値でも検索できる', () => {
    const m = identify(game, { price: 40, priceType: 'sell' })
    expect(m.map((x) => x.item.name)).toEqual(['弟切草', '毒消し草'])
  })
  it('0以下や非数は空を返す', () => {
    expect(identify(game, { price: 0, priceType: 'buy' })).toHaveLength(0)
    expect(identify(game, { price: NaN, priceType: 'buy' })).toHaveLength(0)
  })
})

describe('collectPriceGroups', () => {
  it('通常状態の実在価格を昇順で数える', () => {
    const g = collectPriceGroups(game, { priceType: 'buy', category: 'kusa' })
    expect(g).toEqual([
      { price: 40, count: 1, items: ['薬草'] },
      { price: 100, count: 2, items: ['弟切草', '毒消し草'] },
    ])
  })
  it('杖は回数範囲の全価格を含む', () => {
    const g = collectPriceGroups(game, { priceType: 'buy', category: 'staff' })
    expect(g.map((x) => x.price)).toEqual([1100, 1200, 1300, 1400])
  })
})

describe('nearestPrices', () => {
  it('近い実在価格を返す', () => {
    expect(
      nearestPrices(game, { price: 90, priceType: 'buy', category: 'kusa' }),
    ).toEqual([40, 100])
  })
})

// SFC版のように祝福が存在せず呪いも価格に影響しないタイトル、回数で価格が変わらない壺
describe('倍率1の状態と単価0のアイテム', () => {
  const sfcLike: GameData = {
    ...game,
    priceModifiers: { blessed: 1, cursed: 1 },
    categories: [{ id: 'pot', name: '壺', hasCharges: true }],
    items: [
      { name: '保存の壺', category: 'pot', buy: 1600, sell: 600, buyPerCharge: 0, sellPerCharge: 0, chargeMin: 3, chargeMax: 6 },
      { name: '識別の壺', category: 'pot', buy: 1000, sell: 500, buyPerCharge: 100, sellPerCharge: 50, chargeMin: 3, chargeMax: 6 },
    ],
    dungeons: [],
  }
  it('倍率が1の状態は候補に出ない(通常のみ)', () => {
    const r = identify(sfcLike, { priceType: 'buy', price: 1300 })
    expect(r.map((m) => [m.item.name, m.state, m.charges])).toEqual([['識別の壺', 'normal', 3]])
  })
  it('単価0のアイテムは回数変動なしとして1件だけ一致する', () => {
    expect(chargeRangeOf(sfcLike.items[0])).toBeNull()
    const r = identify(sfcLike, { priceType: 'sell', price: 600 })
    expect(r.map((m) => [m.item.name, m.state, m.charges])).toEqual([['保存の壺', 'normal', undefined]])
  })
  it('倍率が1でない側の状態だけは引き続き候補に出る', () => {
    const half = { ...sfcLike, priceModifiers: { blessed: 1, cursed: 0.5 } }
    const r = identify(half, { priceType: 'sell', price: 300 })
    expect(r.map((m) => [m.item.name, m.state])).toEqual([['保存の壺', 'cursed']])
  })
})
