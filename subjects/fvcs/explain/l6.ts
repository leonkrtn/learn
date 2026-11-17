import { ex, type ExplainMap } from '@/lib/explain';

export const L6: ExplainMap = {
  'L6.vc': ex`
@task
A founder (sometimes with angel investors) owns shares and raises a venture capital round. The deal is described by the VC's target ownership, a post-money or pre-money valuation, or the number of new shares. You are asked for shares issued, price per share, pre- and post-money valuation, ownership stakes, the value of the founder's shares or a multiple on the initial investment.

@idea
A funding round sets **one price per share** for everybody:

- Pre-money valuation $=$ old shares $\times$ round price.
- Post-money valuation $=$ all shares after the round $\times$ round price $=$ pre-money $+$ investment.
- The VC's ownership $=$ new shares $/$ all shares $=$ investment $/$ post-money.

Everything follows from these three identities. "Old shares" includes the angels' shares.

@steps
1. Old shares $N_{old}$ = founder + angels.
2. If the VC wants a fraction $s$: total shares $= N_{old}/(1-s)$, new shares $=$ total $- N_{old}$, price $=$ investment $/$ new shares.
3. If post-money $V_{post}$ is given: pre $= V_{post} - I$, price $=$ pre $/ N_{old}$.
4. If pre-money is given: price $=$ pre $/N_{old}$, new shares $= I/$price.
5. Ownership $=$ own shares $/$ total; value of founder's shares $=$ founder shares $\times$ price.

@example
The founder holds 2 million shares (bought for €100,000) and angels 0.5 million. A VC invests €3m for 40% of the company after the round.

@solution
1. $N_{old} = 2.5$ million.
2. Total $= 2.5 / 0.6 = 4.1667$ million; new shares $= 1.6667$ million; price $= 3{,}000{,}000 / 1{,}666{,}667 = €1.80$.
3. Pre-money $= 2.5\text{m} \times 1.80 = €4.5$m; post-money $= 4.1667\text{m} \times 1.80 = €7.5$m.
4. Founder owns $2 / 4.1667 = 48\%$, worth $2\text{m} \times 1.80 = €3.6$m (36× the €100,000).

@answer
1.67 million new shares at €1.80; pre-money €4.5m, post-money €7.5m; founder 48%.

@pitfalls
- Computing new shares as $s \times N_{old}$; the VC's fraction is of the total *after* the round.
- Forgetting the angels' shares in the old share count.
- Including the new money in the pre-money valuation.
`,

  'L6.rounds': ex`
@task
A firm goes through Series A, B and C rounds with given numbers of shares and prices. You are asked for pre- and post-money valuations of a round, the founder's ownership after each round, or the value of an earlier investor's stake.

@idea
Each round is priced on its own: the round price values **all** shares outstanding at that moment. Pre-money counts the shares before the round, post-money includes the new ones. Earlier investors' shares are revalued at the latest round price.

@steps
1. Pre-money of a round $=$ shares before the round $\times$ round price.
2. Post-money $=$ shares after the round $\times$ round price.
3. Ownership $=$ own shares $/$ all shares after the round.
4. Value of a stake later $=$ shares $\times$ latest price.

@example
Series A: founder 10 million shares at €0.10. Series B: 2 million shares at €0.80. Series C: 3 million shares at €2.40.

@solution
1. Series B pre-money $= 10\text{m} \times 0.80 = €8$m; post-money $= 12\text{m} \times 0.80 = €9.6$m.
2. Founder after B: $10/12 = 83.33\%$.
3. Series C post-money $= 15\text{m} \times 2.40 = €36$m; founder $10/15 = 66.67\%$.
4. Angel's stake after C: $2\text{m} \times 2.40 = €4.8$m.

@answer
Series C post-money €36m; founder 66.67%; angel stake €4.8m.

@pitfalls
- Using the price of an earlier round to value the firm at a later round.
- Leaving the new shares out of the post-money valuation.
- Adding up the money invested across rounds instead of using the round price.
`,

  'L6.spac': ex`
@task
A private firm goes public by merging with a SPAC. You get the units sold (one share plus a fraction of a warrant at €10), sponsor warrants, the 20% promote, a PIPE, the shares given to the target's owners, fees, possible redemptions and a share price at which all warrants are exercised cashlessly. You are asked for promote shares, SPAC shares before the merger, warrants, cash net of fees, shares from the warrant exercise, the effective IPO price, the implied equity value, fees in percent or the underpricing.

@idea
Follow the shares and the cash separately.

- **Promote**: the sponsor ends up with 20% of SPAC shares, i.e. $U/4$ shares for $U$ public units.
- **Cash** raised = €10 × public shares not redeemed + PIPE money.
- **Cashless warrant exercise** at price $P_w$ with strike $K$: holders receive shares worth the intrinsic value, $W \times \frac{P_w - K}{P_w}$.
- **Effective price** $= \dfrac{\text{gross cash}}{\text{shares to non-target holders}}$, where those shares are public (after redemptions) + promote + PIPE + warrant shares. It is usually well below €10: the promote and warrants dilute.

@steps
1. Promote $= U/4$; public shares after redemptions $U_{pub}$.
2. SPAC shares before merger $= U_{pub} +$ promote $+$ PIPE shares.
3. Warrants $=$ fraction per unit $\times U +$ sponsor warrants; new shares $= W(P_w - 11.5)/P_w$.
4. Cash $= 10 U_{pub} +$ PIPE; net of fees $=$ cash $-$ fees.
5. Effective price $=$ cash $/$ (step 2 shares $+$ warrant shares).
6. Equity value $=$ effective price $\times$ all shares (incl. the target's). Underpricing $=$ first price$/$effective price $- 1$.

@example
30m units at €10, each with 1/3 warrant; sponsor gets 5m warrants plus the 20% promote. PIPE: 10m shares at €10. Target owners get 150m shares. Fees €20m, no redemptions, warrants exercised cashlessly at €20.

@solution
1. Promote $= 30/4 = 7.5$m shares.
2. SPAC shares $= 30 + 7.5 + 10 = 47.5$m.
3. Warrants $= 10 + 5 = 15$m; new shares $= 15 \times (20 - 11.5)/20 = 6.375$m.
4. Cash $= 300 + 100 = €400$m; net $= €380$m.
5. Effective price $= 400 / (47.5 + 6.375) = €7.42$.
6. Equity value $= 7.42 \times (47.5 + 150 + 6.375) = €1.51$bn; fees $= 20/400 = 5\%$.

@answer
Effective price €7.42 per share; implied equity value about €1.51bn.

@pitfalls
- Computing the promote as 20% of the public shares ($0.2U$) instead of 20% of the total ($U/4$).
- Counting warrants at full exercise ($W$ shares) instead of the cashless formula.
- Dividing cash by the target's shares or by all shares; use the shares issued to non-target holders.
- Forgetting to remove redeemed shares from both the share count and the cash.
`,

  'L6.concept': ex`
@task
Concept questions on raising equity capital: true/false, find the false (or true) statement, or the best short answer.

@idea
- **Angels**: individuals investing in small private firms, usually early and not until IPO.
- **Venture capital**: funds investing in start-ups; typical fees 2% per year management plus 20% of positive returns (carried interest).
- **Private equity**: equity of existing private firms, often via LBOs; larger amounts.
- **Corporate investors** may also pursue strategic goals.
- **Pre-money** $=$ old shares $\times$ round price (without new money); **post-money** $=$ all shares $\times$ round price.
- **SPAC**: a shell that IPOs first and then searches for a target (no pre-identified target allowed); investors can redeem and keep their warrants; the sponsor's 20% promote resembles PE/VC fees; deals must close within about 18–24 months; PIPEs add capital. Cash raised is uncertain until closing because of redemptions.

@steps
1. Identify the investor type or valuation term.
2. Recall the defining feature from the list above.
3. Watch for swapped numbers (2% vs 20%) and swapped order (target before or after IPO).
4. Pick the odd one out among four options.

@example
True or false? "SPAC investors who redeem their shares prior to the merger must give up their warrants."

@solution
1. Term: SPAC redemption rights.
2. Investors may redeem for €10 per share before the merger and keep the warrants.
3. The statement claims the opposite.

@answer
False. Redeeming investors keep their warrants.

@pitfalls
- Swapping VC fees (2% management, 20% performance).
- Including the new money in the pre-money valuation.
- Thinking a SPAC must name its target before its IPO.
- Calling the promote a cash fee paid to the bank.
`,
};
