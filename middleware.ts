import { NextResponse, NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

type Papel = 'USUARIO' | 'BACKOFFICE' | 'TECNICO' | 'ADMINISTRADOR'
const ADMIN_ROLES: Papel[] = ['BACKOFFICE', 'TECNICO', 'ADMINISTRADOR']
const ALUNO_ROLE: Papel = 'USUARIO'
const ADMIN_HOME = '/admin/home'
const ALUNO_HOME = '/aluno/home'
const LOGIN_PATH = '/login'

const AUTH_PAGES = ['/login', '/primeiro-acesso', '/esqueci-senha', '/reset-senha']
const protectedPrefixes = ['/admin', '/aluno']

async function getJwtPayload(token: string) {
  try {
    if (!process.env.JWT_ACCESS_SECRET) return null
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET)
    const { payload } = await jwtVerify(token, secret, {
      issuer: process.env.JWT_ISSUER || 'helpdesk',
      audience: process.env.JWT_AUDIENCE || 'helpdesk-app',
    })
    return payload as { sub: string; email: string; role: Papel }
  } catch {
    return null
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const sessionToken = req.cookies.get('accessToken')?.value

  const isAuthRoute = AUTH_PAGES.includes(pathname)
  const isProtectedRoute = protectedPrefixes.some(prefix => pathname.startsWith(prefix))

  if (!sessionToken && isProtectedRoute) {
    const url = req.nextUrl.clone()
    url.pathname = LOGIN_PATH
    url.search = `?redirect=${encodeURIComponent(pathname)}`
    return NextResponse.redirect(url)
  }

  if (sessionToken) {
    const payload = await getJwtPayload(sessionToken)

    if (!payload) {
      const url = req.nextUrl.clone()
      url.pathname = LOGIN_PATH
      if (isProtectedRoute) url.search = `?redirect=${encodeURIComponent(pathname)}`
      const res = NextResponse.redirect(url)
      res.cookies.delete('accessToken')
      res.cookies.delete('refreshToken')
      return res
    }

    const role = payload.role

    if (isAuthRoute) {
      const home = ADMIN_ROLES.includes(role) ? ADMIN_HOME : ALUNO_HOME
      return NextResponse.redirect(new URL(home, req.nextUrl.origin))
    }

    if (pathname.startsWith('/admin') && !ADMIN_ROLES.includes(role)) {
      return NextResponse.redirect(new URL(ALUNO_HOME, req.nextUrl.origin))
    }

    if (pathname.startsWith('/aluno') && role !== ALUNO_ROLE) {
      return NextResponse.redirect(new URL(ADMIN_HOME, req.nextUrl.origin))
    }

    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|images|assets|favicon.svg).*)'],
}
