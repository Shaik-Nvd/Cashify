import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static files, api routes, images, icons, and next internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/assets') ||
    pathname === '/favicon.svg' ||
    pathname === '/favicon.ico' ||
    pathname === '/favicon-32x32.png' ||
    pathname.startsWith('/icon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Rewrite all user routes to the domain transfer holding page
  const url = request.nextUrl.clone();
  url.pathname = '/holding';
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ['/:path*'],
};
