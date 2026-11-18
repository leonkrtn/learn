'use client';

import { Frac } from '@/components/Frac';
import { Lab, LinePlot, fx, pct } from '@/components/lab';
import TheoryQuiz from '@/components/TheoryQuiz';

export default function L3() {
  return (
    <div className="theory">
      <p>Growth is the input that moves a valuation most and is hardest to defend. There are three sources: the firm’s own history, the forecasts of analysts and managers, and the fundamentals that every growth rate has to be consistent with, namely how much the firm reinvests and what it earns on that reinvestment.</p>

      <h2 id="history">Historical growth</h2>
      <ol className="steps">
        <li><div><b>Averages.</b> The arithmetic average is the mean of the annual rates; the geometric average (CAGR) is the constant rate that links the first and the last value. With volatile growth the geometric average is lower, and it is the rate the firm actually compounded at.</div></li>
        <li><div><b>Variability.</b> The standard deviation of the growth rates (divide by n − 1) shows how noisy history is. Volatile earnings revert to the mean, so their past growth predicts poorly.</div></li>
        <li><div><b>Negative earnings.</b> Year-on-year rates break down across a sign change. Fit EPS<sub>t</sub> = a + b·t and use b / average EPS, or switch to revenues and absolute changes.</div></li>
        <li><div><b>Time-series models</b> (ARIMA, SARIMA) capture trend and seasonality for a quarter or a year ahead, but need long histories and fail after structural breaks.</div></li>
      </ol>
      <div className="eqline">ḡ<sub>arith</sub> = <Frac n="1" d="n" /> Σ g<sub>t</sub><span className="up">,</span>&nbsp;&nbsp; ḡ<sub>geom</sub> = (<Frac n="ending value" d="beginning value" />)<sup>1/n</sup> − 1</div>

      <h2 id="analysts">Analyst forecasts</h2>
      <p>Analysts combine firm news, management guidance, the industry and the macro picture, so their short-term forecasts beat history. Their accuracy falls with the horizon, they are weaker for small and volatile firms with little coverage, and they can be biased. Use consensus forecasts for the next years and anchor long-run growth in fundamentals; in bad times analysts’ revisions carry more information.</p>

      <h2 id="fundamentals">Fundamental growth</h2>
      <div className="eqline">g = RIR × ROC<span className="up">,</span>&nbsp;&nbsp; RIR = <Frac n="Net CapEx + ΔOWC" d="EBIT(1 − t)" /><span className="up">,</span>&nbsp;&nbsp; ROC = <Frac n="EBIT(1 − t)" d={<>BV<sub>E</sub> + BV<sub>D</sub> − Cash</>} /></div>
      <p>For net income the same logic reads g = retention ratio × ROE with ROE = net income / book equity at the start of the year. When the return on capital changes, existing assets become more or less productive as well, which adds an efficiency term for that year:</p>
      <div className="eqline">g = RIR × ROC<sub>t</sub> + <Frac n={<>ROC<sub>t</sub> − ROC<sub>t−1</sub></>} d={<>ROC<sub>t−1</sub></>} /></div>
      <p>If ROC is negative, forecast revenues (market size × share, with growth that fades as the firm grows) and a path for the operating margin towards a sustainable level. Reinvestment needs fall as firms mature; a ROC above the cost of capital lasts only as long as the competitive advantage behind it. Adjust book capital for R&amp;D, leases and intangibles before trusting a ROC.</p>

      <Lab title="Reinvestment, return on capital and growth" hint="Ten years of operating income starting from 100"
        controls={[
          { key: 'rir', label: 'Reinvestment rate', min: 0, max: 0.9, step: 0.05, value: 0.4, fmt: v => pct(v, 0) },
          { key: 'roc', label: 'Return on capital', min: 0.02, max: 0.3, step: 0.005, value: 0.125, fmt: v => pct(v, 1) },
          { key: 'roc1', label: 'Return on capital from year 1', min: 0.02, max: 0.3, step: 0.005, value: 0.125, fmt: v => pct(v, 1) },
        ]}
        caption="The blue line uses the year-1 ROC throughout; year 1 also gets the efficiency gain or loss on existing capital. The gray line keeps the old ROC. Growth costs reinvestment, so it only adds value when ROC exceeds the cost of capital.">
        {v => {
          const g1 = v.rir * v.roc1 + (v.roc1 - v.roc) / v.roc, gs = v.rir * v.roc1, g0 = v.rir * v.roc;
          const a: [number, number][] = [[0, 100]], b: [number, number][] = [[0, 100]];
          for (let t = 1; t <= 10; t++) { a.push([t, a[t - 1][1] * (1 + (t === 1 ? g1 : gs))]); b.push([t, b[t - 1][1] * (1 + g0)]); }
          const top = Math.max(a[10][1], b[10][1]) * 1.08;
          return {
            plot: <LinePlot x={[0, 10]} y={[0, Math.max(150, top)]} xLabel="Year" yLabel="Operating income" fmtX={t => String(Math.round(t))} fmtY={t => fx(t, 0)}
              series={[{ label: 'New ROC', pts: a, style: 'strong' }, { label: 'Old ROC', pts: b, style: 'soft' }]} />,
            readout: [['Growth, old ROC', pct(g0, 2)], ['Growth in year 1', pct(g1, 2)], ['Growth from year 2', pct(gs, 2)]],
          };
        }}
      </Lab>

      <h2>Worked example: growth from fundamentals (extra question 2)</h2>
      <p>After-tax operating income $100m, invested capital $800m, net CapEx $25m, working capital up $15m.</p>
      <ol className="steps">
        <li><div>ROC = 100 / 800 = 12.5%; reinvestment rate = (25 + 15) / 100 = 40%; growth = 40% × 12.5% = 5%.</div></li>
        <li><div>If ROC rises to 15% next year: 40% × 15% + (15% − 12.5%) / 12.5% = 6% + 20% = 26% for that year.</div></li>
      </ol>

      <h2>Worked example: market-share target (extra question 1)</h2>
      <p>Revenues $25m, market $2bn growing 6% a year, target share 8% in 10 years: market 2,000 × 1.06<sup>10</sup> = 3,581.70; revenue 286.54; CAGR = (286.54 / 25)<sup>1/10</sup> − 1 = 27.62%.</p>

      <h2>Where marks get lost</h2>
      <div className="pitfall"><b>Five periods, six values</b>A CAGR over six years of data has five growth periods.</div>
      <div className="pitfall"><b>Net, not gross</b>Reinvestment uses net CapEx (CapEx − depreciation) plus the change in working capital, divided by after-tax EBIT.</div>
      <div className="pitfall"><b>Start-of-year capital</b>ROC divides by invested capital at the start of the year, net of cash.</div>
      <div className="pitfall"><b>Negative ROC</b>RIR × ROC is meaningless with a negative ROC; forecast revenues and margins.</div>

      <h2>Check yourself</h2>
      <TheoryQuiz topic="3" />
    </div>
  );
}
