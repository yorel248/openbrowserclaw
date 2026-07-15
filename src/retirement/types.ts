// ---------------------------------------------------------------------------
// Retirement Planner — Data Types (Australian, NSW focus)
// Covers FR-001 to FR-064
// ---------------------------------------------------------------------------

export interface RetirementPlan {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  profile: HouseholdProfile;
  superannuation: SuperannuationData;
  income: IncomeData;
  expenses: ExpensesData;
  property: PropertyData;
  investments: InvestmentsData;
  educationBond: EducationBondData;
  lifeEvents: LifeEventsData;
  assumptions: Assumptions;
}

// ---------------------------------------------------------------------------
// Section 1 — Profile (FR-001 to FR-003)
// ---------------------------------------------------------------------------

export interface HouseholdProfile {
  member1: PersonProfile;
  member2?: PersonProfile;
}

export interface PersonProfile {
  name: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: 'male' | 'female' | 'other' | '';
  employmentStatus: 'employed' | 'self-employed' | 'part-time' | 'career-break' | 'unemployed' | 'retired' | '';
  state: string;
  retirementAge: number;
}

// ---------------------------------------------------------------------------
// Section 2 — Superannuation (FR-004 to FR-013)
// ---------------------------------------------------------------------------

export interface SuperannuationData {
  accounts: SuperAccount[];
  catchUpContributions: boolean;
  divisionTwoNineThree: boolean;
}

export interface SuperAccount {
  id: string;
  memberId: 'member1' | 'member2';
  fundName: string;
  type: 'accumulation' | 'abp' | 'ttr' | 'smsf';
  currentBalance: number;
  employerSGRate: number;      // default 12
  salarySacrifice: number;
  nonConcessionalContribution: number;
  spouseContribution: number;
  investmentOption: 'conservative' | 'balanced' | 'growth' | 'high-growth' | 'custom';
  customReturn: number;
  annualSMSFFee: number;
  // Downsizer
  downsizer: boolean;
  downsizeAmount: number;
  downsizeYear: number;
}

// ---------------------------------------------------------------------------
// Section 3 — Income (FR-014 to FR-016)
// ---------------------------------------------------------------------------

export interface IncomeData {
  sources: IncomeSource[];
}

export interface IncomeSource {
  id: string;
  memberId: 'member1' | 'member2';
  type: 'salary' | 'self-employment' | 'rental' | 'dividends' | 'business-sale' | 'inheritance' | 'defined-benefit' | 'annuity' | 'other';
  description: string;
  annualAmount: number;
  startYear: number;
  endYear: number | null;
  growthRate: number;
}

// ---------------------------------------------------------------------------
// Section 4 — Expenses (FR-017 to FR-018)
// ---------------------------------------------------------------------------

export interface ExpensesData {
  asfePreset: 'comfortable-single' | 'comfortable-couple' | 'modest-single' | 'modest-couple' | 'custom';
  retirementTargetAnnual: number;
  expenseInflationRate: number;
  spendingSmile: boolean;
  oneOffExpenses: OneOffExpense[];
}

export interface OneOffExpense {
  id: string;
  description: string;
  year: number;
  amount: number;
}

// ASFA 2026 benchmarks
export const ASFA_BENCHMARKS = {
  'comfortable-single': 51278,
  'comfortable-couple': 72148,
  'modest-single': 33134,
  'modest-couple': 47731,
} as const;

// ---------------------------------------------------------------------------
// Section 5 — Age Pension thresholds (FR-019 to FR-022) — July 2026
// ---------------------------------------------------------------------------

