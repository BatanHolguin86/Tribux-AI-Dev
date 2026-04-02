import { z } from 'zod'

export const savePlatformConfigSchema = z.object({
  provider: z.enum(['github', 'supabase', 'vercel']),
  token: z.string().min(1).max(1000),
  metadata: z.record(z.string(), z.string().max(200)).optional(),
})

export const testPlatformConfigSchema = z.object({
  provider: z.enum(['github', 'supabase', 'vercel']),
  token: z.string().min(1).max(1000),
})

export type SavePlatformConfigInput = z.infer<typeof savePlatformConfigSchema>
export type TestPlatformConfigInput = z.infer<typeof testPlatformConfigSchema>
