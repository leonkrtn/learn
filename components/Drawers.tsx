'use client';

import { useCallback, useState } from 'react';
import CheatDrawer from './CheatDrawer';
import NotesDrawer from './NotesDrawer';

type Which = 'cheat' | 'notes' | null;

/** The top-bar drawers of a subject (cheatsheet, notes); opening one closes the other, since both slide in from the right. */
export default function Drawers() {
  const [which, setWhich] = useState<Which>(null);
  const setCheat = useCallback((o: boolean) => setWhich(w => o ? 'cheat' : w === 'cheat' ? null : w), []);
  const setNotes = useCallback((o: boolean) => setWhich(w => o ? 'notes' : w === 'notes' ? null : w), []);
  return (
    <>
      <NotesDrawer open={which === 'notes'} setOpen={setNotes} />
      <CheatDrawer open={which === 'cheat'} setOpen={setCheat} />
    </>
  );
}
