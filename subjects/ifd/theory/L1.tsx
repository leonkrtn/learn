'use client';

import { Lab, LinePlot, fx, range } from '@/components/lab';
import TheoryQuiz from '@/components/TheoryQuiz';

export default function L1() {
  return (
    <div className="theory">
      <p>Raising equity is never free. In an IPO the original shareholders pay twice: the underwriter keeps a spread, and the shares are sold below what the market pays on the first day. A rights issue avoids underpricing altogether, because the discount goes back to the same people who own the firm.</p>

      <h2 id="ipo">What an IPO costs the original shareholders</h2>
      <ol className="steps">
        <li><div><b>Proceeds:</b> new shares × offer price × (1 − spread). The spread is the direct cost.</div></li>
        <li><div><b>Market value after the first day:</b> all shares × first-day price.</div></li>
        <li><div><b>Perfect-market benchmark:</b> the old shares would be worth the post-IPO value minus the cash raised. Divide by the old shares for the fair price; the amount raised divided by that price gives the new shares needed.</div></li>
        <li><div><b>Cost:</b> benchmark value minus the actual value of the old shares = underpricing n<sub>new</sub>(P<sub>1</sub> − P<sub>offer</sub>) + spread n<sub>new</sub>P<sub>offer</sub>s.</div></li>
      </ol>
      <p>Worked example (practice exercise, AquaVibe): 10m shares, 5m new at $20, spread 7%, first-day price $50. Proceeds 5 × 20 × 0.93 = $93m; market value 15 × 50 = $750m. Fair price (750 − 93)/10 = $65.70, 93/65.70 = 1.42m new shares would have sufficed. Cost 657 − 500 = $157m = underpricing 5 × 30 = $150m + spread $7m.</p>

      <h2 id="rights">Rights issues</h2>
      <p>Each shareholder gets one right per share; k rights buy one new share at the subscription price X. With all rights exercised, the price after the issue is (nP + amount raised)/(n + n/k). A lower X with more rights per share raises the same amount and gives a lower price, but each shareholder holds proportionally more shares, so her wealth is the same: shareholders are indifferent. MacKenzie: 10m shares at $40, five rights for one share at $30: $60m raised, price 460/12 = $38.33. One right for one share at $6: also $60m, price 460/20 = $23.</p>

      <Lab title="Subscription price and shareholder wealth" hint="Same amount raised, different subscription prices"
        controls={[
          { key: 'P', label: 'Share price before ($)', min: 10, max: 80, step: 1, value: 40, fmt: v => fx(v, 0) },
          { key: 'n', label: 'Shares outstanding (m)', min: 2, max: 30, step: 1, value: 10, fmt: v => fx(v, 0) },
          { key: 'R', label: 'Amount raised ($m)', min: 10, max: 200, step: 5, value: 60, fmt: v => fx(v, 0) },
        ]}
        caption="The price after the issue falls as the subscription price falls, but a shareholder who owned 1% before pays 1% of the amount raised and owns 1% of a firm worth nP + R: her wealth does not depend on the subscription price.">
        {v => {
          const xs = range(1, v.P, 120), post = (X: number) => (v.n * v.P + v.R) / (v.n + v.R / X);
          const wealth = (X: number) => 0.01 * (v.n + v.R / X) * post(X) - 0.01 * v.R;
          return {
            plot: <LinePlot x={[1, v.P]} y={[0, v.P * 1.05]} xLabel="Subscription price ($)" yLabel="$" fmtX={t => fx(t, 0)} fmtY={t => fx(t, 0)}
              series={[{ label: 'price after issue', pts: xs.map(X => [X, post(X)]), style: 'strong' }, { label: 'price before', pts: xs.map(X => [X, v.P]), style: 'soft' }]} />,
            readout: [['Wealth of a 1% holder, net of subscription ($m)', fx(wealth(v.P / 2), 2)], ['Same at a subscription price of $1', fx(wealth(1), 2)]],
          };
        }}
      </Lab>

      <h2 id="curse">Underpricing and the winner’s curse</h2>
      <p>The average first-day return overstates what an uninformed investor earns. Informed investors crowd into the IPOs that will rise, so the uninformed are rationed there and receive everything in the ones that fall. Their return per unit bid is Σ p<sub>s</sub> × allocation<sub>s</sub> × r<sub>s</sub>. Sterling Horizon: 10% rise 80%, 80% rise 12%, 10% fall 20%: average 15.6%. With allocations of 10%, 30% and 100%: 0.1 × 0.1 × 80% + 0.8 × 0.3 × 12% − 0.1 × 20% = 1.68%. If the price can only be set in the moderate cases, uninformed investors break even when 0.008 + 0.24x − 0.02 = 0, x = 5%.</p>

      <h2>Where marks get lost</h2>
      <div className="pitfall"><b>Proceeds use the offer price</b>The firm receives the offer price minus the spread, not the first-day price.</div>
      <div className="pitfall"><b>Cost is borne by the old shareholders</b>Compare what their shares would be worth in a perfect market with what they are worth after the first day.</div>
      <div className="pitfall"><b>Rationing</b>The return of the IPO strategy is per amount bid, with zero on the part not allocated: do not divide by the allocation.</div>

      <h2>Check yourself</h2>
      <TheoryQuiz topic="1" />
    </div>
  );
}
