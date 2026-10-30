import type { Metadata } from 'next';
import { Bricolage_Grotesque, Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import Logo from '@/components/Logo';
import './globals.css';

const sans = Inter({ subsets: ['latin'], variable: '--font-sans', style: ['normal', 'italic'], display: 'swap' });
const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-display', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'learn', template: '%s · learn' },
  description: 'Exam practice with generated questions, flashcards and worked theory.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body>
        <div className="gate">
          <div>
            <Logo size={36} />
            <p>This site is built for laptop and desktop screens. Open it on a window at least 1024 pixels wide.</p>
          </div>
        </div>
        <div className="app">{children}</div>
      </body>
    </html>
  );
}
