import type { GameData } from '../types'

/**
 * 識別済みデータの共有コード。
 * 形式: `1.<gameId>.<dungeonId>.<bitset>`
 *  - 先頭はフォーマットバージョン
 *  - bitset は items の並び順のインデックスをビット列にして base64url 化したもの
 *    (アイテム 200 件でも 25 バイト程度に収まる)
 *  - dungeonId は未選択なら空文字
 */

export interface SharePayload {
  gameId: string
  dungeonId: string
  identified: string[]
}

const VERSION = '1'

function toBase64Url(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(s: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]*$/.test(s)) return null
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
  try {
    const bin = atob(padded)
    const out = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
    return out
  } catch {
    return null
  }
}

/** 識別済みリストとダンジョン選択を共有コードにする */
export function encodeShare(
  game: GameData,
  identified: Iterable<string>,
  dungeonId: string,
): string {
  const set = new Set(identified)
  const bytes = new Uint8Array(Math.ceil(game.items.length / 8))
  game.items.forEach((item, i) => {
    if (set.has(item.name)) bytes[i >> 3] |= 1 << (i & 7)
  })
  // 末尾の 0 バイトは落として短くする
  let len = bytes.length
  while (len > 0 && bytes[len - 1] === 0) len--
  const dungeon = game.dungeons.some((d) => d.id === dungeonId) ? dungeonId : ''
  return [VERSION, game.id, dungeon, toBase64Url(bytes.subarray(0, len))].join('.')
}

/** 共有コードを復元する。壊れていたり未知のゲームなら null */
export function decodeShare(
  games: readonly GameData[],
  code: string,
): SharePayload | null {
  const parts = code.split('.')
  if (parts.length !== 4 || parts[0] !== VERSION) return null
  const [, gameId, dungeonId, bits] = parts
  const game = games.find((g) => g.id === gameId)
  if (!game) return null
  const bytes = fromBase64Url(bits)
  if (!bytes) return null
  const identified = game.items
    .filter((_, i) => i >> 3 < bytes.length && (bytes[i >> 3] >> (i & 7)) & 1)
    .map((item) => item.name)
  return {
    gameId: game.id,
    dungeonId: game.dungeons.some((d) => d.id === dungeonId) ? dungeonId : '',
    identified,
  }
}

const HASH_KEY = 's'

/** 共有コードを載せた URL(現在のページの hash に付ける) */
export function shareUrl(code: string, base: string = location.href): string {
  const url = new URL(base)
  url.hash = `${HASH_KEY}=${code}`
  return url.toString()
}

/** URL の hash から共有コードを取り出す。無ければ null */
export function codeFromHash(hash: string): string | null {
  const m = /^#?s=([^&]+)/.exec(hash)
  return m ? decodeURIComponent(m[1]) : null
}
