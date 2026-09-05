import { chargeRangeOf, itemsInScope } from '../engine/identify'
import type { GameData, ItemDef } from '../types'

interface Props {
  game: GameData
  category: string
  dungeonId: string
  identified: ReadonlySet<string>
  onToggleIdentified: (name: string) => void
}

/**
 * 一覧内の全アイテムで回数単価が同じならその値を返す(なければ null)。
 * 回数単価を持つアイテムが 1 つもない場合も null。
 */
function uniformPerCharge(
  items: readonly ItemDef[],
  key: 'buyPerCharge' | 'sellPerCharge',
): number | null {
  const withCharge = items.filter((i) => i[key])
  if (withCharge.length === 0) return null
  const first = withCharge[0][key]!
  return withCharge.every((i) => i[key] === first) ? first : null
}

/** カテゴリ別の値段一覧(逆引き用) */
export function PriceTable({
  game,
  category,
  dungeonId,
  identified,
  onToggleIdentified,
}: Props) {
  const cats = category
    ? game.categories.filter((c) => c.id === category)
    : game.categories

  return (
    <div className="price-tables">
      {cats.map((c) => {
        const items = itemsInScope(game, {
          category: c.id,
          dungeonId: dungeonId || undefined,
        }).slice()
        if (items.length === 0) return null
        items.sort((a, b) => a.buy - b.buy || a.name.localeCompare(b.name, 'ja'))
        // 回数単価がカテゴリ内で一律なら見出しに 1 回だけ出し、各行からは省く
        const uniformBuy = uniformPerCharge(items, 'buyPerCharge')
        const uniformSell = uniformPerCharge(items, 'sellPerCharge')
        const hoisted = uniformBuy != null && uniformSell != null
        // 回数幅を持つアイテムがあれば「回数」列を出す(PC)/ 名前の下に添える(スマホ)
        const hasCharges = items.some((i) => chargeRangeOf(i) != null)
        return (
          <section key={c.id} className="price-table-section">
            <div className="price-table-header">
              <h3>{c.name}</h3>
              {hoisted && (
                <span className="per-charge-note">
                  回数ごとに 買+{uniformBuy} / 売+{uniformSell}
                </span>
              )}
            </div>
            <div className="table-scroll">
              <table className="price-table">
                <thead>
                  <tr>
                    <th className="col-check">済</th>
                    <th>アイテム</th>
                    {hasCharges && <th className="num col-charges">回数</th>}
                    <th className="num">買値</th>
                    <th className="num">売値</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const done = identified.has(item.name)
                    const range = chargeRangeOf(item)
                    const rangeText =
                      range &&
                      (range[0] === range[1]
                        ? String(range[0])
                        : `${range[0]}〜${range[1]}`)
                    return (
                      <tr key={item.name} className={done ? 'identified' : ''}>
                        <td className="col-check">
                          <input
                            type="checkbox"
                            checked={done}
                            onChange={() => onToggleIdentified(item.name)}
                            aria-label={`${item.name} を識別済みにする`}
                          />
                        </td>
                        <td className="col-name">
                          {item.name}
                          {rangeText && (
                            <span className="charge-range-sub">
                              {rangeText}回
                            </span>
                          )}
                        </td>
                        {hasCharges && (
                          <td className="num col-charges">
                            {rangeText ?? '-'}
                          </td>
                        )}
                        <td className="num">
                          {item.buy.toLocaleString()}
                          {!hoisted && !!item.buyPerCharge && (
                            <span className="per-charge">
                              {' '}
                              +{item.buyPerCharge}/回
                            </span>
                          )}
                        </td>
                        <td className="num">
                          {item.sell.toLocaleString()}
                          {!hoisted && !!item.sellPerCharge && (
                            <span className="per-charge">
                              {' '}
                              +{item.sellPerCharge}/回
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )
      })}
    </div>
  )
}
