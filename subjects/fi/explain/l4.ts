import { ex, type ExplainMap } from '@/lib/explain';

export const L4: ExplainMap = {
  'L4.treynorBlack': ex`
@task
Security analysis gives alphas, betas and residual standard deviations for a few stocks. With the market risk premium and $\sigma_M$, you are asked for the stocks' weights in the active portfolio, its alpha (beta, residual variance), its weight in the optimal risky portfolio, the resulting beta and standard deviation, the Sharpe ratio improvement and the benchmark risk.

@idea
**Treynor-Black** combines the passive index with an active portfolio of mispriced stocks.

1. Inside the active portfolio each stock gets a weight proportional to **alpha over residual variance**: $w_i \propto \alpha_i/\sigma^2(e_i)$, scaled so the weights sum to 1.
2. The active portfolio's weight next to the index:
$$w^0 = \frac{\alpha_A/\sigma^2(e_A)}{E[R_M]/\sigma_M^2}, \qquad w^* = \frac{w^0}{1 + (1 - \beta_A)w^0}$$
3. The gain: $SR_P^2 = SR_M^2 + \left(\alpha_A/\sigma(e_A)\right)^2$.

@steps
1. $\alpha_i/\sigma^2(e_i)$ per stock; divide by their sum → active weights.
2. $\alpha_A = \sum w_i\alpha_i$, $\beta_A = \sum w_i\beta_i$, $\sigma^2(e_A) = \sum w_i^2\sigma^2(e_i)$.
3. $w^0$ and $w^*$.
4. Optimal portfolio: $\beta_P = 1 - w^* + w^*\beta_A$; $\sigma_P = \sqrt{\beta_P^2\sigma_M^2 + w^{*2}\sigma^2(e_A)}$.
5. $SR_P = \sqrt{SR_M^2 + \alpha_A^2/\sigma^2(e_A)}$; improvement $= SR_P - SR_M$.
6. Benchmark risk $= |w^*|\sqrt{(1 - \beta_A)^2\sigma_M^2 + \sigma^2(e_A)}$.

@example
Stock A: α 2%, β 1.2, σ(e) 20%. Stock B: α 1%, β 0.8, σ(e) 10%. MRP 6%, $\sigma_M$ 20%.

@solution
1. $0.02/0.04 = 0.5$; $0.01/0.01 = 1.0$; sum 1.5 → weights 1/3 and 2/3.
2. $\alpha_A = 1.333\%$, $\beta_A = 0.933$, $\sigma^2(e_A) = 0.04/9 + 0.04/9 = 0.00889$.
3. $w^0 = (0.01333/0.00889)/(0.06/0.04) = 1.0$; $w^* = 1/(1 + 0.0667) = 0.9375$.
4. $\beta_P = 0.0625 + 0.9375 \times 0.933 = 0.9375$; $\sigma_P = 20.7\%$.
5. $SR_P = \sqrt{0.09 + 0.02} = 0.3317$; improvement $0.0317$.
6. Benchmark risk $= 0.9375\sqrt{0.0667^2 \times 0.04 + 0.00889} = 8.93\%$.

@answer
Active weights 1/3 and 2/3; w* = 0.9375; Sharpe ratio rises by 0.032.

@pitfalls
- Using total variance instead of residual variance in the weights.
- Forgetting the beta adjustment in $w^*$.
- Squaring the weights for alpha or beta (only the residual variance uses $w_i^2$).
- Adding Sharpe ratios instead of squares.
`,

  'L4.blackLitterman': ex`
@task
Two asset classes (bonds, stocks) with standard deviations, correlation, market weights and the average risk aversion; a view on the difference of their returns with its uncertainty. You are asked for the market variance, the market-implied (baseline) expected excess returns, the uncertainty of the view's difference, and the revised (posterior) expected returns.

@idea
**Step 1 – baseline from equilibrium.** If investors hold the market weights, expected returns must be those that make these weights optimal:

$$E[R_M] = A\,\sigma_M^2, \qquad E[R_i] = \beta_i E[R_M], \quad \beta_i = \frac{\text{cov}(R_i, R_M)}{\sigma_M^2}$$

**Step 2 – combine with the view** $Q$ on $E[R_B] - E[R_S]$. The baseline implies $Q_E = E[R_B] - E[R_S]$. The difference $D = Q - Q_E$ is spread over the assets in proportion to how their forecasts covary with the view:

$$\sigma_D^2 = \sigma_\varepsilon^2 + \sigma_{Q_E}^2, \quad \sigma_{Q_E}^2 = \tau(\sigma_B^2 + \sigma_S^2 - 2\sigma_{BS})$$
$$E^*[R_B] = E[R_B] + \frac{D}{\sigma_D^2}\,\tau(\sigma_B^2 - \sigma_{BS}), \qquad E^*[R_S] = E[R_S] + \frac{D}{\sigma_D^2}\,\tau(\sigma_{BS} - \sigma_S^2)$$

(If the covariances of the forecasts are given directly, they replace $\tau\Sigma$.) A confident view (small $\sigma_\varepsilon$) moves the posterior more.

@steps
1. $\sigma_{BS} = \rho\sigma_B\sigma_S$; $\sigma_M^2 = w_B^2\sigma_B^2 + w_S^2\sigma_S^2 + 2w_Bw_S\sigma_{BS}$.
2. $E[R_M] = A\sigma_M^2$; betas and baseline returns.
3. $Q_E$, $\sigma_{Q_E}^2$, $\sigma_D^2$, $D$.
4. Posterior returns with the formulas above.

@example
Bonds σ 8%, stocks σ 20%, ρ 0.2, weights 40/60, A = 3, τ = 0.01. View: bonds minus stocks = −4% with σ 2%.

@solution
1. $\sigma_{BS} = 0.0032$; $\sigma_M^2 = 0.00102 + 0.0144 + 0.00154 = 0.01696$.
2. $E[R_M] = 5.09\%$; $E[R_B] = 1.34\%$, $E[R_S] = 7.58\%$.
3. $Q_E = -6.24\%$; $\sigma_{Q_E}^2 = 0.01 \times (0.0064 + 0.04 - 0.0064) = 0.0004$; $\sigma_D^2 = 0.0004 + 0.0004 = 0.0008$ ($\sigma_D = 2.83\%$); $D = +2.24\%$.
4. $D/\sigma_D^2 = 28$: bonds $1.34\% + 28 \times 0.01 \times 0.0032 = 1.43\%$; stocks $7.58\% + 28 \times 0.01 \times (0.0032 - 0.04) = 6.55\%$.

@answer
Baseline 1.34% / 7.58%; posterior 1.43% for bonds and 6.55% for stocks.

@pitfalls
- Using historical means instead of the equilibrium baseline.
- Forgetting τ when scaling the covariances of the forecasts.
- Reading a low view sd as low confidence (it is high confidence).
`,

  'L4.fee': ex`
@task
Analysts forecast alphas for many stocks with a given accuracy; with the residual sd and the investor's risk aversion you are asked for the information ratio per stock after adjusting for forecast precision, the fee rate the investor would pay, and the fee in dollars (or the inverse questions).

@idea
Noisy forecasts must be shrunk: the usable alpha is $R^2 \times \alpha$, so per stock $IR = R^2\alpha/\sigma(e)$. With $n$ independent stocks the squared information ratios add up. A mean-variance investor gains utility $\frac{1}{2A}(SR_P^2 - SR_M^2)$ from active management, so the most she would pay is

$$f = \frac{n \cdot IR^2}{2A}$$

@steps
1. $IR = R^2\alpha/\sigma(e)$ (with perfect forecasts $R^2 = 1$).
2. Fee rate $f = n \cdot IR^2/(2A)$.
3. Fee in dollars $= f \times$ assets.
4. Inverse: $n = 2Af/IR^2$ or $IR = \sqrt{2Af/n}$.

@example
100 stocks, average forecast alpha 2%, accuracy R² 10%, residual sd 8%, A = 3, assets \$100m.

@solution
1. $IR = 0.10 \times 0.02/0.08 = 0.025$.
2. $f = 100 \times 0.025^2/6 = 1.04\%$.
3. Fee $= 0.0104 \times 100{,}000{,}000 \approx$ \$1.04m.

@answer
Fee rate about 1.04% of assets, roughly \$1.04 million.

@pitfalls
- Forgetting the $R^2$ adjustment.
- Forgetting the square or the factor 2 in $2A$.
- Using $\sqrt n$ instead of $n$.
`,

  'L4.concept': ex`
@task
Concept questions on active portfolio management: true/false, find the false (or true) statement, or the best short answer.

@idea
- **Treynor-Black**: weights ∝ $\alpha/\sigma^2(e)$ (residual, not total variance); $SR_P^2 = SR_M^2 + IR^2$. Raw TB weights are often extreme; shrinking alphas by forecast accuracy (Kane, Kim and White) makes them **less** extreme.
- **Benchmark risk** = sd of the tracking error; constraining it costs efficiency with correct inputs but helps with wrong ones.
- **Black-Litterman**: equilibrium (market-implied) baseline + views; the covariance matrix is estimated from data, not from the baseline. A low view sd means **high** confidence; without views the portfolio is the market.
- The value of active management depends on risk aversion: $f = n\,IR^2/(2A)$.
- Single-index model: covariance between stocks $= \beta_i\beta_j\sigma_M^2$ because residuals are uncorrelated.

@steps
1. Identify the model (TB, BL, fee, SIM).
2. Check the rule; watch "total vs residual" and "low sd = high confidence".
3. Pick the odd one out among four options.

@example
True or false? "Adjusting alpha forecasts for their precision makes Treynor-Black weights more extreme."

@solution
1. Precision adjustment multiplies alphas by $R^2 < 1$.
2. Smaller alphas → smaller $\alpha/\sigma^2(e)$ → smaller positions.

@answer
False. It makes the weights much less extreme.

@pitfalls
- "TB weights ∝ alpha/total variance": false.
- "BL estimates the covariance matrix from equilibrium forecasts": false.
- "A low view sd means low confidence": false.
`,
};
