'use client';

import 'katex/dist/katex.min.css';
import { useMemo } from 'react';
import { renderRich } from '@/lib/rich';

/** User-written text with Markdown and LaTeX, rendered safely. */
export default function Rich({ text, className }: { text: string; className?: string }) {
  const html = useMemo(() => renderRich(text), [text]);
  return <div className={'rich' + (className ? ' ' + className : '')} dangerouslySetInnerHTML={{ __html: html }} />;
}
