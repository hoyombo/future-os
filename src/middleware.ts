import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const res = NextResponse.next();

    res.headers.set('X-Frame-Options', 'DENY');
    res.headers.set('X-Content-Type-Options', 'nosniff');
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    return res;
  },
  {
    callbacks: {
      authorized({ token, req }) {
        const path = req.nextUrl.pathname;

        if (path.startsWith('/api/auth') || path === '/login') {
          return true;
        }

        if (path.startsWith('/api/')) {
          return !!token;
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/api/:path*'],
};
