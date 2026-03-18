import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Public routes that don't require auth
  const publicPaths = ['/login', '/register', '/forgot-password', '/auth/callback', '/auth/reset-password', '/admin/login']
  const isPublicPath = publicPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  if (!user && !isPublicPath && request.nextUrl.pathname !== '/') {
    const url = request.nextUrl.clone()
    // Admin routes redirect to admin login
    if (request.nextUrl.pathname.startsWith('/admin')) {
      url.pathname = '/admin/login'
    } else {
      url.pathname = '/login'
      url.searchParams.set('redirect', request.nextUrl.pathname)
    }
    return createRedirectWithCookies(url, supabaseResponse)
  }

  if (user && isPublicPath) {
    const url = request.nextUrl.clone()
    // Don't redirect admin login to product dashboard
    if (request.nextUrl.pathname === '/admin/login') {
      url.pathname = '/admin/finance'
    } else {
      url.pathname = '/dashboard'
    }
    return createRedirectWithCookies(url, supabaseResponse)
  }

  return supabaseResponse
}

/**
 * Creates a redirect response that preserves the Supabase session cookies.
 * Without this, redirects lose the refreshed auth cookies causing redirect loops.
 */
function createRedirectWithCookies(url: URL, sourceResponse: NextResponse): NextResponse {
  const redirect = NextResponse.redirect(url)
  sourceResponse.cookies.getAll().forEach((cookie) => {
    redirect.cookies.set(cookie.name, cookie.value)
  })
  return redirect
}
