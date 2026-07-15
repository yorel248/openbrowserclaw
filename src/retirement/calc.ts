// ---------------------------------------------------------------------------
// Retirement Planner — Core Calculations
// ---------------------------------------------------------------------------

import type {
  RetirementPlan,
  PersonProfile,
  ProjectionYear,
  ProjectionSummary,
} from './types.js';
import {
  AGE_PENSION,
  SUPER_CAPS_2026,
  TAX_BRACKETS_2026,
  MEDICARE_LEVY,
  LITO_MAX,
  LITO_PHASEOUT_START,
  ASFA_BENCHMARKS,
  FUTURITY_SP3,
  UNI_BAND_RANGES,
} from './types.js';

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

export function ageAt(dob: string, year: number): number {
  if (!dob) return 0;
  const birthYear = parseInt(dob.slice(0, 4), 10);
  return year - birthYear;
}

export function currentYear(): number {
  return new Date().getFullYear();
}

export function tenYearDate(commencementDate: string): string {
  if (!commencementDate) return '';
  const d = new Date(commencementDate);
  d.setFullYear(d.getFullYear() + 10);
  return d.toISOString().slice(0, 10);
}

export function yearsUntilTenYear(commencementDate: string): number {
  if (!commencementDate) return 10;
  const target = new Date(commencementDate);
  target.setFullYear(target.getFullYear() + 10);
  const now = new Date();
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / (365.25 * 24 * 3600 * 1000)));
}

export function maxNCC125(priorYearContribution: number): number {
  if (priorYearContribution <= 0) return 0;
  return Math.round(priorYearContribution * 1.25);
}

// ---------------------------------------------------------------------------
// Income tax (FR-029)
// ---------------------------------------------------------------------------

export function calcIncomeTax(income: number): number {
  if (income <= 0) return 0;
  let tax = 0;
  for (let i = TAX_BRACKETS_2026.length - 1; i >= 0; i--) {
    const bracket = TAX_BRACKETS_2026[i];
    if (income >= bracket.threshold) {
      if (i === 0) {
        tax = 0;
      } else {
        tax = bracket.base + (income - bracket.threshold + 1) * bracket.rate;
      }
      break;
    }
  }

  // Medicare levy
  tax += income * MEDICARE_LEVY;

  // LITO (simplified)
  if (income <= LITO_PHASEOUT_START) {
    tax = Math.max(0, tax - LITO_MAX);
  } else if (income <= 66667) {
    const reduction = LITO_MAX - (income - LITO_PHASEOUT_START) * 0.05;
    tax = Math.max(0, tax - Math.max(0, reduction));
  }

  return Math.max(0, tax);
}

export function marginalRate(income: number): number {
  for (let i = TAX_BRACKETS_2026.length - 1; i >= 0; i--) {
    if (income >= TAX_BRACKETS_2026[i].threshold) {
      return i === 0 ? 0 : TAX_BRACKETS_2026[i].rate;
    }
  }
  return 0;
}

// ---------------------------------------------------------------------------
// Age Pension calculation (FR-020 to FR-022)
// ---------------------------------------------------------------------------

export interface AgePensionResult {
  eligible: boolean;
  fullAnnual: number;
  partAnnual: number;
  assetsTestAmount: number;
  incomeTestAmount: number;
  finalAnnual: number;
  isHomeowner: boolean;
  isCouple: boolean;
}

