import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const next = requestUrl.searchParams.get('next');
      const destination = next ? new URL(next, requestUrl.origin) : new URL('/', requestUrl.origin);
      if (destination.origin === requestUrl.origin) {
        return NextResponse.redirect(destination);
      }
      return NextResponse.redirect(new URL('/', requestUrl.origin));
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth_callback_failed', requestUrl.origin));
}
