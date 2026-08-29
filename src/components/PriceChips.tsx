import { useMemo } from 'react'
import { collectPriceGroups } from '../engine/identify'
import type { GameData, PriceType } from '../types'

interface Props {
  game: GameData
  priceType: PriceType
  category: string
  dungeonId: string
  currentPrice: number | undefined
  identified: ReadonlySet<string>
  onPick: (price: number) => void
}

/** 頻出価格グループのワンタップ選択。カテゴリ未選択時はカテゴリごとにグループ表示 */
export function PriceChips({
  game,
  priceType,
  category,
  dungeonId,
  currentPrice,
  identified,
  onPick,
}: Props) {
  const sections = useMemo(() => {
    const cats = category
      ? game.categories.filter((c) => c.id === category)
      : game.categories
    return cats
      .map((c) => ({
        category: c,
        groups: collectPriceGroups(game, {
          priceType,
          category: c.id,
          dungeonId: dungeonId || undefined,
        }),
      }))
      .filter((s) => s.groups.length > 0)
  }, [game, priceType, category, dungeonId])

  if (sections.length === 0) return null

  return (
    <div className="price-chips">
      {sections.map((s) => (
        <div key={s.category.id} className="price-chip-section">
          {!category && (
            <span className="price-chip-label">{s.category.name}</span>
          )}
          <div className="chip-row">
            {s.groups.map((g) => {
              const allIdentified =
                g.items.length > 0 && g.items.every((n) => identified.has(n))
              return (
                <button
                  key={g.price}
                  className={`chip price-chip${
                    currentPrice === g.price ? ' active' : ''
                  }${allIdentified ? ' done' : ''}`}
                  title={g.items.join('、')}
                  onClick={() => onPick(g.price)}
                >
                  {g.price.toLocaleString()}
                  {g.count > 1 && <span className="chip-count">×{g.count}</span>}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
