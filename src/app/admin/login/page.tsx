'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const supabase = createClient()

      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError('Credenciales invalidas.')
        setIsLoading(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Error de autenticacion.')
        setIsLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || (profile.role !== 'financial_admin' && profile.role !== 'super_admin')) {
        await supabase.auth.signOut()
        setError('No tienes acceso al backoffice financiero.')
        setIsLoading(false)
        return
      }

      router.push('/admin/finance')
    } catch {
      setError('Error inesperado. Intenta de nuevo.')
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center bg-[#0A1F33] px-12">
        <div className="max-w-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#0F2B46] to-indigo-600 shadow-lg shadow-[#0EA5A3]/25 mb-8">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            AI Squad
          </h2>
          <p className="mt-2 text-lg text-[#0EA5A3]/30">
            Control financiero
          </p>
          <p className="mt-6 text-sm text-[#0EA5A3]/70 leading-relaxed">
            Panel de administracion para monitorear costos de IA, infraestructura, ingresos y margenes por usuario.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center bg-white dark:bg-gray-950 px-6">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#0F2B46] to-indigo-600 shadow-lg shadow-[#0EA5A3]/25">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Acceso al backoffice
            </h1>
            <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400">
              Ingresa con tu cuenta de administrador
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-[#0EA5A3] focus:outline-none focus:ring-1 focus:ring-[#0EA5A3]"
                placeholder="admin@aisquad.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Contrasena
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-[#0EA5A3] focus:outline-none focus:ring-1 focus:ring-[#0EA5A3]"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-gradient-to-r from-[#0F2B46] to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#0EA5A3]/25 transition-all hover:shadow-xl hover:shadow-[#0EA5A3]/30 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#0EA5A3] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verificando...' : 'Ingresar al backoffice'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 dark:text-gray-500">
            Acceso exclusivo para administradores de AI Squad.
          </p>
        </div>
      </div>
    </div>
  )
}
