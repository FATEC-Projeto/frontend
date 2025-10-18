import { NextResponse, NextRequest } from "next/server";

const DASHBOARD_HOME = "/dashboard/aluno";
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

  
  const session = req.cookies.get("wf.session")?.value;

  
  const isProtected = pathname.startsWith("/dashboard") || pathname.startsWith("/area-administrativa");
  if (!session && isProtected) {
    const url = req.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    
    url.search = `?redirect=${encodeURIComponent(pathname + (search || ""))}`;
    return NextResponse.redirect(url);
  }

  if (session && pathname === LOGIN_PATH) {
    const url = req.nextUrl.clone();
    url.pathname = DASHBOARD_HOME;
    return NextResponse.redirect(url);
  }

  if (isPublic) return NextResponse.next();

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
    "/login",
    "/dashboard/:path*",
    "/area-administrativa/:path*",
  ],
};
