import { createClient } from '@/lib/supabase/server'

export type FinancialAdminResult =
  | { allowed: true; userId: string }
  | { allowed: false; status: number; body: { error: string; message?: string } }

/**
 * Ensures the current user has role financial_admin or super_admin.
 * Use in API routes for the financial backoffice.
 */
export async function requireFinancialAdmin(): Promise<FinancialAdminResult> {
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

  const role = profile?.role as string | undefined
  if (role !== 'financial_admin' && role !== 'super_admin') {
    return {
      allowed: false,
      status: 403,
      body: { error: 'forbidden', message: 'Acceso reservado al administrador financiero.' },
    }
  }

  return { allowed: true, userId: user.id }
}
