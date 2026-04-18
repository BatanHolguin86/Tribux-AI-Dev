'use client'

import { useRef, useEffect } from 'react'

type KnowledgeSearchProps = {
  value: string
  onChange: (q: string) => void
}

export function KnowledgeSearch({ value, onChange }: KnowledgeSearchProps) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  function handleChange(v: string) {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => onChange(v), 300)
  }

  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        defaultValue={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Buscar en la base de conocimiento..."
        className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-brand-teal focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0EA5A3] dark:border-gray-700 dark:bg-gray-800 dark:placeholder:text-gray-500 dark:focus:bg-gray-900"
      />
    </div>
  )
}
