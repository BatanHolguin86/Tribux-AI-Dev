'use client'

type QuickRepliesProps = {
  options: string[]
  onSelect: (option: string) => void
  disabled?: boolean
}

export function QuickReplies({ options, onSelect, disabled }: QuickRepliesProps) {
  if (options.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 px-4 py-3">
      {options.map((option, i) => (
        <button
          key={i}
          onClick={() => onSelect(option)}
          disabled={disabled}
          className="rounded-full border border-brand-teal px-4 py-2 text-xs font-medium text-brand-teal transition-all hover:bg-brand-teal/10 disabled:opacity-40 dark:border-brand-teal/60 dark:text-brand-teal"
        >
          {option}
        </button>
      ))}
    </div>
  )
}

/**
 * Extract quick-reply options from CTO message text.
 * Expected format:
 * ---OPTIONS---
 * 1. Option text
 * 2. Option text
 * ---/OPTIONS---
 */
export function extractOptions(text: string): { cleanText: string; options: string[] } {
  const match = text.match(/---OPTIONS---\s*\n([\s\S]*?)\n\s*---\/OPTIONS---/)
  if (!match) return { cleanText: text, options: [] }

  const optionsBlock = match[1]
  const options = optionsBlock
    .split('\n')
    .map((line) => line.replace(/^\d+\.\s*/, '').trim())
    .filter((line) => line.length > 0)

  const cleanText = text.slice(0, match.index).trimEnd()

  return { cleanText, options }
}
