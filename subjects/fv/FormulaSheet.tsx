import { Frac } from '@/components/Frac';

/** The official formula sheet of the 2026 course: the present value formulae, nothing else. */
export default function FormulaSheet() {
  return (
    <div className="fs">
      <p className="note">Present Value Formulae Sheet, as handed out with the exam. Everything else (DCF, betas, WACC, multiples) has to be known.</p>
      <h3>Present value – single cash flow</h3>
      <div className="eq">PV = <Frac n="C" d={<>(1 + r)<sup>T</sup></>} /></div>
      <h3>Present value – annuity (non-growing)</h3>
      <div className="eq">PV = C × <Frac n={<>1 − (1 + r)<sup>−T</sup></>} d="r" /></div>
      <h3>Present value – growing annuity</h3>
      <div className="eq">PV = C × <Frac n={<>1 − (<Frac n="1 + g" d="1 + r" />)<sup>T</sup></>} d="r − g" /></div>
      <h3>Present value – perpetuity (non-growing)</h3>
      <div className="eq">PV = <Frac n="C" d="r" /></div>
      <h3>Present value – growing perpetuity</h3>
      <div className="eq">PV = <Frac n="C" d="r − g" /></div>
    </div>
  );
}