export function calcAgePension(
  age1: number,
  age2: number | null,
  isHomeowner: boolean,
  totalAssessableAssets: number,
  totalAssessableIncome: number,
  member2Eligible = false,
): AgePensionResult {
  const eligible1 = age1 >= AGE_PENSION.qualifyingAge;
  const eligible2 = member2Eligible && age2 !== null && age2 >= AGE_PENSION.qualifyingAge;
  const isCouple = age2 !== null;

  if (!eligible1 && !eligible2) {
    return { eligible: false, fullAnnual: 0, partAnnual: 0, assetsTestAmount: 0, incomeTestAmount: 0, finalAnnual: 0, isHomeowner, isCouple };
  }

  const fullAnnual = isCouple
    ? AGE_PENSION.rates.coupleFortnight * 26
    : AGE_PENSION.rates.singleFortnight * 26;

  const thresholds = isCouple
    ? (isHomeowner ? AGE_PENSION.assetsTest.coupleHomeowner : AGE_PENSION.assetsTest.coupleNonHomeowner)
    : (isHomeowner ? AGE_PENSION.assetsTest.singleHomeowner : AGE_PENSION.assetsTest.singleNonHomeowner);

  // Assets test
  let assetsTestAmount = fullAnnual;
  if (totalAssessableAssets >= thresholds.cutoff) {
    assetsTestAmount = 0;
  } else if (totalAssessableAssets > thresholds.full) {
    const excess = totalAssessableAssets - thresholds.full;
    const reduction = Math.floor(excess / 1000) * AGE_PENSION.assetTaperPerThousand;
    assetsTestAmount = Math.max(0, fullAnnual - reduction);
  }

  // Income test (deeming on financial assets)
  const freeArea = isCouple ? AGE_PENSION.incomeTest.coupleFreeArea : AGE_PENSION.incomeTest.singleFreeArea;
  const cutoff = isCouple ? AGE_PENSION.incomeTest.coupleCutoff : AGE_PENSION.incomeTest.singleCutoff;

  let incomeTestAmount = fullAnnual;
  if (totalAssessableIncome >= cutoff) {
    incomeTestAmount = 0;
  } else if (totalAssessableIncome > freeArea) {
    const excess = totalAssessableIncome - freeArea;
    const reduction = excess * AGE_PENSION.incomeTest.taperRate;
    incomeTestAmount = Math.max(0, fullAnnual - reduction);
  }

  const finalAnnual = Math.min(assetsTestAmount, incomeTestAmount);

  return {
    eligible: true,
    fullAnnual,
    partAnnual: finalAnnual,
    assetsTestAmount,
    incomeTestAmount,
    finalAnnual,
    isHomeowner,
    isCouple,
  };
}

// Deeming on financial assets (FR-021)
export function deemedIncome(financialAssets: number, isCouple: boolean): number {
  const threshold = isCouple
    ? AGE_PENSION.deeming.coupleThreshold
    : AGE_PENSION.deeming.singleThreshold;

  if (financialAssets <= threshold) {
    return financialAssets * AGE_PENSION.deeming.lowerRate;
  }
  return (
    threshold * AGE_PENSION.deeming.lowerRate +
    (financialAssets - threshold) * AGE_PENSION.deeming.upperRate
  );
}

// ---------------------------------------------------------------------------
// Education Bond calculations (FR-049 to FR-058)
// ---------------------------------------------------------------------------

export interface EducationBondProjection {
  bondId: string;
  currentTotal: number;
  tenYearDate: string;
  yearsToTenYear: number;
  projectedAtTenYear: number;
  nextYearMaxContribution: number;
  annualFeeDragDollars: number;
  taxBenefitVsMarginalRate: number; // saving if marginal > 30%
  internalTaxRate: number;
}

export function projectEducationBond(
  principal: number,
  earnings: number,
  currentYearContrib: number,
  priorYearContrib: number,
  commencementDate: string,
  grossReturn: number,         // e.g. 6.63
  internalTaxRate: number,     // e.g. 25
  managementFee: number,       // e.g. 0.85
  additionalCostsCap: number,  // e.g. 0.10
  ownerMarginalRate: number,   // as decimal, e.g. 0.37
  yearsToProject: number,
): EducationBondProjection {
  const totalFee = managementFee + additionalCostsCap;
  const netReturn = (grossReturn * (1 - internalTaxRate / 100) / 100) - totalFee / 100;
  const currentTotal = principal + earnings;

  // Project forward to 10-year mark
  const yrs = yearsUntilTenYear(commencementDate);
  let projected = currentTotal;
  for (let i = 0; i < Math.min(yrs, yearsToProject); i++) {
    projected *= 1 + netReturn;
    if (i === 0 && currentYearContrib > 0) projected += currentYearContrib;
  }

  const maxNextContrib = maxNCC125(currentYearContrib > 0 ? currentYearContrib : priorYearContrib);

  return {
    bondId: '',
    currentTotal,
    tenYearDate: tenYearDate(commencementDate),
    yearsToTenYear: yrs,
    projectedAtTenYear: Math.round(projected),
    nextYearMaxContribution: maxNextContrib,
    annualFeeDragDollars: Math.round(currentTotal * totalFee / 100),
    taxBenefitVsMarginalRate: Math.max(0, ownerMarginalRate - 0.30),
    internalTaxRate,
  };
}

