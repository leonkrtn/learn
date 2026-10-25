import type { ReactNode } from 'react';

export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="auth">
      <div className="left">
        <div className="wordmark">learn</div>
        <div>
          <p>Practice for written exams with questions generated fresh every time, flashcards on a spaced schedule, and worked explanations of the hard topics.</p>
          <p className="muted">Answers within 2% count as correct. Decimal comma or decimal point, either works.</p>
        </div>
        <div className="foot">Progress is stored per account and synced across devices.</div>
      </div>
      <div className="right">{children}</div>
    </div>
  );
}
