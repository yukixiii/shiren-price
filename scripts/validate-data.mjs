// ゲームデータJSONのスキーマ・整合性チェック
// usage: node scripts/validate-data.mjs <file.json> [...]
import { readFileSync } from 'node:fs'

let failed = false
const err = (file, msg) => {
  failed = true
  console.error(`[NG] ${file}: ${msg}`)
}

for (const file of process.argv.slice(2)) {
  const g = JSON.parse(readFileSync(file, 'utf8'))
  for (const key of ['id', 'name', 'shortName', 'priceModifiers', 'rounding', 'categories', 'items', 'dungeons']) {
    if (g[key] == null) err(file, `missing field: ${key}`)
  }
  if (typeof g.priceModifiers?.blessed !== 'number' || typeof g.priceModifiers?.cursed !== 'number')
    err(file, 'priceModifiers must have numeric blessed/cursed')
  if (!['floor', 'round', 'ceil'].includes(g.rounding)) err(file, `bad rounding: ${g.rounding}`)

  const catIds = new Set((g.categories ?? []).map((c) => c.id))
  const names = new Set()
  for (const item of g.items ?? []) {
    const where = `item「${item.name}」`
    if (!item.name) err(file, 'item without name')
    if (names.has(item.name)) err(file, `duplicate item name: ${item.name}`)
    names.add(item.name)
    if (!catIds.has(item.category)) err(file, `${where}: unknown category ${item.category}`)
    if (!Number.isInteger(item.buy) || item.buy <= 0) err(file, `${where}: bad buy ${item.buy}`)
    if (!Number.isInteger(item.sell) || item.sell <= 0) err(file, `${where}: bad sell ${item.sell}`)
    if (item.buyPerCharge != null) {
      if (item.chargeMin == null || item.chargeMax == null)
        err(file, `${where}: buyPerCharge without chargeMin/chargeMax`)
      else if (item.chargeMin > item.chargeMax) err(file, `${where}: chargeMin > chargeMax`)
    }
  }
  const dungeonIds = new Set()
  for (const d of g.dungeons ?? []) {
    if (dungeonIds.has(d.id)) err(file, `duplicate dungeon id: ${d.id}`)
    dungeonIds.add(d.id)
    if (!Array.isArray(d.itemPool) || d.itemPool.length === 0)
      err(file, `dungeon「${d.name}」: empty itemPool`)
    for (const n of d.itemPool ?? []) {
      if (!names.has(n)) err(file, `dungeon「${d.name}」: unknown item in itemPool: ${n}`)
    }
  }
  const perCat = {}
  for (const item of g.items ?? []) perCat[item.category] = (perCat[item.category] ?? 0) + 1
  console.log(`[OK?] ${file}: items=${g.items?.length} ${JSON.stringify(perCat)} dungeons=${(g.dungeons ?? []).map((d) => d.name).join(',')}`)
}
process.exit(failed ? 1 : 0)
