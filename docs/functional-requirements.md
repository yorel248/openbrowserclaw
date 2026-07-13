# Functional Requirements Specification
## Australian Retirement Planning Software — Including Education Bond Module

**Version:** 1.0  
**Jurisdiction:** Australia (NSW Focus)  
**Date:** July 2026  

---

## SECTION 1 — USER PROFILE & HOUSEHOLD SETUP

### FR-001 — Individual Profile
- The system shall allow a user to create a single or couple profile.
- The system shall capture: full name, date of birth, current age (auto-calculated), gender, employment status, NSW/state residency.
- The system shall support profiles for: employed, self-employed, part-time, career break, unemployed, retired.

### FR-002 — Partner/Spouse Profile
- The system shall allow an optional second member (spouse/partner) to be added to the household.
- All projections shall support joint and individual views across both members.
- The system shall independently model each partner's super, income, Age Pension eligibility, and tax.

### FR-003 — Data Persistence
- The system shall save all user inputs between sessions via authenticated account.
- The system shall support multiple saved plans per user (e.g. "Base Case", "Early Retirement", "Part-Time Scenario").
- The system shall allow export of plan data in PDF and CSV formats.

---

## SECTION 2 — SUPERANNUATION (SUPER) MODULE

### FR-004 — Account Types
- The system shall support the following Australian super account types:
  - Accumulation account (pre-retirement)
  - Account-Based Pension (ABP) — retirement phase
  - Transition to Retirement (TTR) income stream
  - Self-Managed Super Fund (SMSF)
  - Multiple super fund accounts per member
- The system shall allow users to nominate a primary super fund and consolidate multiple funds.

### FR-005 — Contributions — Concessional (Pre-Tax)
- The system shall model employer Super Guarantee (SG) contributions at the legislated rate:
  - 12% of ordinary time earnings from 1 July 2025 onward
  - Support future rate changes if legislated
- The system shall apply the concessional contributions cap:
  - $32,500/year from 1 July 2026 (indexed annually to AWOTE in $2,500 increments)
- The system shall model salary sacrifice contributions up to the concessional cap.
- The system shall model catch-up concessional contributions for members with a Total Superannuation Balance (TSB) below $500,000, carrying forward unused cap amounts from up to 5 prior financial years (back to 2019–20).
- The system shall warn the user if projected contributions will exceed the concessional cap and calculate the excess tax applicable (taxed at marginal rate less 15% tax offset).

### FR-006 — Contributions — Non-Concessional (After-Tax)
- The system shall apply the non-concessional contributions (NCC) cap:
  - $130,000/year from 1 July 2026 (four times the concessional cap)
- The system shall model the bring-forward rule for members under 75:
  - Up to $390,000 over 3 years from 1 July 2026
- The system shall restrict NCC eligibility based on TSB:
  - TSB ≥ $2.1M (transfer balance cap): NCC not permitted
  - TSB between $1.66M–$2.1M: reduced bring-forward available
  - TSB < $1.66M: full bring-forward available
- The system shall model government super co-contributions:
  - 50 cents per $1 of personal NCC up to $500 maximum
  - Eligible income threshold: $49,293 (2026–27), phasing out at $64,293
  - Automatic ATO payment modeled; user must be under age 71

### FR-007 — Spouse Contributions
- The system shall model contributions made by one spouse to the other's super fund.
- The system shall calculate the spouse contribution tax offset:
  - 18% of up to $3,000 contributed = maximum $540 offset
  - Full offset when receiving spouse earns $37,000 or less; phases out at $40,000
- Spouse contributions shall count toward the receiving spouse's NCC cap.

### FR-008 — Downsizer Contributions
- The system shall model downsizer contributions for members aged 55 and over:
  - Up to $300,000 per eligible person ($600,000 per couple)
  - Property must have been owned by member or spouse for 10 or more years
  - Contribution must be made within 90 days of settlement
  - Total contributions cannot exceed total sale proceeds
- Downsizer contributions shall NOT count toward concessional or non-concessional caps.
- The system shall flag the impact of downsizer contributions on TSB and downstream NCC and catch-up concessional eligibility.

### FR-009 — Transfer Balance Cap
- The system shall apply and track the Transfer Balance Cap (TBC):
  - $2.1 million from 1 July 2026
- The system shall prevent modeling of retirement phase transfers that exceed the TBC.
- The system shall warn if projected super balance at retirement will approach or exceed the TBC.

### FR-010 — Preservation Age & Access Rules
- The system shall enforce superannuation preservation age:
  - Age 60 for all Australians born after 30 June 1964
- The system shall block modeled super withdrawals prior to preservation age except:
  - Transition to Retirement (TTR) income streams (age 60–67, still working)
  - Defined compassionate grounds or severe financial hardship (flagged, not calculated)
- The system shall model the condition of release once preservation age is reached and member is retired.

### FR-011 — Minimum Pension Drawdown
- The system shall enforce minimum annual drawdown rates for Account-Based Pensions:
  - Under 65: 4%
  - 65–74: 5%
  - 75–79: 6%
  - 80–84: 7%
  - 85–89: 9%
  - 90–94: 11%
  - 95 and over: 14%
- The system shall warn if projected drawdown falls below the minimum and flag the potential loss of tax-free pension phase status.

### FR-012 — Super Fund Investment Options
- The system shall allow the user to select or define a super investment option:
  - Preset options: Conservative, Balanced, Growth, High Growth, Lifecycle/MySuper
  - Custom option: user-defined expected annual return rate
