'use client'

import { useState, useEffect } from 'react'
import { useFocusTrap } from '@/hooks/use-focus-trap'

type SaveArtifactModalProps = {
  projectId: string
  content: string
  onClose: () => void
  onSaved: () => void
}

const PHASE_OPTIONS = [
  { value: '', label: 'Sin fase especifica' },
  { value: '0', label: 'Phase 00 — Discovery' },
  { value: '1', label: 'Phase 01 — Requirements' },
  { value: '2', label: 'Phase 02 — Architecture' },
  { value: '3', label: 'Phase 03 — Environment' },
  { value: '4', label: 'Phase 04 — Development' },
  { value: '5', label: 'Phase 05 — Testing' },
  { value: '6', label: 'Phase 06 — Launch' },
  { value: '7', label: 'Phase 07 — Iteration' },
]

export function SaveArtifactModal({
  projectId,
  content,
  onClose,
  onSaved,
}: SaveArtifactModalProps) {
  const [name, setName] = useState('')
  const [phaseNumber, setPhaseNumber] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const trapRef = useFocusTrap<HTMLDivElement>()

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose])

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    setError('')

    const res = await fetch(`/api/projects/${projectId}/artifacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        content,
        phase_number: phaseNumber ? parseInt(phaseNumber) : null,
      }),
    })

    if (!res.ok) {
      const body = await res.json()
      setError(body.error || 'Error al guardar')
      setSaving(false)
      return
    }

    setSaving(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div ref={trapRef} role="dialog" aria-modal="true" className="mx-4 w-full max-w-md rounded-xl bg-white dark:bg-gray-900 p-6 shadow-xl dark:shadow-black/30">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Guardar como Artifact</h3>

        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Arquitectura de pagos"
              autoFocus
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:border-[#0EA5A3] focus:outline-none focus:ring-1 focus:ring-[#0EA5A3]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fase destino</label>
            <select
              value={phaseNumber}
              onChange={(e) => setPhaseNumber(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:border-[#0EA5A3] focus:outline-none focus:ring-1 focus:ring-[#0EA5A3]"
            >
              {PHASE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Preview</label>
            <div className="mt-1 max-h-32 overflow-y-auto rounded-lg bg-gray-50 dark:bg-gray-800 p-3 text-xs text-gray-600 dark:text-gray-400">
              {content.slice(0, 500)}
              {content.length > 500 && '...'}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="rounded-lg bg-[#0F2B46] px-4 py-2 text-sm font-medium text-white shadow-sm dark:shadow-gray-900/20 hover:bg-[#0A1F33] disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar artifact'}
          </button>
        </div>
      </div>
    </div>
  )
}
