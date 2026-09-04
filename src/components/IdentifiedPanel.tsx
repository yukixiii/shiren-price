import type { GameData } from '../types'

interface Props {
  game: GameData
  identified: ReadonlySet<string>
  onToggleIdentified: (name: string) => void
  onReset: () => void
  onShare: () => void
}

/** 識別済みアイテムの一覧とリセット */
export function IdentifiedPanel({
  game,
  identified,
  onToggleIdentified,
  onReset,
  onShare,
}: Props) {
  const byCategory = game.categories
    .map((c) => ({
      category: c,
      items: game.items.filter(
        (i) => i.category === c.id && identified.has(i.name),
      ),
    }))
    .filter((g) => g.items.length > 0)

  return (
    <div className="identified-panel">
      <div className="identified-header">
        <span>識別済み {identified.size} 件</span>
        <div className="identified-actions">
          <button className="primary-btn" onClick={onShare}>
            共有
          </button>
          {identified.size > 0 && (
            <button
              className="danger-btn"
              onClick={() => {
                if (
                  window.confirm(`${game.shortName} の識別済み記録をすべて消しますか?`)
                ) {
                  onReset()
                }
              }}
            >
              冒険をリセット
            </button>
          )}
        </div>
      </div>
      {byCategory.length === 0 && (
        <p className="hint">
          識別済みのアイテムはありません。検索結果や値段表のチェックボックスで記録できます。
          別のデバイスで記録したデータは「共有」から出したリンクを開くと取り込めます。
        </p>
      )}
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
