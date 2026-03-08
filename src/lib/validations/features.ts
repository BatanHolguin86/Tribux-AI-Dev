import { z } from 'zod'

export const createFeatureSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre del feature es requerido')
    .max(100, 'El nombre no puede superar 100 caracteres'),
  description: z.string().max(500).optional(),
})

export const updateFeatureSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  display_order: z.number().int().min(0).optional(),
})

export type CreateFeatureInput = z.infer<typeof createFeatureSchema>
export type UpdateFeatureInput = z.infer<typeof updateFeatureSchema>
