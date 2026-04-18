'use client'

import { useState } from 'react'

type AddFeatureFormProps = {
  projectId: string
  onCreated: () => void
  onCancel: () => void
}

export function AddFeatureForm({ projectId, onCreated, onCancel }: AddFeatureFormProps) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError('')

    const res = await fetch(`/api/projects/${projectId}/phases/1/features`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    })

    setLoading(false)

    if (!res.ok) {
      const body = await res.json()
      setError(body.error || 'Error al crear')
      return
    }

    onCreated()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-lg border border-brand-teal/30 bg-brand-surface p-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre del feature"
        autoFocus
        className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-brand-teal focus:outline-none focus:ring-1 focus:ring-[#0EA5A3]"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-1">
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="flex-1 rounded bg-brand-primary px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
        >
          {loading ? '...' : 'Crear'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
