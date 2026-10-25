'use client';

import { useSubject } from './SubjectContext';

export default function SyncNotice() {
  const { syncError } = useSubject();
  return syncError ? <p className="err" style={{ margin: '16px 0 0' }}>{syncError}</p> : null;
}
