// Investment and Financing Decisions: concept bank (true and false statements, short answers as multiple choice).
// Built from the lecture slides and additional material on debt financing, incentives and information and capital
// budgeting, and from the practice exercises on equity financing.
import type { ConceptBank } from '@/lib/engine/types';

export const LECTURES: Record<string, string> = {
  '1': 'Equity Financing',
  '2': 'Debt Financing',
  '3': 'Financing Choices: Incentives and Information',
  '4': 'Capital Budgeting',
};

export const BANK: ConceptBank = {
  '1': {
    T: [
      'The total cost of an IPO to the original shareholders is the sum of the underpricing and the direct costs such as the underwriting spread.',
      'The underpricing cost of an IPO equals the number of new shares times the difference between the first-day price and the offer price.',
      'In a rights issue in which all rights are exercised or sold, the subscription price does not affect the wealth of existing shareholders.',
      'A lower subscription price in a rights issue means more new shares and a lower share price after the issue, for the same amount raised.',
      'The winner’s curse means that uninformed investors receive a larger allocation of the IPOs that perform badly and a smaller one of those that perform well.',
      'Because of the winner’s curse, the average first-day return overstates the return that uninformed investors actually earn from bidding in every IPO.',
      'IPO underpricing can be seen as compensation that keeps uninformed investors willing to participate.',
      'The underwriting spread is a direct cost of an equity issue, paid out of the gross proceeds.',
    ],
    F: [
      'A rights issue with a deep discount to the market price transfers wealth from existing to new shareholders.',
      'The proceeds of an IPO are the number of new shares times the first-day closing price.',
      'IPO underpricing benefits the original shareholders because the share price rises on the first day.',
      'Uninformed investors who bid in every IPO earn the average first-day return.',
      'The direct costs of an IPO are usually much larger than the underpricing when the first-day return is high.',
      'After a rights issue the share price is unchanged, because the issue raises new money.',
    ],
    MC: [
      { q: 'Why are shareholders indifferent between a one-for-five rights issue at a high price and a one-for-one issue at a low price that raise the same amount?', correct: ['Every shareholder receives rights in proportion to her holding, so the lower price only shifts value between her old and new shares; total wealth is unchanged.'], distractors: ['Because the share price after the issue is the same under both plans.', 'Because the underwriter guarantees the price.', 'Because new investors buy all the shares.'] },
      { q: 'What is the winner’s curse in IPOs?', correct: ['Uninformed investors get full allocations in the IPOs informed investors avoid and are rationed in the good ones, so their expected return is far below the average first-day return.'], distractors: ['The underwriter always wins the largest allocation.', 'Investors who win an auction pay less than the asset is worth.', 'Firms that go public always underperform afterwards.'] },
      { q: 'What makes up the cost of an IPO to the original shareholders?', correct: ['Underpricing (new shares sold below their first-day value) plus direct costs such as the underwriting spread.'], distractors: ['Only the underwriting spread.', 'Only the first-day price rise of the old shares.', 'The dividends paid to new shareholders.'] },
    ],
  },
  '2': {
    T: [
      'If a project’s cash flows are uncorrelated with the market, its risky debt is priced by discounting the expected payoff at the risk-free rate.',
      'The yield of a one-year zero-coupon bond is its face value divided by its price, minus one.',
      'The default spread of a bond is its yield minus the risk-free rate.',
      'A higher default spread is associated with a lower credit rating.',
      'When a firm adds a project financed with subordinated debt, the senior bondholders can gain because they have a larger claim in the bad state.',
      'With fairly priced securities, no taxes and no bankruptcy costs, shareholders are equally well off issuing straight or convertible debt.',
      'Bankruptcy costs only reduce the share price if the security issued can actually default.',
      'Convertible bondholders convert when the value of the shares they receive exceeds the principal.',
      'With fairly priced debt in a perfect market, existing shareholders capture the whole NPV of a new project.',
    ],
    F: [
      'The promised yield of a risky bond equals its expected return.',
      'Junior debt is repaid before senior debt in default.',
      'A convertible bond always gives shareholders a higher share price than straight debt in a perfect market.',
      'The face value of risky debt equals the amount raised times one plus the risk-free rate.',
      'Issuing convertible instead of straight debt changes the NPV of the project.',
      'Bankruptcy costs reduce the share price only if the firm issues convertible debt.',
    ],
    MC: [
      { q: 'Why is a risky zero-coupon bond discounted at the risk-free rate when the project’s cash flows are uncorrelated with the market?', correct: ['Its payoff then has a beta of zero, so investors require no risk premium; default risk lowers the expected payoff instead.'], distractors: ['Because bonds are always risk-free.', 'Because the yield already includes the default spread.', 'Because the face value is certain.'] },
      { q: 'How does a new subordinated debt issue that funds a positive-NPV project affect the existing senior bonds?', correct: ['Their value can rise and their rating improve, because the extra cash flow in the bad state goes to them first.'], distractors: ['They lose value because the firm has more debt.', 'Nothing changes because they mature at the same time.', 'They become junior to the new debt.'] },
      { q: 'Why might bankruptcy costs affect the share price with straight debt but not with a convertible bond?', correct: ['The straight debt defaults in the bad state, the convertible’s lower principal does not; costs only arise where default can happen.'], distractors: ['Convertibles are exempt from bankruptcy law.', 'Straight debt is always junior to convertibles.', 'Bankruptcy costs are paid by bondholders only.'] },
    ],
  },
  '3': {
    T: [
      'An entrepreneur financed with outside equity keeps only part of the gain from effort, so she exerts high effort for a smaller range of effort costs.',
      'Debt can give stronger effort incentives than outside equity because the entrepreneur keeps all the upside above the face value.',
      'Investors price securities on their beliefs about the entrepreneur’s effort, and the entrepreneur bears the cost if these beliefs are not met in equilibrium.',
      'With asymmetric information, good types find equity more underpriced than debt.',
      'Debt is less information-sensitive than equity, so it is less mispriced when investors cannot tell good firms from bad ones.',
      'In a pooling equilibrium both good and bad types issue debt, because issuing equity would reveal a bad type.',
      'The pecking order theory says firms use internal funds first, then debt, and equity last.',
      'With asymmetric information, the NPV of the financing transaction itself matters for the decision.',
    ],
    F: [
      'Outside equity gives the entrepreneur the same effort incentives as using her own money.',
      'Bad types prefer to issue debt because debt is overpriced for them by more than equity.',
      'Under asymmetric information, a bad type can issue equity at the pooled price without revealing her type.',
      'The pecking order theory predicts that firms prefer issuing equity to debt.',
      'Good types prefer equity because it does not require repayment.',
      'If investors cannot observe effort, debt and equity always lead to the same effort choice.',
    ],
    MC: [
      { q: 'Why can debt induce high effort when outside equity cannot?', correct: ['With debt the entrepreneur keeps the whole cash flow above the face value, so she captures more of the gain from effort than with a fixed equity share.'], distractors: ['Debt holders monitor effort directly.', 'Debt is cheaper because interest is tax deductible.', 'Equity investors forbid high effort.'] },
      { q: 'Which security does a good type prefer to issue when investors cannot tell types apart, and why?', correct: ['Debt, because it is the least information-sensitive and therefore the least underpriced security for a good type.'], distractors: ['Equity, because it has no fixed payments.', 'Equity, because it is overpriced for good types.', 'She is indifferent, because both are priced at the pooled value.'] },
      { q: 'What is the pecking order theory?', correct: ['Firms finance first with internal funds, then debt, and only last with equity, because more information-sensitive securities are more underpriced.'], distractors: ['Firms choose the debt ratio that trades off tax shields and distress costs.', 'Firms always issue equity after their share price has risen.', 'Firms keep a constant leverage ratio.'] },
    ],
  },
  '4': {
    T: [
      'A project should be undertaken if the present value of its incremental cash flows is positive.',
      'Sunk costs, such as a completed feasibility study, are irrelevant for the investment decision.',
      'The value of an unused asset that a project would use is an opportunity cost of the project.',
      'Lost sales of an existing product caused by a new product are an incremental cash flow of the new project.',
      'Free cash flow is the cash flow a project would generate if it were all-equity financed.',
      'An increase in net working capital is a cash outflow.',
      'Interest payments and dividends do not enter the free cash flow.',
      'Depreciation is a non-cash expense, but it lowers taxes and so affects free cash flow.',
      'With a predetermined debt schedule, tax shields are discounted at the cost of debt.',
      'With a constant leverage ratio, tax shields are discounted at the unlevered cost of capital.',
      'A project should be discounted at a rate that reflects its own systematic risk, not the firm’s average risk.',
      'A high standard deviation of a project’s cash flows does not imply a high beta if the variability is diversifiable.',
    ],
    F: [
      'A completed market study should be included as a cost when deciding whether to launch the product.',
      'Overhead costs allocated to a project are always incremental cash flows.',
      'Free cash flow is computed from net income, so interest expenses must be deducted.',
      'A decrease in net working capital is a cash outflow.',
      'A firm should discount all its projects at its own cost of equity.',
      'The WACC approach is more flexible than APV when the debt schedule is fixed in advance.',
      'Taxes in the free cash flow are computed on taxable income after interest.',
      'Higher operating leverage lowers a project’s beta.',
    ],
    MC: [
      { q: 'Which of the following is relevant to the decision whether to undertake a project?', correct: ['The value of a currently unused machine that the project would use.', 'Additional advertising expenses for the new product.', 'An increase in the sales of an existing product caused by the project.'], distractors: ['The cost of a feasibility study completed last month.', 'The part of headquarters’ electricity costs allocated to the project.', 'Dividends paid to shareholders from the project’s profits.'] },
      { q: 'When should tax shields be discounted at the cost of debt, and when at the unlevered cost of capital?', correct: ['At r_D when the debt schedule is known in advance; at r_U when debt is adjusted to keep a constant leverage ratio.'], distractors: ['Always at r_D, because tax shields come from debt.', 'Always at r_U, because they come from the operations.', 'At the WACC in both cases.'] },
      { q: 'How do you find the discount rate for a project in a new line of business?', correct: ['Unlever the equity beta of firms in that business (twin firms), relever it at the project’s capital structure and apply the CAPM.'], distractors: ['Use the firm’s own equity beta.', 'Use the average beta of all firms in the market.', 'Use the project’s standard deviation instead of beta.'] },
      { q: 'What is free cash flow?', correct: ['EBITDA − τ·EBIT − CapEx − ΔNWC (+ other cash items): the cash the project generates as if all-equity financed.'], distractors: ['Net income plus depreciation.', 'EBITDA minus interest and dividends.', 'Revenue minus all expenses on the income statement.'] },
    ],
  },
};
