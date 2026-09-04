import { describe, expect, it } from 'vitest'
import type { GameData } from '../types'
import { codeFromHash, decodeShare, encodeShare, shareUrl } from './share'

function makeGame(id: string, count: number): GameData {
  return {
    id,
    name: id,
    shortName: id,
    priceModifiers: { blessed: 1.1, cursed: 0.8 },
    rounding: 'floor',
    categories: [{ id: 'c', name: 'カテゴリ', hasCharges: false }],
    items: Array.from({ length: count }, (_, i) => ({
      name: `item${i}`,
      category: 'c',
      buy: 100 + i,
      sell: 40,
    })),
    dungeons: [{ id: 'd1', name: 'ダンジョン1', itemPool: ['item0'] }],
  }
}

const game = makeGame('g1', 20)
const other = makeGame('g2', 5)
const games = [game, other]

describe('encodeShare / decodeShare', () => {
  it('識別済みリストとダンジョンが往復する', () => {
    const code = encodeShare(game, ['item0', 'item7', 'item19'], 'd1')
    expect(decodeShare(games, code)).toEqual({
      gameId: 'g1',
      dungeonId: 'd1',
      identified: ['item0', 'item7', 'item19'],
    })
  })

  it('復元順は items の並び順になる', () => {
    const code = encodeShare(game, ['item9', 'item2'], '')
    expect(decodeShare(games, code)?.identified).toEqual(['item2', 'item9'])
  })

  it('空のリスト・ダンジョン未選択も往復する', () => {
    const code = encodeShare(game, [], '')
    expect(decodeShare(games, code)).toEqual({
      gameId: 'g1',
      dungeonId: '',
      identified: [],
    })
  })

  it('存在しないアイテム名・ダンジョン id は無視する', () => {
    const code = encodeShare(game, ['item1', 'unknown'], 'nope')
    expect(decodeShare(games, code)).toEqual({
      gameId: 'g1',
      dungeonId: '',
      identified: ['item1'],
    })
  })

  it('コードは短い(200 件でも 40 文字程度)', () => {
    const big = makeGame('big', 200)
    const code = encodeShare(big, big.items.map((i) => i.name), '')
    expect(code.length).toBeLessThan(50)
    expect(decodeShare([big], code)?.identified.length).toBe(200)
  })

  it('別ゲームのコードはそのゲームの items で復元する', () => {
    const code = encodeShare(other, ['item4'], '')
    expect(decodeShare(games, code)).toEqual({
      gameId: 'g2',
      dungeonId: '',
      identified: ['item4'],
    })
  })

  it('未知のゲーム・壊れたコードは null', () => {
    expect(decodeShare(games, '1.zzz..AA')).toBeNull()
    expect(decodeShare(games, '2.g1..AA')).toBeNull()
    expect(decodeShare(games, 'garbage')).toBeNull()
    expect(decodeShare(games, '1.g1..@@@')).toBeNull()
  })

  it('アイテム数より長いビット列は範囲内だけ使う', () => {
    const code = encodeShare(makeGame('g2', 40), ['item39', 'item1'], '')
    expect(decodeShare(games, code)?.identified).toEqual(['item1'])
  })
})

describe('shareUrl / codeFromHash', () => {
  it('URL の hash にコードを載せて取り出せる', () => {
    const code = encodeShare(game, ['item3'], 'd1')
    const url = shareUrl(code, 'https://example.com/shiren-price/?x=1#old')
    expect(url).toBe(`https://example.com/shiren-price/?x=1#s=${code}`)
    expect(codeFromHash(new URL(url).hash)).toBe(code)
  })

  it('コードが無い hash は null', () => {
    expect(codeFromHash('')).toBeNull()
    expect(codeFromHash('#foo')).toBeNull()
    expect(codeFromHash('#s=')).toBeNull()
  })
})
