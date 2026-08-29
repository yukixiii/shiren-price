import type { GameData } from '../types'

interface Props {
  game: GameData
  identified: ReadonlySet<string>
  onToggleIdentified: (name: string) => void
  onReset: () => void
}

/** 識別済みアイテムの一覧とリセット */
export function IdentifiedPanel({
  game,
  identified,
  onToggleIdentified,
  onReset,
}: Props) {
  const byCategory = game.categories
    .map((c) => ({
      category: c,
      items: game.items.filter(
        (i) => i.category === c.id && identified.has(i.name),
      ),
    }))
    .filter((g) => g.items.length > 0)

  if (byCategory.length === 0) {
    return (
      <p className="hint">
        識別済みのアイテムはありません。検索結果や値段表のチェックボックスで記録できます。
      </p>
    )
  }

  return (
    <div className="identified-panel">
      <div className="identified-header">
        <span>識別済み {identified.size} 件</span>
        <button
          className="danger-btn"
          onClick={() => {
            if (window.confirm(`${game.shortName} の識別済み記録をすべて消しますか?`)) {
              onReset()
            }
          }}
        >
          冒険をリセット
        </button>
      </div>
      {byCategory.map((g) => (
        <section key={g.category.id}>
          <h3>{g.category.name}</h3>
          <div className="chip-row">
            {g.items.map((item) => (
              <button
                key={item.name}
                className="chip done"
                title="タップで識別済みを解除"
                onClick={() => onToggleIdentified(item.name)}
              >
                {item.name} ✓
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
