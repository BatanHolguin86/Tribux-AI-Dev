'use client'

import { useRef, useEffect } from 'react'
import { SuggestionChips } from './SuggestionChips'

type ChatInputProps = {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onStop?: () => void
  isLoading: boolean
  disabled?: boolean
  placeholder?: string
  onFilesChange?: (files: FileList | null) => void
  hasAttachments?: boolean
  /** Quick-reply chips above the input (e.g. agent chat empty state) */
  suggestionChips?: string[]
  suggestionChipsVisible?: boolean
  onSuggestionSelect?: (text: string) => void
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  onStop,
  isLoading,
  disabled,
  placeholder,
  onFilesChange,
  hasAttachments,
  suggestionChips,
  suggestionChipsVisible = false,
  onSuggestionSelect,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [value])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !isLoading) {
        onSubmit()
      }
    }
  }

  const chips =
    suggestionChips &&
    suggestionChips.length > 0 &&
    onSuggestionSelect &&
    suggestionChipsVisible

  return (
    <div className="border-t border-brand-border bg-[#F8FAFC] dark:border-brand-border-dark dark:bg-brand-navy">
      {chips ? (
        <SuggestionChips
          suggestions={suggestionChips}
          visible={suggestionChipsVisible}
          onSelect={onSuggestionSelect}
        />
      ) : null}
    <div className="flex items-end gap-2 px-4 py-3">
      {onFilesChange && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => onFilesChange(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isLoading}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 transition-colors hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-500 dark:hover:text-gray-400 disabled:opacity-50"
            title="Adjuntar archivos"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </>
      )}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? "Escribe tu respuesta..."}
        disabled={disabled || isLoading}
        rows={1}
        className="flex-1 resize-none rounded-xl border border-brand-border bg-white px-4 py-2.5 text-sm text-brand-primary transition-colors placeholder:text-brand-muted focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-[#0EA5A3]/20 disabled:opacity-50 dark:border-brand-border-dark dark:bg-brand-primary dark:text-gray-200 dark:placeholder:text-gray-500 dark:focus:border-brand-teal"
      />
      {hasAttachments && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Adjuntos listos
        </div>
      )}
      {isLoading ? (
        <button
          onClick={onStop}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 transition-colors hover:bg-red-100"
          title="Detener"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        </button>
      ) : (
        <button
          onClick={onSubmit}
          disabled={!value.trim() || disabled}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-teal text-white shadow-sm transition-all hover:bg-[#0C8C8A] disabled:opacity-40"
          title="Enviar"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
    </div>
  )
}
