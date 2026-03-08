import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z
    .string()
    .min(8, 'La contrasena debe tener al menos 8 caracteres')
    .regex(/\d/, 'La contrasena debe incluir al menos 1 numero'),
  full_name: z.string().min(1, 'El nombre es requerido').max(100),
})

export const loginSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(1, 'La contrasena es requerida'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email invalido'),
})

export const onboardingCompleteSchema = z.object({
  persona: z.enum(['founder', 'pm', 'consultor', 'emprendedor']),
  project: z.object({
    name: z.string().min(1, 'El nombre del proyecto es requerido').max(100),
    description: z.string().max(500).optional(),
    industry: z.string().max(50).optional(),
  }),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type OnboardingCompleteInput = z.infer<typeof onboardingCompleteSchema>
