'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { ProjectWithProgress } from '@/types/project'
import { useFocusTrap } from '@/hooks/use-focus-trap'

const editSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  description: z.string().max(500).optional(),
  repo_url: z.string().url('URL invalida').max(200).optional().or(z.literal('')),
  supabase_project_ref: z.string().max(50).optional().or(z.literal('')),
  supabase_access_token: z.string().max(200).optional().or(z.literal('')),
})

type EditInput = z.infer<typeof editSchema>

type EditProjectModalProps = {
  project: ProjectWithProgress | null
  onClose: () => void
  onUpdated: (project: ProjectWithProgress) => void
}

export function EditProjectModal({ project, onClose, onUpdated }: EditProjectModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<EditInput>({
    resolver: zodResolver(editSchema),
    values: project ? { name: project.name, description: project.description ?? '', repo_url: project.repo_url ?? '', supabase_project_ref: project.supabase_project_ref ?? '', supabase_access_token: '' } : undefined,
  })

  const trapRef = useFocusTrap<HTMLDivElement>(!!project)

  useEffect(() => {
    if (!project) return
    function handleEsc(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [project, onClose])

  if (!project) return null

  async function onSubmit(data: EditInput) {
    const payload: Record<string, unknown> = {
      ...data,
      repo_url: data.repo_url?.trim() || null,
      supabase_project_ref: data.supabase_project_ref?.trim() || null,
    }
    // Only send token if user typed a new one (don't clear existing)
    if (data.supabase_access_token?.trim()) {
      payload.supabase_access_token = data.supabase_access_token.trim()
    }
    const res = await fetch(`/api/projects/${project!.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      setError('root', { message: 'Error al actualizar' })
      return
    }

    onUpdated({ ...project!, ...data })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div ref={trapRef} role="dialog" aria-modal="true" className="relative z-10 w-full max-w-md rounded-xl bg-white dark:bg-gray-900 p-6 shadow-xl dark:shadow-black/30">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Editar proyecto</h2>
          <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400" aria-label="Cerrar">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div>
            <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nombre
            </label>
            <input
              id="edit-name"
              type="text"
              {...register('name')}
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm dark:bg-gray-800 dark:text-gray-100 focus:border-[#0EA5A3] focus:outline-none focus:ring-1 focus:ring-[#0EA5A3]"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="edit-desc" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Descripcion
            </label>
            <textarea
              id="edit-desc"
              rows={3}
              {...register('description')}
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm dark:bg-gray-800 dark:text-gray-100 focus:border-[#0EA5A3] focus:outline-none focus:ring-1 focus:ring-[#0EA5A3]"
            />
          </div>

          <div>
            <label htmlFor="edit-repo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Repositorio GitHub
            </label>
            <input
              id="edit-repo"
              type="url"
              placeholder="https://github.com/usuario/repo"
              {...register('repo_url')}
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm dark:bg-gray-800 dark:text-gray-100 focus:border-[#0EA5A3] focus:outline-none focus:ring-1 focus:ring-[#0EA5A3]"
            />
            {errors.repo_url && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.repo_url.message}</p>}
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Conecta tu repo para que los agentes vean la estructura y commits recientes.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Supabase</h3>
            <div>
              <label htmlFor="edit-sb-ref" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Project Ref
              </label>
              <input
                id="edit-sb-ref"
                type="text"
                placeholder="abcdefghijklmnop"
                {...register('supabase_project_ref')}
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm dark:bg-gray-800 dark:text-gray-100 focus:border-[#0EA5A3] focus:outline-none focus:ring-1 focus:ring-[#0EA5A3]"
              />
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                URL de Supabase: supabase.com/dashboard/project/<strong>TU_REF</strong>
              </p>
            </div>
            <div>
              <label htmlFor="edit-sb-token" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Access Token
              </label>
              <input
                id="edit-sb-token"
                type="password"
                placeholder={project?.has_supabase_token ? '••••••••  (guardado)' : 'sbp_xxxxxxxxxxxxxxxx'}
                {...register('supabase_access_token')}
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm dark:bg-gray-800 dark:text-gray-100 focus:border-[#0EA5A3] focus:outline-none focus:ring-1 focus:ring-[#0EA5A3]"
              />
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Genera uno en supabase.com/dashboard/account/tokens. Permite ejecutar SQL desde la app.
              </p>
            </div>
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
              {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
