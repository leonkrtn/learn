'use client';

import { Frac } from '@/components/Frac';
import { Lab, LinePlot, fx, pct, range } from '@/components/lab';
import TheoryQuiz from '@/components/TheoryQuiz';

export default function L5() {
  return (
    <div className="theory">
      <p>Emerging markets add two problems to the discount rate: governments that can default, so their bonds are not risk-free, and equity markets that are riskier than mature ones. Both have to be priced explicitly, and both inputs change quickly.</p>

      <h2 id="rf">Risk-free rates in local currency</h2>
      <ol className="steps">
        <li><div>Risk-free rates differ across currencies mainly because of expected inflation; they range from near zero (Swiss franc, yen) to more than 30% (Turkish lira).</div></li>
        <li><div>A local-currency government yield contains a default spread whenever the government can default. Remove it: r<sub>f,local</sub> = local yield − default spread.</div></li>
        <li><div><b>Default spread:</b> (a) a dollar or euro bond of the government minus the US Treasury or German Bund of the same maturity; (b) the sovereign CDS spread, netted against the US CDS; (c) the typical spread of countries with the same rating. Corporate spreads can differ from sovereign spreads for the same rating.</div></li>
      </ol>
      <p>Lecture example, Brazil: dollar bond 6.04% vs Treasury 3.88% → spread 2.16%; CDS 2.39% − US CDS 0.58% = 1.81%; rating Ba2 → 2.21% (sovereign) or 3.28% (corporate).</p>

      <h2 id="crp">Country risk premium</h2>
      <div className="eqline">(1) ERP = ERP<sub>US</sub> + spread&nbsp;&nbsp; (2) CRP = spread × <Frac n={<>σ<sub>Equity</sub></>} d={<>σ<sub>Bond</sub></>} />&nbsp;&nbsp; (3) ERP = ERP<sub>US</sub> × <Frac n={<>σ<sub>Country</sub></>} d={<>σ<sub>US</sub></>} /></div>
      <p>Brazil with a US premium of 5.5%: (1) 7.66%; (2) 2.16% × 30/20 = 3.24% → 8.74%; (3) 5.5% × 30/18 = 9.17%, of which 3.67% is country risk. Historical averages only help if the economy has not changed fundamentally.</p>

      <h2 id="ke">Country risk in the cost of equity</h2>
      <div className="eqline">Additive: r<sub>f</sub> + CRP + β·ERP<sub>US</sub><span className="up">,</span>&nbsp;&nbsp; Integrated: r<sub>f</sub> + β(ERP<sub>US</sub> + CRP)<span className="up">,</span>&nbsp;&nbsp; λ: r<sub>f</sub> + β·ERP<sub>US</sub> + λ·CRP</div>
      <p>λ measures a firm’s exposure to country risk, from a regression or from revenue exposure: the share of its revenues earned in the country relative to the average local firm. An exporter with most sales abroad has a low λ even if it is listed locally.</p>

      <Lab title="Three ways to price country risk" hint="Cost of equity against beta"
        controls={[
          { key: 'rf', label: 'Risk-free rate', min: 0.01, max: 0.06, step: 0.0025, value: 0.04, fmt: v => pct(v, 2) },
          { key: 'us', label: 'Mature-market premium', min: 0.04, max: 0.07, step: 0.0025, value: 0.055, fmt: v => pct(v, 2) },
          { key: 'crp', label: 'Country risk premium', min: 0, max: 0.08, step: 0.0025, value: 0.03, fmt: v => pct(v, 2) },
          { key: 'lam', label: 'λ (country exposure)', min: 0, max: 1.5, step: 0.05, value: 0.5, fmt: v => fx(v, 2) },
          { key: 'b', label: 'Beta', min: 0.3, max: 2, step: 0.05, value: 1.2, fmt: v => fx(v, 2) },
        ]}
        caption="Blue: integrated (beta also scales country risk). Gray: additive (every firm bears the full CRP). Dashed: country risk as a separate factor with the chosen λ.">
        {v => {
          const xs = range(0.3, 2, 60);
          const add = (b: number) => v.rf + v.crp + b * v.us, int = (b: number) => v.rf + b * (v.us + v.crp), lam = (b: number) => v.rf + b * v.us + v.lam * v.crp;
          return {
            plot: <LinePlot x={[0.3, 2]} y={[0, Math.max(0.25, int(2) * 1.05)]} xLabel="Beta" yLabel="Cost of equity" fmtX={x => fx(x, 1)} fmtY={y => pct(y, 0)}
              series={[{ label: 'Integrated', pts: xs.map(b => [b, int(b)]), style: 'strong' }, { label: 'Additive', pts: xs.map(b => [b, add(b)]), style: 'soft' }, { label: 'λ factor', pts: xs.map(b => [b, lam(b)]), style: 'dash' }]} />,
            readout: [['Additive', pct(add(v.b), 2)], ['Integrated', pct(int(v.b), 2)], ['λ approach', pct(lam(v.b), 2)]],
          };
        }}
      </Lab>

      <h2>Worked example: a local risk-free rate (exam 2022, Q4)</h2>
      <p>Rupiah government bonds yield 12%; the government’s euro bond yields 6%; German government bonds yield 2%. Default spread 6% − 2% = 4%; rupiah risk-free rate 12% − 4% = 8%.</p>

      <h2>Practical rules</h2>
      <ol className="steps">
        <li><div>Use a risk-free rate in the currency of the cash flows, net of default risk.</div></li>
        <li><div>Add a country risk premium, scaled for equity volatility where it is used.</div></li>
        <li><div>Decide how much of it a firm carries (additive, beta-scaled or λ), update inputs often and run sensitivity analysis.</div></li>
      </ol>

      <h2>Where marks get lost</h2>
      <div className="pitfall"><b>Local yield is not risk-free</b>Subtract the government’s default spread.</div>
      <div className="pitfall"><b>Volatility ratio</b>Equity over bond in approach 2; country equity over US equity in approach 3.</div>
      <div className="pitfall"><b>Total vs country part</b>Approach 3 gives the total premium; subtract the US premium for the country part.</div>

      <h2>Check yourself</h2>
      <TheoryQuiz topic="5" />
    </div>
  );
}
