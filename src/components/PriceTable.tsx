import { itemsInScope } from '../engine/identify'
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
  const withCharge = items.filter((i) => i[key] != null)
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
                    <th className="num">買値</th>
                    <th className="num">売値</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const done = identified.has(item.name)
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
                        <td>{item.name}</td>
                        <td className="num">
                          {item.buy.toLocaleString()}
                          {!hoisted && item.buyPerCharge != null && (
                            <span className="per-charge">
                              {' '}
                              +{item.buyPerCharge}/回
                            </span>
                          )}
                        </td>
                        <td className="num">
                          {item.sell.toLocaleString()}
                          {!hoisted && item.sellPerCharge != null && (
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