export const AGE_PENSION = {
  qualifyingAge: 67,
  rates: {
    singleFortnight: 1200.90,
    coupleFortnight: 1808.72,
  },
  assetsTest: {
    singleHomeowner:    { full: 333000, cutoff: 733500 },
    singleNonHomeowner: { full: 600000, cutoff: 1000500 },
    coupleHomeowner:    { full: 499000, cutoff: 1102500 },
    coupleNonHomeowner: { full: 766000, cutoff: 1369500 },
  },
  incomeTest: {
    singleFreeArea: 226 * 26,    // annualised
    coupleFreeArea: 400 * 26,
    singleCutoff:   2619.80 * 26,
    coupleCutoff:   4000.80 * 26,
    taperRate: 0.50,
  },
  assetTaperPerThousand: 3 * 26, // $3/fortnight per $1k = $78/year
  deeming: {
    lowerRate: 0.0125,
    upperRate: 0.0325,
    singleThreshold: 64200,
    coupleThreshold: 106200,
  },
} as const;

// ---------------------------------------------------------------------------
// Section 6 — Property (FR-023 to FR-025)
// ---------------------------------------------------------------------------

export interface PropertyData {
  ownsHome: boolean;
  principalResidence: PrincipalResidence;
  investmentProperties: InvestmentProperty[];
}

export interface PrincipalResidence {
  currentValue: number;
  purchaseYear: number;
  mortgageBalance: number;
  mortgageRate: number;
  mortgageTermYears: number;
  monthlyRepayment: number;
  plannedSaleYear: number | null;
}

export interface InvestmentProperty {
  id: string;
  description: string;
  currentValue: number;
  purchasePrice: number;
  purchaseYear: number;
  annualRental: number;
  annualExpenses: number;
  loanBalance: number;
  loanRate: number;
  capitalGrowthRate: number;
  plannedSaleYear: number | null;
}

// ---------------------------------------------------------------------------
// Section 7 — Investments (FR-026 to FR-028)
// ---------------------------------------------------------------------------

export interface InvestmentsData {
  assets: InvestmentAsset[];
}

export type InvestmentAssetType = 'au-shares' | 'intl-shares' | 'managed-funds' | 'bonds' | 'cash' | 'crypto' | 'other';

export interface InvestmentAsset {
  id: string;
  type: InvestmentAssetType;
  description: string;
  currentValue: number;
  expectedReturn: number;
  incomeYield: number;
  frankingPercent: number;
}

// ---------------------------------------------------------------------------
// Section 13 — Education Bond (FR-047 to FR-058)
// Futurity SP3 — Sectoral Indexed International Equities
// ---------------------------------------------------------------------------

export interface EducationBondData {
  bonds: EducationBond[];
}

export interface EducationBond {
  id: string;
  bondOwner: string;
  commencementDate: string; // YYYY-MM-DD
  investmentOption: string;
  principalComponent: number;
  earningsComponent: number;
  currentYearContribution: number;
  priorYearContribution: number;
  managementFee: number;       // default 0.85
  additionalCostsCap: number;  // default 0.10
  expectedReturn: number;      // default 6.63
  effectiveTaxRate: number;    // default 25
  beneficiaries: EducationBeneficiary[];
}

export interface EducationBeneficiary {
  id: string;
  name: string;
  dateOfBirth: string;
  educationStartYear: number | null;
}

// SP3 fund details (FR-048)
export const FUTURITY_SP3 = {
  fundCode: 'SP3',
  apirCode: 'FIG2984AU',
  issuer: 'Futurity Investment Group Limited ABN 21 087 648 879 AFSL 236665',
  investmentStyle: 'Passive (Indexed)',
  assetAllocation: '100% Global Equities',
  benchmark: 'MSCI World Index (fully hedged to AUD)',
  underlyingFund: 'Vanguard International Shares Index Fund – Hedged (VAN0105AU)',
  managementFee: 0.85,
  additionalCostsCap: 0.10,
  buySpread: 0.06,
  sellSpread: 0.06,
  minInvestmentYears: 7,
  riskRating: 'High — 6',
  inceptionDate: '2020-06-11',
  performance: {
    '1m': -4.79, '3m': -2.92, '6m': -0.38,
    '1y': 12.66, '2y': 8.24, '3y': 11.67, '4y': 6.72, '5y': 6.63,
  },
  defaultReturn: 6.63,
} as const;