- The system shall apply the investment return assumption within the super fund for accumulation and pension phases separately.

### FR-013 — SMSF Support
- The system shall support SMSF as an account type with:
  - Up to 6 members per fund
  - Custom asset allocation (Australian shares, international shares, property, bonds, cash)
  - Annual SMSF administration cost input (trustee fees, audit, ATO levy)
  - Annual return lodgment reminder / compliance flag (not lodged = pension tax-free status at risk)
  - SMSF supervisory levy modeling ($259/year per current ATO rates)

---

## SECTION 3 — INCOME & EMPLOYMENT MODULE

### FR-014 — Employment Income
- The system shall allow input of current gross annual salary or wages.
- The system shall support multiple income sources per member (e.g., salary + rental + business).
- The system shall model future income changes:
  - Pay rises (percentage or fixed amount per year)
  - Scheduled career breaks (start date, duration, income during break)
  - Part-time transitions (e.g., reduce to 60% FTE from age 58)
  - Redundancy/termination lump sum
  - Return to work post-break

### FR-015 — Self-Employment & Business Income
- The system shall support self-employed income with user-defined SG contribution percentage (minimum 12% of ordinary time earnings applies where relevant).
- The system shall allow business sale proceeds as a one-off lump sum event at a user-defined age/year.

### FR-016 — Other Income Sources
- The system shall support unlimited additional income streams including:
  - Rental property income
  - Dividends and investment distributions
  - Trust distributions
  - Defined benefit pension income
  - Government entitlements (Age Pension — see FR-019 to FR-022)
  - Annuity income
  - Inheritance receipts (lump sum, user-defined year)
  - Part-time employment post-retirement

---

## SECTION 4 — EXPENSES & SPENDING MODULE

### FR-017 — Retirement Spending Goals
- The system shall allow the user to specify a target annual retirement income in today's dollars.
- The system shall reference ASFA Retirement Standard benchmarks (updated February 2026):
  - Comfortable single: ~$51,278/year
  - Comfortable couple: ~$72,148/year
  - Modest single: ~$33,134/year
  - Modest couple: ~$47,731/year
- The system shall allow full customisation of spending amounts beyond these benchmarks.

### FR-018 — Expense Modeling
- The system shall support recurring annual expenses with individual inflation rates per expense category.
- The system shall support one-off large expenses at user-defined years:
  - Home renovation, holiday, vehicle purchase, private school fees, aged care costs, medical procedures
- The system shall model pre-retirement and post-retirement expense profiles separately.
- The system shall allow a "spending smile" curve — declining real spending in later retirement years (user-adjustable).

---

## SECTION 5 — AGE PENSION MODULE

### FR-019 — Age Pension Eligibility
- The system shall assess and model Australian Age Pension eligibility based on:
  - Qualifying age: 67 (for those born on or after 1 January 1957)
  - Australian residency requirements (10 years continuous, 5 years without break — flagged; user confirms)

### FR-020 — Assets Test (from 1 July 2026)
- The system shall calculate Age Pension entitlement under the assets test using current thresholds (CPI-indexed 3 times per year):

| Situation | Full Pension Threshold | Part Pension Cut-off |
|---|---|---|
| Single Homeowner | $333,000 | $733,500 |
| Single Non-Homeowner | $600,000 | $1,000,500 |
| Couple Homeowner | $499,000 | $1,102,500 |
| Couple Non-Homeowner | $766,000 | $1,369,500 |

- Pension reduces by $3 per fortnight per $1,000 of assessable assets above the lower threshold.
- The system shall automatically exclude exempt assets: principal place of residence, certain funeral bonds, some motor vehicles.

### FR-021 — Income Test (from 1 July 2026)
- The system shall apply the income test:
  - Single: full pension up to $226/fortnight; cut-off at $2,619.80/fortnight
  - Couple: full pension up to $400/fortnight combined; cut-off at $4,000.80/fortnight combined
- Pension reduces at 50 cents per $1 of income above the lower threshold.
- The system shall model deeming rates on financial assets (as at 20 March 2026):
  - First $64,200 (single) / $106,200 (couple combined): deemed at 1.25% p.a.
  - Above those thresholds: deemed at 3.25% p.a.
- The system shall determine which test (assets or income) produces the lower pension and apply that result.

### FR-022 — Age Pension Rate
- The system shall calculate the resulting Age Pension payment (full or part) and include it in retirement income projections:
  - Full single pension: $1,200.90/fortnight including supplements (indexed)
  - Full couple pension: $1,808.72/fortnight combined including supplements
- The system shall model CPI indexation of the Age Pension rate annually.

---

## SECTION 6 — PROPERTY & REAL ESTATE MODULE

### FR-023 — Principal Residence
- The system shall allow input of the primary residence (current market value, purchase year, ownership percentage if shared).
- The system shall exclude the principal residence from the Age Pension assets test.
- The system shall model future sale of the principal residence:
  - Sale proceeds input
  - CGT: exempt for principal residence (system notes exemption applies)
  - Downsizer contribution opportunity triggered automatically if user is 55+

### FR-024 — Investment Properties
- The system shall allow input of up to 10 investment properties with:
  - Current market value
  - Purchase price and date (for CGT calculation)
  - Annual rental income
  - Annual property expenses (rates, maintenance, insurance, management fees)
  - Loan balance and interest rate
  - Annual capital growth rate assumption
  - Planned sale year (optional)
