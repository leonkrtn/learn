import { ex, type ExplainMap } from '@/lib/explain';

export const L4: ExplainMap = {
  'L4.assetSub': ex`
@task
A firm with debt due at year end can switch to a risky strategy (or swap an asset for a speculative lease). You are asked for the expected firm value, the expected payoffs to equity and debt holders, the change for debt holders, and whether equity holders favour the switch or the deal should be accepted.

@idea
**Asset substitution**: when a firm is close to or in default, equity holders have little to lose. Like the holder of a call option, they keep the upside and pass the downside to creditors:

- equity payoff $= \max(V - F, 0)$, debt payoff $= \min(V, F)$.

A risky strategy can raise expected equity value even if it **lowers** total firm value: the gain for shareholders is a transfer from debt holders. Judge equity's choice by the expected equity payoff, and the firm's by expected total value.

@steps
1. Expected firm value under the new strategy $= \sum p_s V_s$.
2. Expected equity payoff $= \sum p_s \max(V_s - F, 0)$.
3. Expected debt payoff $= \sum p_s \min(V_s, F)$.
4. Current strategy: equity $\max(V_0 - F, 0)$, debt $\min(V_0, F)$.
5. Equity favours the switch if step 2 > current equity payoff; the change for debt is step 3 minus the current debt payoff.

@example
Debt of €100m due at year end. Without change, assets are worth €90m. A new strategy succeeds with 50% (assets €140m) or fails (assets €30m). No discounting.

@solution
1. Expected value $= 0.5 \times 140 + 0.5 \times 30 = €85$m (less than 90).
2. Equity $= 0.5 \times 40 + 0.5 \times 0 = €20$m.
3. Debt $= 0.5 \times 100 + 0.5 \times 30 = €65$m.
4. Current: equity $0$, debt $€90$m.
5. Equity gains €20m and favours the strategy; debt loses $65 - 90 = -€25$m; the firm loses €5m.

@answer
Expected firm value €85m, equity €20m, debt €65m (−€25m): equity holders favour the negative-NPV strategy.

@pitfalls
- Deciding by total firm value when the question asks what equity holders prefer.
- Giving equity a negative payoff in a bad state; limited liability floors it at zero.
- In the lease variant, forgetting to add the remaining active field to every outcome.
`,

  'L4.overhang': ex`
@task
A firm whose debt is (nearly) larger than its assets can invest in a positive-NPV project, but the money must come from equity holders. All cash flows are risk-free. You are asked for debt and equity values with and without the investment, the NPV, the equity holders' net gain, whether they fund it, and the debt level up to which they would.

@idea
**Debt overhang**: equity holders pay the whole investment, but part (or all) of the value it creates goes to debt holders, whose claim becomes safer. Equity holders invest only if **their** gain covers the cost:

$$\text{Gain to equity} = \frac{\max(B - F, 0)}{1 + r_f} - I - \frac{\max(A - F, 0)}{1 + r_f}$$

A project can have a positive NPV for the firm and still be rejected.

@steps
1. Without investing: debt $= \min(A, F)/(1+r_f)$, equity $= \max(A - F, 0)/(1+r_f)$.
2. NPV $= -I + (B - A)/(1+r_f)$.
3. With investing: equity $= \max(B - F, 0)/(1+r_f)$, debt $= \min(B, F)/(1+r_f)$.
4. Equity's net gain $=$ step 3 equity $- I -$ step 1 equity. Fund only if positive.
5. Highest face value at which they still fund: $F_{max} = \max(A,\; B - I(1+r_f))$.

@example
Debt €20m due in one year. Without investment the land is worth €12m; developing it costs €5m today and makes it worth €22m. $r_f = 5\%$.

@solution
1. Do nothing: debt $= 12/1.05 = 11.43$, equity $0$.
2. NPV $= -5 + 10/1.05 = 4.52 > 0$.
3. Invest: equity $= 2/1.05 = 1.90$, debt $= 20/1.05 = 19.05$.
4. Gain $= 1.90 - 5 - 0 = -3.10$: equity holders refuse.
5. $F_{max} = \max(12, 22 - 5.25) = €16.75$m.

@answer
NPV €4.52m, but equity holders lose €3.10m by funding it, so they do not invest; with debt up to €16.75m they would.

@pitfalls
- Deciding by the project's NPV instead of the equity holders' gain.
- Forgetting to subtract the €I contributed when computing the equity gain.
- Not discounting the year-1 values at $r_f$.
`,

  'L4.cashout': ex`
@task
A distressed firm can sell equipment today and pay the money out as a dividend, which lowers next year's asset value. You are asked for equity value with and without the sale, the drop in debt value, the drop in firm value and whether equity holders favour the sale.

@idea
**Cashing out**: when default is likely, a euro paid out today goes to shareholders for sure, while a euro left in the firm would mostly go to creditors. So shareholders like paying out even if it destroys value. Equity value with the sale is the dividend now plus what is left for them next year.

@steps
1. Without the sale: equity $= \max(V - F, 0)/(1+r_f)$, debt $= \min(V, F)/(1+r_f)$.
2. With the sale: equity $= X + \max(V_1 - F, 0)/(1+r_f)$, debt $= \min(V_1, F)/(1+r_f)$.
3. Fall in debt value $=$ step 1 debt $-$ step 2 debt.
4. Fall in firm value $= (V - V_1)/(1+r_f) - X$.
5. Equity favours the sale if step 2 equity > step 1 equity.

@example
Debt face value €100m, assets €90m next year without changes. Equipment can be sold for €8m today and paid out; without it the firm is worth €78m. $r_f = 5\%$.

@solution
1. No sale: equity $0$, debt $90/1.05 = 85.71$.
2. Sale: equity $= 8 + 0 = 8$; debt $= 78/1.05 = 74.29$.
3. Debt falls by $85.71 - 74.29 = 11.43$.
4. Firm value falls by $12/1.05 - 8 = 3.43$.
5. Equity gains €8m: in favour.

@answer
Equity holders get €8m instead of nothing and favour the sale, although firm value falls by €3.43m and debt loses €11.43m.

@pitfalls
- Forgetting the dividend in the equity value with the sale.
- Measuring the firm's loss as $V - V_1$ without discounting and without the cash paid out.
- Assuming equity holders care about firm value.
`,

  'L4.petron': ex`
@task
Four strategies with a probability of success and a firm value if successful (zero if they fail). Management maximises expected equity value. You are asked which strategy is best for the firm, which management picks at a given debt level, and the expected equity, firm and debt values and agency costs.

@idea
Without debt management picks the highest expected **firm** value. With debt face value $F$, equity gets $\max(V - F, 0)$ only if the strategy succeeds, so the expected equity payoff is

$$p \times \max(V - F, 0)$$

Higher debt shifts the choice towards riskier strategies with a high value if successful, even if their expected firm value is lower. The **agency cost** is the loss in expected firm value compared with the best strategy.

@steps
1. Expected firm value per strategy $= p \times V$; the highest is best for the firm.
2. For the given $F$: expected equity $= p \times \max(V - F, 0)$ per strategy; management picks the largest.
3. Expected firm value of the chosen strategy $= p V$; expected debt $=$ firm $-$ equity.
4. Agency cost $=$ best expected firm value $-$ expected firm value of the chosen strategy.

@example
Strategies A–D: success probability 100%, 80%, 60%, 40%; value if successful €50m, €60m, €75m, €100m. Debt face value €40m; $r_f = 0$.

@solution
1. Expected firm values: 50, 48, 45, 40. A is best for the firm.
2. Expected equity with $F = 40$: A $1 \times 10 = 10$, B $0.8 \times 20 = 16$, C $0.6 \times 35 = 21$, D $0.4 \times 60 = 24$. Management picks D.
3. Firm value of D $= 40$; equity 24; debt $= 40 - 24 = 16$.
4. Agency cost $= 50 - 40 = €10$m.

@answer
Management chooses D: expected equity €24m, firm €40m, debt €16m; agency cost €10m.

@pitfalls
- Using expected firm value $p V$ to predict management's choice once there is debt.
- Forgetting the $\max(\cdot, 0)$: equity cannot be negative.
- Computing debt as $p \times F$ only when the strategy can be worth less than $F$ in success — check $\min(V, F)$.
`,

  'L4.empire': ex`
@task
An all-equity firm's managers waste a fraction of net income on perks. You are asked how much €1 of interest reduces payouts to shareholders, how much it raises total payouts to investors, payouts without debt, and total payouts with a given interest expense.

@idea
**Agency benefit of debt** (free cash flow hypothesis): interest must be paid, so it removes cash that managers would otherwise waste. €1 of interest reduces net income by $(1-\tau_c)$, and of that shareholders would only have received $(1-w)$. So shareholders lose $(1-\tau_c)(1-w)$ but debt holders get the full €1:

$$\text{Gain per euro of interest} = 1 - (1-\tau_c)(1-w)$$

It combines the tax shield and the waste avoided.

@steps
1. Reduction in shareholder payouts per €1 of interest: $(1-\tau_c)(1-w)$.
2. Increase in total payouts per €1 of interest: $1 - (1-\tau_c)(1-w)$.
3. Without debt: payout $= EBIT(1-\tau_c)(1-w)$.
4. With interest $Int$: total $= Int + (EBIT - Int)(1-\tau_c)(1-w)$.

@example
EBIT €1,000 thousand, tax 25%, managers waste 10% of net income. Interest of €200 thousand would be paid with debt.

@solution
1. $(1 - 0.25)(1 - 0.10) = €0.675$.
2. $1 - 0.675 = €0.325$.
3. $1{,}000 \times 0.75 \times 0.9 = €675$ thousand.
4. $200 + 800 \times 0.75 \times 0.9 = 200 + 540 = €740$ thousand.

@answer
Each €1 of interest cuts shareholder payouts by €0.675 and raises total payouts by €0.325; with debt €740 thousand reach investors instead of €675 thousand.

@pitfalls
- Counting only the tax shield ($\tau_c$) and ignoring the waste avoided.
- Applying the waste rate to the interest paid; debt holders get interest in full.
- Answering in euros when the question is in € thousand.
`,

  'L4.concept': ex`
@task
Concept questions on agency costs and benefits of debt: true/false, find the false (or true) statement, or the best short answer.

@idea
**Agency costs of debt** (conflicts between equity and debt holders, strongest when leverage is high and the firm is near distress):
- **Asset substitution**: shareholders gamble on risky, even negative-NPV projects.
- **Debt overhang**: shareholders refuse positive-NPV projects they must fund.
- **Cashing out**: shareholders pay out cash rather than keep it in the firm.
- Creditors anticipate this and pay less for the debt; covenants and short maturities reduce the problem (covenants cost flexibility; short-term debt raises distress risk). Long-term debt has the **largest** agency costs.

**Agency benefits of debt** (conflicts between managers and shareholders):
- Debt keeps ownership concentrated, commits free cash flow to interest (less empire building), invites creditor monitoring and **reduces** entrenchment.

@steps
1. Decide whether the statement is about equity vs debt holders (costs) or managers vs shareholders (benefits).
2. Check the direction: higher leverage → more asset substitution and overhang, less entrenchment and waste.
3. Watch absolute words ("always", "never").
4. For four options, mark each and pick the odd one out.

@example
Which is FALSE? a) Debt overhang can lead equity holders to reject positive-NPV projects. b) Agency costs are smallest for long-term debt. c) Covenants may help reduce agency costs. d) Leverage can reduce managerial entrenchment.

@solution
1. a) true — the overhang problem.
2. b) long maturities give shareholders more time to exploit creditors, so costs are *largest*: false.
3. c) true. d) true.

@answer
b) is false: agency costs are largest for long-term debt.

@pitfalls
- "Asset substitution is most severe at low leverage": false.
- "Equity holders always fund positive-NPV projects under overhang": false.
- "Higher leverage makes managers more entrenched": false.
- "Distressed shareholders prefer safe strategies": false.
`,
};
