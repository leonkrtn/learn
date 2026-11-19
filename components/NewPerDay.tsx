'use client';

import { useRouter } from 'next/navigation';
import { useSubject } from './SubjectContext';

/** How many new cards each deck introduces per day; saved to the account. */
export default function NewPerDay() {
  const { settings, saveSettings } = useSubject();
  const router = useRouter();
  return (
    <label className="opt">New cards per deck and day
      <select value={settings.newPerDay} onChange={async e => { await saveSettings({ ...settings, newPerDay: +e.target.value }); router.refresh(); }}>
        {[5, 10, 20, 30, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
      </select>
    </label>
  );
}
