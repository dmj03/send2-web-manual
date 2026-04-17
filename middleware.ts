import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that never require authentication
const PUBLIC_ROUTES: RegExp[] = [
  /^\/$/,
  /^\/search(\/.*)?$/,
  /^\/providers(\/.*)?$/,
  /^\/blog(\/.*)?$/,
  /^\/news(\/.*)?$/,
  /^\/about-us$/,
  /^\/contact-us$/,
];

// Routes that redirect authenticated users away (login / register flows)
const AUTH_ROUTES: RegExp[] = [/^\/authentication(\/.*)?$/];

// Routes that require a complete profile setup
const PROFILE_ROUTES: RegExp[] = [/^\/profile(\/.*)?$/];

// The path that the profile-setup redirect lands on
const PROFILE_SETUP_PATH = '/profile/setup';

function isPublic(pathname: string): boolean {
  return PUBLIC_ROUTES.some((re) => re.test(pathname));
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((re) => re.test(pathname));
}

function isProfileRoute(pathname: string): boolean {
  return PROFILE_ROUTES.some((re) => re.test(pathname));
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Skip Next.js internal paths and static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    /\.(.+)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const authToken = request.cookies.get('auth_token')?.value ?? null;
  const isAuthenticated = Boolean(authToken);

  // ── Auth routes (login, register, etc.) ─────────────────────────────────
  // Already-authenticated users are bounced back to home.
  if (isAuthRoute(pathname)) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // ── Public routes ────────────────────────────────────────────────────────
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // ── Profile routes ───────────────────────────────────────────────────────
  // Require auth; then check profile-complete cookie.
  if (isProfileRoute(pathname)) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/authentication/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Redirect to setup if profile is incomplete (except when already there).
    const profileComplete =
      request.cookies.get('profile_complete')?.value === 'true';
    if (!profileComplete && pathname !== PROFILE_SETUP_PATH) {
      return NextResponse.redirect(new URL(PROFILE_SETUP_PATH, request.url));
    }

    return NextResponse.next();
  }

  // ── All other protected routes ───────────────────────────────────────────
  if (!isAuthenticated) {
    const loginUrl = new URL('/authentication/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     *  - _next/static  (static files)
     *  - _next/image   (image optimisation)
     *  - favicon.ico
     *  - public files with an extension (e.g. .png, .svg, .js)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|ttf|eot)).*)',
  ],
};
