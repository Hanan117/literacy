import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    // TODO: Add auth check with Supabase
    // For now, allow in development
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}