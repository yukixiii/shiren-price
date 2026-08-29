import type { GameData } from '../types'
import shiren5 from './shiren5.json'
import shiren6 from './shiren6.json'

// タイトル追加はここに import を1行足すだけ(JSONは GameData スキーマに従うこと)
export const games: GameData[] = [shiren6 as GameData, shiren5 as GameData]

export function getGame(id: string): GameData {
  return games.find((g) => g.id === id) ?? games[0]
}
