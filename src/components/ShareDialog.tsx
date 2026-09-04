import { useEffect, useMemo, useState } from 'react'
import qrcode from 'qrcode-generator'

interface Props {
  url: string
  count: number
  gameName: string
  onClose: () => void
}

/** 識別済みデータを QR コード / リンクで別デバイスに渡すダイアログ */
export function ShareDialog({ url, count, gameName, onClose }: Props) {
  const [copied, setCopied] = useState<'ok' | 'ng' | null>(null)

  const svg = useMemo(() => {
    const qr = qrcode(0, 'M')
    qr.addData(url)
    qr.make()
    return qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true })
  }, [url])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied('ok')
    } catch {
      setCopied('ng')
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="share-title">識別済みデータを共有</h2>
        <p className="hint">
          {gameName} の識別済み {count} 件と選択中のダンジョンを、別のデバイスに渡せます。
          スマホのカメラで QR コードを読むか、リンクを開いてください。
        </p>
        <div
          className="qr"
          aria-label="共有用 QR コード"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        <input
          className="share-url"
          readOnly
          value={url}
          aria-label="共有リンク"
          onFocus={(e) => e.currentTarget.select()}
        />
        <div className="modal-actions">
          <button className="primary-btn" onClick={copy}>
            リンクをコピー
          </button>
          <button onClick={onClose}>閉じる</button>
        </div>
        {copied === 'ok' && <p className="hint">コピーしました</p>}
        {copied === 'ng' && (
          <p className="hint">コピーできませんでした。上のリンクを長押しして選択してください</p>
        )}
      </div>
    </div>
  )
}
