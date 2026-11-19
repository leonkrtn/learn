import type { ReactNode } from 'react';

const P: Record<string, ReactNode> = {
  home: <><path d="M3.5 10.5 12 4l8.5 6.5" /><path d="M5.5 9v10.5h13V9" /><path d="M10 19.5v-5h4v5" /></>,
  practice: <><circle cx="12" cy="12" r="8.5" /><path d="m10 8.5 5.5 3.5-5.5 3.5z" /></>,
  cycle: <><path d="M19.5 12a7.5 7.5 0 0 1-13 5.1" /><path d="M4.5 12a7.5 7.5 0 0 1 13-5.1" /><path d="M17.5 3.5v3.4h-3.4" /><path d="M6.5 20.5v-3.4h3.4" /></>,
  ps: <><path d="M10 6.5h10M10 12h10M10 17.5h10" /><path d="m3.5 6.5 1.5 1.5 2.5-3M3.5 12l1.5 1.5 2.5-3M3.5 17.5l1.5 1.5 2.5-3" /></>,
  mock: <><rect x="5" y="3.5" width="14" height="17" rx="2.5" /><path d="M9 3.5V5h6V3.5" /><path d="M8.5 11h7M8.5 14.5h7M8.5 18h4" /></>,
  cards: <><rect x="3.5" y="7" width="13" height="13" rx="2.5" /><path d="M7.5 7V5.5A2 2 0 0 1 9.5 3.5h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H16.5" /></>,
  theory: <><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z" /><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z" /></>,
  formula: <><path d="M17 5H7l5.5 7L7 19h10" /></>,
  user: <><circle cx="12" cy="8.5" r="3.8" /><path d="M4.5 20c.9-3.8 3.9-6 7.5-6s6.6 2.2 7.5 6" /></>,
  settings: <><path d="M10.33 5.3L10.59 3.11A9 9 0 0 1 13.41 3.11L13.67 5.3A6.9 6.9 0 0 1 15.55 6.09L17.29 4.72A9 9 0 0 1 19.28 6.71L17.91 8.45A6.9 6.9 0 0 1 18.7 10.33L20.89 10.59A9 9 0 0 1 20.89 13.41L18.7 13.67A6.9 6.9 0 0 1 17.91 15.55L19.28 17.29A9 9 0 0 1 17.29 19.28L15.55 17.91A6.9 6.9 0 0 1 13.67 18.7L13.41 20.89A9 9 0 0 1 10.59 20.89L10.33 18.7A6.9 6.9 0 0 1 8.45 17.91L6.71 19.28A9 9 0 0 1 4.72 17.29L6.09 15.55A6.9 6.9 0 0 1 5.3 13.67L3.11 13.41A9 9 0 0 1 3.11 10.59L5.3 10.33A6.9 6.9 0 0 1 6.09 8.45L4.72 6.71A9 9 0 0 1 6.71 4.72L8.45 6.09A6.9 6.9 0 0 1 10.33 5.3z" /><circle cx="12" cy="12" r="3" /></>,
  back: <><path d="M14.5 6 8.5 12l6 6" /></>,
  arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  book: <><path d="M5 4.5h11.5a2 2 0 0 1 2 2v13H7a2 2 0 0 1-2-2z" /><path d="M5 17.5a2 2 0 0 1 2-2h11.5" /></>,
  slides: <><rect x="3.5" y="4.5" width="17" height="12" rx="2" /><path d="M12 16.5V20M8.5 20h7" /></>,
  sheet: <><path d="M6.5 3.5h8l4 4v13h-12z" /><path d="M14.5 3.5v4h4" /><path d="M9.5 12h5M9.5 15.5h5" /></>,
  plus: <><path d="M12 5.5v13M5.5 12h13" /></>,
  edit: <><path d="M4.5 19.5h4l10-10-4-4-10 10z" /><path d="M13 7l4 4" /></>,
  trash: <><path d="M4.5 7h15" /><path d="M9.5 7V4.5h5V7" /><path d="M6.5 7l1 12.5h9l1-12.5" /></>,
  up: <><path d="M12 5.5 5.5 13h4v5.5h5V13h4z" /></>,
  reply: <><path d="M10 7.5 5 12l5 4.5" /><path d="M5 12h9a5 5 0 0 1 5 5v1" /></>,
  print: <><path d="M7 9V3.5h10V9" /><rect x="4" y="9" width="16" height="7.5" rx="2" /><path d="M7 14h10v6.5H7z" /></>,
  grip: <><circle cx="9" cy="6.5" r="1" /><circle cx="15" cy="6.5" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="9" cy="17.5" r="1" /><circle cx="15" cy="17.5" r="1" /></>,
  close: <><path d="M6 6l12 12M18 6 6 18" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>,
  prev: <><path d="M14.5 6 8.5 12l6 6" /></>,
  next: <><path d="M9.5 6l6 6-6 6" /></>,
  upload: <><path d="M12 15.5V4.5M7.5 9 12 4.5 16.5 9" /><path d="M4.5 15v4.5h15V15" /></>,
  copy: <><rect x="8.5" y="8.5" width="11" height="11" rx="2" /><path d="M15.5 8.5v-2a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" /></>,
  pin: <><path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.3" /></>,
  flag: <><path d="M6 20.5V4" /><path d="M6 4.5h11.5l-2.5 4 2.5 4H6" /></>,
  star: <><path d="M12 3.8l2.5 5.2 5.7.8-4.1 4 1 5.7L12 16.8l-5.1 2.7 1-5.7-4.1-4 5.7-.8z" /></>,
  expand: <><path d="M4.5 9V4.5H9M15 4.5h4.5V9M19.5 15v4.5H15M9 19.5H4.5V15" /></>,
  notes: <><rect x="3.5" y="4.5" width="17" height="15" rx="2" /><path d="M14 4.5v15M16.5 9h1.5M16.5 12h1.5" /></>,
  signout: <><path d="M14 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H14" /><path d="M17 8.5 20.5 12 17 15.5M20.5 12H10" /></>,
};

export type IconName = keyof typeof P;

/** Line icons on a 24 px grid, drawn in the current text colour. */
export default function Icon({ name, size = 20, filled }: { name: string; size?: number; filled?: boolean }) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {P[name]}
    </svg>
  );
}
