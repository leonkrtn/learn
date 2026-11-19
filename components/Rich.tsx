'use client';

import { useMemo } from 'react';
import { localizeMd } from '@/lib/numfmt';
import { renderRich } from '@/lib/rich';
import { usePrefs } from './Prefs';

/** User-written text with Markdown and LaTeX, rendered safely. `localize` shows generated numbers in the chosen format. */
export default function Rich({ text, className, localize }: { text: string; className?: string; localize?: boolean }) {
  const { prefs } = usePrefs();
  const sep = localize ? prefs.sep : 'point';
  const html = useMemo(() => renderRich(localizeMd(text, sep)), [text, sep]);
  return <div className={'rich' + (className ? ' ' + className : '')} dangerouslySetInnerHTML={{ __html: html }} />;
}
