'use client'

type Props = {
  suggestions: string[]
  onSelect: (text: string) => void
  visible: boolean
}

export function SuggestionChips({ suggestions, onSelect, visible }: Props) {
  if (!visible || suggestions.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 px-4 py-3">
      {suggestions.map((text, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(text)}
          className="rounded-full border border-brand-teal/30 bg-brand-teal/5 px-4 py-2 text-sm font-medium text-brand-teal transition-all hover:border-brand-teal/50 hover:bg-brand-teal/10 hover:shadow-sm dark:border-brand-teal/20 dark:bg-brand-teal/10 dark:text-brand-teal dark:hover:bg-brand-teal/20"
        >
          {text}
        </button>
      ))}
    </div>
  )
}
