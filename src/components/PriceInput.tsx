import type { PriceType } from '../types'

interface Props {
  priceType: PriceType
  onPriceTypeChange: (t: PriceType) => void
  priceText: string
  onPriceTextChange: (v: string) => void
}

export function PriceInput({
  priceType,
  onPriceTypeChange,
  priceText,
  onPriceTextChange,
}: Props) {
  return (
    <div className="price-input-row">
      <div className="segmented" role="group" aria-label="買値/売値">
        <button
          className={priceType === 'buy' ? 'active' : ''}
          onClick={() => onPriceTypeChange('buy')}
        >
          買値
        </button>
        <button
          className={priceType === 'sell' ? 'active' : ''}
          onClick={() => onPriceTypeChange('sell')}
        >
          売値
        </button>
      </div>
      <div className="price-box">
        <input
          className="price-input"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="値段を入力"
          aria-label="値段"
          value={priceText}
          onChange={(e) =>
            onPriceTextChange(e.target.value.replace(/[^0-9]/g, ''))
          }
        />
        <span className="price-unit">G</span>
        {priceText !== '' && (
          <button
            className="clear-btn"
            aria-label="クリア"
            onClick={() => onPriceTextChange('')}
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}
