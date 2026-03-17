import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If not authenticated, render children directly (login page handles its own layout)
  if (!user) {
    return <>{children}</>
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  const isAdmin =
    profile?.role === 'financial_admin' || profile?.role === 'super_admin'

  // If not admin, render children (login page will show error)
  if (!isAdmin) {
    return <>{children}</>
  }

  const initials = (profile.full_name || user.email?.split('@')[0] || 'A')
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="min-h-screen bg-[#0a0b0f]">
      <header className="sticky top-0 z-40 border-b border-gray-800/60 bg-[#0a0b0f]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[56px] max-w-7xl items-center justify-between px-6">
          <Link
            href="/admin/finance"
            className="flex items-center gap-3"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-bold text-white">AI Squad</span>
              <span className="text-gray-600">|</span>
              <span className="text-[13px] font-medium text-gray-400">Backoffice</span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-800 text-[10px] font-bold text-gray-300 ring-1 ring-gray-700">
                {initials}
              </div>
              <span className="hidden sm:block text-[12px] text-gray-500">
                {user.email}
              </span>
            </div>
            <form action="/api/auth/admin-signout" method="POST">
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
              >
                Salir
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  )
}
