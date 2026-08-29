import type { CategoryDef } from '../types'

interface Props {
  categories: CategoryDef[]
  category: string
  onChange: (id: string) => void
}

export function CategoryTabs({ categories, category, onChange }: Props) {
  return (
    <div className="chip-row" role="group" aria-label="カテゴリ選択">
      <button
        className={`chip${category === '' ? ' active' : ''}`}
        onClick={() => onChange('')}
      >
        すべて
      </button>
      {categories.map((c) => (
        <button
          key={c.id}
          className={`chip${category === c.id ? ' active' : ''}`}
          onClick={() => onChange(category === c.id ? '' : c.id)}
        >
          {c.name}
        </button>
      ))}
    </div>
  )
}
