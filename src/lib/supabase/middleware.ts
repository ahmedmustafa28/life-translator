import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const isPlaceholder = !supabaseUrl || supabaseUrl.includes('placeholder') || supabaseUrl.includes('dummy')

  // Check if we are running in local mock mode
  if (isPlaceholder) {
    const mockUserCookie = request.cookies.get('sb-mock-user')
    let user = null
    if (mockUserCookie) {
      try {
        user = JSON.parse(decodeURIComponent(mockUserCookie.value))
      } catch {
        // Ignore parsing errors
      }
    }

    const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
    const isDashboardPage = request.nextUrl.pathname.startsWith('/dashboard')
    const isDocumentsPage = request.nextUrl.pathname.startsWith('/documents')

    // Protect authenticated paths
    if (!user && (isDashboardPage || isDocumentsPage)) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      return NextResponse.redirect(url)
    }

    // Redirect authenticated users away from login/signup to dashboard
    if (user && isAuthPage) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  }

  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key'

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired
  const { data: { user } } = await supabase.auth.getUser()

  const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
  const isDashboardPage = request.nextUrl.pathname.startsWith('/dashboard')
  const isDocumentsPage = request.nextUrl.pathname.startsWith('/documents')

  // Protect authenticated paths
  if (!user && (isDashboardPage || isDocumentsPage)) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from login/register to dashboard
  if (user && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
