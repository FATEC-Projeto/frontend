// app/middleware.ts
import { NextResponse, NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

type Papel = 'USUARIO' | 'BACKOFFICE' | 'TECNICO' | 'ADMINISTRADOR'
const ADMIN_ROLES: Papel[] = ['BACKOFFICE', 'TECNICO', 'ADMINISTRADOR']
const ALUNO_ROLE: Papel = 'USUARIO'
const ADMIN_HOME = '/admin/home'
const ALUNO_HOME = '/aluno/home'
const LOGIN_PATH = '/login'

// Páginas realmente públicas (deixe /login de fora para podermos tratá-la antes)
const PUBLIC_PATHS = ['/', '/sobre', '/como-funciona', '/recursos', '/impacto']
const PUBLIC_PREFIXES = ['/_next', '/favicon.svg', '/images', '/assets']

function isAssetPath(pathname: string) {
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
}
function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.includes(pathname)
}

async function getJwtPayload(token: string) {
  try {
    const secretStr = process.env.JWT_ACCESS_SECRET
    if (!secretStr || secretStr.length === 0) {
      console.error('Middleware Error: JWT_ACCESS_SECRET não definida no .env.local.')
      return null
    }
    const secret = new TextEncoder().encode(secretStr)
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

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl
  console.log(`\n--- [MIDDLEWARE] Rota: ${pathname}`)

  // 0) Deixa assets passarem sempre
  if (isAssetPath(pathname)) {
    return NextResponse.next()
  }

  const sessionToken = req.cookies.get('access_token')?.value
  const redirectParam = `?redirect=${encodeURIComponent(pathname + search)}`

  // 1) Tratar /login ANTES de checar público
  if (pathname === LOGIN_PATH) {
    // Se já está logado, manda para home adequada
    if (sessionToken) {
      const payload = await getJwtPayload(sessionToken)
      if (payload) {
        const home = ADMIN_ROLES.includes(payload.role) ? ADMIN_HOME : ALUNO_HOME
        return NextResponse.redirect(new URL(home, req.url))
      } else {
        // token inválido → limpa cookie e deixa entrar no login
        const res = NextResponse.next()
        res.cookies.delete('access_token')
        return res
      }
    }
    // não logado → pode ver /login
    return NextResponse.next()
  }

  // 2) Páginas públicas (excluindo /login, já tratado)
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // 3) Rota privada → exige token
  if (!sessionToken) {
    const url = req.nextUrl.clone()
    url.pathname = LOGIN_PATH
    url.search = redirectParam
    return NextResponse.redirect(url)
  }

  const payload = await getJwtPayload(sessionToken)
  if (!payload) {
    const url = req.nextUrl.clone()
    url.pathname = LOGIN_PATH
    url.search = redirectParam
    const res = NextResponse.redirect(url)
    res.cookies.delete('access_token')
    return res
  }

  const userRole = payload.role
  const isAdminRoute = pathname.startsWith('/admin')
  const isAlunoRoute = pathname.startsWith('/aluno')

  if (isAdminRoute && !ADMIN_ROLES.includes(userRole)) {
    return NextResponse.redirect(new URL(ALUNO_HOME, req.url))
  }
  if (isAlunoRoute && userRole !== ALUNO_ROLE) {
    return NextResponse.redirect(new URL(ADMIN_HOME, req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api).*)', // roda em tudo exceto /api (ajuste se quiser proteger /api também)
  ],
}