// ---------------------------------------------------------------------------
// Section 15 — Life Events: Gwyneth (FR-059 to FR-064)
// ---------------------------------------------------------------------------

export interface ExtracurricularActivity {
  id: string;
  name: string;
  annualCost: number;
  coveredByMembership: boolean;
  membershipNote: string;
  startAge: number;
  endAge: number;
  feeInflationRate: number;
}

export interface LifeEventsData {
  beneficiaryName: string;
  beneficiaryDateOfBirth: string;
  schoolFees: SchoolFeesEvent;
  university: UniversityEvent;
  wedding: WeddingEvent;
  houseDeposit: HouseDepositEvent;
  extracurricular: ExtracurricularActivity[];
}

export type SchoolType =
  | 'government'
  | 'catholic-systemic'
  | 'catholic-independent'
  | 'independent-lower'
  | 'independent-mid'
  | 'independent-elite';

export const SCHOOL_FEE_BENCHMARKS: Record<SchoolType, { tuitionLow: number; tuitionHigh: number; label: string }> = {
  'government':            { tuitionLow: 0,     tuitionHigh: 0,     label: 'Government / Public' },
  'catholic-systemic':     { tuitionLow: 2800,  tuitionHigh: 7500,  label: 'Catholic Systemic' },
  'catholic-independent':  { tuitionLow: 8000,  tuitionHigh: 25000, label: 'Catholic Independent' },
  'independent-lower':     { tuitionLow: 10000, tuitionHigh: 18500, label: 'Independent — Lower tier' },
  'independent-mid':       { tuitionLow: 18500, tuitionHigh: 32000, label: 'Independent — Mid tier' },
  'independent-elite':     { tuitionLow: 38000, tuitionHigh: 52000, label: 'Independent — Elite (GPS/CAS)' },
};

export interface SchoolFeesEvent {
  enabled: boolean;
  schoolType: SchoolType;
  annualTuitionFee: number;
  annualAdditionalCosts: number;
  feeInflationRate: number;
  fundingSource: 'cash' | 'education-bond' | 'combination';
  bondFundingPercent: number;
}

export type StudyBand = 1 | 2 | 3 | 4;

export const UNI_BAND_RANGES: Record<StudyBand, { low: number; high: number; label: string }> = {
  1: { low: 4738,  high: 6901,  label: 'Band 1 — Education, Humanities, Social Work' },
  2: { low: 8021,  high: 9827,  label: 'Band 2 — Computing, Health, Nursing' },
  3: { low: 11669, high: 11669, label: 'Band 3 — Engineering, Science, Allied Health' },
  4: { low: 11669, high: 16392, label: 'Band 4 — Law, Commerce, Medicine' },
};

export interface UniversityEvent {
  enabled: boolean;
  studyBand: StudyBand;
  degreeDuration: number;
  useHECS: boolean;
  annualLivingSupport: number;
  fundingSource: 'cash' | 'education-bond' | 'combination';
  bondFundingPercent: number;
}

export interface WeddingEvent {
  enabled: boolean;
  estimatedYear: number;
  parentalContribution: number;
  inflationRate: number;
  fundingSource: 'cash' | 'bond-post-10yr' | 'investment-sale' | 'combination';
}

export type DepositType = '5-percent' | '10-percent' | '20-percent' | 'custom';

export interface HouseDepositEvent {
  enabled: boolean;
  estimatedYear: number;
  depositType: DepositType;
  customAmount: number;
  giftOrLoan: 'gift' | 'loan';
  loanRepaymentAmount: number;
  fundingSource: 'cash' | 'bond-post-10yr' | 'investment-sale' | 'downsizing' | 'combination';
}

// ---------------------------------------------------------------------------
// Section 11 — Assumptions (FR-042 to FR-043)
// ---------------------------------------------------------------------------

