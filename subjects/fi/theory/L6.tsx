'use client';

import { Frac } from '@/components/Frac';
import { Lab, LinePlot, fx, pct, range } from '@/components/lab';
import TheoryQuiz from '@/components/TheoryQuiz';

export default function L6() {
  return (
    <div className="theory">
      <p>Hedge funds can do almost anything a mutual fund cannot: short, lever, use options, lock in capital and charge performance fees. That flexibility is the source of their potential alpha and the reason their performance is so hard to measure.</p>

      <h2 id="what">Hedge funds versus mutual funds</h2>
      <p>Mutual funds are regulated, disclose strategy and holdings, accept any number of investors, allow easy redemptions and charge 0.5–1.5% of assets. Hedge funds are partnerships with minimal disclosure, at most about 100 sophisticated investors, opportunistic strategies, lock-ups and redemption notices, and fees of 1–2% plus 20% of profits. Strategies are directional or non-directional (convergence and relative-value trades); Pedersen classifies them by their economic driver: value, momentum, liquidity provision, carry, low risk, arbitrage, quality.</p>

      <h2 id="pa">Portable alpha</h2>
      <ol className="steps">
        <li><div>Unhedged value next period: V<sub>t+1</sub> = V(1 + r<sub>f</sub> + α − βr<sub>f</sub>) + Vβ r<sub>M</sub> + V e.</div></li>
        <li><div>Sell N = Vβ/(S<sub>0</sub> × multiplier) index futures. With F<sub>0</sub> = S<sub>0</sub>(1 + r<sub>f</sub>) the hedge pays H<sub>t+1</sub> = Vβ(r<sub>f</sub> − r<sub>M</sub>).</div></li>
        <li><div>Hedged: V<sub>t+1</sub> + H<sub>t+1</sub> = V(1 + r<sub>f</sub> + α) + V e. Market risk is gone; specific risk remains.</div></li>
      </ol>
      <p>Sample exam Q22: $3m, α = 12%, β = 2, r<sub>f</sub> = 5%, S&amp;P at 2,000, multiplier 250: V = 3.21 + 6r<sub>M</sub> + 3e; sell 12 contracts, H = 0.3 − 6r<sub>M</sub>; hedged 3.51 + 3e.</p>

      <h2 id="fees">Fees as options</h2>
      <Lab title="What the investor keeps under 2 and 20" hint="Net return against gross return, one fund, one year"
        controls={[
          { key: 'mg', label: 'Management fee', min: 0, max: 0.03, step: 0.0025, value: 0.02, fmt: v => pct(v, 2) },
          { key: 'inc', label: 'Incentive fee', min: 0, max: 0.4, step: 0.05, value: 0.2, fmt: v => pct(v, 0) },
          { key: 'h', label: 'Hurdle rate', min: 0, max: 0.08, step: 0.005, value: 0.01, fmt: v => pct(v, 1) },
        ]}
        caption="The incentive fee is a call option on the fund with the hurdle as strike: the manager shares the upside but not the downside, so volatility helps the manager and hurts the investor.">
        {v => {
          const xs = range(-0.3, 0.4, 140), net = (g: number) => g - v.mg - v.inc * Math.max(g - v.h, 0), fee = (g: number) => v.mg + v.inc * Math.max(g - v.h, 0);
          return {
            plot: <LinePlot x={[-0.3, 0.4]} y={[-0.35, 0.4]} xLabel="Gross return" yLabel="Return" fmtX={t => pct(t, 0)} fmtY={t => pct(t, 0)}
              series={[{ label: 'gross', pts: xs.map(g => [g, g]), style: 'soft' }, { label: 'investor net', pts: xs.map(g => [g, net(g)]), style: 'strong' }, { label: 'manager fees', pts: xs.map(g => [g, fee(g)]), style: 'dash' }]}
              vline={{ x: v.h, label: 'hurdle' }} />,
            readout: [['Net at +20% gross', pct(net(0.2), 2)], ['Net at −20% gross', pct(net(-0.2), 2)], ['Fees at +20%', pct(fee(0.2), 2)]],
          };
        }}
      </Lab>
      <p>Funds of funds pay incentive fees to every winning fund even when the total loses, so diversifying across hedge funds can hurt the investor. High-water marks charge incentive fees only above the previous peak, which pushes funds with deep losses to close.</p>

      <h2 id="measure">Why hedge fund performance is hard to measure</h2>
      <ol className="steps">
        <li><div><b>Data biases:</b> survivorship bias about twice that of mutual funds, plus backfill bias; about 75% of funds died over an 8-year sample (Malkiel and Saha, 2005). No persistence, non-normal risk.</div></li>
        <li><div><b>Illiquidity and stale prices:</b> serial correlation smooths returns and inflates Sharpe ratios (Hasanhodzic and Lo). Scholes-Williams: add lagged market returns and sum the betas. Asness, Krail and Liew (2001) find true risk two to four times higher and most alphas negative.</div></li>
        <li><div><b>Omitted factors:</b> liquidity premia (Aragon: alphas vanish after controlling for lock-ups; Sadka: liquidity-risk betas earn about 6% a year).</div></li>
        <li><div><b>Changing exposures and tail risk:</b> characteristic lines look like those of option writers, not market timers; samples without crashes (1987, LTCM) overstate performance (Taleb).</div></li>
        <li><div><b>Manipulation:</b> the Santa effect, December returns pushed up, especially by illiquid funds.</div></li>
      </ol>
      <div className="eqline">R<sub>t+1</sub> = α + β<sub>0</sub>R<sub>m,t+1</sub> + β<sub>1</sub>R<sub>m,t</sub> + … + β<sub>k</sub>R<sub>m,t+1−k</sub> + ε<span className="up">,</span>&nbsp; β̂<sub>c</sub> = <span className="up">Σ</span> β̂<sub>i</sub></div>

      <h2 id="role">Their role in efficiently inefficient markets</h2>
      <p>If nobody tried to beat the market, nobody would make it efficient; if beating it were easy, professionals would do it routinely. Pedersen’s answer: a limited amount of active capital earns enough to cover its costs. Hedge funds make prices more informative, allocate capital better, monitor managers (activists, e.g. at Unilever in 2022), provide liquidity and diversify investors’ returns.</p>

      <h2>Where marks get lost</h2>
      <div className="pitfall"><b>Direction of the bias</b>Simple CAPM regressions overestimate hedge fund alphas, because lagged market exposure is left out.</div>
      <div className="pitfall"><b>Contracts and sign</b>To hedge a long portfolio you sell futures: N = Vβ/(S<sub>0</sub> × multiplier).</div>
      <div className="pitfall"><b>Fees on losers</b>Management fees apply to every fund; incentive fees only to those above the hurdle, computed fund by fund.</div>

      <h2>Check yourself</h2>
      <TheoryQuiz topic="6" />
    </div>
  );
}
