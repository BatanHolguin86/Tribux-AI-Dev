'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

type DocumentEditorProps = {
  content: string
  documentId: string
  projectId: string
}

export function DocumentEditor({ content, documentId, projectId }: DocumentEditorProps) {
  const [value, setValue] = useState(content)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const save = useCallback(async (text: string) => {
    setSaveStatus('saving')
    await fetch(`/api/projects/${projectId}/documents/${documentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text }),
    })
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus('idle'), 2000)
  }, [projectId, documentId])

  useEffect(() => {
    setValue(content)
  }, [content])

  function handleChange(newValue: string) {
    setValue(newValue)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => save(newValue), 1000)
  }

  return (
    <div className="flex flex-1 flex-col">
      <textarea
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        className="flex-1 resize-none p-4 font-mono text-sm text-gray-800 focus:outline-none"
        spellCheck={false}
      />
      <div className="border-t border-gray-100 px-4 py-2">
        <span className="text-xs text-gray-400">
          {saveStatus === 'saving' && 'Guardando...'}
          {saveStatus === 'saved' && 'Guardado'}
          {saveStatus === 'idle' && 'Auto-save activo'}
        </span>
      </div>
    </div>
  )
}
