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
          className="rounded-full border border-[#0EA5A3]/30 bg-[#0EA5A3]/5 px-4 py-2 text-sm font-medium text-[#0EA5A3] transition-all hover:border-[#0EA5A3]/50 hover:bg-[#0EA5A3]/10 hover:shadow-sm dark:border-[#0EA5A3]/20 dark:bg-[#0EA5A3]/10 dark:text-[#0EA5A3] dark:hover:bg-[#0EA5A3]/20"
        >
          {text}
        </button>
      ))}
    </div>
  )
}
