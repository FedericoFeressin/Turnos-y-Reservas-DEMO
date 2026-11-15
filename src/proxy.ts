import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

const SIGN_IN_PATH = "/ingresar";

/**
 * Chequeo optimista del panel: si no hay cookie de sesión, redirige al ingreso.
 *
 * No valida la sesión contra la base a propósito. Next 16 corre `proxy` antes de
 * cada request y no conviene hacer consultas acá. La validación real ocurre en
 * `/admin` con `auth.api.getSession`.
 */
export function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    const url = new URL(SIGN_IN_PATH, request.url);
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
