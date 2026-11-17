import { ex, type ExplainMap } from '@/lib/explain';

export const L5: ExplainMap = {
  'L5.markowitz': ex`
@task
Two risky assets with expected excess returns, standard deviations and a correlation (or covariance). You are asked for the tangency (optimal risky) weights, the global minimum-variance (GMV) weights, the tangency Sharpe ratio, an investor's fraction in the risky portfolio, the tangency portfolio's return and risk, or the number of inputs Markowitz needs.

@idea
With excess returns $\mu_i$ and covariance $\sigma_{12} = \rho\sigma_1\sigma_2$:

$$w_1^{T} = \frac{\mu_1\sigma_2^2 - \mu_2\sigma_{12}}{\mu_1\sigma_2^2 + \mu_2\sigma_1^2 - (\mu_1 + \mu_2)\sigma_{12}}, \qquad w_1^{GMV} = \frac{\sigma_2^2 - \sigma_{12}}{\sigma_1^2 + \sigma_2^2 - 2\sigma_{12}}$$

The tangency portfolio maximises the Sharpe ratio; the investor then holds $y^* = \frac{E[R_T]}{A\sigma_T^2}$ in it and the rest in T-bills. Markowitz needs $n$ means, $n$ variances and $n(n-1)/2$ covariances.

@steps
1. $\sigma_{12} = \rho\sigma_1\sigma_2$.
2. Tangency weight $w_1$ from the formula; $w_2 = 1 - w_1$.
3. $E[R_T] = w_1\mu_1 + w_2\mu_2$; $\sigma_T = \sqrt{w_1^2\sigma_1^2 + w_2^2\sigma_2^2 + 2w_1w_2\sigma_{12}}$; $SR = E[R_T]/\sigma_T$.
4. $y^* = E[R_T]/(A\sigma_T^2)$.
5. GMV weight from its formula (it ignores the means).

@example
$\mu_1 = 6\%$, $\mu_2 = 10\%$, $\sigma_1 = 15\%$, $\sigma_2 = 25\%$, $\rho = 0.2$, A = 3.

@solution
1. $\sigma_{12} = 0.2 \times 0.15 \times 0.25 = 0.0075$.
2. $w_1 = (0.06 \times 0.0625 - 0.10 \times 0.0075)/(0.00375 + 0.00225 - 0.16 \times 0.0075) = 0.003/0.0048 = 0.625$.
3. $E[R_T] = 7.5\%$; $\sigma_T = 14.52\%$; SR $= 0.516$.
4. $y^* = 0.075/(3 \times 0.0211) = 1.185$ (borrowing).
5. $w_1^{GMV} = (0.0625 - 0.0075)/(0.0225 + 0.0625 - 0.015) = 0.786$.

@answer
Tangency 62.5% / 37.5%, Sharpe 0.516, y* = 1.19; GMV 78.6% in asset 1.

@pitfalls
- Using total instead of excess returns in the tangency formula.
- Forgetting the factor 2 in the GMV denominator.
- Counting covariances as $n^2$ instead of $n(n-1)/2$.
`,

  'L5.shrinkage': ex`
@task
Sample-optimised weights (or a sample covariance) are shrunk towards a target with intensity λ. You are asked for shrunk weights, the expected return of the shrunk portfolio, or a shrunk covariance.

@idea
Estimation error makes optimised weights extreme and unstable. **Shrinkage** pulls each estimate towards a simple target:

$$\tilde w_i = (1 - \lambda)\,w_i^{MV} + \lambda\,w_i^{target}, \qquad \tilde\sigma_{ij} = (1 - \lambda)\,\hat\sigma_{ij} + \lambda\,\sigma_{ij}^{target}$$

With the 1/N target each target weight is $1/N$. Shrunk weights still sum to 1.

@steps
1. Target weight ($1/N$ or as given).
2. $\tilde w_i = (1 - \lambda)w_i + \lambda \times$ target for each asset.
3. Portfolio excess return $= \sum \tilde w_i\mu_i$.
4. Covariance: same convex combination.

@example
Weights 1.4, −0.6, 0.2 with expected excess returns 6%, 4%, 8%; λ = 0.5 towards 1/N. A sample covariance of 0.02 is shrunk towards 0.01.

@solution
1. Target $= 1/3$.
2. $0.5 \times 1.4 + 0.5/3 = 0.867$; $0.5 \times (-0.6) + 0.167 = -0.133$; $0.1 + 0.167 = 0.267$.
3. $0.867 \times 6\% - 0.133 \times 4\% + 0.267 \times 8\% = 6.8\%$.
4. $0.5 \times 0.02 + 0.5 \times 0.01 = 0.015$.

@answer
Shrunk weights 0.867, −0.133, 0.267; expected excess return 6.8%; covariance 0.015.

@pitfalls
- Swapping λ and $1 - λ$ (λ is the weight on the target).
- Using 1/N in percent with a weight in decimals.
- Shrinking means, weights or covariances when the question asks about another input.
`,

  'L5.concept': ex`
@task
Concept questions on mean-variance optimisation and estimation error: true/false, find the false (or true) statement, or the best short answer.

@idea
- Markowitz needs many inputs ($2n + n(n-1)/2$); small errors in means cause large weight changes (**error maximisation**, Michaud); estimated weights are very noisy (Jobson and Korkie), more so with more assets and higher correlation.
- Out of sample, optimised portfolios rarely beat **1/N** (DeMiguel, Garlappi and Uppal).
- Remedies: **shrinkage** towards a target (equal means, structured covariance, 1/N), **Galton correction** (historical inputs regress to the mean; variances are most persistent, means least), **parametric portfolio policies** (weights as functions of a few characteristics: few parameters, less estimation error, no covariance matrix).
- Out-of-sample tests use only data available at each date.

@steps
1. Identify the method or finding in the statement.
2. Check its direction (more assets → more error; optimisers overweight extreme estimates).
3. Pick the odd one out among four options.

@example
True or false? "Estimation error in Markowitz weights decreases with the number of assets."

@solution
1. More assets → many more covariances to estimate.
2. Errors pile up and the optimiser exploits them.

@answer
False. The imprecision increases with the number of assets.

@pitfalls
- "Sample means are unbiased forecasts for all inputs": false (Galton).
- "PPPs need the full covariance matrix": false.
- "Optimisers underweight extreme estimates": false — they overweight them.
`,
};
