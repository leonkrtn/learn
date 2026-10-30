import type { ReactNode } from 'react';
import Logo from './Logo';

/** Sign-in and sign-up: the form, and next to it a real question as it looks in practice. */
export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="auth">
      <div className="authform glass">
        <Logo size={30} />
        {children}
        <p className="foot">Progress is stored per account and synced across devices.</p>
      </div>
      <figure className="sample">
        <div className="samplecard glass">
          <div className="sh"><b>Question 4</b><span>Interest deduction and income limit · Lecture 2</span></div>
          <p>Ashby Technologies has EBIT of €2,350m and interest expense of €915m. The corporate tax rate is 21%. Interest deduction is limited to 30% of EBIT.</p>
          <div className="sq">
            <span>a) What is the allowed interest deduction?</span>
            <span className="unit">€m</span><span className="ans ok">705</span>
          </div>
          <div className="sq">
            <span>b) What are the tax savings from leverage?</span>
            <span className="unit">€m</span><span className="ans bad">192,15</span>
          </div>
          <div className="sfb">Correct answer: €148.05m</div>
        </div>
        <figcaption>Every question is generated with new numbers. Answers within 2% count, with a decimal comma or point.</figcaption>
      </figure>
    </div>
  );
}
