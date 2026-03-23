import { z } from 'zod'
import { KB_CATEGORIES } from '@/types/knowledge'

export const createKBEntrySchema = z.object({
  title: z.string().min(1, 'El titulo es requerido').max(200),
  content: z.string().min(1, 'El contenido es requerido'),
  category: z.enum(KB_CATEGORIES),
  summary: z.string().max(300).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
})

export const updateKBEntrySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().optional(),
  category: z.enum(KB_CATEGORIES).optional(),
  summary: z.string().max(300).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  is_pinned: z.boolean().optional(),
})
