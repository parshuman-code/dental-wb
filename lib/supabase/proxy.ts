import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { sanitizeRedirectPath } from '@/lib/validation';

export { sanitizeRedirectPath };

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // If Supabase env vars are not yet configured, allow navigation with a warning
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: Do NOT use supabase.auth.getSession() in server code.
  // getSession() does not guarantee the JWT is verified against the auth server.
  // supabase.auth.getUser() sends a request to the Supabase Auth server to revalidate the user.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Protected route prefixes
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/settings');

  // Auth route prefixes
  const isAuthRoute =
    pathname === '/auth/login' ||
    pathname === '/auth/register' ||
    pathname === '/auth/forgot-password';

  // 1. Unauthenticated users trying to access protected routes -> redirect to login
  if (!user && isProtectedRoute) {
    const redirectUrl = new URL('/auth/login', request.url);
    redirectUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 2. Authenticated users trying to access login/register -> redirect to dashboard or sanitized next target
  if (user && isAuthRoute) {
    const rawNext = request.nextUrl.searchParams.get('next');
    const safeNext = sanitizeRedirectPath(rawNext, '/dashboard');
    const redirectUrl = new URL(safeNext, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
