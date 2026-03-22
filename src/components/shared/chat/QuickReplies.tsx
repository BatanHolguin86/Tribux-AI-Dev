'use client'

type QuickRepliesProps = {
  options: string[]
  onSelect: (option: string) => void
  disabled?: boolean
}

export function QuickReplies({ options, onSelect, disabled }: QuickRepliesProps) {
  if (options.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 border-t border-gray-100 px-3 py-2 dark:border-gray-800">
      {options.map((option, i) => {
        const isOpen = i === options.length - 1
        return (
          <button
            key={i}
            onClick={() => onSelect(option)}
            disabled={disabled}
            className={`rounded-xl px-3 py-2 text-xs font-medium leading-snug text-left transition-all disabled:opacity-40 ${
              isOpen
                ? 'bg-gray-50 text-gray-500 ring-1 ring-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-gray-700'
                : 'bg-violet-50 text-violet-700 ring-1 ring-violet-200 hover:bg-violet-100 dark:bg-violet-900/20 dark:text-violet-300 dark:ring-violet-800/50 dark:hover:bg-violet-900/30'
            }`}
          >
            {option}
          </button>
        )
      })}
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
