import { Frac } from '@/components/Frac';

/** Key formulas of the four lectures. No official exam formula sheet is known yet, so this is a study summary. */
export default function FormulaSheet() {
  return (
    <div className="fs">
      <p className="note">No official formula sheet for the exam is known yet. This page collects the formulas from the lectures and exercises for revision.</p>
      <h3>Equity financing</h3>
      <div className="eq">Proceeds = n<sub>new</sub> × P<sub>offer</sub> × (1 − spread)<span className="up">,</span>&nbsp; cost = n<sub>new</sub>(P<sub>1</sub> − P<sub>offer</sub>) + n<sub>new</sub>P<sub>offer</sub> × spread</div>
      <div className="eq">P<sub>perfect</sub> = <Frac n="V after IPO − proceeds" d={<>n<sub>old</sub></>} /><span className="up">,</span>&nbsp; P<sub>after rights</sub> = <Frac n="n × P + amount raised" d={<>n + n<sub>new</sub></>} /></div>
      <div className="eq">Winner’s curse: E[return per unit bid] = Σ p<sub>s</sub> × allocation<sub>s</sub> × r<sub>s</sub></div>
      <h3>Debt financing</h3>
      <div className="eq">B<sub>0</sub> = <Frac n="E[min(F, V)]" d={<>1 + r<sub>f</sub></>} /><span className="up">,</span>&nbsp; y = <Frac n={<>F − B<sub>0</sub></>} d={<>B<sub>0</sub></>} /><span className="up">,</span>&nbsp; spread = y − r<sub>f</sub></div>
      <div className="eq">Convertible: payoff = max(min(K, V), <Frac n="x" d="n + x" /> V)<span className="up">,</span>&nbsp; conversion ratio = <Frac n="x" d="number of bonds" /></div>
      <h3>Incentives and information</h3>
      <div className="eq">Own cash: κ ≤ E<sub>H</sub>[V] − E<sub>L</sub>[V]<span className="up">,</span>&nbsp; equity: α = <Frac n="I" d={<>E<sub>H</sub>[V]</>} />, κ ≤ (1 − α)(E<sub>H</sub>[V] − E<sub>L</sub>[V])</div>
      <div className="eq">Debt: E<sub>H</sub>[min(F, V)] = I<span className="up">,</span>&nbsp; κ ≤ Σ(p<sub>H</sub> − p<sub>L</sub>) max(V − F, 0)</div>
      <h3>Capital budgeting</h3>
      <div className="eq">NPV = Σ<sub>t</sub> <Frac n={<>E[CF<sub>t</sub>]</>} d={<>(1 + r)<sup>t</sup></>} /><span className="up">,</span>&nbsp; NWC = cash + inventory + A/R − A/P</div>
      <div className="eq">FCF = EBITDA − τ·EBIT − CapEx − ΔNWC + other = EBIT(1 − τ) + Dep − CapEx − ΔNWC + other</div>
      <div className="eq">FCF<sub>T</sub> = EBIT<sub>T</sub>(1 − τ) + Dep<sub>T</sub> + post-tax PPE<sub>T</sub> + NWC<sub>T</sub><span className="up">,</span>&nbsp; TV<sub>T</sub> = <Frac n={<>FCF<sub>T+1</sub></>} d="r − g" /></div>
      <div className="eq">E[R<sub>i</sub>] = r<sub>f</sub> + β<sub>i</sub>(E[R<sub>M</sub>] − r<sub>f</sub>)<span className="up">,</span>&nbsp; β<sub>U</sub> = <Frac n="E" d="V" />β<sub>E</sub> + <Frac n="D" d="V" />β<sub>D</sub><span className="up">,</span>&nbsp; β<sub>E′</sub> = β<sub>U</sub> + <Frac n="D′" d="E′" />(β<sub>U</sub> − β<sub>D′</sub>)</div>
      <div className="eq">V<sup>L</sup> = V<sup>U</sup> + PV(DTS) + other<span className="up">,</span>&nbsp; PV(DTS) = Σ <Frac n={<>τ r<sub>D</sub> D<sub>t−1</sub></>} d={<>(1 + r<sub>DTS</sub>)<sup>t</sup></>} /><span className="up">,</span>&nbsp; perpetual debt: τD</div>
      <div className="eq">WACC = <Frac n="E′" d="E′ + D′" /> r<sub>E′</sub> + <Frac n="D′" d="E′ + D′" /> r<sub>D′</sub>(1 − τ)<span className="up">,</span>&nbsp; r<sub>E</sub> = r<sub>U</sub> + <Frac n="D" d="E" />(r<sub>U</sub> − r<sub>D</sub>)</div>
    </div>
  );
}
