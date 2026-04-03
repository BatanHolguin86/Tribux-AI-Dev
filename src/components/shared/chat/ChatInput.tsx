'use client'

import { useRef, useEffect } from 'react'

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

  return (
    <div className="flex items-end gap-2 border-t border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 dark:border-[#1E3A55] dark:bg-[#0A1F33]">
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
        className="flex-1 resize-none rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm text-[#0F2B46] transition-colors placeholder:text-[#94A3B8] focus:border-[#0EA5A3] focus:outline-none focus:ring-2 focus:ring-[#0EA5A3]/20 disabled:opacity-50 dark:border-[#1E3A55] dark:bg-[#0F2B46] dark:text-gray-200 dark:placeholder:text-gray-500 dark:focus:border-[#0EA5A3]"
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
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0EA5A3] text-white shadow-sm transition-all hover:bg-[#0C8C8A] disabled:opacity-40"
          title="Enviar"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  )
}
