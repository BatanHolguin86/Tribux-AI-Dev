import { z } from 'zod'

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre del proyecto es requerido')
    .max(100, 'El nombre no puede superar 100 caracteres'),
  description: z.string().max(500).optional(),
  industry: z.string().max(50).optional(),
  client_name: z.string().max(100).optional(),
})

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  status: z.enum(['active', 'paused', 'archived']).optional(),
  client_name: z.string().max(100).nullable().optional(),
  repo_url: z.string().url().max(200).nullable().optional(),
  supabase_project_ref: z.string().max(50).nullable().optional(),
  supabase_access_token: z.string().max(200).nullable().optional(),
  supabase_api_url: z.string().url().max(200).nullable().optional(),
  supabase_anon_key: z.string().max(500).nullable().optional(),
  supabase_db_password: z.string().max(200).nullable().optional(),
  vercel_project_id: z.string().max(100).nullable().optional(),
  vercel_project_url: z.string().url().max(300).nullable().optional(),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
