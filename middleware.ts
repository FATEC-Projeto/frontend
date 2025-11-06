// app/middleware.ts
import { NextResponse, NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

type Papel = 'USUARIO' | 'BACKOFFICE' | 'TECNICO' | 'ADMINISTRADOR'
const ADMIN_ROLES: Papel[] = ['BACKOFFICE', 'TECNICO', 'ADMINISTRADOR']
const ALUNO_ROLE: Papel = 'USUARIO'
const ADMIN_HOME = '/admin/home'
const ALUNO_HOME = '/aluno/home'
const LOGIN_PATH = '/login'
const PUBLIC_PATHS = ['/', '/login', '/sobre', '/como-funciona', '/recursos', '/impacto']
const PUBLIC_PREFIXES = ['/_next', '/favicon.ico', '/images', '/assets']

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
}

async function getJwtPayload(token: string) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET)
    if (!secret || process.env.JWT_ACCESS_SECRET?.length === 0) {
      console.error('Middleware Error: JWT_ACCESS_SECRET não definida no .env.local.')
      return null
    }
    const { payload } = await jwtVerify(token, secret, {
      issuer: process.env.JWT_ISSUER || 'helpdesk',
      audience: process.env.JWT_AUDIENCE || 'helpdesk-app',
    })
    return payload as { sub: string; email: string; role: Papel }
  } catch (err) {
    console.warn('Middleware: Falha ao verificar JWT.', (err as Error).message)
    return null
  }
}

// --- O MIDDLEWARE ---
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  console.log(`\n--- [V4 - MIDDLEWARE A CORRER] ---`)
  console.log(`[Middleware DEBUG] Rota: ${pathname}`)

  if (isPublicPath(pathname)) {
    console.log('[Middleware DEBUG] Rota pública. Acesso permitido.')
    return NextResponse.next()
  }

  const sessionToken = req.cookies.get('access_token')?.value
  if (!sessionToken) {
    console.log('[Middleware DEBUG] Token não encontrado. Redirecionando para login.')
    const url = req.nextUrl.clone()
    url.pathname = LOGIN_PATH
    url.search = `?redirect=${encodeURIComponent(pathname + req.nextUrl.search)}`
    return NextResponse.redirect(url)
  }

  const payload = await getJwtPayload(sessionToken)

  if (!payload) {
    console.log('[Middleware DEBUG] Token inválido. Redirecionando para login.')
    const url = req.nextUrl.clone()
    url.pathname = LOGIN_PATH
    url.search = `?redirect=${encodeURIComponent(pathname + req.nextUrl.search)}`
    const res = NextResponse.redirect(url)
    res.cookies.delete('access_token')
    return res
  }

  const userRole = payload.role
  const isAdminRoute = pathname.startsWith('/admin')
  const isAlunoRoute = pathname.startsWith('/aluno')
  console.log(`[Middleware DEBUG] Papel do Utilizador: ${userRole}`)

  if (pathname === LOGIN_PATH) {
    const home = ADMIN_ROLES.includes(userRole) ? ADMIN_HOME : ALUNO_HOME
    console.log(`[Middleware DEBUG] Utilizador logado a tentar aceder ao /login. Redirecionando para ${home}`)
    return NextResponse.redirect(new URL(home, req.url))
  }

  if (isAdminRoute && !ADMIN_ROLES.includes(userRole)) {
    console.log(`[Middleware DEBUG] 🚨 ACESSO NEGADO: Papel '${userRole}' não pode aceder a '${pathname}'. Redirecionando para ${ALUNO_HOME}`)
    return NextResponse.redirect(new URL(ALUNO_HOME, req.url))
  }

  if (isAlunoRoute && userRole !== ALUNO_ROLE) {
    console.log(`[Middleware DEBUG] 🚨 ACESSO NEGADO: Papel '${userRole}' não pode aceder a '${pathname}'. Redirecionando para ${ADMIN_HOME}`)
    return NextResponse.redirect(new URL(ADMIN_HOME, req.url))
  }

  console.log(`[Middleware DEBUG] Acesso PERMITIDO para papel '${userRole}' em '${pathname}'.`)
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/admin/:path*',
    '/aluno/:path*',
    '/sobre',
    '/como-funciona',
    '/recursos',
    '/impacto',
  ],
}