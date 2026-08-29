import type { GameData } from '../types'

interface Props {
  games: GameData[]
  gameId: string
  onChange: (id: string) => void
}

export function GameSelector({ games, gameId, onChange }: Props) {
  return (
    <div className="game-tabs" role="tablist" aria-label="ゲーム選択">
      {games.map((g) => (
        <button
          key={g.id}
          role="tab"
          aria-selected={g.id === gameId}
          className={`game-tab${g.id === gameId ? ' active' : ''}`}
          onClick={() => onChange(g.id)}
        >
          {g.shortName}
        </button>
      ))}
    </div>
  )
}