- The system shall model capital gains tax on sale:
  - 50% CGT discount for assets held more than 12 months
  - Net capital gain added to assessable income in year of sale
  - CGT included in tax estimation for that year
- Rental income shall feed into the income test for Age Pension calculations.

### FR-025 — Debt & Mortgage Modeling
- The system shall model home loan and investment loan balances:
  - Current balance, interest rate (fixed or variable), loan term remaining
  - Monthly repayments (principal + interest or interest only)
  - Additional lump-sum repayments modeled as one-off events
  - Loan payoff date auto-calculated
- The system shall allow users to model the impact of paying off the mortgage early on cash flow and retirement readiness.

---

## SECTION 7 — INVESTMENT PORTFOLIO MODULE (NON-SUPER)

### FR-026 — Investment Assets Outside Super
- The system shall support the following non-super asset classes:
  - Australian shares / ETFs
  - International shares / ETFs
  - Managed funds
  - Bonds / fixed income
  - Cash / term deposits
  - Cryptocurrency (user-defined; flagged as high volatility)
  - Education Bonds (dedicated module — see Section 13, FR-047 to FR-058)
- Each asset shall allow: current value, expected annual return, expected annual income yield, franking credit percentage.

### FR-027 — Franking Credits
- The system shall model franking credits on Australian share dividends:
  - Franking credit = (dividend / (1 − 0.30)) × 0.30
  - Excess franking credits are refundable for individuals in lower tax brackets
  - Franking credits included in assessable income and offset against tax

### FR-028 — Bridge Fund (Pre-Preservation Age)
- The system shall model a bridge fund for users planning early retirement (before age 60):
  - Non-super investments fund living expenses from retirement date until super preservation age (60)
  - System auto-calculates the required bridge fund balance at retirement to sustain the gap period
  - System shows bridge fund depletion timeline alongside super accumulation

---

## SECTION 8 — TAX ESTIMATION MODULE

### FR-029 — Income Tax (Individual)
- The system shall estimate annual income tax for each member based on 2026–27 resident tax rates (updated annually):

| Taxable Income | Tax Payable |
|---|---|
| $0 to $18,200 | Nil |
| $18,201 to $45,000 | 19 cents per $1 over $18,200 |
| $45,001 to $120,000 | $5,092 + 32.5 cents per $1 over $45,000 |
| $120,001 to $180,000 | $29,467 + 37 cents per $1 over $120,000 |
| $180,001 and over | $51,667 + 45 cents per $1 over $180,000 |

- Medicare Levy: 2% of taxable income.
- Low Income Tax Offset (LITO) and other applicable offsets applied.
- Where Education Benefit Claims are made, the ETB is added to the Education Beneficiary's assessable income — NOT the Bond Owner's.

### FR-030 — Seniors Tax Concessions
- The system shall apply Seniors and Pensioners Tax Offset (SAPTO) for eligible retirees:
  - Single: approximately $35,812/year tax-free effective threshold
  - Couple: approximately $31,888/year each tax-free effective threshold
- The system shall model SAPTO eligibility conditions (Age Pension age, not in full-time work).

### FR-031 — Super Contributions Tax
- The system shall model 15% contributions tax on concessional contributions entering super.
- The system shall model Division 293 tax (extra 15%) for high-income earners with income + concessional contributions exceeding $250,000.

### FR-032 — Retirement Phase Tax
- The system shall model tax-free treatment of:
  - Super income stream (ABP) payments after age 60 — fully tax-free
  - Earnings within pension phase accounts (within TBC) — 0% tax
- The system shall model tax-free lump sum withdrawals from taxed super funds after age 60.
- For withdrawals before age 60 (TTR): taxed component taxed at marginal rate minus 15% offset.

---

## SECTION 9 — SCENARIO MODELLING & ANALYSIS

### FR-033 — Base Case Plan
- The system shall produce a base case retirement projection showing:
  - Year-by-year net worth (super + investments + property − liabilities)
  - Annual income by source (super drawdown, Age Pension, investment income, employment)
  - Annual expenses and surplus/deficit
  - Age at which funds are exhausted (if applicable) or surplus at death
  - Default planning horizon: to age 95 (adjustable by user)

### FR-034 — What-If Scenarios
- The system shall allow users to create and name multiple alternative scenarios branched from the base case, including:
  - Retire 2 years earlier or later
  - Increase salary sacrifice by a nominated amount per year
  - Sell investment property in a nominated year
  - Take a 2-year career break
  - Downsize home and make downsizer contribution
  - Change super investment option to growth or conservative
  - Increase or decrease retirement spending
  - One spouse stops working
  - Withdraw Education Bond at 10-year mark vs. hold longer
  - Use Education Bond earnings for school fees vs. leave invested

### FR-035 — Scenario Comparison
- The system shall display two or more scenarios side-by-side showing:
  - Portfolio balance over time (chart)
  - Total lifetime income
  - Age Pension received
  - Age at portfolio exhaustion (if applicable)
  - Total tax paid over lifetime

### FR-036 — Monte Carlo Simulation
- The system shall run Monte Carlo simulations (minimum 500 iterations) to model return uncertainty:
  - Variable annual investment return drawn from a normal distribution around the user's assumed return with a user-adjustable standard deviation
  - Output: probability of portfolio surviving to user's planning horizon
  - Display full probability distribution (fan chart or percentile bands: 10th, 25th, 50th, 75th, 90th percentile)
  - Separate Monte Carlo runs for super and non-super portfolios

