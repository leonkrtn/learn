import { Big, Frac } from '@/components/Frac';

/** Formulas from lectures 1–2. Replace with the official exam sheet once it is known. */
export default function FormulaSheet() {
  return (
    <div className="fs">
      <p className="note">Formulas from lectures 1 and 2. The official exam formula sheet has not been published yet; this page will follow it once it is.</p>
      <h3>Value as discounted expected cash flows</h3>
      <div className="eq">V<sub>0</sub> = <Big>Σ</Big> <Frac n={<>E[CF<sub>n</sub>]</>} d={<>(1 + r)<sup>n</sup></>} /></div>
      <h3>Gordon growth model and sustainable growth</h3>
      <div className="eq">V<sub>0</sub> = <Frac n={<>D<sub>1</sub></>} d={<>k<sub>e</sub> − g</>} /><span className="up">,</span>&nbsp;&nbsp; g = b <span className="up">·</span> ROE = (1 − payout) <span className="up">·</span> ROE<span className="up">,</span>&nbsp;&nbsp; k<sub>e</sub> = <Frac n={<>D<sub>1</sub></>} d={<>P<sub>0</sub></>} /> + g</div>
      <h3>Two-stage dividend discount model</h3>
      <div className="eq">V<sub>0</sub> = <Big>Σ</Big><sub>t=1..n</sub> <Frac n={<>D<sub>0</sub>(1 + g<sub>s</sub>)<sup>t</sup></>} d={<>(1 + k<sub>e</sub>)<sup>t</sup></>} /> + <Frac n={<>D<sub>n</sub>(1 + g<sub>l</sub>)</>} d={<>(k<sub>e</sub> − g<sub>l</sub>)(1 + k<sub>e</sub>)<sup>n</sup></>} /></div>
      <h3>H-model</h3>
      <div className="eq">V<sub>0</sub> = <Frac n={<>D<sub>0</sub>(1 + g<sub>L</sub>) + D<sub>0</sub> <span className="up">·</span> H <span className="up">·</span> (g<sub>S</sub> − g<sub>L</sub>)</>} d={<>k<sub>e</sub> − g<sub>L</sub></>} /></div>
      <h3>Free cash flows</h3>
      <div className="eq">FCFF = EBIT(1 − t) + D&amp;A − CapEx − ΔNWC<span className="up">,</span>&nbsp;&nbsp; FCFE ≈ FCFF − I(1 − τ<sub>c</sub>) + ΔD</div>
      <h3>Firm value and equity value</h3>
      <div className="eq">V<sub>0</sub><sup>F</sup> = <Big>Σ</Big><sub>t=1..T</sub> <Frac n={<>FCFF<sub>t</sub></>} d={<>(1 + WACC)<sup>t</sup></>} /> + <Frac n={<>FCFF<sub>T</sub>(1 + g)</>} d="WACC − g" /> <span className="up">·</span> <Frac n="1" d={<>(1 + WACC)<sup>T</sup></>} /></div>
      <div className="eq">V<sub>0</sub><sup>E</sup> = V<sub>0</sub><sup>F</sup> − Debt + Cash</div>
    </div>
  );
}
