/** The learn mark: a lowercase l that turns into a baseline, with a dot for progress. */
export function Mark({ size = 28, inverse = false }: { size?: number; inverse?: boolean }) {
  const bg = inverse ? '#ffffff' : 'var(--accent)';
  const fg = inverse ? 'var(--accent)' : '#ffffff';
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="mark">
      <rect width="32" height="32" rx="9" fill={bg} />
      <path d="M11 7.5v13a4 4 0 0 0 4 4h7" fill="none" stroke={fg} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="21.5" cy="11" r="2.6" fill={fg} />
    </svg>
  );
}

export default function Logo({ size = 28, inverse = false }: { size?: number; inverse?: boolean }) {
  return (
    <span className={'logo' + (inverse ? ' inverse' : '')}>
      <Mark size={size} inverse={inverse} />
      <span className="logotype">learn</span>
    </span>
  );
}
