import type { SharePayload } from '../engine/share'
import type { GameData } from '../types'

export type ImportMode = 'replace' | 'merge'

interface Props {
  game: GameData
  payload: SharePayload
  /** 取り込み先にすでにある識別済み件数 */
  existingCount: number
  onApply: (mode: ImportMode) => void
  onCancel: () => void
}

/** 共有リンクから開いたときに、取り込むかどうかを確認するダイアログ */
export function ImportDialog({
  game,
  payload,
  existingCount,
  onApply,
  onCancel,
}: Props) {
  const dungeon = game.dungeons.find((d) => d.id === payload.dungeonId)
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="import-title">共有された識別済みデータ</h2>
        <p>
          {game.shortName} の識別済み {payload.identified.length} 件
          {dungeon ? `(ダンジョン: ${dungeon.name})` : ''}
          を取り込みますか?
        </p>
        {payload.identified.length > 0 && (
          <div className="chip-row import-preview">
            {payload.identified.map((name) => (
              <span key={name} className="chip done">
                {name}
              </span>
            ))}
          </div>
        )}
        {existingCount > 0 && (
          <p className="hint">
            このデバイスには {game.shortName} の識別済みが {existingCount}{' '}
            件あります。「上書き」は置き換え、「マージ」は両方を残します。
          </p>
        )}
        <div className="modal-actions">
          <button className="primary-btn" onClick={() => onApply('replace')}>
            上書きして取り込む
          </button>
          {existingCount > 0 && (
            <button onClick={() => onApply('merge')}>マージして取り込む</button>
          )}
          <button onClick={onCancel}>キャンセル</button>
        </div>
      </div>
    </div>
  )
}
