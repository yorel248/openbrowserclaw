# Retirement Planner Skill

You are working on the Australian retirement planner built into OpenBrowserClaw. This skill provides authoritative context for any task touching the planner — adding sections, updating legislative values, fixing calculations, or extending the UI.

## What this planner is

A browser-native Australian retirement planner for NSW-focused households, covering 64 functional requirements (FR-001 to FR-064) across 11 UI sections. All data lives in OPFS (no server). Legislation is pinned to **2026-27** values.

## File map

| File | Purpose |
|------|---------|
| `src/retirement/types.ts` | All TypeScript interfaces + every legislative constant |
| `src/retirement/calc.ts` | Pure calculation functions (tax, super, age pension, ETB, projection) |
| `src/retirement/store.ts` | OPFS persistence — `loadActivePlan()`, `savePlan()`, `listPlans()`, `exportPlanJSON()` |
| `src/ui/retirement.ts` | `RetirementUI` class — renders all 11 sections, handles user input, calls `scheduleSave()` |
| `src/ui/styles.css` | All `.ret-*` CSS classes (dark navy design system — `--bg-primary: #0f0f23`, `--accent: #64ffda`) |
| `src/ui/app.ts` | Wires `RetirementUI` into the app shell under the `retirement` view |

## Section architecture

`RetirementUI` has a sidebar nav and a single content panel. Clicking a nav item calls `this.setSection(name)` → `renderSection()` which clears `this.contentEl.innerHTML` and calls one private render method:

| Section key | Render method | FRs |
|-------------|--------------|-----|
| `profile` | `renderProfile()` | FR-001–FR-003 |
| `super` | `renderSuper()` | FR-004–FR-013 |
| `income` | `renderIncome()` | FR-014–FR-016 |
| `expenses` | `renderExpenses()` | FR-017–FR-018 |
| `property` | `renderProperty()` | FR-023–FR-025 |
| `investments` | `renderInvestments()` | FR-026–FR-028 |
| `education-bond` | `renderEducationBond()` | FR-047–FR-058 |
| `life-events` | `renderLifeEvents()` | FR-059–FR-064 |
| `age-pension` | `renderAgePension()` | FR-019–FR-022 |
| `projection` | `renderProjection()` | FR-033–FR-038 |
| `assumptions` | `renderAssumptions()` | FR-042–FR-043 |

**Important**: Many inputs call `this.renderSection()` in their change handler — this completely tears down and rebuilds `this.contentEl`. Always use Playwright `locator()` (not `$$()`) when automating this UI, because `ElementHandle` objects become stale after re-renders.

## Data model (`RetirementPlan`)

```ts
RetirementPlan {
  profile:        HouseholdProfile   // member1 + optional member2
  superannuation: SuperannuationData // accounts[], catchUpContributions, div293
  income:         IncomeData         // sources[]
  expenses:       ExpensesData       // ASFA preset + oneOffExpenses[]
  property:       PropertyData       // ownsHome + principalResidence + investmentProperties[]
  investments:    InvestmentsData    // assets[]
  educationBond:  EducationBondData  // bonds[] (Futurity SP3 defaults)
  lifeEvents:     LifeEventsData     // schoolFees, university, wedding, houseDeposit
  assumptions:    Assumptions        // CPI, returns, horizon
}
```

OPFS paths: `retirement/plans/{id}.json` (plans), `retirement/active-plan-id.json` (pointer).

## Key 2026-27 legislative constants (all in `src/retirement/types.ts`)

### Super caps
| Constant | Value |
|----------|-------|
| Concessional cap | $32,500 |
| Non-concessional cap | $130,000 |
| Bring-forward cap | $390,000 |
| Transfer Balance Cap | $2,100,000 |
| SG rate | 12% |
| Catch-up TSB threshold | $500,000 |
| Division 293 threshold | $250,000 |
| Downsizer minimum age | 55 |
| Downsizer max per person | $300,000 |
| Preservation age | 60 |

### Tax brackets 2026-27
| Threshold | Rate |
|-----------|------|
| $0 | 0% |
| $18,201 | 19% |
| $45,001 | 32.5% |
| $120,001 | 37% |
| $180,001 | 45% |

Medicare levy: 2% | LITO max: $700 | LITO phase-out start: $37,500

### Age Pension (qualifying age 67)
| Rate | Value |
|------|-------|
| Single (fortnight) | $1,200.90 |
| Couple (fortnight) | $1,808.72 |
| Deeming lower rate | 1.25% (threshold $64,200 single / $106,200 couple) |
| Deeming upper rate | 3.25% |
| Asset taper | $3/fortnight per $1,000 over threshold |
| Income taper | 50 cents per dollar over free area |

### ASFA 2026 benchmarks
| Lifestyle | Annual |
|-----------|--------|
| Comfortable single | $51,278 |
| Comfortable couple | $72,148 |
| Modest single | $33,134 |
| Modest couple | $47,731 |

