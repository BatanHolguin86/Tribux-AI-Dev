'use client'

import { useRef, useEffect } from 'react'

type ChatInputProps = {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onStop?: () => void
  isLoading: boolean
  disabled?: boolean
}

export function ChatInput({ value, onChange, onSubmit, onStop, isLoading, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
    <div className="flex items-end gap-2 border-t border-gray-100 px-4 py-3">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Escribe tu respuesta..."
        disabled={disabled || isLoading}
        rows={1}
        className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#0EA5A3] focus:outline-none focus:ring-1 focus:ring-[#0EA5A3] disabled:opacity-50"
      />
      {isLoading ? (
        <button
          onClick={onStop}
          className="shrink-0 rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-200"
        >
          Detener
        </button>
      ) : (
        <button
          onClick={onSubmit}
          disabled={!value.trim() || disabled}
          className="shrink-0 rounded-lg bg-[#0F2B46] px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#0A1F33] disabled:opacity-50"
        >
          Enviar
        </button>
      )}
    </div>
  )
}
