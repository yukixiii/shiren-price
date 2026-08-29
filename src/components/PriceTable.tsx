import { itemsInScope } from '../engine/identify'
import type { GameData } from '../types'

interface Props {
  game: GameData
  category: string
  dungeonId: string
  identified: ReadonlySet<string>
  onToggleIdentified: (name: string) => void
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
        return (
          <section key={c.id} className="price-table-section">
            <h3>{c.name}</h3>
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
                          {item.buyPerCharge != null && (
                            <span className="per-charge">
                              {' '}
                              +{item.buyPerCharge}/回
                            </span>
                          )}
                        </td>
                        <td className="num">
                          {item.sell.toLocaleString()}
                          {item.sellPerCharge != null && (
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