### FR-037 — Historical Backtesting
- The system shall allow backtesting the plan against historical Australian market return sequences:
  - Apply historical ASX/balanced fund return sequences to the portfolio
  - Show best-case and worst-case historical outcomes alongside median

### FR-038 — Stress Testing
- The system shall provide pre-built stress test scenarios:
  - Market crash at retirement (e.g., −30% portfolio in year 1 of retirement)
  - Extended low-return environment (e.g., 1% real return for 10 years)
  - High inflation scenario (e.g., 5% CPI for 5 years)
  - Longevity stress test (plan to age 100 or 105)
  - One partner dies 10 years into retirement (survivor income and expenses recalculated)

---

## SECTION 10 — VISUALISATION & REPORTING

### FR-039 — Charts & Graphs
- The system shall provide the following visual outputs:
  - Net worth trajectory (line chart, year by year to planning horizon)
  - Income sources waterfall / stacked bar (super, pension, investment, employment by year)
  - Expense vs income gap chart
  - Super balance accumulation and drawdown curve
  - Probability fan chart (Monte Carlo)
  - Cash flow Sankey diagram (income → tax → expenses → savings)
  - Asset allocation pie chart
  - Education Bond growth curve and 10-year tax-free milestone marker

### FR-040 — Downloadable Reports
- The system shall generate a downloadable PDF report including:
  - Executive summary (retirement readiness status)
  - Assumptions used
  - Year-by-year projection table
  - All charts
  - Scenario comparison
  - Key milestones

### FR-041 — Milestone Alerts
- The system shall highlight key financial milestones on the timeline:
  - Mortgage payoff date
  - Super preservation age reached (60)
  - Age Pension eligibility age (67)
  - Transfer Balance Cap approached or exceeded ($2.1M)
  - Concessional cap catch-up window opens or closes
  - Bring-forward NCC window opens
  - SMSF annual return lodgment due date
  - Education Bond 10-year tax-free anniversary date (countdown)
  - Education Bond 125% contribution cap limit for next year

---

## SECTION 11 — ASSUMPTIONS & CONFIGURATION

### FR-042 — Modifiable Global Assumptions
- The system shall allow the user to adjust the following global assumptions:
  - CPI / inflation rate (default: 2.5%)
  - Pre-retirement investment return (default: 7.0% p.a.)
  - Post-retirement investment return (default: 5.0% p.a.)
  - Super fund fee (% p.a., default: 0.50%)
  - Life expectancy / planning horizon (default: age 95)
  - Wage growth rate (default: 3.0% p.a.)
  - Age Pension indexation rate (default: CPI)
  - Deeming rates (pre-filled from current ATO rates; adjustable)
  - Education Bond expected return (default: 6.63% p.a. — SP3 5-year return at 31 March 2026)
  - Internal tax rate applied within Education Bond (default: 25% effective; user-adjustable)

### FR-043 — Australian Tax Year
- All projections shall operate on the Australian financial year: 1 July to 30 June.
- Contribution caps, thresholds, and rates shall update automatically each 1 July.
- The system shall flag when projections span a threshold change year.

---

## SECTION 12 — DATA & PRIVACY

### FR-044 — No Bank Account Linking Required
- The system shall not require connection to live bank accounts or super funds.
- All data shall be manually entered by the user (no open banking integration required in version 1).

### FR-045 — Data Security
- All user data shall be encrypted at rest and in transit (AES-256 / TLS 1.3).
- User data shall not be shared with third parties or financial product providers.
- The system shall comply with the Australian Privacy Act 1988 and APP (Australian Privacy Principles).

### FR-046 — Data Portability
- Users shall be able to export all their plan data in JSON or CSV format.
- Users shall be able to delete their account and all associated data on demand.

---

## SECTION 13 — EDUCATION BOND MODULE
### Futurity Investment Group — Sectoral Indexed International Equities (SP3, APIR FIG2984AU)

### FR-047 — Education Bond Account Setup
- The system shall support the addition of one or more Education Bond accounts with the following fields:
  - Bond Owner name(s)
  - Bond Commencement Date (starts the 10-year tax-free clock)
  - Current bond value: Principal Component and Earnings Component shown separately
  - Investment Option selected (e.g., SP3 — Sectoral Indexed International Equities)
  - Current year's contribution amount
  - Prior year's contribution amount (needed to enforce the 125% rule)
  - Nominated Education Beneficiary name(s) and age(s)
  - Note: SP3 fund inception date is 11 June 2020

### FR-048 — Investment Option Details (Futurity SP3)

| Field | Value |
|---|---|
| Fund Code | SP3 |
| APIR Code | FIG2984AU |
| Issuer | Futurity Investment Group Limited ABN 21 087 648 879, AFSL 236665 |
| Investment Style | Passive (Indexed) |
| Asset Allocation | 100% Global Equities |
| Benchmark | MSCI World Index (fully hedged to AUD) |
| Underlying Fund | Vanguard International Shares Index Fund – Hedged (VAN0105AU) |
| Total Management Fee | 0.85% p.a. (after-tax) |
| Additional Costs Cap | 0.10% p.a. |
| Maximum Total Cost | 0.95% p.a. |
| Buy Spread | 0.06% |
| Sell Spread | 0.06% |
| Minimum Investment Time | 7 years |
| Investment Risk Rating | High — 6 |
| Inception Date | 11 June 2020 |

**Performance history (at 31 March 2026, after tax and fees):**

