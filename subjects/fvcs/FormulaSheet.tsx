import { Big, Frac } from '@/components/Frac';

/** The formula sheet handed out with the FVCS exam, nothing more. */
export default function FormulaSheet() {
  return (
    <div className="fs">
      <h3>Present value of an N-period annuity with payment C and discount rate r:</h3>
      <div className="eq">C <span className="up">·</span> <Frac n="1" d="r" /><Big>(</Big>1 − <Frac n="1" d={<>(1 + r)<sup>N</sup></>} /><Big>)</Big></div>
      <h3>Present value of a perpetuity with payment C and discount rate r:</h3>
      <div className="eq">PV(perpetuity) = <Frac n="C" d="r" /></div>
      <h3>Present value of a growing perpetuity with payment C, discount rate r, and growth rate g:</h3>
      <div className="eq">PV(growing perpetuity) = <Frac n="C" d="r − g" /></div>
      <h3>Levered Beta:</h3>
      <div className="eq">Levered Beta = Unlevered Beta <span className="up">·</span> <Big>[</Big>1 + (1 − Tax rate) <span className="up">·</span> <Big>(</Big><Frac n="Debt" d="Equity" /><Big>)</Big><Big>]</Big></div>
      <h3>CAPM</h3>
      <div className="eq">r<sub>a</sub> = r<sub>f</sub> + β<sub>a</sub> <span className="up">·</span> (r<sub>m</sub> − r<sub>f</sub>)</div>
      <div className="legend">
        <i>r<sub>a</sub></i><span>Expected return of an asset</span>
        <i>r<sub>f</sub></i><span>Risk free rate</span>
        <i>r<sub>m</sub></i><span>Expected market return</span>
        <i>β<sub>a</sub></i><span>Beta of the security</span>
      </div>
      <h3>WACC</h3>
      <div className="eq">WACC = <Frac n="E" d="E + D" /> <span className="up">·</span> r<sub>E</sub> + <Frac n="D" d="D + E" /> <span className="up">·</span> r<sub>D</sub> <span className="up">·</span> (1 − τ<sub>c</sub>)</div>
    </div>
  );
}
