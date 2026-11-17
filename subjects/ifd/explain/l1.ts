import { ex, type ExplainMap } from '@/lib/explain';

export const L1: ExplainMap = {
  'L1.ipo': ex`
@task
A firm with existing shares sells new shares in an IPO at an offer price, pays an underwriting spread, and the price jumps on the first day. You are asked for the money the firm receives, the market value after day one, the price and number of shares in a perfect-market benchmark, and the total cost to the original shareholders split into underpricing and direct costs.

@idea
The firm only receives the **offer price minus the spread** on the new shares. The first-day price shows what the shares were really worth, so selling them at the offer price gives value away (**underpricing**), and the spread is a **direct cost**.

The cost to the original shareholders is measured against a perfect market in which they would have kept the firm's value minus the cash raised:

$$\text{cost} = (\text{market value} - \text{proceeds}) - n_0 \times P_1 = \underbrace{n_{new}(P_1 - P_0)}_{\text{underpricing}} + \underbrace{n_{new} P_0 s}_{\text{spread}}$$

@steps
1. Proceeds $= n_{new} \times P_0 \times (1 - s)$.
2. Market value after day one $= (n_0 + n_{new}) \times P_1$.
3. Perfect-market value of the old shares $=$ market value $-$ proceeds; price $=$ that $/ n_0$; new shares needed $=$ proceeds $/$ price.
4. Underpricing $= n_{new}(P_1 - P_0)$; direct cost $= n_{new} P_0 s$.
5. Total cost $=$ underpricing $+$ direct cost (also $=$ step 3 value $- n_0 P_1$).

@example
10 million shares outstanding; 4 million new shares at €20 with a 7% spread; first-day price €30.

@solution
1. Proceeds $= 4 \times 20 \times 0.93 = €74.4$m.
2. Market value $= 14 \times 30 = €420$m.
3. Old shareholders would hold $420 - 74.4 = 345.6$, i.e. €34.56 per share; new shares needed $74.4/34.56 = 2.15$m.
4. Underpricing $= 4 \times (30 - 20) = €40$m; spread $= 4 \times 20 \times 0.07 = €5.6$m.
5. Total cost $= €45.6$m (check: $345.6 - 10 \times 30 = 45.6$).

@answer
Proceeds €74.4m; cost to original shareholders €45.6m (€40m underpricing + €5.6m spread).

@pitfalls
- Computing proceeds at the first-day price; the firm sells at the offer price.
- Forgetting the spread is taken from the gross proceeds.
- Counting the first-day jump as a gain for the original shareholders; it is a cost to them.
`,

  'L1.rights': ex`
@task
Shareholders get one right per share; a number of rights plus a subscription price buy one new share, and all rights are exercised. You are asked how much is raised, the share price after the issue, the same for an alternative plan, and which plan shareholders prefer.

@idea
After the issue the firm is worth the old equity plus the cash raised, spread over all shares:

$$P_{after} = \frac{n P_0 + \text{cash raised}}{n + n_{new}}$$

Because every shareholder receives rights in proportion to their holding, the subscription price only decides how value is split between old and new shares — which the same people own. A lower price means more shares and a lower price per share, but **no change in wealth** as long as rights are exercised or sold.

@steps
1. New shares $= n / k$ ($k$ rights per new share); cash $=$ new shares $\times X$.
2. $P_{after} = (n P_0 + \text{cash})/(n + n/k)$.
3. Repeat for the alternative plan.
4. Same cash raised and rights to everyone → shareholders are indifferent.

@example
10 million shares at €50. 4 rights buy one new share at €30. Alternative: each right buys one share at €7.50.

@solution
1. New shares $= 10/4 = 2.5$m; cash $= 2.5 \times 30 = €75$m.
2. $P_{after} = (500 + 75)/12.5 = €46.00$.
3. Alternative: 10m new shares × €7.50 $= €75$m; $P = 575/20 = €28.75$.
4. A holder of 4 shares ends with 5 shares worth €230 (plan 1) or 8 shares worth €230 (plan 2), paying €30 either way.

@answer
€75m raised in both plans; price €46.00 or €28.75; shareholders are indifferent.

@pitfalls
- Thinking the price stays at €50 because new money comes in.
- Believing a deep discount transfers wealth to new shareholders; the rights go to the old ones.
- Dividing by the old share count only.
`,

  'L1.winners': ex`
@task
IPOs fall into three groups with given probabilities and first-day returns. You are asked for the average first-day return, the expected return of an uninformed investor who is rationed in good IPOs, and the return needed in the middle group for that investor to break even.

@idea
**Winner's curse**: informed investors bid only for the good IPOs, so those are oversubscribed and uninformed investors receive only a fraction of the shares. In bad IPOs nobody else bids, so the uninformed get everything. Their return per euro bid weights each outcome by **probability × allocation**:

$$E[r] = \sum_i p_i \, a_i \, r_i$$

Underpricing on average is what keeps uninformed investors in the market.

@steps
1. Average first-day return $= \sum p_i r_i$.
2. With rationing: $\sum p_i a_i r_i$ (unallocated money earns 0).
3. Break-even in the middle group: solve $p_1 a_1 r_1 + p_2 a_2 x + p_3 a_3 r_3 = 0$ for $x$.

@example
20% of IPOs rise 60%, 60% rise 10%, 20% fall 20%. Allocations: 20% in strong debuts, 40% in moderate ones, 100% in bad ones.

@solution
1. Average $= 0.2 \times 60\% + 0.6 \times 10\% + 0.2 \times (-20\%) = 14\%$.
2. Rationed: $0.2 \times 0.2 \times 60\% + 0.6 \times 0.4 \times 10\% + 0.2 \times 1 \times (-20\%) = 2.4\% + 2.4\% - 4\% = 0.8\%$.
3. $2.4\% + 0.24x - 4\% = 0 \Rightarrow x = 6.67\%$.

@answer
Average underpricing 14%, but only 0.8% for the rationed investor; break-even needs 6.67% in the moderate IPOs.

@pitfalls
- Assuming uninformed investors earn the average first-day return.
- Weighting by allocation but forgetting the probability (or vice versa).
- Giving the bad IPOs a partial allocation; uninformed investors get them in full.
`,

  'L1.concept': ex`
@task
Concept questions on equity financing: true/false, find the false (or true) statement, or the best short answer.

@idea
- IPO proceeds $=$ new shares × **offer** price × (1 − spread).
- Cost to original shareholders $=$ underpricing ($n_{new}(P_1 - P_0)$) $+$ direct costs (spread). The first-day jump is a **cost**, not a benefit, to them; underpricing is usually much larger than the spread.
- Rights issue: the subscription price does not affect wealth if all rights are exercised or sold; a lower price means more shares and a lower post-issue price.
- Winner's curse: uninformed investors get more of the bad IPOs, so they earn **less** than the average first-day return; underpricing compensates them.

@steps
1. Identify the topic: IPO cost, rights issue or winner's curse.
2. Check the specific claim against the facts above.
3. Watch for swapped prices (offer vs first-day) and swapped directions.
4. Pick the odd one out among four options.

@example
True or false? "A rights issue with a deep discount to the market price transfers wealth from existing to new shareholders."

@solution
1. Topic: rights issue.
2. The rights go to the existing shareholders, who buy the new shares themselves or sell the rights.
3. The discount only changes how many shares there are; total wealth is the same.

@answer
False. With all rights exercised or sold, the subscription price does not change shareholders' wealth.

@pitfalls
- "Proceeds use the first-day price": false.
- "Underpricing benefits the original shareholders": false.
- "Uninformed investors earn the average first-day return": false.
- "The share price is unchanged after a rights issue": false, it falls to the new average.
`,
};