| Period | Return |
|---|---|
| 1 Month | -4.79% |
| 3 Months | -2.92% |
| 6 Months | -0.38% |
| 1 Year | +12.66% |
| 2 Years | +8.24% p.a. |
| 3 Years | +11.67% p.a. |
| 4 Years | +6.72% p.a. |
| 5 Years | +6.63% p.a. |

Past performance is not a reliable indicator of future performance.

### FR-049 — Internal Tax Treatment (Tax-Paid Structure)
- The system shall model Education Bond earnings as taxed internally at the fund level:
  - Nominal internal tax rate: 30%
  - Effective tax rate: lower than 30% where franking credits apply (default: 25% effective; user-adjustable)
  - The Bond Owner does NOT include bond earnings in their personal income tax return while the bond is held
- The system shall calculate and display the tax benefit vs. the user's marginal tax rate:
  - If user's marginal rate > 30%: bond is tax-advantaged
  - If user's marginal rate ≤ 30%: no internal tax advantage but 10-year advantage still applies
- Management fees shall be deducted annually (0.85% + up to 0.10% additional = max 0.95% p.a.)
- Buy/sell spread (0.06% each way) applied on contribution and withdrawal events respectively

### FR-050 — The 125% Contribution Rule
- The system shall enforce the 125% annual contribution cap:
  - Maximum contribution in Year N = 125% × contribution in Year N−1
  - In Year 1 (commencement year): no cap
  - If Year N−1 contribution was $0: no further contributions permitted without resetting the clock
- The system shall warn the user if a planned contribution in any year would breach the 125% cap.
- The system shall flag that breaching the 125% rule restarts the 10-year clock from the year of breach.
- The system shall model the impact of a cap breach on the 10-year tax-free withdrawal date.

### FR-051 — The 10-Year Investment Bond Advantage
- The system shall track the 10-year anniversary of the Bond Commencement Date.
- Once the bond has been held for 10 complete bond years:
  - All withdrawals (earnings + principal) are completely tax-free to the Bond Owner
  - No conditions apply to the purpose of withdrawal
  - The system shall display a countdown to the 10-year tax-free date on the dashboard
- The system shall model the projected bond value at the 10-year anniversary.
- The system shall model the impact of withdrawing at 10 years vs. continuing to hold.

### FR-052 — Education Benefit Claims (Pre-10-Year Education Withdrawals)
- Eligible expenses include:
  - School fees (Kindergarten through Year 12)
  - University and TAFE tuition fees
  - Textbooks and course materials
  - School uniforms
  - Laptops, tablets, and educational software
- The Education Tax Benefit (ETB) refunds the 30% tax already paid inside the fund:
  - For every $70 withdrawn from the Earnings Component, a $30 ETB is paid
  - Effective gross value = $100 per $70 of earnings withdrawn
- The ETB is assessable income in the Education Beneficiary's hands — NOT the Bond Owner's.
- The system shall model the Beneficiary's tax position to estimate the net tax impact of the ETB.
- Principal Component withdrawals at any time: no tax, no ETB payable.

### FR-053 — Non-Education Withdrawals Before 10 Years
- Earnings withdrawn are included in the Bond Owner's assessable income in that financial year.
- The Bond Owner receives a 30% tax offset (reflecting tax already paid inside the fund).
- Net additional tax = (Bond Owner marginal rate − 30%) × earnings withdrawn.
- If Bond Owner marginal rate ≤ 30%: excess offset may be refunded.
- The system shall flag this as a taxable event in the year of withdrawal and show net after-tax proceeds.

### FR-054 — Bond Owner vs. Beneficiary Flexibility
- The system shall allow modeling of:
  - Adding or changing Education Beneficiaries (must be nominated before making a claim)
  - Bond Owner and Beneficiary being the same person (adult studying)
  - Multiple Education Beneficiaries with different education start dates
  - Change of Bond Owner — system flags this may reset the 10-year clock; user advised to seek advice

### FR-055 — Education Bond in the Retirement Cash Flow Timeline
- Education Bond balance shown as a separate line item in net worth tracker
- Annual contributions included in the cash flow model
- Education withdrawals shown as education expense offsets
- Post-10-year tax-free withdrawal shown as a lump-sum income event in the retirement timeline
- The system shall model years where both Education Benefit Claims and super drawdown are occurring simultaneously

### FR-056 — Education Bond: Age Pension & Centrelink Treatment

**Assets Test:** Education Bonds ARE assessable assets for the Age Pension assets test. The current market value is included in assessable assets.

**Income Test (Deeming):** Education Bonds ARE subject to deeming rules. Current deeming rates (from 20 March 2026):
- First $64,200 (single) / $106,200 (couple combined): deemed at 1.25% p.a.
- Anything above: deemed at 3.25% p.a.

**Strategic Alert:** The system shall flag that holding a large Education Bond balance approaching Age Pension age may reduce Age Pension entitlement and model the net financial impact.

### FR-057 — Education Bond: Scenario Modeling
- The system shall support the following Education Bond-specific scenarios:
  - Withdraw at 10 years tax-free vs. hold for 15 years
  - Use bond for school fees vs. leave invested
  - Increase annual contributions to the 125% cap
  - Bond impact on Age Pension (assets/deeming vs. return)
  - Marginal tax rate drops in retirement — is bond still advantageous?
  - Bond Owner dies before 10 years (flags estate tax treatment change)

