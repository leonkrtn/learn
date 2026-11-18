import { ex, type ExplainMap } from '@/lib/explain';

export const L5: ExplainMap = {
  'L5.rf': ex`
@task
A local-currency government bond yield for an emerging market and one way to measure the government's default risk: a dollar or euro bond against US Treasuries or German Bunds, a sovereign CDS spread against the US CDS, or a rating with its typical spread. You are asked for the default spread and the local-currency risk-free rate.

@idea
A government that can default does not issue risk-free bonds: its local-currency yield contains a default spread. The risk-free rate in that currency is the yield **net of** that spread.

$$r_{f,local} = \text{local government yield} - \text{default spread}.$$

The spread can come from a foreign-currency bond of the same government (its yield minus the yield of a riskless government in that currency), from CDS (net of the US CDS), or from the average spread of countries with the same rating.

@steps
1. Default spread: dollar/euro bond yield − US/German yield, or CDS − US CDS, or the rating spread.
2. Local risk-free rate: local-currency yield − spread.

@example
The government's rupiah bonds yield 12%. It also has a euro bond yielding 6%; German government bonds yield 2%.

@solution
1. Default spread: $6\% - 2\% = 4\%$.
2. Rupiah risk-free rate: $12\% - 4\% = 8\%$.

@answer
The rupiah risk-free rate is 8%, after removing the 4% default spread.

@pitfalls
- Taking the local-currency yield itself as risk-free.
- Subtracting the US or German yield from the local yield: that difference mixes default risk and inflation.
- Using the gross CDS spread without netting the US CDS when the question asks for it.
`,

  'L5.crp': ex`
@task
The mature-market (US) equity premium, a country's default spread, and the volatilities of the country's equity index, its government bond and the US equity market. You are asked for the country risk premium and the total equity risk premium with three approaches.

@idea
Equity investors in a riskier country want more than the mature-market premium. Three ways to size the extra:

1. Add the default spread: $ERP = ERP_{US} + \text{spread}$.
2. Scale the spread up because equities are riskier than bonds: $CRP = \text{spread} \times \frac{\sigma_{Equity}}{\sigma_{Bond}}$, total $= ERP_{US} + CRP$.
3. Relative equity volatility: total $= ERP_{US} \times \frac{\sigma_{Country}}{\sigma_{US}}$, CRP = total − $ERP_{US}$.

@steps
1. Approach 1: add spread and US premium.
2. Approach 2: multiply the spread by $\sigma_E/\sigma_B$, then add the US premium.
3. Approach 3: multiply the US premium by $\sigma_{Country}/\sigma_{US}$; subtract the US premium for the country part.

@example
US premium 5.50%, default spread 2.16%, country equity volatility 30%, country bond volatility 20%, US equity volatility 18%.

@solution
1. Approach 1: $5.50\% + 2.16\% = 7.66\%$.
2. Approach 2: $CRP = 2.16\% \times 30/20 = 3.24\%$; total $8.74\%$.
3. Approach 3: $5.50\% \times 30/18 = 9.17\%$; country part $3.67\%$.

@answer
Total premium 7.66%, 8.74% or 9.17% depending on the approach.

@pitfalls
- Inverting the volatility ratio.
- Reporting the country part when the total premium is asked (or the other way round).
- Using the bond volatility in approach 3: it compares equity markets only.
`,

  'L5.ke': ex`
@task
A firm's beta, the risk-free rate, the mature-market premium, the country risk premium (CRP) and the firm's exposure to country risk λ. You are asked for the cost of equity with the additive, the integrated (beta-scaled) and the λ approach.

@idea
Where country risk enters the cost of equity is a choice:

- **Additive:** $E(R) = r_f + CRP + \beta \times ERP_{US}$. Every firm in the country bears the same country risk.
- **Integrated:** $E(R) = r_f + \beta(ERP_{US} + CRP)$. Country risk scales with market risk.
- **Separate factor:** $E(R) = r_f + \beta \times ERP_{US} + \lambda \times CRP$, with λ from a regression or from revenue exposure (firm's share of local sales / average local firm's share).

@steps
1. Additive: add the CRP once.
2. Integrated: add CRP to the US premium, multiply by beta.
3. λ approach: multiply the CRP by λ.

@example
$r_f$ = 4%, $\beta$ = 1.2, $ERP_{US}$ = 5.5%, CRP = 3%, λ = 0.5.

@solution
1. Additive: $4\% + 3\% + 1.2 \times 5.5\% = 13.6\%$.
2. Integrated: $4\% + 1.2 \times 8.5\% = 14.2\%$.
3. λ approach: $4\% + 1.2 \times 5.5\% + 0.5 \times 3\% = 12.1\%$.

@answer
13.6%, 14.2% and 12.1%.

@pitfalls
- Multiplying the CRP by beta in the additive approach.
- Forgetting to multiply the CRP by beta in the integrated approach.
- Treating λ as a beta on the US premium.
`,

  'L5.concept': ex`
@task
Concept questions on emerging markets: true or false, the odd statement out of four, or the answer that fits best. They cover local risk-free rates, default spreads, country risk premiums and how country risk enters the cost of equity.

@idea
- Risk-free rates differ by currency (mainly expected inflation) and must be net of the government's default spread.
- Default spreads come from foreign-currency sovereign bonds, CDS (net of the US CDS) or ratings.
- Country equity premiums: spread, spread × $\sigma_E/\sigma_B$, or relative equity volatility.
- Country risk enters additively, beta-scaled, or with a firm-specific λ (revenue exposure or regression).
- Inputs move fast in emerging markets; update them and run sensitivity analysis.

@steps
1. Identify whether the statement is about $r_f$, the spread, the premium or the cost of equity.
2. Recall the rule for that input.
3. Check whether the statement reverses a direction (equity vs bond volatility) or a definition (local yield as risk-free).

@example
True or false? "The yield on a local-currency government bond of an emerging market is always risk-free."

@solution
1. Input: the risk-free rate.
2. Rule: local yields include a default spread when the government can default.
3. The statement ignores the default spread.

@answer
False. Subtract the default spread to get the local risk-free rate.

@pitfalls
- Treating every local government yield as risk-free.
- Believing the country risk premium must be the same for all firms in a country.
- Swapping equity and bond volatility in the scaling.
`,
};