// ETB calculation (FR-052)
export function calcEducationTaxBenefit(earningsWithdrawn: number): {
  etb: number;
  grossValue: number;
  netTaxIfNilIncome: number;
} {
  const etb = (earningsWithdrawn / 70) * 30;
  return {
    etb: Math.round(etb),
    grossValue: Math.round(earningsWithdrawn + etb),
    netTaxIfNilIncome: 0, // student with no other income → under $18,200 threshold
  };
}

// ---------------------------------------------------------------------------
// Life event costs with inflation (FR-059 to FR-062)
// ---------------------------------------------------------------------------

export function inflatedAmount(todayAmount: number, inflationRate: number, years: number): number {
  return Math.round(todayAmount * Math.pow(1 + inflationRate / 100, years));
}

export interface GwynetLifeEventSummary {
  schoolFeesTotalInflated: number;
  schoolFeesBondEligible: number;
  uniLivingSupportTotal: number;
  uniTuitionTotal: number;
  weddingInflated: number;
  depositInflated: number;
  extracurricularTotal: number;
  grandTotalInflated: number;
  centrelinkGiftingAlert: boolean;
  giftAmount: number;
}

export function calcLifeEventSummary(
  plan: RetirementPlan,
  member1DOB: string,
): GwynetLifeEventSummary {
  const le = plan.lifeEvents;
  const cy = currentYear();
  const dob = le.beneficiaryDateOfBirth;
  const birthYear = dob ? parseInt(dob.slice(0, 4), 10) : cy;

  // School: kindergarten ~age 5 to year 12 ~age 17
  const schoolStartYear = birthYear + 5;
  const schoolEndYear = birthYear + 18;
  const schoolYears = schoolEndYear - schoolStartYear;
  let schoolTotal = 0;
  if (le.schoolFees.enabled) {
    const annualCost = le.schoolFees.annualTuitionFee + le.schoolFees.annualAdditionalCosts;
    for (let y = 0; y < schoolYears; y++) {
      const yrsFromNow = (schoolStartYear + y) - cy;
      schoolTotal += inflatedAmount(annualCost, le.schoolFees.feeInflationRate, Math.max(0, yrsFromNow));
    }
  }

  // University
  const uniStartYear = birthYear + 18;
  let uniLiving = 0;
  let uniTuition = 0;
  if (le.university.enabled) {
    for (let y = 0; y < le.university.degreeDuration; y++) {
      const yrsFromNow = (uniStartYear + y) - cy;
      uniLiving += inflatedAmount(le.university.annualLivingSupport, plan.assumptions.cpiRate, Math.max(0, yrsFromNow));
      if (!le.university.useHECS) {
        const midBand = (UNI_BAND_RANGES[le.university.studyBand].low + UNI_BAND_RANGES[le.university.studyBand].high) / 2;
        uniTuition += inflatedAmount(midBand, plan.assumptions.cpiRate, Math.max(0, yrsFromNow));
      }
    }
  }

  // Wedding
  const weddingInflated = le.wedding.enabled
    ? inflatedAmount(le.wedding.parentalContribution, le.wedding.inflationRate, Math.max(0, le.wedding.estimatedYear - cy))
    : 0;

  // House deposit
  let depositAmount = le.houseDeposit.customAmount;
  if (le.houseDeposit.depositType !== 'custom') {
    // Use NSW average dwelling ~$1.06M × deposit %
    const medianPrice = 1060000;
    const pct = le.houseDeposit.depositType === '5-percent' ? 0.05
              : le.houseDeposit.depositType === '10-percent' ? 0.10 : 0.20;
    depositAmount = medianPrice * pct;
  }
  const depositInflated = le.houseDeposit.enabled
    ? inflatedAmount(depositAmount, plan.assumptions.propertyGrowthRate, Math.max(0, le.houseDeposit.estimatedYear - cy))
    : 0;

  const centrelinkAlert = le.houseDeposit.enabled &&
    le.houseDeposit.giftOrLoan === 'gift' &&
    depositAmount > 10000;

  // Extracurricular activities (excludes membership-covered items)
  let extracurricularTotal = 0;
  for (const act of (le.extracurricular ?? [])) {
    if (act.coveredByMembership || act.annualCost <= 0) continue;
    const actYears = Math.max(0, act.endAge - act.startAge);
    const actStartYear = birthYear + act.startAge;
    for (let y = 0; y < actYears; y++) {
      const yrsFromNow = (actStartYear + y) - cy;
      extracurricularTotal += inflatedAmount(act.annualCost, act.feeInflationRate, Math.max(0, yrsFromNow));
    }
  }

  return {
    schoolFeesTotalInflated: Math.round(schoolTotal),
    schoolFeesBondEligible: le.schoolFees.fundingSource !== 'cash'
      ? Math.round(schoolTotal * le.schoolFees.bondFundingPercent / 100)
      : 0,
    uniLivingSupportTotal: Math.round(uniLiving),
    uniTuitionTotal: Math.round(uniTuition),
    weddingInflated,
    depositInflated,
    extracurricularTotal: Math.round(extracurricularTotal),
    grandTotalInflated: Math.round(schoolTotal + uniLiving + uniTuition + weddingInflated + depositInflated + extracurricularTotal),
    centrelinkGiftingAlert: centrelinkAlert,
    giftAmount: depositAmount,
  };
}