### FR-058 — Education Bond Dashboard Display
- Current bond value (total); Principal vs. Earnings Component split
- Bond Commencement Date; years held; countdown to 10-year tax-free anniversary
- Projected bond value at 10-year anniversary
- Current year's contribution and 125% cap limit for next year
- Beneficiary name(s) and eligible education start dates
- Annual management fee drag in dollar terms (0.85%–0.95% p.a.)
- Investment Option: SP3 / Benchmark: MSCI World Index (hedged to AUD) / Risk: High – 6

---

## SECTION 14 — REQUIREMENTS SUMMARY

| Section | Requirement IDs | Count |
|---|---|---|
| User Profile & Household | FR-001 to FR-003 | 3 |
| Superannuation | FR-004 to FR-013 | 10 |
| Income & Employment | FR-014 to FR-016 | 3 |
| Expenses & Spending | FR-017 to FR-018 | 2 |
| Age Pension | FR-019 to FR-022 | 4 |
| Property & Real Estate | FR-023 to FR-025 | 3 |
| Investment Portfolio (Non-Super) | FR-026 to FR-028 | 3 |
| Tax Estimation | FR-029 to FR-032 | 4 |
| Scenario Modelling & Analysis | FR-033 to FR-038 | 6 |
| Visualisation & Reporting | FR-039 to FR-041 | 3 |
| Assumptions & Configuration | FR-042 to FR-043 | 2 |
| Data & Privacy | FR-044 to FR-046 | 3 |
| Education Bond Module | FR-047 to FR-058 | 12 |
| Gwyneth Life Events | FR-059 to FR-064 | 6 |
| **TOTAL** | | **64** |

---

## SECTION 15 — LIFE EVENTS MODULE: GWYNETH

### FR-059 — Life Event: School Fees (Gwyneth)

**Purpose:** Model the ongoing annual cost of Gwyneth's school education as a recurring expense, and link applicable costs to the Futurity Education Bond (SP3) as a potential funding source.

**Inputs:**
- Beneficiary name: Gwyneth
- School type (user selects one):
  - Government / public school ($0 tuition; additional costs only)
  - Catholic systemic school ($2,800–$7,500/year)
  - Catholic independent school ($8,000–$25,000/year)
  - Independent school — lower tier ($10,000–$18,500/year)
  - Independent school — mid tier ($18,500–$32,000/year)
  - Independent school — elite (GPS/CAS) ($38,000–$52,000/year)
- School start year (Kindergarten entry age: 5)
- Primary school end year (Year 6, age ~11–12)
- Secondary school end year (Year 12, age ~17–18)
- Annual tuition fee (user-defined or preset by school tier)
- Additional annual costs (NSW benchmark: $5,000–$15,000/year):
  - Uniforms ($500–$2,000/year)
  - Technology levy or laptop ($500–$1,200/year or $1,500–$2,800 every 3–4 years)
  - Camps, excursions, sport ($1,000–$5,000/year)
  - Music, arts, extracurricular tuition ($500–$5,000/year)
- Fee inflation rate (default: 5.5% p.a. — NSW school fees rising at 5–7% in 2026)
- Funding source: household cash flow / Education Bond (ETB applies) / combination

**NSW Cost Benchmarks (2026):**

| School Type | Annual Tuition | Total K-12 (inflated est.) |
|---|---|---|
| Government | $0 | $65,000–$130,000 (additional costs only) |
| Catholic systemic | $2,800–$7,500 | $105,000–$195,000 |
| Catholic independent | $8,000–$25,000 | $165,000–$445,000 |
| Independent mid-tier | $18,500–$32,000 | $305,000–$585,000 |
| Elite GPS/CAS | $38,000–$52,000 | $595,000–$845,000 |

### FR-060 — Life Event: University Fees (Gwyneth)

**Purpose:** Model the cost of Gwyneth's tertiary education, including HECS-HELP student contributions, living expenses, and optional parental financial support.

**Inputs:**
- Beneficiary name: Gwyneth
- University start year (estimated age: 18)
- Degree duration (default: 4 years)
- Course / study band (user selects):
  - Band 1 — Education, humanities, social work: $4,738–$6,901/year (2026)
  - Band 2 — Computing, built environment, health, nursing: $8,021–$9,827/year
  - Band 3 — Allied health, engineering, science, surveying: $11,669/year
  - Band 4 — Law, accounting, commerce, economics, medicine: up to $16,392/year
- Commonwealth Supported Place (CSP) vs. full-fee paying
- HECS-HELP usage: Yes / No
- Parental living cost support (NSW benchmark: $25,000–$35,000/year)
- Education Bond use: Yes / No / Partial (ETB applies to tuition and textbooks only; not living costs)

**HECS Repayment Note:** HECS repayment income threshold $54,435 (2026–27); HELP loan lifetime limit $129,883.

**Eligible for Education Bond ETB:** University/TAFE tuition, textbooks — YES. General living costs — NO.

**NSW/Australia Cost Benchmarks (2026):**

| Degree Type | Annual Student Contribution | 4-Year Total (HECS) | Parental Living Support (est.) |
|---|---|---|---|
| Arts / Education | $4,738–$6,901 | $18,952–$27,604 | $100,000–$140,000 |
| Science / Nursing | $8,021–$11,669 | $32,084–$46,676 | $100,000–$140,000 |
| Law / Commerce | $11,669–$16,392 | $46,676–$65,568 | $100,000–$140,000 |
| Medicine (6 years) | $11,669–$16,392 | $70,014–$98,352 | $150,000–$210,000 |

### FR-061 — Life Event: Wedding (Gwyneth)

**Purpose:** Model a one-off parental financial contribution toward Gwyneth's wedding as a lump-sum event.