### Futurity SP3 education bond (APIR: FIG2984AU)
- 100% global equities, passive, indexed to MSCI World (fully hedged AUD)
- Underlying: Vanguard International Shares Index Fund – Hedged (VAN0105AU)
- Management fee: 0.85% | Additional costs cap: 0.10% | Buy/sell spread: 0.06%
- Default return assumption: **6.63% p.a.** (5-year trailing)
- 10-year rule: withdrawals after 10 years from commencement are tax-free in the investor's hands
- 125% rule: current-year contribution may not exceed 125% of prior-year contribution (`maxNCC125()` in calc.ts)
- ETB (Education Tax Benefit): $30 tax offset per $70 earnings withdrawn for approved education
- Centrelink: bond value is assessable under deeming rules; gift amount triggers gifting rules if > $10,000/yr or $30,000/5yr

### Centrelink gifting limits
- Annual allowance: $10,000
- Five-year limit: $30,000
- Deprived asset period: 5 years

### School fee benchmarks (NSW)
- Government: $0
- Catholic systemic: $2,800–$7,500/yr
- Catholic independent: $8,000–$25,000/yr
- Independent lower: $10,000–$18,500/yr
- Independent mid: $18,500–$32,000/yr
- Independent elite (GPS/CAS): $38,000–$52,000/yr

### University HECS band ranges (annual)
- Band 1 (Education, Humanities, Social Work): $4,738–$6,901
- Band 2 (Computing, Health, Nursing): $8,021–$9,827
- Band 3 (Engineering, Science, Allied Health): $11,669
- Band 4 (Law, Commerce, Medicine): $11,669–$16,392

### NSW median wedding cost
$42,322 (used as default in `WeddingEvent`)

### NSW median house price (deposit calculation)
~$1,060,000 (used for First Home Guarantee 5% deposit: ~$53,000)

## How to add a new section

1. **Add data types** to `src/retirement/types.ts` — interface + any new constants
2. **Add the field** to `RetirementPlan` interface and `DEFAULT_PLAN` in `src/retirement/store.ts`
3. **Add calculations** to `src/retirement/calc.ts` as pure functions
4. **Add a render method** `private renderMySection(wrap: HTMLElement): void` to `RetirementUI` in `src/ui/retirement.ts`
5. **Register it** in `renderSection()` switch block and add a nav button in `mount()`
6. **Add CSS** for any new `.ret-*` classes to the retirement section in `src/ui/styles.css`

DOM helpers available in `retirement.ts` scope (defined at the bottom of the file):
- `h(tag, cls?)` — creates an element
- `field(label, input)` — label + input wrapped in `.ret-field`
- `input(value, onChange, type?)` — text/date `<input>`
- `numInput(value, onChange)` — `<input class="ret-input-num">`
- `currencyInput(value, onChange)` — `<input class="ret-input-currency">`
- `checkbox(label, checked, onChange)` — `.ret-checkbox-row` with label
- `select(options, value, onChange)` — `<select class="ret-select">`
- `formCard(title)` — `.ret-card` with title
- `sectionHeader(wrap, icon, title, refs)` — `.ret-section-header` row
- `btn(label, cls, onClick)` — generic button

## Projection engine (`src/retirement/calc.ts`)

`runProjection(plan: RetirementPlan): ProjectionSummary` simulates year-by-year from current year to `assumptions.planningHorizonAge`:

1. Calculates salary + SG + salary sacrifice each year
2. Applies tax using `calcIncomeTax()` (brackets + Medicare + LITO)
3. Grows super balance; checks if past preservation age for drawdown
4. Grows investment portfolio at `assumptions.preRetirementReturn` / `postRetirementReturn`
5. Grows education bond at `bond.expectedReturn` minus internal tax; checks 10-year milestone
6. Calculates age pension eligibility via `calcAgePension()` each year
7. Deducts expenses (ASFA target, inflated by CPI; spending-smile if enabled)
8. Applies one-off expenses and life event costs in their respective years
9. Returns `ProjectionSummary` with `years[]`, retirement year, surplus at horizon, lifetime pension/tax totals

Key output shape (`ProjectionYear`): `year`, `age1`, `age2`, `superBalance`, `investmentBalance`, `educationBondBalance`, `netWorth`, `totalIncome`, `agePensionIncome`, `totalExpenses`, `taxPaid`.

## Auto-save behaviour

Every user input calls `this.scheduleSave()` which sets a 800ms debounce timer. After the timer fires, `savePlan()` writes the plan to OPFS. The topbar shows a "Saving…" / "Saved ✓" indicator.

## Testing / Playwright notes

When automating the retirement UI with Playwright, always use **locators** (`page.locator('selector').nth(n).action()`) rather than element handles (`page.$$()`) because most input handlers call `this.renderSection()` which rebuilds the entire content area DOM. The `verify_all.mjs` script in the repo root demonstrates correct patterns for each section.
