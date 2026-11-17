import { ex, type ExplainMap } from '@/lib/explain';

export const L1: ExplainMap = {
  'L1.pv': ex`
@task
You get a forecast of cash flows to equity for a few years, a growth rate after the forecast, a discount rate, the number of shares and the share price. You are asked for parts of a DCF valuation: the present value of the forecast years, the terminal value, its present value, the equity value, the value per share, and whether the share is under- or overvalued.

@idea
The intrinsic value of a claim is the present value of the cash flows it is expected to deliver. You cannot forecast every year forever, so you split the future in two:

- **Explicit period** (years 1 to $n$): discount each cash flow on its own.
- **Terminal value** at the end of year $n$: all cash flows after year $n$ grow at a constant rate $g$, so they form a growing perpetuity worth $TV_n = \dfrac{CF_{n+1}}{r-g} = \dfrac{CF_n(1+g)}{r-g}$.

The terminal value is a value *at the end of year n*, so it still has to be discounted $n$ years back to today. Comparing the value per share with the market price tells you whether the market price is below (undervalued) or above (overvalued) your estimate.

@steps
1. Discount each forecast cash flow: $PV_t = \dfrac{CF_t}{(1+r)^t}$ and add them up.
2. Next year's cash flow after the forecast: $CF_{n+1} = CF_n(1+g)$. With no growth, $CF_{n+1} = CF_n$.
3. Terminal value at the end of year $n$: $TV_n = \dfrac{CF_{n+1}}{r-g}$.
4. Discount it to today: $PV(TV) = \dfrac{TV_n}{(1+r)^n}$.
5. Equity value $=$ sum of step 1 $+$ step 4. Value per share $=$ equity value $/$ shares.
6. Price below value per share means undervalued, price above means overvalued. The terminal-value share is $PV(TV)/V$.

@example
Cash flows to equity are expected to be €100m, €110m and €120m in years 1–3 and to grow at 2% forever after year 3. The discount rate is 9%. There are 50 million shares trading at €30.00. Find the equity value, the value per share and the verdict.

@solution
1. PV of the forecast: $\frac{100}{1.09} + \frac{110}{1.09^2} + \frac{120}{1.09^3} = 91.74 + 92.58 + 92.66 = 276.99$.
2. $CF_4 = 120 \times 1.02 = 122.4$.
3. $TV_3 = \frac{122.4}{0.09 - 0.02} = 1{,}748.57$.
4. $PV(TV) = \frac{1{,}748.57}{1.09^3} = 1{,}350.22$.
5. Equity value $= 276.99 + 1{,}350.22 = 1{,}627.21$m, per share $1{,}627.21 / 50 = €32.54$.
6. The price of €30.00 is below €32.54, so the share is undervalued. The terminal value makes up $1{,}350.22 / 1{,}627.21 = 83.0\%$ of the value.

@answer
Equity value €1,627.21m, value per share €32.54, undervalued. Terminal value share 83%.

@pitfalls
- Discounting the terminal value by $n+1$ years, or not discounting it at all. It sits at the end of year $n$.
- Using $CF_n$ instead of $CF_n(1+g)$ in the numerator of the perpetuity.
- Mixing up the verdict: a price *below* value means the share is cheap (undervalued).
- Rounding the intermediate results; keep full precision and round only the final answers.
`,

  'L1.bridge': ex`
@task
You get either the share price and number of shares together with debt and cash, or a DCF enterprise value together with the claims on the firm (debt, cash, preferred stock, minority interests). You are asked to move between firm (enterprise) value and equity value, and sometimes for a value per share and a verdict against the price.

@idea
Firm value is the value of the whole business, owned by all capital providers. Equity holders get what is left after everyone with a prior claim has been paid, and they also own the cash on the balance sheet:

$$\text{Equity} = \text{Firm value} - \text{Debt} + \text{Cash} - \text{Preferred} - \text{Minority interests}$$

Read in the other direction, the market's enterprise value is market capitalisation plus net debt (debt minus cash), plus preferred stock and minority interests if there are any.

@steps
1. Market capitalisation $=$ shares $\times$ price.
2. Net debt $=$ debt $-$ cash.
3. From market data: enterprise value $=$ market cap $+$ net debt (+ preferred + minorities).
4. From a DCF firm value: equity $=$ firm value $-$ debt $+$ cash $-$ preferred $-$ minorities.
5. Value per share $=$ equity $/$ shares; the gap to the price is $\frac{\text{value per share}}{\text{price}} - 1$.
6. Value above the price means undervalued.

@example
A DCF gives an enterprise value of €2,400m. Debt is €800m, cash €150m, preferred stock €100m and minority interests €50m. There are 60 million shares trading at €22.00. What is the equity value per share, and is the share under- or overvalued?

@solution
1. Equity $= 2{,}400 - 800 + 150 - 100 - 50 = 1{,}600$m.
2. Value per share $= 1{,}600 / 60 = €26.67$.
3. Gap to price: $26.67 / 22.00 - 1 = 21.2\%$.
4. Value above price, so the share is undervalued.

@answer
Equity €1,600m, €26.67 per share, 21.2% above the price: undervalued.

@pitfalls
- Subtracting cash instead of adding it when going from firm value to equity (cash belongs to shareholders).
- Forgetting preferred stock or minority interests: they are claims ahead of common equity.
- Calling market capitalisation the value of the whole business; it is the equity only.
- Computing the gap as price/value − 1 instead of value/price − 1.
`,

  'L1.event': ex`
@task
You get a market model estimated before an event, $R_i = \alpha + \beta R_m$, and a table of daily stock and market returns around the event day 0. You are asked for the normal return, the abnormal return on a day, and cumulative abnormal returns (CAR) over a window. Answers are in percent.

@idea
An event study isolates the part of a stock's return that is caused by the news. The market model tells you what the stock *would* have returned given what the market did that day (the normal return). Whatever is left over is the abnormal return:

$$AR_t = R_{i,t} - (\alpha + \beta R_{m,t})$$

Adding the abnormal returns over a window gives the cumulative abnormal return, $CAR(t_1, t_2) = \sum_{t=t_1}^{t_2} AR_t$, which measures the total price reaction including leakage before and drift after the event.

@steps
1. Normal return on day $t$: $\alpha + \beta \times R_{m,t}$ (keep the signs of $\alpha$ and $R_m$).
2. Abnormal return: actual stock return minus normal return.
3. Repeat for every day in the requested window.
4. CAR: add the abnormal returns of the days in the window, both ends included.
5. Enter in percent: 0.0348 is 3.48.

@example
Market model: $R_i = 0.02\% + 1.2 R_m$. Returns from day −2 to +2:

| Day | −2 | −1 | 0 | +1 | +2 |
|---|---|---|---|---|---|
| Stock | 0.60% | −0.70% | 4.10% | 0.60% | 0.10% |
| Market | 0.40% | −0.60% | 0.50% | 0.20% | −0.10% |

Find the normal and abnormal return on day 0, CAR(−2,+2) and CAR(0,+2).

@solution
1. Normal returns: $0.02\% + 1.2 \times R_m$ gives 0.50%, −0.70%, 0.62%, 0.26%, −0.10%.
2. Abnormal returns: $0.60 - 0.50 = 0.10$, $-0.70 - (-0.70) = 0.00$, $4.10 - 0.62 = 3.48$, $0.60 - 0.26 = 0.34$, $0.10 - (-0.10) = 0.20$ (all in %).
3. CAR(−2,+2) $= 0.10 + 0.00 + 3.48 + 0.34 + 0.20 = 4.12\%$.
4. CAR(0,+2) $= 3.48 + 0.34 + 0.20 = 4.02\%$.

@answer
Normal return on day 0: 0.62%. Abnormal return on day 0: 3.48%. CAR(−2,+2) = 4.12%, CAR(0,+2) = 4.02%.

@pitfalls
- Subtracting the market return (or the risk-free rate) instead of the market-model prediction $\alpha + \beta R_m$.
- Forgetting $\alpha$, or dropping the minus sign of a negative market return.
- Leaving out a day of the window: CAR(0,+2) has three days.
- Entering 0.0348 instead of 3.48 when the question asks for percent.
`,

  'L1.concept': ex`
@task
Concept questions come in four formats: a single statement to mark true or false, four statements of which exactly one is false (or exactly one is true), and a short question with the answer that fits best. They test the forms of market efficiency, the evidence on anomalies, event studies, and the difference between firm and equity value.

@idea
Most statements in this lecture are built from a few core facts, and the false ones swap one of them:

- **Weak form**: prices contain all past price and volume data, so *technical* analysis cannot earn abnormal returns. Momentum challenges it.
- **Semi-strong form**: prices contain all *public* information, so *fundamental* analysis of public data cannot earn persistent abnormal returns. Post-earnings-announcement drift challenges it; fast reactions in event studies support it.
- **Strong form**: prices also contain *private* information. Profitable insider trading contradicts it.
- **Event study**: abnormal return = actual return − normal (model-predicted) return; CAR adds them over the window.
- **Firm vs equity value**: firm value belongs to all capital providers; equity = firm value − net debt. Market cap is equity only.
- Anomalies are evidence against efficiency only if they survive risk adjustment, trading costs and data-mining checks.

@steps
1. Find the key term in the statement (which form, which claim holder, which return).
2. Recall the defining fact for that term from the list above.
3. Check every qualifier: "all", "never", "only", "public", "past", "plus" or "minus". A single swapped word makes the statement false.
4. For "which is false/true", judge each option on its own, then pick the odd one out.

@example
True or false? "Under the weak form of market efficiency, fundamental analysis of financial statements cannot earn abnormal returns, but technical analysis can."

@solution
1. Key term: weak form.
2. The weak form says prices reflect past prices and volume, so it rules out *technical* analysis.
3. The statement swaps the two kinds of analysis: it is fundamental analysis that the weak form says nothing about.

@answer
False. The weak form rules out abnormal returns from technical analysis; fundamental analysis is only ruled out by the semi-strong form.

@pitfalls
- Confusing which form rules out which analysis (weak: technical; semi-strong: fundamental on public data; strong: even insider information).
- Reading "equity = firm value plus net debt": it is minus.
- Thinking one anomaly proves that all markets are inefficient.
- Defining the abnormal return against the risk-free rate instead of the model's normal return.
`,
};
