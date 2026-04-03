'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const integrationsSchema = z.object({
  repo_url: z.string().url('URL invalida').max(200).optional().or(z.literal('')),
  supabase_project_ref: z.string().max(50).optional().or(z.literal('')),
  supabase_access_token: z.string().max(200).optional().or(z.literal('')),
})

type IntegrationsInput = z.infer<typeof integrationsSchema>

type IntegrationsStepProps = {
  defaultValues?: Partial<IntegrationsInput>
  onSubmit: (data: IntegrationsInput) => void
  onBack: () => void
  onSkip: () => void
}

export function IntegrationsStep({ defaultValues, onSubmit, onBack, onSkip }: IntegrationsStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IntegrationsInput>({
    resolver: zodResolver(integrationsSchema),
    defaultValues,
  })

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="text-2xl font-display font-bold text-gray-900">Conecta tus herramientas</h2>
      <p className="mt-2 text-sm text-gray-600">
        Conecta GitHub y Supabase para que los agentes puedan ver tu codigo y ejecutar migraciones.
        Todo es opcional — puedes configurarlo despues.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
        {/* GitHub */}
        <div className="rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg className="h-5 w-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <h3 className="text-sm font-semibold text-gray-900">GitHub</h3>
          </div>
          <div>
            <label htmlFor="repo_url" className="block text-sm font-medium text-gray-700">
              URL del repositorio
              <span className="ml-1 text-gray-400">(opcional)</span>
            </label>
            <input
              id="repo_url"
              type="url"
              {...register('repo_url')}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#0EA5A3] focus:outline-none focus:ring-1 focus:ring-[#0EA5A3]"
              placeholder="https://github.com/usuario/mi-proyecto"
            />
            {errors.repo_url && (
              <p className="mt-1 text-sm text-red-600">{errors.repo_url.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-400">
              Los agentes podran ver la estructura del repo y commits recientes.
            </p>
          </div>
        </div>

        {/* Supabase */}
        <div className="rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg className="h-5 w-5 text-emerald-600" viewBox="0 0 109 113" fill="none">
              <path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fill="url(#a)" />
              <path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fill="url(#b)" fillOpacity="0.2" />
              <path d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.041L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z" fill="#3ECF8E" />
              <defs>
                <linearGradient id="a" x1="53.9738" y1="54.974" x2="94.1635" y2="71.8295" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#249361" /><stop offset="1" stopColor="#3ECF8E" />
                </linearGradient>
                <linearGradient id="b" x1="36.1558" y1="30.578" x2="54.4844" y2="65.0806" gradientUnits="userSpaceOnUse">
                  <stop /><stop offset="1" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
            <h3 className="text-sm font-semibold text-gray-900">Supabase</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label htmlFor="supabase_ref" className="block text-sm font-medium text-gray-700">
                Project Ref
                <span className="ml-1 text-gray-400">(opcional)</span>
              </label>
              <input
                id="supabase_ref"
                type="text"
                {...register('supabase_project_ref')}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#0EA5A3] focus:outline-none focus:ring-1 focus:ring-[#0EA5A3]"
                placeholder="abcdefghijklmnop"
              />
              <p className="mt-1 text-xs text-gray-400">
                Encuentralo en tu URL de Supabase: supabase.com/dashboard/project/<strong>TU_REF</strong>
              </p>
            </div>

            <div>
              <label htmlFor="supabase_token" className="block text-sm font-medium text-gray-700">
                Access Token
                <span className="ml-1 text-gray-400">(opcional)</span>
              </label>
              <input
                id="supabase_token"
                type="password"
                {...register('supabase_access_token')}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#0EA5A3] focus:outline-none focus:ring-1 focus:ring-[#0EA5A3]"
                placeholder="sbp_xxxxxxxxxxxxxxxx"
              />
              <p className="mt-1 text-xs text-gray-400">
                Genera uno en supabase.com/dashboard/account/tokens. Permite ejecutar SQL desde la app.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Atras
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50"
          >
            Saltar
          </button>
          <button
            type="submit"
            className="flex-1 rounded-lg bg-[#0F2B46] px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#0A1F33]"
          >
            Continuar
          </button>
        </div>
      </form>
    </div>
  )
}
