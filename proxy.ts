import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

// Next.js 16: "middleware" foi renomeado para "proxy"
export const proxy = auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  const isAuthRoute = nextUrl.pathname.startsWith('/entrar')
  const isApiAuth = nextUrl.pathname.startsWith('/api/auth')

  if (isApiAuth) return NextResponse.next()
  if (isAuthRoute) {
    if (isLoggedIn) return NextResponse.redirect(new URL('/feed', nextUrl))
    return NextResponse.next()
  }
  if (!isLoggedIn) return NextResponse.redirect(new URL('/entrar', nextUrl))

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
}
