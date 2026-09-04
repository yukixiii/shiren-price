// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { games, getGame } from './data'
import { codeFromHash, decodeShare, encodeShare } from './engine/share'

beforeEach(() => localStorage.clear())
afterEach(cleanup)

describe('App (実データでの結合テスト)', () => {
  it('初期表示はシレン6で、値段入力で候補が出る', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByRole('heading', { name: 'シレン値段識別' })).toBeTruthy()

    await user.type(screen.getByLabelText('値段'), '300')
    await user.click(screen.getByRole('button', { name: '巻物' }))
    // シレン6の買値300Gの巻物(識別の巻物など)が候補に出る
    expect(screen.getByText('識別の巻物')).toBeTruthy()
    expect(screen.getByText('混乱の巻物')).toBeTruthy()
  })

  it('ゲームを切り替えるとシレン5のデータになる', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('tab', { name: 'シレン5' }))
    await user.type(screen.getByLabelText('値段'), '50')
    await user.click(screen.getByRole('button', { name: '草・種' }))
    // シレン5では50Gの草は薬草と楽草(まがいもの)
    expect(screen.getByText('薬草')).toBeTruthy()
    expect(screen.getByText('楽草')).toBeTruthy()
  })

  it('ダンジョン絞り込みで候補が変わる', async () => {
    const user = userEvent.setup()
    render(<App />)
    const select = screen.getByLabelText('ダンジョン') as HTMLSelectElement
    expect(within(select).getByText('とぐろ島の神髄')).toBeTruthy()
    await user.selectOptions(select, within(select).getByText('とぐろ島の神髄'))
    expect(screen.getByText(/に出現するアイテムのみ表示中/)).toBeTruthy()
  })

  it('識別済みチェックが記録され識別済みタブに出る', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.type(screen.getByLabelText('値段'), '300')
    await user.click(
      screen.getByLabelText('識別の巻物 を識別済みにする'),
    )
    await user.click(screen.getByRole('tab', { name: /識別済み \(1\)/ }))
    expect(screen.getByText('識別済み 1 件')).toBeTruthy()
    expect(screen.getByText('識別の巻物 ✓')).toBeTruthy()
    // localStorage に保存されている
    expect(localStorage.getItem('sp:shiren6:identified')).toContain('識別の巻物')
  })

  it('値段表タブに全カテゴリの表が出る', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('tab', { name: '値段表' }))
    expect(screen.getByRole('heading', { name: 'お香' })).toBeTruthy()
    expect(screen.getByText('白紙の巻物')).toBeTruthy()
  })

  it('回数単価がカテゴリ内で一律なら見出しにまとめ、各行には出さない', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('tab', { name: '値段表' }))
    // シレン6の杖は全て 買+100 / 売+40 なので見出し側に 1 回だけ出る
    expect(screen.getAllByText('回数ごとに 買+100 / 売+40').length).toBeGreaterThan(0)
    expect(screen.queryByText(/\+100\/回/)).toBeNull()
  })

  it('値段表に回数幅が出る', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('tab', { name: '値段表' }))
    // かなしばりの杖: 回数 4〜6(PC は回数列、スマホは名前の下)
    const row = screen.getByText('かなしばりの杖').closest('tr')!
    expect(within(row).getByText('4〜6')).toBeTruthy()
    expect(within(row).getByText('4〜6回')).toBeTruthy()
    const cells = within(row).getAllByRole('cell')
    expect(cells.at(-2)!.textContent).toBe('500')
    expect(cells.at(-1)!.textContent).toBe('200')
  })

  it('識別結果の回数バッジに回数幅を添える', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.type(screen.getByLabelText('値段'), '1000')
    await user.click(screen.getByRole('button', { name: '杖' }))
    const row = screen
      .getByLabelText('かなしばりの杖 を識別済みにする')
      .closest('label')!
    expect(within(row).getByText('[5]')).toBeTruthy()
    expect(within(row).getByText('4〜6回')).toBeTruthy()
    // 回数 5 での価格: 買 500+100×5 / 売 200+40×5
    expect(within(row).getByText(/買 1,000 \/ 売 400/)).toBeTruthy()
  })

  it('回数単価がばらつくカテゴリでは各行に表示する', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('tab', { name: 'シレン5' }))
    await user.click(screen.getByRole('tab', { name: '値段表' }))
    // シレン5の杖はアイテムごとに単価が異なるので行ごとに表示される
    expect(screen.getAllByText(/\+30\/回/).length).toBeGreaterThan(0)
    expect(screen.queryByText(/^回数ごとに/)).toBeNull()
  })

  it('テーマボタンで 自動 → ライト → ダーク を循環し、html[data-theme] と保存値が変わる', async () => {
    const user = userEvent.setup()
    render(<App />)
    const btn = screen.getByRole('button', { name: /テーマ: 自動/ })
    expect(document.documentElement.dataset.theme).toBeUndefined()

    await user.click(btn)
    expect(screen.getByRole('button', { name: /テーマ: ライト/ })).toBeTruthy()
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem('sp:theme')).toBe('"light"')

    await user.click(screen.getByRole('button', { name: /テーマ: ライト/ }))
    expect(document.documentElement.dataset.theme).toBe('dark')

    await user.click(screen.getByRole('button', { name: /テーマ: ダーク/ }))
    expect(screen.getByRole('button', { name: /テーマ: 自動/ })).toBeTruthy()
    expect(document.documentElement.dataset.theme).toBeUndefined()
  })
})

