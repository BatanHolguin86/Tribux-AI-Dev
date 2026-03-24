import { z } from 'zod'

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre del proyecto es requerido')
    .max(100, 'El nombre no puede superar 100 caracteres'),
  description: z.string().max(500).optional(),
  industry: z.string().max(50).optional(),
})

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  status: z.enum(['active', 'paused', 'archived']).optional(),
  repo_url: z.string().url().max(200).nullable().optional(),
  supabase_project_ref: z.string().max(50).nullable().optional(),
  supabase_access_token: z.string().max(200).nullable().optional(),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
