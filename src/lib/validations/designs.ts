import { z } from 'zod'

export const generateDesignSchema = z.object({
  type: z.enum(['wireframe', 'mockup_lowfi', 'mockup_highfi']),
  screens: z.array(z.string().min(1)).min(1, 'Selecciona al menos una pantalla'),
  refinement: z.string().max(500).optional(),
})

export const refineDesignSchema = z.object({
  instruction: z
    .string()
    .min(1, 'La instruccion de refinamiento es requerida')
    .max(500),
})

export const importFigmaSchema = z.object({
  figma_url: z.string().url(),
  selected_frames: z
    .array(z.object({ node_id: z.string(), name: z.string() }))
    .min(1, 'Selecciona al menos un frame'),
  type: z.enum(['wireframe', 'mockup_lowfi', 'mockup_highfi']),
})

export const importV0Schema = z.object({
  content: z.string().min(10, 'Pega el codigo generado en V0'),
  screen_name: z.string().min(1),
  type: z.enum(['wireframe', 'mockup_lowfi', 'mockup_highfi']),
  source_url: z.string().url().optional(),
})

export const importLovableSchema = z.object({
  lovable_url: z.string().url(),
  screen_name: z.string().min(1),
  type: z.enum(['wireframe', 'mockup_lowfi', 'mockup_highfi']).default('mockup_highfi'),
})

export const saveIntegrationSchema = z.object({
  figma_token: z.string().min(1).optional(),
  v0_api_key: z.string().min(1).optional(),
})

export type GenerateDesignInput = z.infer<typeof generateDesignSchema>
export type RefineDesignInput = z.infer<typeof refineDesignSchema>
export type ImportFigmaInput = z.infer<typeof importFigmaSchema>
export type ImportV0Input = z.infer<typeof importV0Schema>
export type ImportLovableInput = z.infer<typeof importLovableSchema>
