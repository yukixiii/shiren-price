import type {
  GameData,
  ItemDef,
  ItemState,
  PriceType,
  Rounding,
} from '../types'

export interface IdentifyQuery {
  price: number
  priceType: PriceType
  /** カテゴリID。未指定なら全カテゴリ */
  category?: string
  /** ダンジョンID。未指定なら全アイテム */
  dungeonId?: string
}

export interface Match {
  item: ItemDef
  state: ItemState
  /** 回数変動アイテムのときのみ: この回数なら一致する */
  charges?: number
}

const STATE_ORDER: ItemState[] = ['normal', 'blessed', 'cursed']

function applyRounding(value: number, rounding: Rounding): number {
  switch (rounding) {
    case 'floor':
      return Math.floor(value)
    case 'ceil':
      return Math.ceil(value)
    case 'round':
      return Math.round(value)
  }
}

/** 状態倍率適用後の価格。倍率は基本価格(回数込み)全体にかかる */
export function priceOf(
  game: GameData,
  item: ItemDef,
  priceType: PriceType,
  state: ItemState,
  charges?: number,
): number {
  const base = priceType === 'buy' ? item.buy : item.sell
  const perCharge =
    (priceType === 'buy' ? item.buyPerCharge : item.sellPerCharge) ?? 0
  // sellPerCharge は小数(買値の35%等)がありうるため、最終価格は常に端数処理する
  const raw = base + perCharge * (charges ?? 0)
  if (state === 'normal') return applyRounding(raw, game.rounding)
  const mod =
    state === 'blessed'
      ? game.priceModifiers.blessed
      : game.priceModifiers.cursed
  return applyRounding(raw * mod, game.rounding)
}

/** 入手時にありうる回数の幅 [min, max]。回数で変動しないアイテムなら null */
export function chargeRangeOf(item: ItemDef): [number, number] | null {
  // 単価が両方 0(または未定義)なら回数で価格が変わらない(SFCの保存の壺など)
  if (!item.buyPerCharge && !item.sellPerCharge) return null
  const min = item.chargeMin ?? 0
  return [min, item.chargeMax ?? min]
}

function chargeRange(item: ItemDef): number[] {
  const range = chargeRangeOf(item)
  if (range == null) return [NaN]
  const list: number[] = []
  for (let n = range[0]; n <= range[1]; n++) list.push(n)
  return list
}

export function itemsInScope(
  game: GameData,
  opts: { category?: string; dungeonId?: string },
): ItemDef[] {
  let items = game.items
  if (opts.category) items = items.filter((i) => i.category === opts.category)
  if (opts.dungeonId) {
    const dungeon = game.dungeons.find((d) => d.id === opts.dungeonId)
    if (dungeon) {
      const pool = new Set(dungeon.itemPool)
      items = items.filter((i) => pool.has(i.name))
    }
  }
  return items
}

/** 値段からの候補検索。カテゴリ・ダンジョンで絞り込み、祝福/呪い・回数変動も照合する */
/** 価格が通常と変わらない状態(倍率1)は候補に出さない(SFCは祝福なし・呪いも価格不変) */
function statesOf(game: GameData): ItemState[] {
  return STATE_ORDER.filter(
    (s) =>
      s === 'normal' ||
      (s === 'blessed' ? game.priceModifiers.blessed : game.priceModifiers.cursed) !== 1,
  )
}

export function identify(game: GameData, query: IdentifyQuery): Match[] {
  const matches: Match[] = []
  if (!Number.isFinite(query.price) || query.price <= 0) return matches
  const states = statesOf(game)
  for (const item of itemsInScope(game, query)) {
    for (const charges of chargeRange(item)) {
      const c = Number.isNaN(charges) ? undefined : charges
      for (const state of states) {
        if (priceOf(game, item, query.priceType, state, c) === query.price) {
          matches.push({ item, state, charges: c })
        }
      }
    }
  }
  // 通常状態を先に、同一アイテムの回数違いは昇順に
  matches.sort(
    (a, b) =>
      STATE_ORDER.indexOf(a.state) - STATE_ORDER.indexOf(b.state) ||
      a.item.name.localeCompare(b.item.name, 'ja') ||
      (a.charges ?? 0) - (b.charges ?? 0),
  )
  return matches
}

export interface PriceGroup {
  price: number
  /** この価格(通常状態)に該当するアイテム数(回数違いは1アイテムとして数える) */
  count: number
  /** この価格に該当するアイテム名 */
  items: string[]
}

/**
 * 頻出価格チップ用: スコープ内アイテムの通常状態の実在価格を集計する。
 * 回数変動アイテムは範囲内の全価格を数えるが、同一アイテムは価格ごとに1回のみ。
 */
export function collectPriceGroups(
  game: GameData,
  opts: { priceType: PriceType; category?: string; dungeonId?: string },
): PriceGroup[] {
  const byPrice = new Map<number, string[]>()
  for (const item of itemsInScope(game, opts)) {
    const prices = new Set<number>()
    for (const charges of chargeRange(item)) {
      const c = Number.isNaN(charges) ? undefined : charges
      prices.add(priceOf(game, item, opts.priceType, 'normal', c))
    }
    for (const p of prices) {
      const list = byPrice.get(p) ?? []
      list.push(item.name)
      byPrice.set(p, list)
    }
  }
  return [...byPrice.entries()]
    .map(([price, items]) => ({ price, count: items.length, items }))
    .sort((a, b) => a.price - b.price)
}

/** 候補0件時のヒント: 入力価格に近い実在価格を返す */
export function nearestPrices(
  game: GameData,
  opts: { price: number; priceType: PriceType; category?: string; dungeonId?: string },
  limit = 3,
): number[] {
  const groups = collectPriceGroups(game, opts)
  return groups
    .map((g) => g.price)
    .sort((a, b) => Math.abs(a - opts.price) - Math.abs(b - opts.price) || a - b)
    .slice(0, limit)
    .sort((a, b) => a - b)
}
