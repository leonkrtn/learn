import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { SUPABASE_KEY, SUPABASE_URL } from './config';

export async function supabaseServer() {
  const store = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: list => {
        try { list.forEach(({ name, value, options }) => store.set(name, value, options)); }
        catch { /* called from a Server Component: the proxy refreshes the session instead */ }
      },
    },
  });
}

/** Returns the signed-in user or redirects to /login. Cached per request. */
export const requireUser = cache(async () => {
  const sb = await supabaseServer();
  const { data } = await sb.auth.getUser();
  if (!data.user) redirect('/login');
  return { sb, user: data.user };
});
