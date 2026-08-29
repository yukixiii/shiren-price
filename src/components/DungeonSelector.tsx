import type { GameData } from '../types'

interface Props {
  game: GameData
  dungeonId: string
  onChange: (id: string) => void
}

export function DungeonSelector({ game, dungeonId, onChange }: Props) {
  const selected = game.dungeons.find((d) => d.id === dungeonId)
  return (
    <div className="field-row">
      <label className="field-label" htmlFor="dungeon-select">
        ダンジョン
      </label>
      <select
        id="dungeon-select"
        className="dungeon-select"
        value={dungeonId}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">指定なし(全アイテム)</option>
        {game.dungeons.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>
      {selected?.note && <span className="dungeon-note">{selected.note}</span>}
    </div>
  )
}
