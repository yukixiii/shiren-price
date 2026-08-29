import { useMemo, useState } from 'react'
import { CategoryTabs } from './components/CategoryTabs'
import { DungeonSelector } from './components/DungeonSelector'
import { GameSelector } from './components/GameSelector'
import { IdentifiedPanel } from './components/IdentifiedPanel'
import { PriceChips } from './components/PriceChips'
import { PriceInput } from './components/PriceInput'
import { PriceTable } from './components/PriceTable'
import { ResultList } from './components/ResultList'
import { games, getGame } from './data'
import { identify, nearestPrices } from './engine/identify'
import type { PriceType } from './types'
import { useStoredState } from './useStoredState'

type Tab = 'identify' | 'table' | 'identified'

export default function App() {
  const [gameId, setGameId] = useStoredState<string>('sp:game', games[0].id)
  const game = getGame(gameId)

  const [dungeonId, setDungeonId] = useStoredState<string>(
    `sp:${game.id}:dungeon`,
    '',
  )
  const [identifiedList, setIdentifiedList] = useStoredState<string[]>(
    `sp:${game.id}:identified`,
    [],
  )
  const [hideIdentified, setHideIdentified] = useStoredState<boolean>(
    'sp:hideIdentified',
    false,
  )
  const [priceType, setPriceType] = useStoredState<PriceType>(
    'sp:priceType',
    'buy',
  )
  const [tab, setTab] = useState<Tab>('identify')
  const [category, setCategory] = useState('')
  const [priceText, setPriceText] = useState('')

  const identified = useMemo(() => new Set(identifiedList), [identifiedList])
  const price = priceText === '' ? undefined : Number(priceText)

  const toggleIdentified = (name: string) => {
    setIdentifiedList((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    )
  }

  const matches = useMemo(
    () =>
      price == null
        ? []
        : identify(game, {
            price,
            priceType,
            category: category || undefined,
            dungeonId: dungeonId || undefined,
          }),
    [game, price, priceType, category, dungeonId],
  )

  const nearest = useMemo(
    () =>
      price == null || matches.length > 0
        ? []
        : nearestPrices(game, {
            price,
            priceType,
            category: category || undefined,
            dungeonId: dungeonId || undefined,
          }),
    [game, price, priceType, category, dungeonId, matches.length],
  )

  const dungeonName = game.dungeons.find((d) => d.id === dungeonId)?.name

  return (
    <div className="app">
      <header className="app-header">
        <h1>シレン値段識別</h1>
        <GameSelector
          games={games}
          gameId={game.id}
          onChange={(id) => {
            setGameId(id)
            setPriceText('')
            setCategory('')
          }}
        />
      </header>

      <nav className="main-tabs" role="tablist" aria-label="機能切替">
        {(
          [
            ['identify', '識別'],
            ['table', '値段表'],
            ['identified', `識別済み${identified.size > 0 ? ` (${identified.size})` : ''}`],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? 'active' : ''}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      <main className="app-main">
        <DungeonSelector
          game={game}
          dungeonId={dungeonId}
          onChange={setDungeonId}
        />
        {dungeonName && (
          <p className="scope-note">
            「{dungeonName}」に出現するアイテムのみ表示中
          </p>
        )}

        {tab === 'identify' && (
          <>
            <PriceInput
              priceType={priceType}
              onPriceTypeChange={setPriceType}
              priceText={priceText}
              onPriceTextChange={setPriceText}
            />
            <CategoryTabs
              categories={game.categories}
              category={category}
              onChange={setCategory}
            />
            <PriceChips
              game={game}
              priceType={priceType}
              category={category}
              dungeonId={dungeonId}
              currentPrice={price}
              identified={identified}
              onPick={(p) => setPriceText(String(p))}
            />
            <div className="result-header">
              <h2>候補{price != null ? ` (${matches.length})` : ''}</h2>
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={hideIdentified}
                  onChange={(e) => setHideIdentified(e.target.checked)}
                />
                識別済みを隠す
              </label>
            </div>
            <ResultList
              game={game}
              matches={matches}
              price={price}
              nearest={nearest}
              hideIdentified={hideIdentified}
              identified={identified}
              onToggleIdentified={toggleIdentified}
              onPickPrice={(p) => setPriceText(String(p))}
            />
          </>
        )}

        {tab === 'table' && (
          <>
            <CategoryTabs
              categories={game.categories}
              category={category}
              onChange={setCategory}
            />
            <PriceTable
              game={game}
              category={category}
              dungeonId={dungeonId}
              identified={identified}
              onToggleIdentified={toggleIdentified}
            />
          </>
        )}

        {tab === 'identified' && (
          <IdentifiedPanel
            game={game}
            identified={identified}
            onToggleIdentified={toggleIdentified}
            onReset={() => setIdentifiedList([])}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>
          {game.name} / 祝福 ×{game.priceModifiers.blessed} ・ 呪い ×
          {game.priceModifiers.cursed}
        </p>
      </footer>
    </div>
  )
}
