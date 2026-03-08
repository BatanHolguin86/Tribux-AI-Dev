'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const projectStepSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  description: z.string().max(500).optional(),
  industry: z.string().max(50).optional(),
})

type ProjectStepInput = z.infer<typeof projectStepSchema>

type ProjectStepProps = {
  defaultValues?: Partial<ProjectStepInput>
  onSubmit: (data: ProjectStepInput) => void
  onBack: () => void
}

export function ProjectStep({ defaultValues, onSubmit, onBack }: ProjectStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectStepInput>({
    resolver: zodResolver(projectStepSchema),
    defaultValues,
  })

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="text-2xl font-bold text-gray-900">Tu primer proyecto</h2>
      <p className="mt-2 text-sm text-gray-600">
        Dale un nombre a lo que quieres construir. Podras cambiarlo despues.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Nombre del proyecto
          </label>
          <input
            id="name"
            type="text"
            {...register('name')}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            placeholder="Ej: Mi App de Delivery"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Descripcion breve
            <span className="ml-1 text-gray-400">(opcional)</span>
          </label>
          <textarea
            id="description"
            rows={3}
            {...register('description')}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            placeholder="Que problema resuelve? Para quien es?"
          />
        </div>

        <div>
          <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
            Industria
            <span className="ml-1 text-gray-400">(opcional)</span>
          </label>
          <input
            id="industry"
            type="text"
            {...register('industry')}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            placeholder="Ej: Fintech, Salud, Educacion"
          />
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
            type="submit"
            className="flex-1 rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-700"
          >
            Continuar
          </button>
        </div>
      </form>
    </div>
  )
}
