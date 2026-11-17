import { Frac } from '@/components/Frac';

/** Key formulas of the course. In the exam students bring their own two-sided A4 cheatsheet, so this is a study summary. */
export default function FormulaSheet() {
  return (
    <div className="fs">
      <p className="note">There is no official formula sheet: in the exam you use your own cheatsheet (one A4 sheet, both sides). This page collects the formulas of the course; the suggested cheatsheet under My cheatsheet arranges them for printing. Continuous compounding, days/365, months/12.</p>
      <h3>Bounds, parity and early exercise</h3>
      <div className="eq">max(S − PV(X) − D, 0) ≤ c ≤ S<span className="up">,</span>&nbsp; max(PV(X) + D − S, 0) ≤ p ≤ PV(X)<span className="up">,</span>&nbsp; PV(X) = Xe<sup>−rT</sup></div>
      <div className="eq">c = p + S − PV(X) − D<span className="up">,</span>&nbsp; American, no income: S − X ≤ C − P ≤ S − PV(X)<span className="up">,</span>&nbsp; C = c</div>
      <div className="eq">American put: exercise now if (X − S)e<sup>rT</sup> &gt; X<span className="up">,</span>&nbsp; American call before a dividend d only if d &gt; X(1 − e<sup>−r(T − t)</sup>)</div>
      <h3>Trading strategies</h3>
      <div className="eq">Net payoff = Σ q<sub>i</sub> payoff<sub>i</sub>(S<sub>T</sub>) + CF<sub>0</sub>e<sup>rT</sup><span className="up">,</span>&nbsp; butterfly: +1 at X<sub>1</sub>, −2 at X<sub>2</sub> = <Frac n={<>X<sub>1</sub> + X<sub>3</sub></>} d="2" />, +1 at X<sub>3</sub></div>
      <h3>Binomial model</h3>
      <div className="eq">m = <Frac n={<>c<sup>u</sup> − c<sup>d</sup></>} d={<>S<sup>u</sup> − S<sup>d</sup></>} /><span className="up">,</span>&nbsp; B = <Frac n={<>mS<sup>u</sup> − c<sup>u</sup></>} d="1 + r" /><span className="up">,</span>&nbsp; c = mS − B = <Frac n={<>πc<sup>u</sup> + (1 − π)c<sup>d</sup></>} d="1 + r" /></div>
      <div className="eq">π = <Frac n="1 + r − d" d="u − d" /> or <Frac n={<>e<sup>(r − q)Δt</sup> − d</>} d="u − d" /><span className="up">,</span>&nbsp; u = e<sup>σ√Δt</sup>, d = 1/u<span className="up">,</span>&nbsp; σ̂ = s(ln S<sub>t</sub>/S<sub>t−1</sub>)√252</div>
      <div className="eq">c<sub>0</sub> = (1 + r)<sup>−n</sup> Σ<sub>j</sub> <Frac n="n!" d="j!(n − j)!" /> π<sup>j</sup>(1 − π)<sup>n−j</sup> max(S<sub>0</sub>u<sup>j</sup>d<sup>n−j</sup> − X, 0)</div>
      <h3>Black-Scholes and the lognormal model</h3>
      <div className="eq">ln S<sub>T</sub> ~ N(ln S<sub>0</sub> + (μ − σ²/2)T, σ²T)<span className="up">,</span>&nbsp; E[S<sub>T</sub>] = S<sub>0</sub>e<sup>μT</sup></div>
      <div className="eq">c = Se<sup>−qT</sup>N(d1) − Xe<sup>−rT</sup>N(d2)<span className="up">,</span>&nbsp; p = Xe<sup>−rT</sup>N(−d2) − Se<sup>−qT</sup>N(−d1)</div>
      <div className="eq">d1 = <Frac n="ln(S/X) + (r − q + σ²/2)T" d="σ√T" /><span className="up">,</span>&nbsp; d2 = d1 − σ√T<span className="up">,</span>&nbsp; Δ<sub>call</sub> = N(d1), P<sup>Q</sup>(exercise) = N(d2)</div>
      <h3>Structured products</h3>
      <div className="eq">Price × (1 − margin) = value of the building blocks<span className="up">,</span>&nbsp; max(A, B − S<sub>T</sub>) = A + max(B − A − S<sub>T</sub>, 0)</div>
      <div className="eq">K(1 + |R|) = K + <Frac n="K" d={<>S<sub>0</sub></>} />[max(S<sub>T</sub> − S<sub>0</sub>, 0) + max(S<sub>0</sub> − S<sub>T</sub>, 0)]<span className="up">,</span>&nbsp; commodity: q = y − u</div>
      <h3>Forwards, futures and swaps</h3>
      <div className="eq">F<sub>0</sub> = S<sub>0</sub>e<sup>rT</sup>, (S<sub>0</sub> − I)e<sup>rT</sup>, S<sub>0</sub>e<sup>(r − q)T</sup>, S<sub>0</sub>e<sup>(r − r<sub>f</sub>)T</sup>, S<sub>0</sub>e<sup>(r + u − y)T</sup><span className="up">,</span>&nbsp; f = (F<sub>0</sub> − K)e<sup>−rT</sup></div>
      <div className="eq">h* = ρ<Frac n={<>σ<sub>S</sub></>} d={<>σ<sub>F</sub></>} /><span className="up">,</span>&nbsp; N* = <Frac n={<>h*Q<sub>A</sub></>} d={<>Q<sub>F</sub></>} /><span className="up">,</span>&nbsp; N = (β* − β)<Frac n="V" d="F × multiplier" /></div>
      <div className="eq">Swap rate s = <Frac n={<>1 − DF<sub>n</sub></>} d={<>Σ DF<sub>t</sub></>} /><span className="up">,</span>&nbsp; V<sub>receive fixed</sub> = B<sub>fix</sub> − B<sub>fl</sub> = (K − s) × L × Σ DF<sub>t</sub></div>
    </div>
  );
}
