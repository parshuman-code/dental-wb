import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeRedirectPath } from '@/lib/supabase/proxy';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const rawNext = searchParams.get('next');
  const safeNext = sanitizeRedirectPath(rawNext, '/dashboard');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Record login activity if user is now available
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('user_activity').insert({
          user_id: user.id,
          action: 'user.authenticated_via_oauth_or_email_link',
          entity_type: 'auth',
          details: { provider: user.app_metadata?.provider || 'email' },
        });
      }

      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${safeNext}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${safeNext}`);
      } else {
        return NextResponse.redirect(`${origin}${safeNext}`);
      }
    }
  }

  // If code exchange failed or no code provided, redirect to login with error parameter
  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`);
}