export interface Assumptions {
  cpiRate: number;
  preRetirementReturn: number;
  postRetirementReturn: number;
  superFee: number;
  planningHorizonAge: number;
  wageGrowthRate: number;
  educationBondReturn: number;
  educationBondInternalTaxRate: number;
  propertyGrowthRate: number;
}

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  cpiRate: 2.5,
  preRetirementReturn: 7.0,
  postRetirementReturn: 5.0,
  superFee: 0.5,
  planningHorizonAge: 95,
  wageGrowthRate: 3.0,
  educationBondReturn: 6.63,
  educationBondInternalTaxRate: 25,
  propertyGrowthRate: 4.0,
};

// ---------------------------------------------------------------------------
// Super caps & thresholds 2026-27 (FR-005 to FR-009)
// ---------------------------------------------------------------------------

export const SUPER_CAPS_2026 = {
  concessionalCap: 32500,
  nonConcessionalCap: 130000,
  bringForwardCap: 390000,
  transferBalanceCap: 2100000,
  sgRate: 0.12,
  catchUpTSBThreshold: 500000,
  coContributionMax: 500,
  coContributionIncomeThreshold: 49293,
  coContributionPhaseOut: 64293,
  spouseOffsetMax: 540,
  spouseOffsetIncome1: 37000,
  spouseOffsetIncome2: 40000,
  division293Threshold: 250000,
  downsizeMinAge: 55,
  downsizeMaxPerPerson: 300000,
  preservationAge: 60,
  minDrawdownRates: [
    { maxAge: 64, rate: 0.04 },
    { maxAge: 74, rate: 0.05 },
    { maxAge: 79, rate: 0.06 },
    { maxAge: 84, rate: 0.07 },
    { maxAge: 89, rate: 0.09 },
    { maxAge: 94, rate: 0.11 },
    { maxAge: 999, rate: 0.14 },
  ],
} as const;

// ---------------------------------------------------------------------------
// Tax tables 2026-27 (FR-029)
// ---------------------------------------------------------------------------

export const TAX_BRACKETS_2026 = [
  { threshold: 0,      rate: 0,    base: 0 },
  { threshold: 18201,  rate: 0.19, base: 0 },
  { threshold: 45001,  rate: 0.325, base: 5092 },
  { threshold: 120001, rate: 0.37,  base: 29467 },
  { threshold: 180001, rate: 0.45,  base: 51667 },
] as const;

export const MEDICARE_LEVY = 0.02;
export const LITO_MAX = 700;
export const LITO_PHASEOUT_START = 37500;
export const SAPTO_SINGLE_THRESHOLD = 35812;
export const SAPTO_COUPLE_THRESHOLD = 31888;

// ---------------------------------------------------------------------------
// Projection output types
// ---------------------------------------------------------------------------

export interface ProjectionYear {
  year: number;
  age1: number;
  age2: number | null;
  superBalance: number;
  investmentBalance: number;
  propertyEquity: number;
  educationBondBalance: number;
  netWorth: number;
  totalIncome: number;
  agePensionIncome: number;
  superDrawdown: number;
  investmentIncome: number;
  employmentIncome: number;
  totalExpenses: number;
  lifeEventExpenses: number;
  surplus: number;
  taxPaid: number;
}

export interface ProjectionSummary {
  retirementYear: number;
  portfolioExhaustedAge: number | null;
  surplusAtHorizon: number;
  totalLifetimeAgePension: number;
  totalLifetimeTaxPaid: number;
  educationBondTenYearValue: number;
  educationBondTenYearDate: string;
  totalGwynetLifeEventCost: number;
  years: ProjectionYear[];
}

// ---------------------------------------------------------------------------
// Centrelink gifting rules (FR-062)
// ---------------------------------------------------------------------------

export const CENTRELINK_GIFTING = {
  annualAllowance: 10000,
  fiveYearLimit: 30000,
  deprivedAssetYears: 5,
} as const;

// ---------------------------------------------------------------------------
// Default plan factory
// ---------------------------------------------------------------------------

