import type { GameData } from '../types'
import shiren5 from './shiren5.json'
import shiren6 from './shiren6.json'
import shiren4 from './shiren4.json'
import asuka from './asuka.json'

// タイトル追加はここに import と games への追加を1行ずつ足すだけ(JSONは GameData スキーマに従うこと)
// 先頭がデフォルトのタイトル
export const games: GameData[] = [shiren6 as GameData, shiren5 as GameData, shiren4 as GameData, asuka as GameData]

export function getGame(id: string): GameData {
  return games.find((g) => g.id === id) ?? games[0]
}
