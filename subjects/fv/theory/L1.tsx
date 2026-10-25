'use client';

import { Frac } from '@/components/Frac';
import { Lab, LinePlot, fx, pct, range } from '@/components/lab';
import TheoryQuiz from '@/components/TheoryQuiz';

export default function L1() {
  return (
    <div className="theory">
      <p>Valuation only pays off if prices can differ from values. This lecture asks how often that happens: how quickly markets absorb information, what the evidence says about each form of efficiency, and which value a DCF actually estimates.</p>

      <h2 id="emh">Efficient markets in five steps</h2>
      <ol className="steps">
        <li><div>Returns are hard to predict; prices move close to a random walk. If they did not, traders would exploit the pattern until it disappeared.</div></li>
        <li><div><b>Weak form:</b> prices contain all past prices and volume, so technical analysis earns nothing extra. Momentum is the main challenge.</div></li>
        <li><div><b>Semi-strong form:</b> prices contain all public information (statements, corporate actions, macro data), so fundamental analysis earns no persistent excess return. Event studies show fast reactions; post-earnings drift is the counter-evidence.</div></li>
        <li><div><b>Strong form:</b> prices also contain private information. It fails: insiders do earn abnormal returns.</div></li>
        <li><div>Anomalies (momentum, size, value, calendar effects) point to inefficiency or behavioural bias, but many shrink after risk adjustment, trading costs or correcting for data mining. After costs, active management rarely beats passive investing.</div></li>
      </ol>

      <h2 id="event">Measuring a price reaction: the event study</h2>
      <p>Estimate a normal-return model on a clean window before the event, usually the market model R<sub>i</sub> = α + β R<sub>m</sub>. Around the event, the abnormal return is the part of the return the model does not explain; adding them up over the event window gives the cumulative abnormal return.</p>
      <div className="eqline">AR<sub>t</sub> = R<sub>i,t</sub> − (α + β R<sub>m,t</sub>)<span className="up">,</span>&nbsp;&nbsp; CAR(t<sub>1</sub>, t<sub>2</sub>) = <span className="up">Σ</span> AR<sub>t</sub></div>

      <Lab title="What efficient and inefficient reactions look like" hint="Cumulative abnormal return around good news on day 0"
        controls={[
          { key: 'news', label: 'Value of the news', min: 0.01, max: 0.1, step: 0.005, value: 0.05, fmt: v => pct(v, 1) },
          { key: 'leak', label: 'Share known before day 0', min: 0, max: 0.8, step: 0.05, value: 0, fmt: v => pct(v, 0) },
          { key: 'drift', label: 'Share priced in only after day 0', min: 0, max: 0.8, step: 0.05, value: 0, fmt: v => pct(v, 0) },
        ]}
        caption="With both sliders at zero the full jump happens on day 0: semi-strong efficiency. A run-up before day 0 means someone traded on information before it was public; a drift afterwards means the market under-reacted.">
        {v => {
          const days = range(-10, 10, 20);
          const before = v.news * v.leak, after = v.news * Math.min(v.drift, 1 - v.leak), jump = v.news - before - after;
          const car = (d: number) => d < 0 ? before * (d + 10) / 10 : before + jump + after * (d / 10);
          return {
            plot: <LinePlot x={[-10, 10]} y={[0, 0.1]} xLabel="Trading day relative to the announcement" yLabel="Cumulative abnormal return" fmtX={t => String(Math.round(t))} fmtY={t => pct(t, 0)}
              series={[
                { label: 'CAR', pts: days.map(d => [d, car(d)]), style: 'strong' },
                { label: 'full value', pts: [[-10, v.news], [10, v.news]], style: 'dash' },
              ]}
              vline={{ x: 0, label: 'day 0' }} />,
            readout: [['CAR(−10, −1)', pct(before, 2)], ['AR on day 0', pct(jump, 2)], ['CAR(+1, +10)', pct(after, 2)]],
          };
        }}
      </Lab>

      <h2 id="value">Firm value and equity value</h2>
      <p>Firm (enterprise) value is the value of the whole business to everyone who financed it. Equity value is what is left for shareholders once net debt is paid off: firm value − debt + cash, minus preferred stock and minority interests where they exist. On the asset side, firm value is the value of assets in place plus the value of expected growth.</p>
      <div className="eqline">V<sub>0</sub> ≈ P<sub>0</sub> = <span className="up">Σ</span> <Frac n={<>E[CF<sub>n</sub>]</>} d={<>(1 + r)<sup>n</sup></>} /></div>
      <p>Which cash flow and which rate you use decides which value you get: cash flows to the firm at the WACC give firm value, cash flows to equity at the cost of equity give equity value.</p>

      <h2>Worked example: abnormal returns</h2>
      <p>Market model R<sub>i</sub> = 0.02% + 1.2 × R<sub>m</sub>. On the announcement day the stock returns 4.10% and the market 0.50%.</p>
      <ol className="steps">
        <li><div>Normal return: 0.02% + 1.2 × 0.50% = 0.62%.</div></li>
        <li><div>Abnormal return: 4.10% − 0.62% = 3.48%. Add the abnormal returns of the surrounding days to get the CAR.</div></li>
      </ol>

      <h2>Where marks get lost</h2>
      <div className="pitfall"><b>Benchmark</b>The abnormal return subtracts the model’s normal return, not the risk-free rate and not the raw market return (unless β = 1 and α = 0).</div>
      <div className="pitfall"><b>Which form fails</b>Insider profits reject the strong form; post-earnings drift rejects the semi-strong form; momentum challenges the weak form.</div>
      <div className="pitfall"><b>Bridge direction</b>Equity = firm value − debt + cash. Adding debt to firm value double-counts it.</div>

      <h2>Check yourself</h2>
      <TheoryQuiz topic="1" />
    </div>
  );
}
