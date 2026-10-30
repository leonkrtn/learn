import type { ReactNode } from 'react';

const P: Record<string, ReactNode> = {
  home: <><path d="M3.5 10.5 12 4l8.5 6.5" /><path d="M5.5 9v10.5h13V9" /><path d="M10 19.5v-5h4v5" /></>,
  practice: <><circle cx="12" cy="12" r="8.5" /><path d="m10 8.5 5.5 3.5-5.5 3.5z" /></>,
  cycle: <><path d="M19.5 12a7.5 7.5 0 0 1-13 5.1" /><path d="M4.5 12a7.5 7.5 0 0 1 13-5.1" /><path d="M17.5 3.5v3.4h-3.4" /><path d="M6.5 20.5v-3.4h3.4" /></>,
  review: <><path d="M4 12a8 8 0 1 0 2.4-5.7" /><path d="M4 4.5v3.8h3.8" /><path d="M12 8v4.2l2.8 1.8" /></>,
  mock: <><rect x="5" y="3.5" width="14" height="17" rx="2.5" /><path d="M9 3.5V5h6V3.5" /><path d="M8.5 11h7M8.5 14.5h7M8.5 18h4" /></>,
  cards: <><rect x="3.5" y="7" width="13" height="13" rx="2.5" /><path d="M7.5 7V5.5A2 2 0 0 1 9.5 3.5h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H16.5" /></>,
  theory: <><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z" /><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z" /></>,
  formula: <><path d="M17 5H7l5.5 7L7 19h10" /></>,
  stats: <><path d="M4 20h16" /><path d="M7 16.5V11M12 16.5V6.5M17 16.5v-3.5" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M18 6l-1.6 1.6M7.6 16.4 6 18M18 18l-1.6-1.6M7.6 7.6 6 6" /></>,
  back: <><path d="M14.5 6 8.5 12l6 6" /></>,
  arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  book: <><path d="M5 4.5h11.5a2 2 0 0 1 2 2v13H7a2 2 0 0 1-2-2z" /><path d="M5 17.5a2 2 0 0 1 2-2h11.5" /></>,
  signout: <><path d="M14 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H14" /><path d="M17 8.5 20.5 12 17 15.5M20.5 12H10" /></>,
};

export type IconName = keyof typeof P;

/** Line icons on a 24 px grid, drawn in the current text colour. */
export default function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {P[name]}
    </svg>
  );
}
