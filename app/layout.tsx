import type { Metadata } from 'next';
import { IBM_Plex_Sans, Source_Serif_4 } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';

const serif = Source_Serif_4({ subsets: ['latin'], variable: '--font-serif', display: 'swap', axes: ['opsz'] });
const sans = IBM_Plex_Sans({ subsets: ['latin'], variable: '--font-sans', weight: ['400', '500', '600'], display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'learn', template: '%s · learn' },
  description: 'Exam practice with generated questions, flashcards and worked theory.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <div className="gate">
          <div>
            <div className="wordmark">learn</div>
            <p>This site is built for laptop and desktop screens. Open it on a window at least 1024 pixels wide.</p>
          </div>
        </div>
        <div className="app">{children}</div>
      </body>
    </html>
  );
}
