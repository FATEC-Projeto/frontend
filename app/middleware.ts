import { NextResponse, NextRequest } from "next/server";

const ADMIN_HOME = "/admin/home";
const ALUNO_HOME = "/aluno/home";
const LOGIN_PATH = "/login";

// caminhos públicos
const PUBLIC_PATHS = [
  "/", 
  "/login",
  "/sobre",
  "/como-funciona",
  "/recursos",
  "/impacto",
];


const PUBLIC_PREFIXES = ["/_next", "/favicon.ico", "/images", "/assets"];

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const isPublic = isPublicPath(pathname);

  
  const session = req.cookies.get("access_token")?.value;

  // 3. Verifique os caminhos corretos (admin/aluno)
  const isProtected = pathname.startsWith("/admin") || pathname.startsWith("/aluno");

  if (!session && isProtected) {
    const url = req.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.search = `?redirect=${encodeURIComponent(pathname + (search || ""))}`;
    return NextResponse.redirect(url);
  }

  if (session && pathname === LOGIN_PATH) {
    const url = req.nextUrl.clone();
    // NOTA: Esta lógica ainda é simples. O ideal seria decodificar o token
    // e redirecionar para ADMIN_HOME ou ALUNO_HOME baseado no 'papel'.
    // Por enquanto, enviaremos para ALUNO_HOME para manter o comportamento anterior,
    // mas o Bug #1 (na página de login) já resolve o fluxo principal.
    url.pathname = ALUNO_HOME; 
    return NextResponse.redirect(url);
  }

  // Permite acesso a caminhos públicos
  if (isPublic) return NextResponse.next();

  // Bloqueia qualquer outro caminho não protegido se não houver sessão
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.search = `?redirect=${encodeURIComponent(pathname + (search || ""))}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/admin/:path*",
    "/aluno/:path*",
  ],
};
