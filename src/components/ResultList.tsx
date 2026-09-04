import { chargeRangeOf, priceOf, type Match } from '../engine/identify'
import type { GameData } from '../types'

interface Props {
  game: GameData
  matches: Match[]
  price: number | undefined
  nearest: number[]
  hideIdentified: boolean
  identified: ReadonlySet<string>
  onToggleIdentified: (name: string) => void
  onPickPrice: (price: number) => void
}

const STATE_LABEL = { blessed: '祝福', cursed: '呪い' } as const

export function ResultList({
  game,
  matches,
  price,
  nearest,
  hideIdentified,
  identified,
  onToggleIdentified,
  onPickPrice,
}: Props) {
  if (price == null) {
    return (
      <p className="hint">
        値段を入力するか、上の頻出価格をタップしてください。
      </p>
    )
  }

  const visible = hideIdentified
    ? matches.filter((m) => !identified.has(m.item.name))
    : matches
  const hiddenCount = matches.length - visible.length

  if (matches.length === 0) {
    return (
      <div className="no-result">
        <p>
          <strong>{price.toLocaleString()}G</strong> に一致するアイテムはありません。
        </p>
        {nearest.length > 0 && (
          <p className="hint">
            近い値段:{' '}
            {nearest.map((p) => (
              <button key={p} className="chip" onClick={() => onPickPrice(p)}>
                {p.toLocaleString()}G
              </button>
            ))}
          </p>
        )}
      </div>
    )
  }

  const catName = (id: string) =>
    game.categories.find((c) => c.id === id)?.name ?? id

  return (
    <div className="result-list">
      {visible.map((m, i) => {
        const done = identified.has(m.item.name)
        const range = chargeRangeOf(m.item)
        return (
          <label
            key={`${m.item.name}-${m.state}-${m.charges ?? ''}-${i}`}
            className={`result-row${done ? ' identified' : ''}`}
          >
            <input
              type="checkbox"
              checked={done}
              onChange={() => onToggleIdentified(m.item.name)}
              aria-label={`${m.item.name} を識別済みにする`}
            />
            <span className="result-name">
              {m.item.name}
              {m.charges != null && (
                <span className="charge-badge">[{m.charges}]</span>
              )}
              {range && (
                <span className="charge-range">
                  {range[0] === range[1]
                    ? `${range[0]}回固定`
                    : `${range[0]}〜${range[1]}回`}
                </span>
              )}
            </span>
            {m.state !== 'normal' && (
              <span className={`state-badge ${m.state}`}>
                {STATE_LABEL[m.state]}
              </span>
            )}
            <span className="result-cat">{catName(m.item.category)}</span>
            <span className="result-prices">
              買 {priceOf(game, m.item, 'buy', 'normal', m.charges).toLocaleString()}{' '}
              / 売 {priceOf(game, m.item, 'sell', 'normal', m.charges).toLocaleString()}
              {m.item.buyPerCharge != null && (
                <span className="per-charge"> +{m.item.buyPerCharge}/回</span>
              )}
            </span>
          </label>
        )
      })}
      {hiddenCount > 0 && (
        <p className="hint">識別済み {hiddenCount} 件を非表示中</p>
      )}
    </div>
  )
}
