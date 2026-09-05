import { describe, expect, it } from 'vitest'
import { games, getGame } from './index'
import { identify } from '../engine/identify'

// 実データ(全タイトル)のスキーマ整合性チェック。scripts/validate-data.mjs と重なるが CI(npm test)で回すため
describe('ゲームデータの整合性', () => {
  it('ゲームIDは一意で、共有コードの区切り文字(.)を含まない', () => {
    const ids = games.map((g) => g.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const g of games) {
      expect(g.id).not.toContain('.')
      for (const d of g.dungeons) expect(d.id).not.toContain('.')
    }
  })

  it.each(games.map((g) => [g.id, g] as const))('%s: アイテム名は一意でカテゴリが定義済み', (_id, g) => {
    const names = g.items.map((i) => i.name)
    expect(new Set(names).size).toBe(names.length)
    const cats = new Set(g.categories.map((c) => c.id))
    for (const i of g.items) expect(cats.has(i.category), i.name).toBe(true)
  })

  it.each(games.map((g) => [g.id, g] as const))('%s: 回数カテゴリのアイテムは回数情報を持つ', (_id, g) => {
    const charged = new Set(g.categories.filter((c) => c.hasCharges).map((c) => c.id))
    for (const i of g.items) {
      if (charged.has(i.category)) {
        expect(i.buyPerCharge, i.name).toBeTypeOf('number')
        expect(i.chargeMin, i.name).toBeTypeOf('number')
        expect(i.chargeMax, i.name).toBeTypeOf('number')
        expect(i.chargeMin!).toBeLessThanOrEqual(i.chargeMax!)
      } else {
        expect(i.buyPerCharge, i.name).toBeUndefined()
      }
    }
  })

  it.each(games.map((g) => [g.id, g] as const))('%s: 各ダンジョンの itemPool は items に存在する名前のみ', (_id, g) => {
    const names = new Set(g.items.map((i) => i.name))
    expect(g.dungeons.length).toBeGreaterThan(0)
    for (const d of g.dungeons) {
      expect(d.itemPool.length, d.name).toBeGreaterThan(0)
      for (const n of d.itemPool) expect(names.has(n), `${d.name}: ${n}`).toBe(true)
    }
  })
})

// wiki 記載の識別例と突き合わせるスモークテスト
describe('シレン4 実データ', () => {
  const game = getGame('shiren4')
  it('識別の壺は 600+30×容量 (買値720 → 容量4)', () => {
    const r = identify(game, { priceType: 'buy', price: 720, category: 'pot' })
    expect(r.map((m) => [m.item.name, m.charges, m.state])).toContainEqual(['識別の壺', 4, 'normal'])
    expect(r.every((m) => m.state !== 'normal' || m.charges === 4)).toBe(true)
  })
  it('祝福×1.1 / 呪い×0.8 (しあわせの腕輪 10000 → 11000 / 8000)', () => {
    const blessed = identify(game, { priceType: 'buy', price: 11000, category: 'bracelet' })
    expect(blessed.some((m) => m.item.name === 'しあわせの腕輪' && m.state === 'blessed')).toBe(true)
    const cursed = identify(game, { priceType: 'buy', price: 8000, category: 'bracelet' })
    expect(cursed.some((m) => m.item.name === 'しあわせの腕輪' && m.state === 'cursed')).toBe(true)
  })
})

describe('アスカ見参 実データ', () => {
  const game = getGame('asuka')
  it('買値1120の杖は回復の杖[4]のみ (wiki 記載の識別例)', () => {
    const r = identify(game, { priceType: 'buy', price: 1120, category: 'staff' }).filter((m) => m.state === 'normal')
    expect(r.map((m) => [m.item.name, m.charges])).toEqual([['回復の杖', 4]])
  })
  it('買値4200以上の杖は不幸の杖 (wiki 記載の識別例)', () => {
    const r = identify(game, { priceType: 'buy', price: 4200, category: 'staff' }).filter((m) => m.state === 'normal')
    expect(r.map((m) => m.item.name)).toEqual(['不幸の杖'])
  })
  it('売値と買値が wiki と逆になっていない (識別の巻物 買値500/売値250)', () => {
    const item = game.items.find((i) => i.name === '識別の巻物')!
    expect(item.buy).toBe(500)
    expect(item.sell).toBe(250)
  })
  it('転ばぬ先の杖は回数0固定、合成の壺は容量2〜4', () => {
    expect(game.items.find((i) => i.name === '転ばぬ先の杖')).toMatchObject({ chargeMin: 0, chargeMax: 0 })
    expect(game.items.find((i) => i.name === '合成の壺')).toMatchObject({ chargeMin: 2, chargeMax: 4 })
  })
})

describe('初代シレン(SFC) 実データ', () => {
  const game = getGame('shiren1')
  it('祝福・呪いの候補が出ない(価格変動なし)', () => {
    const r = identify(game, { priceType: 'buy', price: 2400, category: 'bracelet' })
    expect(r.length).toBeGreaterThan(0)
    expect(r.every((m) => m.state === 'normal')).toBe(true)
  })
  it('杖は基本価格+10%×回数: 買値1050は場所替えの杖[5]のみ、1800は封印の杖[8]のみ', () => {
    expect(identify(game, { priceType: 'buy', price: 1050, category: 'staff' }).map((m) => [m.item.name, m.charges])).toEqual([['場所替えの杖', 5]])
    expect(identify(game, { priceType: 'buy', price: 1800, category: 'staff' }).map((m) => [m.item.name, m.charges])).toEqual([['封印の杖', 8]])
  })
  it('容量で値段が変わらない壺は回数なしで1件(保存の壺 売値600)', () => {
    const r = identify(game, { priceType: 'sell', price: 600, category: 'pot' })
    expect(r.map((m) => [m.item.name, m.charges])).toEqual([['保存の壺', undefined]])
  })
  it('こばみ谷では草・巻物は候補に出ない', () => {
    const r = identify(game, { priceType: 'buy', price: 300, dungeonId: 'table-mountain' })
    expect(r).toEqual([])
  })
})
