import type { ReactNode } from 'react';
import Logo from './Logo';

export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="auth">
      <div className="right">
        <div className="authtop"><Logo size={32} /></div>
        {children}
        <div className="foot">Progress is stored per account and synced across devices.</div>
      </div>
      <div className="left">
        <div className="pitch">
          <h2>Practise for written exams with questions that are new every time.</h2>
          <p>Flashcards on a spaced schedule, worked explanations of the hard topics, and mock exams with the real paper&rsquo;s structure.</p>
          <ul>
            <li>Answers within 2% count as correct</li>
            <li>Decimal comma or decimal point, either works</li>
            <li>Weak question types come back more often</li>
          </ul>
        </div>
        <div className="shapes" aria-hidden><span /><span /><span /></div>
      </div>
    </div>
  );
}
