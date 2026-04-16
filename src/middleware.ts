import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES: RegExp[] = [
  /^\/$/,
  /^\/search(\/.*)?$/,
  /^\/providers(\/.*)?$/,
  /^\/blog(\/.*)?$/,
  /^\/news(\/.*)?$/,
  /^\/about-us$/,
  /^\/contact-us$/,
];

const AUTH_ROUTES: RegExp[] = [/^\/authentication(\/.*)?$/];
const PROFILE_ROUTES: RegExp[] = [/^\/profile(\/.*)?$/];
const PROFILE_SETUP_PATH = '/profile/setup';

function isPublic(pathname: string)      { return PUBLIC_ROUTES.some(re => re.test(pathname)); }
function isAuthRoute(pathname: string)   { return AUTH_ROUTES.some(re => re.test(pathname)); }
function isProfileRoute(pathname: string){ return PROFILE_ROUTES.some(re => re.test(pathname)); }

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    /\.(.+)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const authToken = request.cookies.get('auth_token')?.value ?? null;
  const isAuthenticated = Boolean(authToken);

  if (isAuthRoute(pathname)) {
    if (isAuthenticated) return NextResponse.redirect(new URL('/', request.url));
    return NextResponse.next();
  }

  if (isPublic(pathname)) return NextResponse.next();

  if (isProfileRoute(pathname)) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/authentication/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    const profileComplete = request.cookies.get('profile_complete')?.value === 'true';
    if (!profileComplete && pathname !== PROFILE_SETUP_PATH) {
      return NextResponse.redirect(new URL(PROFILE_SETUP_PATH, request.url));
    }
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    const loginUrl = new URL('/authentication/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|ttf|eot)).*)',
  ],
};