export function createDefaultPlan(name = 'My Retirement Plan'): RetirementPlan {
  const now = Date.now();
  const currentYear = new Date().getFullYear();

  return {
    id: `plan-${now}`,
    name,
    createdAt: now,
    updatedAt: now,
    profile: {
      member1: {
        name: '',
        dateOfBirth: '',
        gender: '',
        employmentStatus: '',
        state: 'NSW',
        retirementAge: 65,
      },
    },
    superannuation: {
      accounts: [],
      catchUpContributions: false,
      divisionTwoNineThree: false,
    },
    income: { sources: [] },
    expenses: {
      asfePreset: 'comfortable-couple',
      retirementTargetAnnual: ASFA_BENCHMARKS['comfortable-couple'],
      expenseInflationRate: 2.5,
      spendingSmile: false,
      oneOffExpenses: [],
    },
    property: {
      ownsHome: true,
      principalResidence: {
        currentValue: 0,
        purchaseYear: currentYear - 5,
        mortgageBalance: 0,
        mortgageRate: 6.0,
        mortgageTermYears: 25,
        monthlyRepayment: 0,
        plannedSaleYear: null,
      },
      investmentProperties: [],
    },
    investments: { assets: [] },
    educationBond: {
      bonds: [{
        id: 'bond-1',
        bondOwner: '',
        commencementDate: '',
        investmentOption: 'SP3 — Futurity Sectoral Indexed International Equities',
        principalComponent: 0,
        earningsComponent: 0,
        currentYearContribution: 0,
        priorYearContribution: 0,
        managementFee: FUTURITY_SP3.managementFee,
        additionalCostsCap: FUTURITY_SP3.additionalCostsCap,
        expectedReturn: FUTURITY_SP3.defaultReturn,
        effectiveTaxRate: 25,
        beneficiaries: [],
      }],
    },
    lifeEvents: {
      beneficiaryName: 'Gwyneth',
      beneficiaryDateOfBirth: '',
      schoolFees: {
        enabled: false,
        schoolType: 'independent-mid',
        annualTuitionFee: 18500,
        annualAdditionalCosts: 8000,
        feeInflationRate: 5.5,
        fundingSource: 'combination',
        bondFundingPercent: 50,
      },
      university: {
        enabled: false,
        studyBand: 2,
        degreeDuration: 4,
        useHECS: true,
        annualLivingSupport: 28000,
        fundingSource: 'cash',
        bondFundingPercent: 0,
      },
      wedding: {
        enabled: false,
        estimatedYear: currentYear + 25,
        parentalContribution: 30000,
        inflationRate: 2.5,
        fundingSource: 'cash',
      },
      houseDeposit: {
        enabled: false,
        estimatedYear: currentYear + 28,
        depositType: '20-percent',
        customAmount: 200000,
        giftOrLoan: 'gift',
        loanRepaymentAmount: 0,
        fundingSource: 'cash',
      },
      extracurricular: [
        { id: 'ec-piano',    name: 'Piano',     annualCost: 3600, coveredByMembership: false, membershipNote: '',                          startAge: 5,  endAge: 17, feeInflationRate: 3.0 },
        { id: 'ec-tennis',   name: 'Tennis',    annualCost: 2400, coveredByMembership: false, membershipNote: '',                          startAge: 5,  endAge: 17, feeInflationRate: 3.0 },
        { id: 'ec-swimming', name: 'Swimming',  annualCost: 0,    coveredByMembership: true,  membershipNote: 'Covered by YMCA gym membership', startAge: 5, endAge: 17, feeInflationRate: 0   },
        { id: 'ec-ballet',   name: 'Ballet',    annualCost: 2800, coveredByMembership: false, membershipNote: '',                          startAge: 5,  endAge: 12, feeInflationRate: 3.0 },
      ],
    },
    assumptions: { ...DEFAULT_ASSUMPTIONS },
  };
}
