'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';

export default function DeleteDeck({ id }: { id: string }) {
  const [armed, setArmed] = useState(false);
  const router = useRouter();
  return (
    <button type="button" className="linkbtn" style={{ marginLeft: 14 }} onClick={async () => {
      if (!armed) { setArmed(true); return; }
      await supabaseBrowser().from('decks').delete().eq('id', id);
      router.refresh();
    }}>{armed ? 'Confirm' : 'Delete'}</button>
  );
}
