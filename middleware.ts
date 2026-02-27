import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get('adp_auth');
  
  // If already authenticated, continue
  if (authCookie?.value === 'authenticated') {
    return NextResponse.next();
  }
  
  // If posting password, check it
  if (request.method === 'POST' && request.nextUrl.pathname === '/api/login') {
    return NextResponse.next();
  }
  
  // Check for login page
  if (request.nextUrl.pathname === '/login') {
    return NextResponse.next();
  }
  
  // Redirect to login
  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/login).*)'],
};