describe('識別済みデータの共有 (実データ)', () => {
  afterEach(() => {
    history.replaceState(null, '', '/')
  })

  it('共有ボタンで QR コードとリンクが出る', async () => {
    const user = userEvent.setup()
    localStorage.setItem('sp:shiren6:identified', JSON.stringify(['識別の巻物']))
    render(<App />)
    await user.click(screen.getByRole('tab', { name: /識別済み \(1\)/ }))
    await user.click(screen.getByRole('button', { name: '共有' }))
    const dialog = screen.getByRole('dialog', { name: '識別済みデータを共有' })
    const link = within(dialog).getByLabelText('共有リンク') as HTMLInputElement
    expect(link.value).toMatch(/#s=1\.shiren6\.\./)
    expect(dialog.querySelector('.qr svg')).toBeTruthy()
    // 出したリンクを復元すると同じ内容になる
    const code = codeFromHash(new URL(link.value).hash)!
    expect(decodeShare(games, code)?.identified).toEqual(['識別の巻物'])
  })

  it('共有リンクを開くと取り込み確認が出て、上書きで保存される', async () => {
    const user = userEvent.setup()
    const code = encodeShare(getGame('shiren6'), ['識別の巻物', '混乱の巻物'], 'togurojima-shinzui')
    localStorage.setItem('sp:shiren6:identified', JSON.stringify(['白紙の巻物']))
    history.replaceState(null, '', `/#s=${code}`)
    render(<App />)
    const dialog = screen.getByRole('dialog', { name: '共有された識別済みデータ' })
    expect(within(dialog).getByText(/識別済み 2 件/)).toBeTruthy()
    expect(within(dialog).getByText(/1 件あります/)).toBeTruthy()
    await user.click(within(dialog).getByRole('button', { name: '上書きして取り込む' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(location.hash).toBe('')
    expect(screen.getByText('識別済み 2 件')).toBeTruthy()
    expect(screen.getByText('混乱の巻物 ✓')).toBeTruthy()
    expect(screen.queryByText('白紙の巻物 ✓')).toBeNull()
    // 復元順は JSON の並び順
    expect(JSON.parse(localStorage.getItem('sp:shiren6:identified')!).sort()).toEqual(
      ['混乱の巻物', '識別の巻物'].sort(),
    )
    expect(localStorage.getItem('sp:shiren6:dungeon')).toBe('"togurojima-shinzui"')
    expect(screen.getByText(/「とぐろ島の神髄」に出現/)).toBeTruthy()
  })

  it('マージで取り込むと既存の記録も残る', async () => {
    const user = userEvent.setup()
    const code = encodeShare(getGame('shiren6'), ['識別の巻物'], '')
    localStorage.setItem('sp:shiren6:identified', JSON.stringify(['白紙の巻物']))
    history.replaceState(null, '', `/#s=${code}`)
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'マージして取り込む' }))
    expect(screen.getByText('識別済み 2 件')).toBeTruthy()
    expect(screen.getByText('白紙の巻物 ✓')).toBeTruthy()
    expect(screen.getByText('識別の巻物 ✓')).toBeTruthy()
  })

  it('別ゲームのリンクを開くとそのゲームに切り替えて取り込む', async () => {
    const user = userEvent.setup()
    const code = encodeShare(getGame('shiren5'), ['薬草'], '')
    history.replaceState(null, '', `/#s=${code}`)
    render(<App />)
    expect(screen.getByText(/シレン5 の識別済み 1 件/)).toBeTruthy()
    await user.click(screen.getByRole('button', { name: '上書きして取り込む' }))
    expect(screen.getByRole('tab', { name: 'シレン5', selected: true })).toBeTruthy()
    expect(screen.getByText('薬草 ✓')).toBeTruthy()
    expect(localStorage.getItem('sp:shiren5:identified')).toContain('薬草')
  })

  it('キャンセルすると何も変わらず hash も消える', async () => {
    const user = userEvent.setup()
    const code = encodeShare(getGame('shiren6'), ['識別の巻物'], '')
    history.replaceState(null, '', `/#s=${code}`)
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'キャンセル' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(location.hash).toBe('')
    expect(localStorage.getItem('sp:shiren6:identified')).toBe('[]')
  })

  it('壊れた共有リンクは無視する', () => {
    history.replaceState(null, '', '/#s=garbage')
    render(<App />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
