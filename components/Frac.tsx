import type { ReactNode } from 'react';

export function Frac({ n, d }: { n: ReactNode; d: ReactNode }) {
  return <span className="frac"><span>{n}</span><span>{d}</span></span>;
}

export function Big({ children }: { children: ReactNode }) {
  return <span className="big">{children}</span>;
}
