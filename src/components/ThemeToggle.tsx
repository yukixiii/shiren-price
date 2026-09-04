export type Theme = 'auto' | 'light' | 'dark'

export const THEME_ORDER: Theme[] = ['auto', 'light', 'dark']

const LABELS: Record<Theme, { icon: string; label: string }> = {
  auto: { icon: '🌓', label: '自動' },
  light: { icon: '☀️', label: 'ライト' },
  dark: { icon: '🌙', label: 'ダーク' },
}

/** <html data-theme> を更新する。auto は属性を外して OS 設定に従わせる */
export function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'auto') delete root.dataset.theme
  else root.dataset.theme = theme
}

interface Props {
  theme: Theme
  onChange: (theme: Theme) => void
}

export function ThemeToggle({ theme, onChange }: Props) {
  const next = THEME_ORDER[(THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length]
  const { icon, label } = LABELS[theme]
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => onChange(next)}
      aria-label={`テーマ: ${label}（クリックで${LABELS[next].label}に切替）`}
      title={`テーマ: ${label}`}
    >
      <span aria-hidden="true">{icon}</span>
      {label}
    </button>
  )
}
