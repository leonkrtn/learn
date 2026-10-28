import { Frac } from '@/components/Frac';

/** Key formulas from lectures 1–6. The sample exam does not include a formula sheet, so this is a study summary. */
export default function FormulaSheet() {
  return (
    <div className="fs">
      <p className="note">The sample exam does not come with a formula sheet. This page collects the formulas from the six lectures for revision.</p>
      <h3>CAPM, CML and the single-index model</h3>
      <div className="eq">E[r<sub>i</sub>] = r<sub>f</sub> + β<sub>i</sub>(E[r<sub>M</sub>] − r<sub>f</sub>)<span className="up">,</span>&nbsp; β<sub>i</sub> = <Frac n={<>cov(r<sub>i</sub>, r<sub>M</sub>)</>} d={<>σ²<sub>M</sub></>} /><span className="up">,</span>&nbsp; E[r<sub>M</sub>] − r<sub>f</sub> = Ā σ²<sub>M</sub></div>
      <div className="eq">CAL(P): E[r<sub>C</sub>] = r<sub>f</sub> + ρ<sub>PM</sub> <Frac n={<>E[r<sub>M</sub>] − r<sub>f</sub></>} d={<>σ<sub>M</sub></>} /> σ<sub>C</sub><span className="up">,</span>&nbsp; σ²<sub>i</sub> = β²<sub>i</sub>σ²<sub>M</sub> + σ²(e<sub>i</sub>)<span className="up">,</span>&nbsp; cov(R<sub>i</sub>, R<sub>j</sub>) = β<sub>i</sub>β<sub>j</sub>σ²<sub>M</sub></div>
      <h3>APT</h3>
      <div className="eq">E[r<sub>i</sub>] = r<sub>f</sub> + β<sub>i1</sub>RP<sub>1</sub> + … + β<sub>iK</sub>RP<sub>K</sub><span className="up">,</span>&nbsp; σ²(e<sub>P</sub>) = <Frac n={<>σ²<sub>e</sub></>} d="n" /> (equal weights)</div>
      <h3>Performance measures</h3>
      <div className="eq">SR = <Frac n={<>r̄<sub>P</sub> − r̄<sub>f</sub></>} d={<>σ<sub>P</sub></>} /><span className="up">,</span>&nbsp; T = <Frac n={<>r̄<sub>P</sub> − r̄<sub>f</sub></>} d={<>β<sub>P</sub></>} /><span className="up">,</span>&nbsp; α<sub>P</sub> = r̄<sub>P</sub> − [r̄<sub>f</sub> + β<sub>P</sub>(r̄<sub>M</sub> − r̄<sub>f</sub>)]<span className="up">,</span>&nbsp; IR = <Frac n={<>α<sub>P</sub></>} d={<>σ(e<sub>P</sub>)</>} /></div>
      <div className="eq">M² = r<sub>f</sub> + SR<sub>P</sub> σ<sub>M</sub> − E[r<sub>M</sub>]<span className="up">,</span>&nbsp; t(α) = <Frac n="α" d={<>σ<sub>e</sub></>} />√N</div>
      <div className="eq">r<sub>P</sub> − r<sub>B</sub> = Σ(w<sub>Pi</sub> − w<sub>Bi</sub>)r<sub>Bi</sub> + Σ w<sub>Pi</sub>(r<sub>Pi</sub> − r<sub>Bi</sub>)</div>
      <h3>Treynor-Black</h3>
      <div className="eq">w<sub>i</sub>⁰ = <Frac n={<>α<sub>i</sub></>} d={<>σ²(e<sub>i</sub>)</>} /><span className="up">,</span>&nbsp; w<sub>A</sub>⁰ = <Frac n={<>α<sub>A</sub>/σ²(e<sub>A</sub>)</>} d={<>E[R<sub>M</sub>]/σ²<sub>M</sub></>} /><span className="up">,</span>&nbsp; w<sub>A</sub>* = <Frac n={<>w<sub>A</sub>⁰</>} d={<>1 + (1 − β<sub>A</sub>)w<sub>A</sub>⁰</>} /></div>
      <div className="eq">SR²<sub>P</sub> = SR²<sub>M</sub> + IR²<sub>A</sub><span className="up">,</span>&nbsp; σ(T<sub>E</sub>) = w<sub>A</sub>√[(1 − β<sub>A</sub>)²σ²<sub>M</sub> + σ²(e<sub>A</sub>)]<span className="up">,</span>&nbsp; f = <Frac n="1" d="2A" /> Σ IR²<sub>i</sub></div>
      <h3>Black-Litterman (two assets, view on E[R<sub>B</sub>] − E[R<sub>S</sub>])</h3>
      <div className="eq">Σ<sub>F</sub> = τΣ<span className="up">,</span>&nbsp; σ²<sub>D</sub> = σ²<sub>ε</sub> + P′Σ<sub>F</sub>P<span className="up">,</span>&nbsp; R* = R<sub>E</sub> + <Frac n={<>Q − Q<sub>E</sub></>} d={<>σ²<sub>D</sub></>} /> Σ<sub>F</sub>P</div>
      <h3>Two-asset Markowitz</h3>
      <div className="eq">w<sub>1</sub> = <Frac n={<>μ<sub>1</sub>σ²<sub>2</sub> − μ<sub>2</sub>σ<sub>12</sub></>} d={<>μ<sub>1</sub>σ²<sub>2</sub> + μ<sub>2</sub>σ²<sub>1</sub> − (μ<sub>1</sub> + μ<sub>2</sub>)σ<sub>12</sub></>} /><span className="up">,</span>&nbsp; w<sub>1</sub><sup>GMV</sup> = <Frac n={<>σ²<sub>2</sub> − σ<sub>12</sub></>} d={<>σ²<sub>1</sub> + σ²<sub>2</sub> − 2σ<sub>12</sub></>} /></div>
      <h3>Portable alpha</h3>
      <div className="eq">N = <Frac n="V × β" d={<>S<sub>0</sub> × multiplier</>} /><span className="up">,</span>&nbsp; V<sub>t+1</sub> = V(1 + r<sub>f</sub> + α − β r<sub>f</sub>) + Vβ r<sub>M</sub> + V e<span className="up">,</span>&nbsp; H<sub>t+1</sub> = Vβ(r<sub>f</sub> − r<sub>M</sub>)</div>
    </div>
  );
}