**Inputs:**
- Estimated wedding year (user-defined, e.g., Gwyneth aged 26–30)
- Parental contribution amount (today's dollars) — NSW benchmarks as reference presets:
  - Budget contribution: $5,000–$10,000
  - Mid-range contribution: $15,000–$25,000
  - Generous contribution: $30,000–$45,000
  - Full NSW average wedding: $42,322
  - Premium Sydney wedding: $50,000–$80,000+
- Inflation rate (default: CPI 2.5%)
- Funding source: household savings / investment sale / Education Bond post-10-year tax-free withdrawal / inheritance / combination

**Note:** Wedding costs are NOT eligible for Education Bond ETB. However, if the bond has passed its 10-year mark, a full tax-free withdrawal can fund the contribution.

**NSW / Sydney Cost Reference (2026):**

| Category | National Average | NSW Average |
|---|---|---|
| Total wedding cost | $38,252 | $42,322 |
| Venue (ceremony + reception) | $15,800 | $18,662 |
| Catering (per head) | $6,177 | $7,782 |
| Photography/videography | $4,200–$6,500 | $4,800–$7,500 |
| Flowers and styling | $3,500–$6,000 | $4,000–$7,000 |
| Entertainment/DJ/band | $2,000–$5,000 | $2,500–$6,000 |
| Dress and attire | $3,000–$8,000 | $3,500–$9,000 |

Note: Couples typically spend 23% more than their original budget.

### FR-062 — Life Event: House Deposit (Gwyneth)

**Purpose:** Model a one-off parental financial gift or loan toward Gwyneth's first home deposit.

**Inputs:**
- Estimated year of home purchase (user-defined, e.g., Gwyneth aged 28–35)
- Gift or loan to Gwyneth (user selects):
  - Outright gift: reduces household net worth permanently
  - Family loan: household retains asset; repayment schedule modeled as future income
- Parental contribution amount (today's dollars) — NSW benchmarks:
  - 5% deposit (with First Home Guarantee): ~$53,000
  - 10% deposit: ~$106,000
  - 20% deposit (no LMI): ~$206,000–$265,000
  - Custom amount (user-defined)
- Inflation rate (default: 4.0% p.a. — NSW property price inflation)
- Funding source: household savings / investment property sale / Education Bond post-10-year / downsizing proceeds / combination

**Government Schemes (displayed as informational notes):**
- **First Home Guarantee:** Eligible first home buyers can purchase with 5% deposit, no LMI. Government guarantees up to 15% of property value. Income caps: $125,000/year (single) or $200,000/year (couple) in 2026. Property price cap in NSW: up to $900,000.
- **First Home Super Saver Scheme (FHSSS):** Gwyneth may withdraw up to $50,000 of additional super contributions for a first home deposit (reduces parental contribution needed).

**Centrelink Gifting Rules Alert:**
> Gifts to Gwyneth above $10,000 in any financial year, or above $30,000 over any 5-year period, may be treated by Centrelink as "deprived assets" and continue to count in the Age Pension assets test for 5 years from the date of the gift, regardless of whether the money has been transferred.
> - Annual gifting allowance: $10,000/year
> - 5-year rolling limit: $30,000 over any 5-year period
> - Deprived asset period: 5 years from date of gift

**NSW / Australia Deposit Benchmarks (2026):**

| Deposit Type | National Average | NSW Average | Sydney (est.) |
|---|---|---|---|
| Average saved by first home buyers | $173,000 | $206,000+ | $220,000–$265,000 |
| 20% deposit needed (no LMI) | $173,000 | $206,000–$264,960 | $220,000–$265,000 |
| 5% deposit (First Home Guarantee) | $43,250 | $51,500–$66,240 | $55,000–$66,250 |

### FR-063 — Gwyneth Life Events: Combined Timeline View

**Purpose:** Display all four life events on a single integrated timeline showing cumulative cash impact on the household.

**Display:**

| Event | Trigger Age | Est. Year | Today's $ | Inflated $ |
|---|---|---|---|---|
| School fees start | 5 | [calc] | [user] | [calc] |
| School fees end | 18 | [calc] | [user] | [calc] |
| University start | 18 | [calc] | [user] | [calc] |
| University end | 21–24 | [calc] | [user] | [calc] |
| Wedding | [user set] | [user] | [user] | [calc] |
| House deposit | [user set] | [user] | [user] | [calc] |

- Total cumulative cost of all Gwyneth life events (today's and inflated dollars)
- Education Bond balance vs. total Education Bond-eligible costs — gap analysis
- Year-by-year cash outflow chart showing overlap between all events
- Overlapping events in the same year highlighted as cash flow pressure points

**Gwyneth Total Cost Summary (NSW, 2026):**

| Life Event | Low Estimate | Mid Estimate | High Estimate |
|---|---|---|---|
| School fees K–12 (total, inflated) | $105,000 (Catholic sys) | $310,000 (Indep. mid) | $845,000 (Elite GPS) |
| University — parental living support only | $100,000 (Arts/HECS) | $135,000 (Commerce) | $210,000 (Medicine, 6yr) |
| Wedding (parental contribution) | $10,000 | $30,000 | $50,000+ |
| House deposit (NSW, 5%–20%) | $51,500 (5%, FHG) | $150,000 (10%) | $265,000 (20%, no LMI) |
| **TOTAL RANGE** | **$266,500** | **$625,000** | **$1,370,000+** |

### FR-064 — Gwyneth Life Events: Funding Strategy Analysis

**Purpose:** Run an optimised funding analysis across all four life events to determine the most tax-efficient approach.

**Strategy A — Pay Everything from Cash Flow:**
All four events funded from household savings and income. No Education Bond withdrawals. Bond held to 10-year tax-free point.

**Strategy B — Education Bond Maximised:**
School fees and university tuition paid via Education Benefit Claims (ETB applied). Wedding and house deposit funded from Education Bond post-10-year tax-free withdrawal (if timing aligns) or household cash/investments.

**Strategy C — Hybrid:**
- School fees: Education Bond (ETB claimed)
- University living costs: cash flow
- Wedding: household savings
- House deposit: combination of bond withdrawal (post-10 years) and investment sale

**For each strategy the system shall display:**
- Total household out-of-pocket cost (after ETB refunds and tax savings)
- Education Bond balance at each milestone
- Age Pension impact in the year of house deposit gift
- Retirement portfolio balance at age 67 and age 85
- Centrelink gifting rule alert (if applicable)

---

## SECTION 16 — KEY LEGISLATIVE & REGULATORY REFERENCES (JULY 2026)

### Superannuation
| Item | Value |
|---|---|
| Concessional contributions cap | $32,500/year (from 1 July 2026) |
| Non-concessional contributions cap | $130,000/year (from 1 July 2026) |
| Bring-forward NCC cap | $390,000 over 3 years (from 1 July 2026) |
| Transfer Balance Cap | $2.1 million (from 1 July 2026) |
| Super Guarantee rate | 12% (from 1 July 2025) |
| Preservation age | 60 (born after 30 June 1964) |
| Division 293 threshold | $250,000 (income + concessional contributions) |
| SG payment frequency (from 1 July 2026) | Within 7 business days of each payday |

### Age Pension (from 1 July 2026)
| Item | Value |
|---|---|
| Qualifying age | 67 |
| Full pension — single homeowner threshold | $333,000 |
| Full pension — couple homeowner threshold | $499,000 |
| Part pension cut-off — single homeowner | $733,500 |
| Part pension cut-off — couple homeowner | $1,102,500 |
| Assets test taper rate | $3/fortnight per $1,000 excess |
| Income test taper rate | 50 cents per $1 of excess income |
| Single income free area | $226/fortnight |
| Couple income free area | $400/fortnight combined |
| Full single pension rate | $1,200.90/fortnight (incl. supplements) |
| Full couple pension rate | $1,808.72/fortnight combined |
| Deeming rate — lower | 1.25% (up to $64,200 single / $106,200 couple) |
| Deeming rate — upper | 3.25% (above lower threshold amounts) |

### Education Bond (Futurity SP3)
| Item | Value |
|---|---|
| Fund Code | SP3 |
| APIR Code | FIG2984AU |
| Issuer | Futurity Investment Group Limited ABN 21 087 648 879, AFSL 236665 |
| Inception Date | 11 June 2020 |
| Internal tax rate (nominal) | 30% |
| 125% rule | Annual contributions capped at 125% of prior year |
| 10-year rule | All withdrawals tax-free after 10 bond years from commencement |
| Education Tax Benefit | $30 per $70 of earnings withdrawn (assessable in Beneficiary's hands) |
| Total management fee | 0.85% p.a. (after tax) |
| Additional costs cap | 0.10% p.a. |
| Buy/sell spread | 0.06% / 0.06% |
| Risk rating | High — 6 |
| Benchmark | MSCI World Index (fully hedged to AUD) |
| 5-year return (to 31 March 2026) | 6.63% p.a. (after fees and tax) |
| Age Pension treatment | Assessable asset; subject to deeming |
| Minimum suggested investment time | 7 years |

### Downsizer Contribution
| Item | Value |
|---|---|
| Minimum age | 55 |
| Maximum per person | $300,000 ($600,000 per couple) |
| Property ownership minimum | 10 years |
| Contribution window | Within 90 days of settlement |
| Counts toward contribution caps | No |

### Government Co-Contribution (2026–27)
| Item | Value |
|---|---|
| Maximum co-contribution | $500 |
| Full co-contribution income threshold | $49,293 |
| Phase-out income threshold | $64,293 |
| Rate | 50 cents per $1 of personal NCC |

### Tax Rates (2026–27)
| Item | Value |
|---|---|
| Tax-free threshold | $18,200 |
| Medicare Levy | 2% |
| SAPTO effective tax-free threshold (single) | ~$35,812/year |
| SAPTO effective tax-free threshold (couple each) | ~$31,888/year |

### ASFA Retirement Standard (February 2026 update)
| Item | Value |
|---|---|
| Comfortable single | ~$51,278/year |
| Comfortable couple | ~$72,148/year |
| Modest single | ~$33,134/year |
| Modest couple | ~$47,731/year |

---

## DISCLAIMER

These functional requirements are based on publicly available information, Australian legislative rules, and the Futurity Investment Group Education Bond Fund Facts sheet (SP3, dated 31 March 2026). All rates, thresholds, and caps are subject to change by government indexation, legislation, or Futurity's product terms. Users of this software should verify current rates with the ATO, Services Australia, and Futurity Investment Group before making financial decisions. This document does not constitute financial advice.

**For Futurity Education Bond product information:**
- Website: futurityinvest.com
- Phone: 1300 345 456
- Hours: 9am to 5pm (Mon–Fri) Melbourne time
- Email: advisercare@futurityinvest.com
