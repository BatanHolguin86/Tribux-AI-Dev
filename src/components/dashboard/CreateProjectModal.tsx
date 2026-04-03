'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createProjectSchema, type CreateProjectInput } from '@/lib/validations/projects'
import { useFocusTrap } from '@/hooks/use-focus-trap'

type CreateProjectModalProps = {
  open: boolean
  onClose: () => void
  onCreated: (project: { id: string; name: string }) => void
}

export function CreateProjectModal({ open, onClose, onCreated }: CreateProjectModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
  })

  const trapRef = useFocusTrap<HTMLDivElement>(open)

  useEffect(() => {
    if (!open) return
    function handleEsc(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [open, onClose])

  if (!open) return null

  async function onSubmit(data: CreateProjectInput) {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const body = await res.json()
      if (body.code === 'PLAN_LIMIT_REACHED') {
        setError('root', { message: body.error })
      } else {
        setError('root', { message: 'Error al crear el proyecto' })
      }
      return
    }

    const project = await res.json()
    reset()
    onCreated(project)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div ref={trapRef} role="dialog" aria-modal="true" className="relative z-10 w-full max-w-md rounded-xl bg-white dark:bg-gray-900 p-6 shadow-xl dark:shadow-black/30">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Nuevo proyecto</h2>
          <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400" aria-label="Cerrar">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div>
            <label htmlFor="create-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nombre *
            </label>
            <input
              id="create-name"
              type="text"
              {...register('name')}
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm dark:bg-gray-800 dark:text-gray-100 focus:border-[#0EA5A3] focus:outline-none focus:ring-1 focus:ring-[#0EA5A3]"
              placeholder="Mi plataforma de delivery"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="create-desc" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Descripcion <span className="text-gray-400 dark:text-gray-500">(opcional)</span>
            </label>
            <textarea
              id="create-desc"
              rows={3}
              {...register('description')}
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm dark:bg-gray-800 dark:text-gray-100 focus:border-[#0EA5A3] focus:outline-none focus:ring-1 focus:ring-[#0EA5A3]"
            />
          </div>

          <div>
            <label htmlFor="create-industry" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Industria <span className="text-gray-400 dark:text-gray-500">(opcional)</span>
            </label>
            <input
              id="create-industry"
              type="text"
              {...register('industry')}
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm dark:bg-gray-800 dark:text-gray-100 focus:border-[#0EA5A3] focus:outline-none focus:ring-1 focus:ring-[#0EA5A3]"
              placeholder="Ej: Fintech, Salud, Educacion"
            />
          </div>

          {errors.root && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">{errors.root.message}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-[#0F2B46] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#0A1F33] disabled:opacity-50"
            >
              {isSubmitting ? 'Creando...' : 'Crear proyecto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
