import { createClient } from '@/lib/supabase/server'

export type SuperAdminResult =
  | { allowed: true; userId: string }
  | { allowed: false; status: number; body: { error: string; message?: string } }

/**
 * Ensures the current user has role super_admin.
 * Use in API routes for platform-level configuration.
 */
export async function requireSuperAdmin(): Promise<SuperAdminResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      allowed: false,
      status: 401,
      body: { error: 'unauthorized', message: 'No autenticado' },
    }
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin' && profile?.role !== 'financial_admin') {
    return {
      allowed: false,
      status: 403,
      body: { error: 'forbidden', message: 'Acceso reservado al super administrador.' },
    }
  }

  return { allowed: true, userId: user.id }
}
