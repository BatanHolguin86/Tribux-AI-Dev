'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { forgotPasswordSchema } from '@/lib/validations/auth'
import { z } from 'zod'

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  async function onSubmit(data: ForgotPasswordInput) {
    setError(null)

    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (res.status === 429) {
      const body = await res.json()
      setError(`Demasiados intentos. Intenta de nuevo en ${Math.ceil(body.retryAfter / 60)} minutos.`)
      return
    }

    if (!res.ok) {
      setError('Error al enviar el email. Intenta de nuevo.')
      return
    }

    setSuccess(true)
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#E8F4F8] dark:bg-[#0F2B46]/20">
          <svg className="h-6 w-6 text-[#0F2B46] dark:text-[#0EA5A3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Email enviado</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Si la cuenta existe, recibiras un link para restablecer tu contrasena.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm text-[#0F2B46] dark:text-[#0EA5A3] hover:text-[#0F2B46] dark:hover:text-[#0EA5A3]"
        >
          Volver a inicio de sesion
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Recuperar contrasena</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Ingresa tu email y te enviaremos un link para restablecerla
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-[#0EA5A3] focus:outline-none focus:ring-1 focus:ring-[#0EA5A3]"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">{error}</div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-[#0F2B46] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#0A1F33] disabled:opacity-50"
        >
          {isSubmitting ? 'Enviando...' : 'Enviar link de recuperacion'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
        <Link href="/login" className="text-[#0F2B46] dark:text-[#0EA5A3] hover:text-[#0F2B46] dark:hover:text-[#0EA5A3]">
          Volver a inicio de sesion
        </Link>
      </p>
    </>
  )
}
