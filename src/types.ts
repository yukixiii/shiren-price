export type PriceType = 'buy' | 'sell'
export type ItemState = 'normal' | 'blessed' | 'cursed'
export type Rounding = 'floor' | 'round' | 'ceil'

export interface CategoryDef {
  id: string
  name: string
  /** 店頭価格が回数(杖など)で変動するカテゴリか */
  hasCharges: boolean
}

export interface ItemDef {
  name: string
  category: string
  /** 回数0(または基準状態)の基本買値 */
  buy: number
  /** 基本売値 */
  sell: number
  /** 回数1あたりの買値増分(回数で変動する場合のみ) */
  buyPerCharge?: number
  sellPerCharge?: number
  /** 入手時にありうる回数の範囲 */
  chargeMin?: number
  chargeMax?: number
}

export interface DungeonDef {
  id: string
  name: string
  /** 出現アイテム名のリスト(包含方式)。items の name と一致させる */
  itemPool: string[]
  note?: string
}

export interface GameData {
  id: string
  name: string
  shortName: string
  /** 祝福/呪い状態の価格倍率 */
  priceModifiers: { blessed: number; cursed: number }
  /** 倍率適用時の端数処理 */
  rounding: Rounding
  categories: CategoryDef[]
  items: ItemDef[]
  dungeons: DungeonDef[]
}
