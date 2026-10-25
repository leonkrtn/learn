'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';

export default function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const sb = supabaseBrowser();
    if (mode === 'login') {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) { setMsg({ ok: false, text: error.message }); setBusy(false); return; }
      router.replace('/'); router.refresh();
      return;
    }
    const { data, error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: location.origin + '/auth/confirm' } });
    setBusy(false);
    if (error) { setMsg({ ok: false, text: error.message }); return; }
    if (data.session) { router.replace('/'); router.refresh(); return; }
    setMsg({ ok: true, text: 'Check your inbox: we sent a confirmation link to ' + email + '.' });
  }

  return (
    <form onSubmit={submit}>
      <h1>{mode === 'login' ? 'Sign in' : 'Create account'}</h1>
      <label className="field"><span>Email</span>
        <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
      </label>
      <label className="field"><span>Password{mode === 'signup' ? ' (at least 8 characters)' : ''}</span>
        <input type="password" required minLength={mode === 'signup' ? 8 : undefined} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} />
      </label>
      <button className="btn" type="submit" disabled={busy}>{busy ? 'Please wait' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
      <div className="formmsg">{msg && <div className={msg.ok ? 'okmsg' : 'err'}>{msg.text}</div>}</div>
      <div className="alt">
        {mode === 'login'
          ? <>No account yet? <Link href="/signup">Create one</Link></>
          : <>Already registered? <Link href="/login">Sign in</Link></>}
      </div>
    </form>
  );
}
