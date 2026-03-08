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

export type GenerateDesignInput = z.infer<typeof generateDesignSchema>
export type RefineDesignInput = z.infer<typeof refineDesignSchema>