// ---------------------------------------------------------------------------
// Simple year-by-year projection (FR-033)
// ---------------------------------------------------------------------------

export function runProjection(plan: RetirementPlan): ProjectionSummary {
  const cy = currentYear();
  const m1 = plan.profile.member1;
  const m2 = plan.profile.member2;
  const m1DOB = m1.dateOfBirth;
  const m2DOB = m2?.dateOfBirth;

  const retireYear1 = m1DOB
    ? parseInt(m1DOB.slice(0, 4), 10) + m1.retirementAge
    : cy + 10;
  const horizonAge = plan.assumptions.planningHorizonAge;
  const horizonYear = m1DOB
    ? parseInt(m1DOB.slice(0, 4), 10) + horizonAge
    : cy + 40;

  const years: ProjectionYear[] = [];

  // State
  let superBal = plan.superannuation.accounts.reduce((s, a) => s + a.currentBalance, 0);
  let investBal = plan.investments.assets.reduce((s, a) => s + a.currentValue, 0);
  let bondBal = plan.educationBond.bonds.reduce((s, b) => s + b.principalComponent + b.earningsComponent, 0);
  let propEquity = plan.property.principalResidence.currentValue - plan.property.principalResidence.mortgageBalance +
    plan.property.investmentProperties.reduce((s, p) => s + p.currentValue - p.loanBalance, 0);

  const isCouple = !!m2;
  const isHomeowner = plan.property.ownsHome;

  let totalAgePension = 0;
  let totalTax = 0;
  let portfolioExhaustedAge: number | null = null;

  const preRet = plan.assumptions.preRetirementReturn / 100;
  const postRet = plan.assumptions.postRetirementReturn / 100;
  const cpi = plan.assumptions.cpiRate / 100;
  const superFee = plan.assumptions.superFee / 100;
  const bondReturn = plan.assumptions.educationBondReturn / 100;
  const bondTaxRate = plan.assumptions.educationBondInternalTaxRate / 100;
  const bondNetReturn = bondReturn * (1 - bondTaxRate) - (FUTURITY_SP3.managementFee + FUTURITY_SP3.additionalCostsCap) / 100;

  const targetExpenses = plan.expenses.retirementTargetAnnual;

  // Life event years
  const le = plan.lifeEvents;
  const dob = le.beneficiaryDateOfBirth;
  const birthYear = dob ? parseInt(dob.slice(0, 4), 10) : cy + 5;

  for (let year = cy; year <= horizonYear; year++) {
    const age1 = ageAt(m1DOB, year);
    const age2 = m2DOB ? ageAt(m2DOB, year) : null;
    const isRetired = year >= retireYear1;
    const returnRate = isRetired ? postRet : preRet;

    // Super growth
    if (!isRetired) {
      const sgContrib = plan.superannuation.accounts.reduce((s, a) => {
        const salary = plan.income.sources
          .filter(src => src.memberId === a.memberId && src.type === 'salary')
          .reduce((t, src) => t + src.annualAmount, 0);
        return s + salary * (a.employerSGRate / 100) + a.salarySacrifice + a.nonConcessionalContribution;
      }, 0);
      superBal = superBal * (1 + returnRate - superFee) + sgContrib;
    } else {
      // Drawdown to meet expenses
      const minDraw = (() => {
        const rate = SUPER_CAPS_2026.minDrawdownRates.find(r => age1 <= r.maxAge);
        return superBal * (rate?.rate ?? 0.04);
      })();
      const expenseInflated = targetExpenses * Math.pow(1 + cpi, year - cy);
      superBal = superBal * (1 + returnRate - superFee);
      const draw = Math.max(minDraw, expenseInflated * 0.6);
      superBal = Math.max(0, superBal - draw);
    }

    // Investments growth
    investBal = investBal * (1 + returnRate);

    // Education bond
    bondBal = bondBal * (1 + bondNetReturn);

    // Life event outflows
    let lifeEventExp = 0;
    const gwAge = year - birthYear;

    if (le.schoolFees.enabled && gwAge >= 5 && gwAge <= 17) {
      const annualSchool = le.schoolFees.annualTuitionFee + le.schoolFees.annualAdditionalCosts;
      const inflated = inflatedAmount(annualSchool, le.schoolFees.feeInflationRate, Math.max(0, year - cy));
      lifeEventExp += inflated;
      if (le.schoolFees.fundingSource !== 'cash') {
        const bondPortion = inflated * le.schoolFees.bondFundingPercent / 100;
        bondBal = Math.max(0, bondBal - bondPortion);
      }
    }
    if (le.university.enabled && gwAge >= 18 && gwAge < 18 + le.university.degreeDuration) {
      const annualLiving = le.university.annualLivingSupport;
      lifeEventExp += inflatedAmount(annualLiving, cpi * 100, Math.max(0, year - cy));
    }
    if (le.wedding.enabled && year === le.wedding.estimatedYear) {
      const weddingCost = inflatedAmount(le.wedding.parentalContribution, le.wedding.inflationRate, Math.max(0, year - cy));
      lifeEventExp += weddingCost;
    }
    if (le.houseDeposit.enabled && year === le.houseDeposit.estimatedYear) {
      const depositBase = le.houseDeposit.depositType !== 'custom'
        ? 1060000 * { '5-percent': 0.05, '10-percent': 0.10, '20-percent': 0.20 }[le.houseDeposit.depositType]!
        : le.houseDeposit.customAmount;
      const depositCost = inflatedAmount(depositBase, plan.assumptions.propertyGrowthRate, Math.max(0, year - cy));
      lifeEventExp += depositCost;
    }
    // Extracurricular (membership-covered items cost $0 extra)
    for (const act of (le.extracurricular ?? [])) {
      if (act.coveredByMembership || act.annualCost <= 0) continue;
      if (gwAge >= act.startAge && gwAge < act.endAge) {
        lifeEventExp += inflatedAmount(act.annualCost, act.feeInflationRate, Math.max(0, year - cy));
      }
    }

    // Employment income
    const empIncome = isRetired ? 0 : plan.income.sources
      .filter(s => (!s.endYear || year <= s.endYear) && year >= s.startYear)
      .reduce((t, s) => t + inflatedAmount(s.annualAmount, s.growthRate, Math.max(0, year - s.startYear)), 0);

    // Investment income
    const invIncome = plan.investments.assets.reduce((s, a) => s + a.currentValue * a.incomeYield / 100, 0);

    // Age pension
    const financialAssets = superBal + investBal + bondBal;
    const deemInc = deemedIncome(financialAssets, isCouple);
    const totalAssetsForPension = financialAssets + propEquity * (isHomeowner ? 0 : 1);
    const pension = calcAgePension(age1, age2, isHomeowner, totalAssetsForPension, deemInc + invIncome + empIncome);
    const agePensionIncome = isRetired ? pension.finalAnnual : 0;

    totalAgePension += agePensionIncome;

    // Total income
    const totalIncome = empIncome + invIncome + agePensionIncome;

    // Tax
    const taxableSalary = empIncome;
    const taxPaid = isRetired ? 0 : calcIncomeTax(taxableSalary);
    totalTax += taxPaid;

    const expensesInflated = targetExpenses * Math.pow(1 + cpi, year - cy) + lifeEventExp;
    const superDrawdown = isRetired ? Math.max(0, expensesInflated - totalIncome) : 0;

    const netWorth = superBal + investBal + bondBal + propEquity;
    const surplus = totalIncome + superDrawdown - expensesInflated - taxPaid;

    if (netWorth <= 0 && portfolioExhaustedAge === null && isRetired) {
      portfolioExhaustedAge = age1;
    }

    years.push({
      year,
      age1,
      age2,
      superBalance: Math.max(0, Math.round(superBal)),
      investmentBalance: Math.max(0, Math.round(investBal)),
      propertyEquity: Math.max(0, Math.round(propEquity)),
      educationBondBalance: Math.max(0, Math.round(bondBal)),
      netWorth: Math.round(netWorth),
      totalIncome: Math.round(totalIncome),
      agePensionIncome: Math.round(agePensionIncome),
      superDrawdown: Math.round(superDrawdown),
      investmentIncome: Math.round(invIncome),
      employmentIncome: Math.round(empIncome),
      totalExpenses: Math.round(expensesInflated),
      lifeEventExpenses: Math.round(lifeEventExp),
      surplus: Math.round(surplus),
      taxPaid: Math.round(taxPaid),
    });
  }

  // Education bond 10-year summary
  const primaryBond = plan.educationBond.bonds[0];
  const bondTenYearDate = primaryBond ? tenYearDate(primaryBond.commencementDate) : '';
  const bondTenYearYear = bondTenYearDate ? parseInt(bondTenYearDate.slice(0, 4), 10) : 0;
  const bondTenYearRow = years.find(y => y.year === bondTenYearYear);

  const lifeEventSummary = calcLifeEventSummary(plan, m1DOB);

  return {
    retirementYear: retireYear1,
    portfolioExhaustedAge,
    surplusAtHorizon: years[years.length - 1]?.netWorth ?? 0,
    totalLifetimeAgePension: Math.round(totalAgePension),
    totalLifetimeTaxPaid: Math.round(totalTax),
    educationBondTenYearValue: bondTenYearRow?.educationBondBalance ?? 0,
    educationBondTenYearDate: bondTenYearDate,
    totalGwynetLifeEventCost: lifeEventSummary.grandTotalInflated,
    years,
  };
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

export function fmtCurrency(n: number, compact = false): string {
  if (compact && Math.abs(n) >= 1_000_000) {
    return `$${(n / 1_000_000).toFixed(1)}M`;
  }
  if (compact && Math.abs(n) >= 1_000) {
    return `$${(n / 1_000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(n);
}

export function fmtDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function fmtPct(n: number): string {
  return `${n.toFixed(2)}%`;
}
