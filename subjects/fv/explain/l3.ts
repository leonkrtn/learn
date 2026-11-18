import { ex, type ExplainMap } from '@/lib/explain';

export const L3: ExplainMap = {
  'L3.hist': ex`
@task
Six years of revenue, EBITDA or EBIT. You are asked for one year's growth rate, the arithmetic and the geometric average growth, the standard deviation of the growth rates, or a forecast for next year at the geometric average.

@idea
Historical growth is the starting point of every growth estimate. The **arithmetic average** is the simple mean of the annual rates; the **geometric average** (CAGR) is the constant rate that turns the first value into the last one:

$$\bar g_{arith} = \frac{1}{n}\sum_{t=1}^n g_t, \qquad \bar g_{geom} = \left(\frac{\text{ending value}}{\text{beginning value}}\right)^{1/n} - 1.$$

Because growth rates vary, the geometric average is never above the arithmetic one. The standard deviation (with $n - 1$ in the denominator) measures how noisy past growth was, and so how little it may tell you about the future.

@steps
1. Growth in year $t$: $g_t = \frac{V_t}{V_{t-1}} - 1$.
2. Arithmetic average: add the five rates and divide by 5.
3. Geometric average: $(V_{last}/V_{first})^{1/5} - 1$; five growth periods for six values.
4. Standard deviation: square each deviation from the arithmetic mean (in percentage points), add them, divide by $n - 1 = 4$, take the square root.
5. Forecast: last value $\times (1 + \bar g_{geom})$.

@example
Revenue for six years: 100, 108, 115, 124, 130, 140.

@solution
1. Growth rates: 8.00%, 6.48%, 7.83%, 4.84%, 7.69%.
2. Arithmetic average: $(8.00 + 6.48 + 7.83 + 4.84 + 7.69) / 5 = 6.97\%$.
3. Geometric average: $(140/100)^{1/5} - 1 = 1.4^{0.2} - 1 = 6.96\%$.
4. Squared deviations: 1.07, 0.24, 0.74, 4.53, 0.53; sum 7.10; $\sigma = \sqrt{7.10/4} = 1.33$ percentage points.
5. Forecast: $140 \times 1.0696 = 149.75$.

@answer
Arithmetic 6.97%, geometric 6.96%, standard deviation 1.33 percentage points, forecast 149.75.

@pitfalls
- Using six periods instead of five in the geometric average: six values span five growth periods.
- Dividing the sum of squared deviations by $n$ instead of $n - 1$.
- Treating the arithmetic mean as the compound rate: with volatile growth it overstates what the firm actually achieved.
- Mixing decimals and percentage points in the standard deviation.
`,

  'L3.trend': ex`
@task
Six years of earnings per share, some of them negative. You fit a linear trend $EPS_t = a + b \cdot t$ and are asked for the average EPS, the slope $b$, the implied growth rate $b / \overline{EPS}$, or the trend value for the next year.

@idea
When earnings move from a loss to a profit, year-on-year growth rates are meaningless (dividing by a negative number). A trend line still captures how fast earnings improve in euros per year. Dividing the slope by the average EPS turns it into a growth rate. It is only a rough guide: with small average earnings the rate becomes very large.

$$b = \frac{\sum (t - \bar t)(EPS_t - \overline{EPS})}{\sum (t - \bar t)^2}, \qquad g \approx \frac{b}{\overline{EPS}}.$$

With $t = 1, \dots, 6$: $\bar t = 3.5$ and $\sum (t - \bar t)^2 = 17.5$.

@steps
1. Average EPS $\overline{EPS}$.
2. For each year, $(t - 3.5)(EPS_t - \overline{EPS})$; add them.
3. Slope $b$ = that sum divided by 17.5.
4. Growth $= b / \overline{EPS}$.
5. Trend value for $t = 7$: $a = \overline{EPS} - 3.5\,b$, then $a + 7b$.

@example
EPS for six years: −0.50, −0.20, 0.30, 0.60, 0.90, 1.40 (€).

@solution
1. $\overline{EPS} = 2.50 / 6 = 0.4167$.
2. Cross products: 2.2917, 0.9250, 0.0583, 0.0917, 0.7250, 2.4583; sum 6.55.
3. $b = 6.55 / 17.5 = 0.3743$ (€ per year).
4. $g = 0.3743 / 0.4167 = 89.83\%$.
5. $a = 0.4167 - 3.5 \times 0.3743 = -0.8933$; trend for $t = 7$: $-0.8933 + 7 \times 0.3743 = 1.73$ (€).

@answer
Slope 0.37 € per year, implied growth about 89.8%, trend EPS for year 7 of 1.73 €.

@pitfalls
- Computing year-on-year growth rates across a sign change.
- Forgetting to subtract the means in the numerator (using $\sum t \cdot EPS_t$).
- Dividing the slope by the last EPS instead of the average EPS.
- Taking the result at face value: with a small average EPS the growth rate explodes; consider absolute changes instead.
`,

  'L3.fundamental': ex`
@task
Accounting data of a firm: EBIT, CapEx, depreciation, the change in operating working capital and either invested capital or the book values of equity, debt and cash (or net income, dividends and book equity). You are asked for the reinvestment rate, the return on capital (or ROE) and the expected growth, sometimes with a change in the return on capital.

@idea
Growth is not free: it comes from reinvesting and from how well the reinvestment pays off.

$$RIR = \frac{\text{Net CapEx} + \Delta OWC}{EBIT(1-t)}, \qquad ROC = \frac{EBIT(1-t)}{BV_{E} + BV_{D} - \text{Cash}}, \qquad g = RIR \times ROC.$$

If the return on capital changes, existing assets also become more or less efficient, which adds a second term:

$$g = RIR \times ROC_t + \frac{ROC_t - ROC_{t-1}}{ROC_{t-1}}.$$

For equity: $g = b \times ROE$ with $b = 1 - \text{Dividends}/\text{Net income}$ and $ROE = \text{Net income}/BV_{E,t-1}$.

@steps
1. After-tax operating income: $EBIT(1 - t)$.
2. Net CapEx = CapEx − depreciation.
3. Reinvestment rate: (net CapEx + ΔOWC) / $EBIT(1 - t)$.
4. Return on capital: $EBIT(1 - t)$ over invested capital (book equity + book debt − cash, at the start of the year).
5. Growth: RIR × ROC; add $(ROC_t - ROC_{t-1})/ROC_{t-1}$ when the return on capital changes.

@example
A firm earned after-tax operating income of €100m on invested capital of €800m, with net CapEx of €25m and a working-capital increase of €15m. (a) Growth with unchanged ROC? (b) Growth if ROC rises by 2.5 percentage points next year?

@solution
1. $ROC = 100 / 800 = 12.5\%$.
2. $RIR = (25 + 15) / 100 = 40\%$.
3. (a) $g = 40\% \times 12.5\% = 5\%$.
4. (b) New ROC 15%: $g = 40\% \times 15\% + (15\% - 12.5\%)/12.5\% = 6\% + 20\% = 26\%$.

@answer
(a) 5%. (b) 26%, because the efficiency gain on existing assets adds 20 percentage points in that year.

@pitfalls
- Using total CapEx instead of net CapEx (CapEx − depreciation).
- Dividing reinvestment by pre-tax EBIT.
- Using end-of-year or market values for invested capital; the lecture uses start-of-year book values net of cash.
- Forgetting the second term when ROC changes, or keeping it for later years when ROC is stable again.
`,

  'L3.market': ex`
@task
A small firm, the size of its market today, the market's growth rate and a target market share in $n$ years. You are asked for the market size and the firm's revenue in $n$ years, and the compounded annual growth rate (CAGR) this implies.

@idea
For young firms, history says little. A top-down estimate asks how large the market will be and what share the firm can win. The required growth rate then follows from the start and end revenue:

$$R_n = M_0(1 + g_M)^n \times s, \qquad CAGR = \left(\frac{R_n}{R_0}\right)^{1/n} - 1.$$

@steps
1. Market in $n$ years: $M_0 (1 + g_M)^n$.
2. Firm revenue in $n$ years: market × target share.
3. CAGR: $(R_n / R_0)^{1/n} - 1$.
4. Sanity check: today's share $R_0 / M_0$ against the target share.

@example
A software firm had revenues of \$25m; its market had revenues of \$2,000m, growing 6% a year. You expect the firm to reach an 8% share in 10 years.

@solution
1. Market: $2{,}000 \times 1.06^{10} = 2{,}000 \times 1.7908 = 3{,}581.70$ (\$ million).
2. Firm revenue: $3{,}581.70 \times 0.08 = 286.54$ (\$ million).
3. CAGR: $(286.54 / 25)^{1/10} - 1 = 27.62\%$.

@answer
Revenue of \$286.54m in 10 years, a CAGR of 27.62%.

@pitfalls
- Applying the target share to today's market instead of the future market.
- Taking the 10th root of the growth multiple minus one ($11.46^{0.1}$, not $10.46^{0.1}$).
- Ignoring whether the target share is plausible given competition and saturation.
`,

  'L3.margin': ex`
@task
A loss-making or barely profitable firm, a path of revenue growth rates for five years and a target operating margin in year 5. You are asked for revenues, margins and operating income (EBIT) in a given year.

@idea
When the return on capital is negative, growth cannot come from reinvestment × ROC. Forecast revenues and a path for the operating margin instead:

- **Equal steps:** the margin rises by $(m_5 - m_0)/5$ each year.
- **Constant rate of cost decline:** operating expenses as a share of revenue, $1 - m$, fall at a constant rate $g$ with $(1 - m_5) = (1 - m_0)(1 + g)^5$.

EBIT in each year is revenue × margin.

@steps
1. Starting margin: $m_0 = EBIT_0 / R_0$.
2. Revenue path: $R_k = R_{k-1}(1 + g_k)$.
3. Margin in year $k$: $m_0 + k(m_5 - m_0)/5$ (or $1 - (1 - m_0)(1 + g)^k$ for the constant-rate version).
4. EBIT in year $k$: $R_k \times m_k$.

@example
Operating loss of \$10m on revenues of \$100m. Revenue growth: 100%, 75%, 50%, 30%, 30%. The margin improves in equal steps to 8% by year 5.

@solution
1. $m_0 = -10/100 = -10\%$; step $= (8\% - (-10\%))/5 = 3.6$ percentage points.
2. Revenues: 200, 350, 525, 682.50, 887.25.
3. Margins: −6.4%, −2.8%, 0.8%, 4.4%, 8.0%.
4. EBIT: −12.80, −9.80, 4.20, 30.03, 70.98 (\$ million).

@answer
EBIT turns positive in year 3 (\$4.20m) and reaches \$70.98m in year 5 on revenues of \$887.25m.

@pitfalls
- Growing EBIT itself at the revenue growth rate: with a negative base this makes losses grow.
- Applying all growth rates to year-0 revenue instead of compounding.
- Moving the margin by $m_5 - m_0$ in total but forgetting it is spread over five steps.
`,

  'L3.concept': ex`
@task
Concept questions on growth: a statement to mark true or false, four statements of which one is false (or true), or a short question with the answer that fits best. They cover historical averages, analyst forecasts and fundamental growth.

@idea
The lecture's core facts:

- **Historical growth:** geometric ≤ arithmetic average; volatile earnings mean-revert, so their history predicts poorly; negative earnings need a trend regression.
- **Time-series models (ARIMA):** fine for a quarter or a year, weak for long horizons and structural breaks.
- **Analysts:** more information and better short-term accuracy, but accuracy falls with the horizon and for small, volatile firms; bias is possible.
- **Fundamentals:** $g = RIR \times ROC$ for operating income, $g = b \times ROE$ for net income; a changing ROC adds an efficiency term; negative ROC means forecasting revenues and margins.
- Reinvestment needs fall as firms mature; ROC above the cost of capital lasts only as long as the competitive advantage.

@steps
1. Identify the growth source the statement is about: history, analysts or fundamentals.
2. Recall its defining fact and its main limitation.
3. Check the direction words: "higher", "always", "never", "more accurate further ahead".
4. Pick the statement that contradicts one of the facts (or the one that matches).

@example
True or false? "Analyst forecasts become more accurate the further ahead they look."

@solution
1. Source: analyst forecasts.
2. Their limitation: predictive power falls with the horizon.
3. The statement reverses that.

@answer
False. Analyst forecasts are most useful in the short run; their accuracy declines over longer horizons.

@pitfalls
- Thinking the arithmetic average can be below the geometric one.
- Using payout instead of retention (or reinvestment) in the growth formula.
- Applying RIR × ROC when ROC is negative.
- Forgetting that reinvestment needs shrink as firms mature.
`,
};
