'use client'

import { useState } from 'react'

const PERSONA_LABELS: Record<string, string> = {
  founder: 'Founder',
  pm: 'Product Manager',
  consultor: 'Consultor',
  emprendedor: 'Emprendedor',
}

type ProfileSectionProps = {
  fullName: string
  email: string
  persona: string | null
}

export function ProfileSection({ fullName, email, persona }: ProfileSectionProps) {
  const [name, setName] = useState(fullName)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    if (name === fullName) return
    setSaving(true)
    setSaved(false)

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: name }),
      })
      if (res.ok) setSaved(true)
    } catch {
      // silent
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Perfil</h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Nombre completo
          </label>
          <div className="mt-1 flex gap-2">
            <input
              id="fullName"
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setSaved(false) }}
              className="block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm dark:shadow-gray-900/20 focus:border-[#0EA5A3] focus:outline-none focus:ring-1 focus:ring-[#0EA5A3] dark:bg-gray-800 dark:text-gray-100"
            />
            <button
              onClick={handleSave}
              disabled={saving || name === fullName}
              className="rounded-md bg-[#0F2B46] px-3 py-2 text-sm font-medium text-white hover:bg-[#0A1F33] disabled:opacity-50"
            >
              {saving ? '...' : 'Guardar'}
            </button>
          </div>
          {saved && <p className="mt-1 text-xs text-green-600">Guardado</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
          <p className="mt-1 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
            {email}
          </p>
        </div>

        {persona && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rol</label>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{PERSONA_LABELS[persona] ?? persona}</p>
          </div>
        )}
      </div>
    </section>
  )
}
