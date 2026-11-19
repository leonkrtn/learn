import type { Metadata } from 'next';
import { Instrument_Sans, Schibsted_Grotesk } from 'next/font/google';
import { cookies, headers } from 'next/headers';
import type { CSSProperties, ReactNode } from 'react';
import Logo from '@/components/Logo';
import { PrefsProvider } from '@/components/Prefs';
import { PREFS_COOKIE, SIZES, parsePrefs } from '@/lib/prefs';
import { isMacUA } from '@/lib/shortcuts';
import { supabaseServer } from '@/lib/supabase/server';
import 'katex/dist/katex.min.css';
import './globals.css';

const sans = Instrument_Sans({ subsets: ['latin'], variable: '--font-sans', style: ['normal', 'italic'], display: 'swap' });
const display = Schibsted_Grotesk({ subsets: ['latin'], variable: '--font-display', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'learn', template: '%s · learn' },
  description: 'Exam practice with generated questions, flashcards and worked theory.',
};

/** Display preferences from the cookie; on a new device, from the account (then the cookie is written client-side). */
async function loadPrefs() {
  const store = await cookies();
  const raw = store.get(PREFS_COOKIE)?.value;
  if (raw) return { prefs: parsePrefs(decodeURIComponent(raw)), persist: false };
  if (!store.getAll().some(c => c.name.startsWith('sb-'))) return { prefs: parsePrefs(null), persist: false };
  try {
    const sb = await supabaseServer();
    const { data: u } = await sb.auth.getUser();
    if (!u.user) return { prefs: parsePrefs(null), persist: false };
    const { data } = await sb.from('user_prefs').select('prefs').eq('user_id', u.user.id).maybeSingle();
    return { prefs: parsePrefs(data?.prefs), persist: !!data };
  } catch { return { prefs: parsePrefs(null), persist: false }; }
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const { prefs, persist } = await loadPrefs();
  const mac = isMacUA((await headers()).get('user-agent') || '');
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`} data-accent={prefs.accent} style={{ '--fs': String(SIZES[prefs.size]) } as CSSProperties}>
      <body>
        <div className="gate">
          <div>
            <Logo size={36} />
            <p>This site is built for laptop and desktop screens. Open it on a window at least 1024 pixels wide.</p>
          </div>
        </div>
        <div className="app"><PrefsProvider initial={prefs} persist={persist} mac={mac}>{children}</PrefsProvider></div>
      </body>
    </html>
  );
}
