// ---------------------------------------------------------------------------
// Retirement Planner — Main UI View
// ---------------------------------------------------------------------------

import type { RetirementPlan, SuperAccount, IncomeSource, InvestmentProperty, InvestmentAsset, EducationBond, EducationBeneficiary } from '../retirement/types.js';
import {
  ASFA_BENCHMARKS, SCHOOL_FEE_BENCHMARKS, UNI_BAND_RANGES,
  FUTURITY_SP3, SUPER_CAPS_2026, AGE_PENSION, CENTRELINK_GIFTING,
  createDefaultPlan,
} from '../retirement/types.js';
import { loadActivePlan, savePlan, exportPlanJSON } from '../retirement/store.js';
import {
  runProjection, calcAgePension, deemedIncome, projectEducationBond,
  calcLifeEventSummary, fmtCurrency, fmtDate, fmtPct, ageAt,
  yearsUntilTenYear, tenYearDate, maxNCC125, currentYear,
} from '../retirement/calc.js';

// ---------------------------------------------------------------------------
// Section definitions
// ---------------------------------------------------------------------------

type SectionId =
  | 'profile' | 'super' | 'income' | 'expenses'
  | 'property' | 'investments' | 'education-bond'
  | 'life-events' | 'age-pension' | 'projection' | 'assumptions';

const SECTIONS: { id: SectionId; label: string; icon: string }[] = [
  { id: 'profile',        label: 'Profile',         icon: '👤' },
  { id: 'super',          label: 'Super',            icon: '🏦' },
  { id: 'income',         label: 'Income',           icon: '💼' },
  { id: 'expenses',       label: 'Expenses',         icon: '🛒' },
  { id: 'property',       label: 'Property',         icon: '🏠' },
  { id: 'investments',    label: 'Investments',      icon: '📈' },
  { id: 'education-bond', label: 'Education Bond',   icon: '🎓' },
  { id: 'life-events',    label: 'Gwyneth',          icon: '⭐' },
  { id: 'age-pension',    label: 'Age Pension',      icon: '🇦🇺' },
  { id: 'projection',     label: 'Projection',       icon: '📊' },
  { id: 'assumptions',    label: 'Assumptions',      icon: '⚙️' },
];

// ---------------------------------------------------------------------------
// RetirementUI class
// ---------------------------------------------------------------------------

export class RetirementUI {
  private container: HTMLElement | null = null;
  private plan: RetirementPlan = createDefaultPlan();
  private activeSection: SectionId = 'profile';
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private contentEl: HTMLElement | null = null;

  async mount(container: HTMLElement): Promise<void> {
    this.container = container;
    try {
      this.plan = await loadActivePlan();
    } catch {
      this.plan = createDefaultPlan();
    }
    this.render();
  }

  // ---------------------------------------------------------------------------
  // Auto-save with debounce
  // ---------------------------------------------------------------------------

  private scheduleSave(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(async () => {
      await savePlan(this.plan);
      this.showSaveIndicator();
    }, 800);
  }

  private showSaveIndicator(): void {
    const ind = this.container?.querySelector('.ret-save-indicator');
    if (!ind) return;
    ind.textContent = 'Saved';
    ind.classList.add('ret-save-flash');
    setTimeout(() => ind.classList.remove('ret-save-flash'), 1500);
  }

  // ---------------------------------------------------------------------------
  // Render shell
  // ---------------------------------------------------------------------------

  private render(): void {
    if (!this.container) return;
    this.container.innerHTML = '';
    this.container.className = 'ret-shell';

    // Top bar
    const topBar = h('div', 'ret-topbar');
    const title = h('span', 'ret-topbar-title');
    title.textContent = 'Retirement Planner';
    const saveInd = h('span', 'ret-save-indicator');
    saveInd.textContent = '';
    const exportBtn = btn('Export JSON', 'ret-export-btn', async () => {
      const json = await exportPlanJSON(this.plan);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `retirement-plan-${Date.now()}.json`;
      a.click();
    });
    topBar.append(title, saveInd, exportBtn);
    this.container.appendChild(topBar);

    // Layout: sidebar + content
    const layout = h('div', 'ret-layout');

    // Sidebar
    const sidebar = h('nav', 'ret-sidebar');
    for (const sec of SECTIONS) {
      const item = h('button', 'ret-nav-item');
      item.dataset.section = sec.id;
      item.innerHTML = `<span class="ret-nav-icon">${sec.icon}</span><span class="ret-nav-label">${sec.label}</span>`;
      item.addEventListener('click', () => this.navigate(sec.id));
      sidebar.appendChild(item);
    }
    layout.appendChild(sidebar);

    // Content area
    const content = h('div', 'ret-content');
    content.id = 'ret-content';
    this.contentEl = content;
    layout.appendChild(content);

    this.container.appendChild(layout);

    this.updateNav();
    this.renderSection();
  }

  private navigate(section: SectionId): void {
    this.activeSection = section;
    this.updateNav();
    this.renderSection();
  }

  private updateNav(): void {
    this.container?.querySelectorAll('.ret-nav-item').forEach(item => {
      const el = item as HTMLElement;
      el.classList.toggle('active', el.dataset.section === this.activeSection);
    });
  }

  private renderSection(): void {
    if (!this.contentEl) return;
    this.contentEl.innerHTML = '';
    const wrap = h('div', 'ret-section-wrap');

    switch (this.activeSection) {
      case 'profile':        this.renderProfile(wrap); break;
      case 'super':          this.renderSuper(wrap); break;
      case 'income':         this.renderIncome(wrap); break;
      case 'expenses':       this.renderExpenses(wrap); break;
      case 'property':       this.renderProperty(wrap); break;
      case 'investments':    this.renderInvestments(wrap); break;
      case 'education-bond': this.renderEducationBond(wrap); break;
      case 'life-events':    this.renderLifeEvents(wrap); break;
      case 'age-pension':    this.renderAgePension(wrap); break;
      case 'projection':     this.renderProjection(wrap); break;
      case 'assumptions':    this.renderAssumptions(wrap); break;
    }

    this.contentEl.appendChild(wrap);
  }

  // ---------------------------------------------------------------------------
  // Section: Profile (FR-001 to FR-003)
  // ---------------------------------------------------------------------------

  private renderProfile(wrap: HTMLElement): void {
    sectionHeader(wrap, '👤', 'Profile & Household Setup', 'FR-001 to FR-003');
    this.renderMemberForm(wrap, 'member1', 'Member 1 (Primary)');
    const m2Toggle = h('div', 'ret-toggle-row');
    const cb = checkbox('Add Partner / Spouse', !!this.plan.profile.member2, (v) => {
      if (v) {
        this.plan.profile.member2 = { name: '', dateOfBirth: '', gender: '', employmentStatus: '', state: 'NSW', retirementAge: 65 };
      } else {
        delete this.plan.profile.member2;
      }
      this.scheduleSave();
      this.renderSection();
    });
    m2Toggle.appendChild(cb);
    wrap.appendChild(m2Toggle);
    if (this.plan.profile.member2) {
      this.renderMemberForm(wrap, 'member2', 'Member 2 (Partner / Spouse)');
    }
  }

  private renderMemberForm(wrap: HTMLElement, key: 'member1' | 'member2', title: string): void {
    const member = key === 'member1' ? this.plan.profile.member1 : this.plan.profile.member2!;
    const card = formCard(title);

    const grid = h('div', 'ret-form-grid');

    grid.appendChild(field('Full Name', input(member.name, v => { member.name = v; this.scheduleSave(); })));
    grid.appendChild(field('Date of Birth', input(member.dateOfBirth, v => { member.dateOfBirth = v; this.scheduleSave(); }, 'date')));
    grid.appendChild(field('Gender', select(
      { male: 'Male', female: 'Female', other: 'Non-binary / Other' },
      member.gender,
      v => { member.gender = v as typeof member.gender; this.scheduleSave(); }
    )));
    grid.appendChild(field('Employment Status', select(
      { employed: 'Employed', 'self-employed': 'Self-employed', 'part-time': 'Part-time', 'career-break': 'Career break', unemployed: 'Unemployed', retired: 'Retired' },
      member.employmentStatus,
      v => { member.employmentStatus = v as typeof member.employmentStatus; this.scheduleSave(); }
    )));
    grid.appendChild(field('State', select(
      { NSW: 'NSW', VIC: 'VIC', QLD: 'QLD', WA: 'WA', SA: 'SA', TAS: 'TAS', ACT: 'ACT', NT: 'NT' },
      member.state,
      v => { member.state = v; this.scheduleSave(); }
    )));
    grid.appendChild(field('Target Retirement Age', numInput(member.retirementAge, v => { member.retirementAge = v; this.scheduleSave(); })));

    const age = member.dateOfBirth ? ageAt(member.dateOfBirth, currentYear()) : null;
    if (age !== null) {
      const agePill = h('div', 'ret-age-pill');
      agePill.textContent = `Current age: ${age}`;
      grid.appendChild(agePill);
    }

    card.appendChild(grid);
    wrap.appendChild(card);
  }

  // ---------------------------------------------------------------------------
  // Section: Superannuation (FR-004 to FR-013)
  // ---------------------------------------------------------------------------

  private renderSuper(wrap: HTMLElement): void {
    sectionHeader(wrap, '🏦', 'Superannuation', 'FR-004 to FR-013');

    const threshCard = h('div', 'ret-info-bar');
    threshCard.innerHTML = `
      <span class="ret-info-item"><strong>Concessional cap:</strong> ${fmtCurrency(SUPER_CAPS_2026.concessionalCap)}/yr</span>
      <span class="ret-info-item"><strong>NCC cap:</strong> ${fmtCurrency(SUPER_CAPS_2026.nonConcessionalCap)}/yr</span>
      <span class="ret-info-item"><strong>Bring-forward:</strong> ${fmtCurrency(SUPER_CAPS_2026.bringForwardCap)} over 3 yrs</span>
      <span class="ret-info-item"><strong>Transfer Balance Cap:</strong> ${fmtCurrency(SUPER_CAPS_2026.transferBalanceCap)}</span>
      <span class="ret-info-item"><strong>SG rate:</strong> 12%</span>
    `;
    wrap.appendChild(threshCard);

    for (const acct of this.plan.superannuation.accounts) {
      this.renderSuperAccount(wrap, acct);
    }

    const addBtn = btn('+ Add Super Account', 'ret-add-btn', () => {
      const newAcct: SuperAccount = {
        id: `super-${Date.now()}`,
        memberId: 'member1',
        fundName: '',
        type: 'accumulation',
        currentBalance: 0,
        employerSGRate: 12,
        salarySacrifice: 0,
        nonConcessionalContribution: 0,
        spouseContribution: 0,
        investmentOption: 'balanced',
        customReturn: 7.0,
        annualSMSFFee: 0,
        downsizer: false,
        downsizeAmount: 0,
        downsizeYear: currentYear() + 10,
      };
      this.plan.superannuation.accounts.push(newAcct);
      this.scheduleSave();
      this.renderSection();
    });
    wrap.appendChild(addBtn);
  }

  private renderSuperAccount(wrap: HTMLElement, acct: SuperAccount): void {
    const card = formCard(`Super Account — ${acct.fundName || 'Unnamed'}`);
    const grid = h('div', 'ret-form-grid');

    const members: Record<string, string> = { member1: this.plan.profile.member1.name || 'Member 1' };
    if (this.plan.profile.member2) members.member2 = this.plan.profile.member2.name || 'Member 2';

    grid.appendChild(field('Member', select(members, acct.memberId, v => { acct.memberId = v as 'member1' | 'member2'; this.scheduleSave(); })));
    grid.appendChild(field('Fund Name', input(acct.fundName, v => { acct.fundName = v; this.scheduleSave(); })));
    grid.appendChild(field('Account Type', select(
      { accumulation: 'Accumulation', abp: 'Account-Based Pension (ABP)', ttr: 'Transition to Retirement (TTR)', smsf: 'SMSF' },
      acct.type, v => { acct.type = v as typeof acct.type; this.scheduleSave(); }
    )));
    grid.appendChild(field('Current Balance', currencyInput(acct.currentBalance, v => { acct.currentBalance = v; this.scheduleSave(); })));
    grid.appendChild(field('SG Rate (%)', numInput(acct.employerSGRate, v => { acct.employerSGRate = v; this.scheduleSave(); })));
    grid.appendChild(field('Salary Sacrifice ($/yr)', currencyInput(acct.salarySacrifice, v => { acct.salarySacrifice = v; this.scheduleSave(); })));
    grid.appendChild(field('Non-Concessional Contribution ($/yr)', currencyInput(acct.nonConcessionalContribution, v => { acct.nonConcessionalContribution = v; this.scheduleSave(); })));
    grid.appendChild(field('Spouse Contribution ($/yr)', currencyInput(acct.spouseContribution, v => { acct.spouseContribution = v; this.scheduleSave(); })));
    grid.appendChild(field('Investment Option', select(
      { conservative: 'Conservative', balanced: 'Balanced', growth: 'Growth', 'high-growth': 'High Growth', custom: 'Custom' },
      acct.investmentOption, v => { acct.investmentOption = v as typeof acct.investmentOption; this.scheduleSave(); }
    )));
    if (acct.investmentOption === 'custom') {
      grid.appendChild(field('Custom Return (%)', numInput(acct.customReturn, v => { acct.customReturn = v; this.scheduleSave(); })));
    }
    if (acct.type === 'smsf') {
      grid.appendChild(field('Annual SMSF Fee ($)', currencyInput(acct.annualSMSFFee, v => { acct.annualSMSFFee = v; this.scheduleSave(); })));
    }

    // Downsizer
    grid.appendChild(checkbox('Downsizer contribution', acct.downsizer, v => { acct.downsizer = v; this.scheduleSave(); this.renderSection(); }));
    if (acct.downsizer) {
      grid.appendChild(field('Downsizer Amount ($)', currencyInput(acct.downsizeAmount, v => { acct.downsizeAmount = v; this.scheduleSave(); })));
      grid.appendChild(field('Downsizer Year', numInput(acct.downsizeYear, v => { acct.downsizeYear = v; this.scheduleSave(); })));
      note(grid, `Max ${fmtCurrency(SUPER_CAPS_2026.downsizeMaxPerPerson)} per person. Age 55+. Property owned 10+ years. Not counted in contribution caps.`);
    }

    card.appendChild(grid);
    const removeBtn = btn('Remove Account', 'ret-remove-btn', () => {
      this.plan.superannuation.accounts = this.plan.superannuation.accounts.filter(a => a.id !== acct.id);
      this.scheduleSave();
      this.renderSection();
    });
    card.appendChild(removeBtn);
    wrap.appendChild(card);
  }

  // ---------------------------------------------------------------------------
  // Section: Income (FR-014 to FR-016)
  // ---------------------------------------------------------------------------

  private renderIncome(wrap: HTMLElement): void {
    sectionHeader(wrap, '💼', 'Income & Employment', 'FR-014 to FR-016');

    for (const src of this.plan.income.sources) {
      this.renderIncomeSource(wrap, src);
    }

    const addBtn = btn('+ Add Income Source', 'ret-add-btn', () => {
      const newSrc: IncomeSource = {
        id: `inc-${Date.now()}`,
        memberId: 'member1',
        type: 'salary',
        description: '',
        annualAmount: 0,
        startYear: currentYear(),
        endYear: null,
        growthRate: 3.0,
      };
      this.plan.income.sources.push(newSrc);
      this.scheduleSave();
      this.renderSection();
    });
    wrap.appendChild(addBtn);
  }

  private renderIncomeSource(wrap: HTMLElement, src: IncomeSource): void {
    const members: Record<string, string> = { member1: this.plan.profile.member1.name || 'Member 1' };
    if (this.plan.profile.member2) members.member2 = this.plan.profile.member2.name || 'Member 2';
    const card = formCard(src.description || 'Income Source');
    const grid = h('div', 'ret-form-grid');

    grid.appendChild(field('Member', select(members, src.memberId, v => { src.memberId = v as 'member1' | 'member2'; this.scheduleSave(); })));
    grid.appendChild(field('Type', select({
      salary: 'Salary / Wages', 'self-employment': 'Self-employment', rental: 'Rental income',
      dividends: 'Dividends', 'business-sale': 'Business sale', inheritance: 'Inheritance',
      'defined-benefit': 'Defined benefit pension', annuity: 'Annuity', other: 'Other',
    }, src.type, v => { src.type = v as typeof src.type; this.scheduleSave(); })));
    grid.appendChild(field('Description', input(src.description, v => { src.description = v; this.scheduleSave(); })));
    grid.appendChild(field('Annual Amount ($)', currencyInput(src.annualAmount, v => { src.annualAmount = v; this.scheduleSave(); })));
    grid.appendChild(field('Start Year', numInput(src.startYear, v => { src.startYear = v; this.scheduleSave(); })));
    grid.appendChild(field('End Year (blank = ongoing)', numInput(src.endYear ?? 0, v => { src.endYear = v || null; this.scheduleSave(); })));
    grid.appendChild(field('Annual Growth Rate (%)', numInput(src.growthRate, v => { src.growthRate = v; this.scheduleSave(); })));

    card.appendChild(grid);
    card.appendChild(btn('Remove', 'ret-remove-btn', () => {
      this.plan.income.sources = this.plan.income.sources.filter(s => s.id !== src.id);
      this.scheduleSave(); this.renderSection();
    }));
    wrap.appendChild(card);
  }

  // ---------------------------------------------------------------------------
  // Section: Expenses (FR-017 to FR-018)
  // ---------------------------------------------------------------------------

  private renderExpenses(wrap: HTMLElement): void {
    sectionHeader(wrap, '🛒', 'Expenses & Spending', 'FR-017 to FR-018');

    const card = formCard('Retirement Spending Goal');
    const grid = h('div', 'ret-form-grid');

    const exp = this.plan.expenses;
    grid.appendChild(field('ASFA Preset', select({
      'comfortable-couple': 'Comfortable Couple ($72,148/yr)',
      'comfortable-single': 'Comfortable Single ($51,278/yr)',
      'modest-couple': 'Modest Couple ($47,731/yr)',
      'modest-single': 'Modest Single ($33,134/yr)',
      custom: 'Custom',
    }, exp.asfePreset, v => {
      exp.asfePreset = v as typeof exp.asfePreset;
      if (v !== 'custom') exp.retirementTargetAnnual = ASFA_BENCHMARKS[v as keyof typeof ASFA_BENCHMARKS];
      this.scheduleSave(); this.renderSection();
    })));
    grid.appendChild(field('Annual Retirement Target ($)', currencyInput(exp.retirementTargetAnnual, v => {
      exp.retirementTargetAnnual = v; exp.asfePreset = 'custom'; this.scheduleSave();
    })));
    grid.appendChild(field('Expense Inflation Rate (%)', numInput(exp.expenseInflationRate, v => { exp.expenseInflationRate = v; this.scheduleSave(); })));
    grid.appendChild(checkbox('Apply spending smile curve (declining real spending post-70)', exp.spendingSmile, v => { exp.spendingSmile = v; this.scheduleSave(); }));

    card.appendChild(grid);
    wrap.appendChild(card);

    const oneOffCard = formCard('One-Off Large Expenses');
    note(oneOffCard, 'E.g. home renovation, holiday, vehicle, medical. Enter in today\'s dollars — inflation is applied.');
    for (const exp of this.plan.expenses.oneOffExpenses) {
      const row = h('div', 'ret-row');
      row.appendChild(input(exp.description, v => { exp.description = v; this.scheduleSave(); }));
      row.appendChild(numInput(exp.year, v => { exp.year = v; this.scheduleSave(); }, 'Year'));
      row.appendChild(currencyInput(exp.amount, v => { exp.amount = v; this.scheduleSave(); }));
      row.appendChild(btn('×', 'ret-remove-inline', () => {
        this.plan.expenses.oneOffExpenses = this.plan.expenses.oneOffExpenses.filter(e => e.id !== exp.id);
        this.scheduleSave(); this.renderSection();
      }));
      oneOffCard.appendChild(row);
    }
    oneOffCard.appendChild(btn('+ Add One-Off Expense', 'ret-add-btn', () => {
      this.plan.expenses.oneOffExpenses.push({ id: `exp-${Date.now()}`, description: '', year: currentYear() + 5, amount: 0 });
      this.scheduleSave(); this.renderSection();
    }));
    wrap.appendChild(oneOffCard);
  }

  // ---------------------------------------------------------------------------
  // Section: Property (FR-023 to FR-025)
  // ---------------------------------------------------------------------------

  private renderProperty(wrap: HTMLElement): void {
    sectionHeader(wrap, '🏠', 'Property & Real Estate', 'FR-023 to FR-025');
    const prop = this.plan.property;

    const homeCard = formCard('Principal Residence');
    const homeGrid = h('div', 'ret-form-grid');
    homeGrid.appendChild(checkbox('Owns home (exempt from Age Pension assets test)', prop.ownsHome, v => { prop.ownsHome = v; this.scheduleSave(); this.renderSection(); }));
    if (prop.ownsHome) {
      const r = prop.principalResidence;
      homeGrid.appendChild(field('Current Market Value ($)', currencyInput(r.currentValue, v => { r.currentValue = v; this.scheduleSave(); })));
      homeGrid.appendChild(field('Purchase Year', numInput(r.purchaseYear, v => { r.purchaseYear = v; this.scheduleSave(); })));
      homeGrid.appendChild(field('Mortgage Balance ($)', currencyInput(r.mortgageBalance, v => { r.mortgageBalance = v; this.scheduleSave(); })));
      homeGrid.appendChild(field('Mortgage Rate (%)', numInput(r.mortgageRate, v => { r.mortgageRate = v; this.scheduleSave(); })));
      homeGrid.appendChild(field('Mortgage Term Remaining (years)', numInput(r.mortgageTermYears, v => { r.mortgageTermYears = v; this.scheduleSave(); })));
      homeGrid.appendChild(field('Monthly Repayment ($)', currencyInput(r.monthlyRepayment, v => { r.monthlyRepayment = v; this.scheduleSave(); })));
      homeGrid.appendChild(field('Planned Sale Year (optional)', numInput(r.plannedSaleYear ?? 0, v => { r.plannedSaleYear = v || null; this.scheduleSave(); })));
      if (r.mortgageBalance > 0 && r.currentValue > 0) {
        const equity = r.currentValue - r.mortgageBalance;
        const lvr = (r.mortgageBalance / r.currentValue * 100).toFixed(1);
        note(homeGrid, `Equity: ${fmtCurrency(equity)} | LVR: ${lvr}% | CGT exempt on sale (principal residence)`);
      }
    }
    homeCard.appendChild(homeGrid);
    wrap.appendChild(homeCard);

    for (const ip of prop.investmentProperties) {
      this.renderInvestmentProperty(wrap, ip);
    }

    wrap.appendChild(btn('+ Add Investment Property', 'ret-add-btn', () => {
      prop.investmentProperties.push({
        id: `ip-${Date.now()}`, description: '', currentValue: 0,
        purchasePrice: 0, purchaseYear: currentYear() - 5,
        annualRental: 0, annualExpenses: 0, loanBalance: 0, loanRate: 6.0,
        capitalGrowthRate: 4.0, plannedSaleYear: null,
      });
      this.scheduleSave(); this.renderSection();
    }));
  }

  private renderInvestmentProperty(wrap: HTMLElement, ip: InvestmentProperty): void {
    const card = formCard(`Investment Property — ${ip.description || 'Unnamed'}`);
    const grid = h('div', 'ret-form-grid');
    grid.appendChild(field('Description', input(ip.description, v => { ip.description = v; this.scheduleSave(); })));
    grid.appendChild(field('Current Value ($)', currencyInput(ip.currentValue, v => { ip.currentValue = v; this.scheduleSave(); })));
    grid.appendChild(field('Purchase Price ($)', currencyInput(ip.purchasePrice, v => { ip.purchasePrice = v; this.scheduleSave(); })));
    grid.appendChild(field('Purchase Year', numInput(ip.purchaseYear, v => { ip.purchaseYear = v; this.scheduleSave(); })));
    grid.appendChild(field('Annual Rental Income ($)', currencyInput(ip.annualRental, v => { ip.annualRental = v; this.scheduleSave(); })));
    grid.appendChild(field('Annual Property Expenses ($)', currencyInput(ip.annualExpenses, v => { ip.annualExpenses = v; this.scheduleSave(); })));
    grid.appendChild(field('Loan Balance ($)', currencyInput(ip.loanBalance, v => { ip.loanBalance = v; this.scheduleSave(); })));
    grid.appendChild(field('Loan Interest Rate (%)', numInput(ip.loanRate, v => { ip.loanRate = v; this.scheduleSave(); })));
    grid.appendChild(field('Capital Growth Rate (%)', numInput(ip.capitalGrowthRate, v => { ip.capitalGrowthRate = v; this.scheduleSave(); })));
    grid.appendChild(field('Planned Sale Year (optional)', numInput(ip.plannedSaleYear ?? 0, v => { ip.plannedSaleYear = v || null; this.scheduleSave(); })));

    const heldYears = currentYear() - ip.purchaseYear;
    const cgtNote = heldYears > 1
      ? `Held ${heldYears} years — 50% CGT discount applies on sale. Estimated gain: ${fmtCurrency(ip.currentValue - ip.purchasePrice)}`
      : 'Hold > 12 months for 50% CGT discount on sale.';
    note(grid, cgtNote);

    card.appendChild(grid);
    card.appendChild(btn('Remove', 'ret-remove-btn', () => {
      this.plan.property.investmentProperties = this.plan.property.investmentProperties.filter(p => p.id !== ip.id);
      this.scheduleSave(); this.renderSection();
    }));
    wrap.appendChild(card);
  }

  // ---------------------------------------------------------------------------
  // Section: Investments (FR-026 to FR-028)
  // ---------------------------------------------------------------------------

  private renderInvestments(wrap: HTMLElement): void {
    sectionHeader(wrap, '📈', 'Investment Portfolio (Non-Super)', 'FR-026 to FR-028');

    const totalValue = this.plan.investments.assets.reduce((s, a) => s + a.currentValue, 0);
    if (totalValue > 0) {
      const summaryBar = h('div', 'ret-info-bar');
      summaryBar.innerHTML = `<span class="ret-info-item"><strong>Total portfolio:</strong> ${fmtCurrency(totalValue)}</span>`;
      wrap.appendChild(summaryBar);
    }

    for (const asset of this.plan.investments.assets) {
      this.renderInvestmentAsset(wrap, asset);
    }

    wrap.appendChild(btn('+ Add Investment Asset', 'ret-add-btn', () => {
      this.plan.investments.assets.push({
        id: `inv-${Date.now()}`, type: 'au-shares', description: '',
        currentValue: 0, expectedReturn: 7.0, incomeYield: 4.0, frankingPercent: 70,
      });
      this.scheduleSave(); this.renderSection();
    }));
  }

  private renderInvestmentAsset(wrap: HTMLElement, asset: InvestmentAsset): void {
    const card = formCard(asset.description || 'Investment Asset');
    const grid = h('div', 'ret-form-grid');
    grid.appendChild(field('Type', select({
      'au-shares': 'Australian Shares / ETFs', 'intl-shares': 'International Shares / ETFs',
      'managed-funds': 'Managed Funds', bonds: 'Bonds / Fixed Income',
      cash: 'Cash / Term Deposits', crypto: 'Cryptocurrency ⚠️ High Volatility', other: 'Other',
    }, asset.type, v => { asset.type = v as typeof asset.type; this.scheduleSave(); })));
    grid.appendChild(field('Description', input(asset.description, v => { asset.description = v; this.scheduleSave(); })));
    grid.appendChild(field('Current Value ($)', currencyInput(asset.currentValue, v => { asset.currentValue = v; this.scheduleSave(); })));
    grid.appendChild(field('Expected Annual Return (%)', numInput(asset.expectedReturn, v => { asset.expectedReturn = v; this.scheduleSave(); })));
    grid.appendChild(field('Income Yield (%)', numInput(asset.incomeYield, v => { asset.incomeYield = v; this.scheduleSave(); })));
    if (asset.type === 'au-shares' || asset.type === 'managed-funds') {
      grid.appendChild(field('Franking Credit (%)', numInput(asset.frankingPercent, v => { asset.frankingPercent = v; this.scheduleSave(); })));
    }
    card.appendChild(grid);
    card.appendChild(btn('Remove', 'ret-remove-btn', () => {
      this.plan.investments.assets = this.plan.investments.assets.filter(a => a.id !== asset.id);
      this.scheduleSave(); this.renderSection();
    }));
    wrap.appendChild(card);
  }

  // ---------------------------------------------------------------------------
  // Section: Education Bond (FR-047 to FR-058)
  // ---------------------------------------------------------------------------

  private renderEducationBond(wrap: HTMLElement): void {
    sectionHeader(wrap, '🎓', 'Education Bond — Futurity SP3', 'FR-047 to FR-058');

    // SP3 fund facts
    const factCard = h('div', 'ret-fund-facts');
    factCard.innerHTML = `
      <div class="ret-fund-header">
        <span class="ret-fund-name">Futurity Sectoral Indexed — International Equities</span>
        <span class="ret-fund-code">SP3 · FIG2984AU</span>
      </div>
      <div class="ret-fund-grid">
        <div class="ret-fund-item"><span class="ret-fund-label">Benchmark</span><span>${FUTURITY_SP3.benchmark}</span></div>
        <div class="ret-fund-item"><span class="ret-fund-label">Underlying Fund</span><span>${FUTURITY_SP3.underlyingFund}</span></div>
        <div class="ret-fund-item"><span class="ret-fund-label">Management Fee</span><span>${fmtPct(FUTURITY_SP3.managementFee)}</span></div>
        <div class="ret-fund-item"><span class="ret-fund-label">Risk Rating</span><span>${FUTURITY_SP3.riskRating}</span></div>
        <div class="ret-fund-item"><span class="ret-fund-label">1 Year Return</span><span class="ret-return-pos">${fmtPct(FUTURITY_SP3.performance['1y'])}</span></div>
        <div class="ret-fund-item"><span class="ret-fund-label">3 Year Return</span><span class="ret-return-pos">${fmtPct(FUTURITY_SP3.performance['3y'])} p.a.</span></div>
        <div class="ret-fund-item"><span class="ret-fund-label">5 Year Return</span><span class="ret-return-pos">${fmtPct(FUTURITY_SP3.performance['5y'])} p.a.</span></div>
        <div class="ret-fund-item"><span class="ret-fund-label">Inception</span><span>${fmtDate(FUTURITY_SP3.inceptionDate)}</span></div>
      </div>
      <div class="ret-fund-disclaimer">Past performance is not a reliable indicator of future performance. Data at 31 March 2026.</div>
    `;
    wrap.appendChild(factCard);

    for (const bond of this.plan.educationBond.bonds) {
      this.renderBondForm(wrap, bond);
    }

    wrap.appendChild(btn('+ Add Education Bond', 'ret-add-btn', () => {
      this.plan.educationBond.bonds.push({
        id: `bond-${Date.now()}`, bondOwner: '', commencementDate: '',
        investmentOption: 'SP3 — Futurity Sectoral Indexed International Equities',
        principalComponent: 0, earningsComponent: 0,
        currentYearContribution: 0, priorYearContribution: 0,
        managementFee: FUTURITY_SP3.managementFee, additionalCostsCap: FUTURITY_SP3.additionalCostsCap,
        expectedReturn: FUTURITY_SP3.defaultReturn, effectiveTaxRate: 25, beneficiaries: [],
      });
      this.scheduleSave(); this.renderSection();
    }));
  }

  private renderBondForm(wrap: HTMLElement, bond: EducationBond): void {
    const card = formCard(`Education Bond — ${bond.bondOwner || 'Bond Owner'}`);
    const grid = h('div', 'ret-form-grid');

    grid.appendChild(field('Bond Owner', input(bond.bondOwner, v => { bond.bondOwner = v; this.scheduleSave(); })));
    grid.appendChild(field('Commencement Date', input(bond.commencementDate, v => { bond.commencementDate = v; this.scheduleSave(); this.renderSection(); }, 'date')));
    grid.appendChild(field('Investment Option', input(bond.investmentOption, v => { bond.investmentOption = v; this.scheduleSave(); })));
    grid.appendChild(field('Principal Component ($)', currencyInput(bond.principalComponent, v => { bond.principalComponent = v; this.scheduleSave(); })));
    grid.appendChild(field('Earnings Component ($)', currencyInput(bond.earningsComponent, v => { bond.earningsComponent = v; this.scheduleSave(); })));
    grid.appendChild(field('Current Year Contribution ($)', currencyInput(bond.currentYearContribution, v => { bond.currentYearContribution = v; this.scheduleSave(); this.renderSection(); })));
    grid.appendChild(field('Prior Year Contribution ($)', currencyInput(bond.priorYearContribution, v => { bond.priorYearContribution = v; this.scheduleSave(); this.renderSection(); })));
    grid.appendChild(field('Expected Return (%)', numInput(bond.expectedReturn, v => { bond.expectedReturn = v; this.scheduleSave(); })));
    grid.appendChild(field('Internal Tax Rate (% effective)', numInput(bond.effectiveTaxRate, v => { bond.effectiveTaxRate = v; this.scheduleSave(); })));

    // 125% rule display
    const maxContrib = maxNCC125(bond.currentYearContribution || bond.priorYearContribution);
    if (maxContrib > 0) {
      const rule125 = h('div', 'ret-rule-highlight');
      rule125.innerHTML = `<strong>125% Rule:</strong> Next year max contribution = <strong>${fmtCurrency(maxContrib)}</strong>`;
      grid.appendChild(rule125);
    }

    // 10-year countdown
    if (bond.commencementDate) {
      const yrs = yearsUntilTenYear(bond.commencementDate);
      const tyd = tenYearDate(bond.commencementDate);
      const countdown = h('div', yrs === 0 ? 'ret-rule-highlight ret-ten-year-ready' : 'ret-rule-highlight ret-ten-year-countdown');
      countdown.innerHTML = yrs === 0
        ? `🎉 <strong>10-Year Tax-Free Advantage reached!</strong> All withdrawals are now tax-free.`
        : `⏱ <strong>10-Year Tax-Free Date:</strong> ${fmtDate(tyd)} — <strong>${yrs} year${yrs !== 1 ? 's' : ''} remaining</strong>`;
      grid.appendChild(countdown);

      // Projected value at 10 years
      const m1Income = this.plan.income.sources.find(s => s.type === 'salary')?.annualAmount ?? 0;
      const margRate = require_marginalRate(m1Income);
      const proj = projectEducationBond(
        bond.principalComponent, bond.earningsComponent,
        bond.currentYearContribution, bond.priorYearContribution,
        bond.commencementDate, bond.expectedReturn, bond.effectiveTaxRate,
        bond.managementFee, bond.additionalCostsCap, margRate, yrs,
      );
      const projCard = h('div', 'ret-proj-summary-mini');
      projCard.innerHTML = `
        <div class="ret-mini-stat"><span>Current Total</span><strong>${fmtCurrency(proj.currentTotal)}</strong></div>
        <div class="ret-mini-stat"><span>Projected at 10 Years</span><strong>${fmtCurrency(proj.projectedAtTenYear)}</strong></div>
        <div class="ret-mini-stat"><span>Annual Fee Drag</span><strong>${fmtCurrency(proj.annualFeeDragDollars)}</strong></div>
        <div class="ret-mini-stat"><span>Max Next Year Contribution</span><strong>${fmtCurrency(proj.nextYearMaxContribution)}</strong></div>
      `;
      grid.appendChild(projCard);
    }

    // Beneficiaries
    const benTitle = h('div', 'ret-subsection-title');
    benTitle.textContent = 'Education Beneficiaries';
    grid.appendChild(benTitle);

    for (const ben of bond.beneficiaries) {
      const benRow = h('div', 'ret-row');
      benRow.appendChild(input(ben.name, v => { ben.name = v; this.scheduleSave(); }, undefined, 'Beneficiary Name'));
      benRow.appendChild(input(ben.dateOfBirth, v => { ben.dateOfBirth = v; this.scheduleSave(); }, 'date'));
      benRow.appendChild(btn('×', 'ret-remove-inline', () => {
        bond.beneficiaries = bond.beneficiaries.filter(b => b.id !== ben.id);
        this.scheduleSave(); this.renderSection();
      }));
      grid.appendChild(benRow);
    }
    grid.appendChild(btn('+ Add Beneficiary', 'ret-add-btn-sm', () => {
      bond.beneficiaries.push({ id: `ben-${Date.now()}`, name: '', dateOfBirth: '', educationStartYear: null });
      this.scheduleSave(); this.renderSection();
    }));

    // ETB explainer
    const etbCard = h('div', 'ret-info-box');
    etbCard.innerHTML = `
      <div class="ret-info-box-title">Education Tax Benefit (ETB)</div>
      <p>For every <strong>$70</strong> withdrawn from the Earnings Component for eligible education expenses,
      a <strong>$30 ETB</strong> is paid — a refund of the 30% tax already paid inside the fund.</p>
      <p>ETB is assessable income in the <strong>Beneficiary's</strong> hands — not the Bond Owner's.
      If the beneficiary earns under $18,200 total, no tax is payable on the ETB.</p>
      <p>Eligible expenses: school fees K–12, university/TAFE tuition, textbooks, uniforms, laptops.</p>
    `;
    grid.appendChild(etbCard);

    const pensionNote = h('div', 'ret-warning-box');
    pensionNote.innerHTML = `
      <strong>Age Pension — Centrelink Treatment:</strong>
      The Education Bond is an <strong>assessable asset</strong> for the Age Pension assets test and is subject to
      <strong>deeming</strong> (not actual earnings). Deeming rates as at 20 March 2026:
      1.25% (up to $64,200 single/$106,200 couple) then 3.25% above.
    `;
    grid.appendChild(pensionNote);

    card.appendChild(grid);
    if (this.plan.educationBond.bonds.length > 1) {
      card.appendChild(btn('Remove Bond', 'ret-remove-btn', () => {
        this.plan.educationBond.bonds = this.plan.educationBond.bonds.filter(b => b.id !== bond.id);
        this.scheduleSave(); this.renderSection();
      }));
    }
    wrap.appendChild(card);
  }

  // ---------------------------------------------------------------------------
  // Section: Life Events — Gwyneth (FR-059 to FR-064)
  // ---------------------------------------------------------------------------

  private renderLifeEvents(wrap: HTMLElement): void {
    const le = this.plan.lifeEvents;
    sectionHeader(wrap, '⭐', `Life Events — ${le.beneficiaryName || 'Dependent'}`, 'FR-059 to FR-064');

    // Beneficiary details
    const profileCard = formCard('Beneficiary Details');
    const pg = h('div', 'ret-form-grid');
    pg.appendChild(field('Beneficiary Name', input(le.beneficiaryName, v => { le.beneficiaryName = v; this.scheduleSave(); })));
    pg.appendChild(field('Date of Birth', input(le.beneficiaryDateOfBirth, v => { le.beneficiaryDateOfBirth = v; this.scheduleSave(); this.renderSection(); }, 'date')));
    if (le.beneficiaryDateOfBirth) {
      const age = ageAt(le.beneficiaryDateOfBirth, currentYear());
      const agePill = h('div', 'ret-age-pill');
      agePill.textContent = `Current age: ${age}`;
      pg.appendChild(agePill);
    }
    profileCard.appendChild(pg);
    wrap.appendChild(profileCard);

    // School Fees
    this.renderSchoolFees(wrap, le);
    // University
    this.renderUniversity(wrap, le);
    // Wedding
    this.renderWedding(wrap, le);
    // House Deposit
    this.renderHouseDeposit(wrap, le);

    // Summary table
    const summary = calcLifeEventSummary(this.plan, this.plan.profile.member1.dateOfBirth);
    const summaryCard = formCard('Total Life Event Cost Summary (Inflated)');
    const tableWrap = h('div', 'ret-table-wrap');
    tableWrap.innerHTML = `
      <table class="ret-table">
        <thead><tr><th>Event</th><th>Low</th><th>Mid</th><th>High</th></tr></thead>
        <tbody>
          <tr><td>School Fees K–12</td><td>$105,000</td><td>$310,000</td><td>$845,000</td></tr>
          <tr><td>University (parental support only)</td><td>$100,000</td><td>$135,000</td><td>$210,000</td></tr>
          <tr><td>Wedding (parental contribution)</td><td>$10,000</td><td>$30,000</td><td>$50,000+</td></tr>
          <tr><td>House Deposit NSW (5%–20%)</td><td>$51,500</td><td>$150,000</td><td>$265,000</td></tr>
          <tr class="ret-table-total"><td><strong>Your Projected Total</strong></td><td colspan="3"><strong>${fmtCurrency(summary.grandTotalInflated)}</strong></td></tr>
        </tbody>
      </table>
    `;
    summaryCard.appendChild(tableWrap);
    if (summary.centrelinkGiftingAlert) {
      const alert = h('div', 'ret-warning-box');
      alert.innerHTML = `
        <strong>⚠️ Centrelink Gifting Rule Alert</strong><br>
        The proposed house deposit gift of ${fmtCurrency(summary.giftAmount)} exceeds the
        $${CENTRELINK_GIFTING.annualAllowance.toLocaleString()} annual gifting allowance.
        Amounts above $${CENTRELINK_GIFTING.annualAllowance.toLocaleString()}/year and
        $${CENTRELINK_GIFTING.fiveYearLimit.toLocaleString()} over 5 years are treated as
        <strong>deprived assets</strong> and remain in your Age Pension assets test for
        ${CENTRELINK_GIFTING.deprivedAssetYears} years from the date of the gift.
      `;
      summaryCard.appendChild(alert);
    }
    wrap.appendChild(summaryCard);
  }

  private renderSchoolFees(wrap: HTMLElement, le: typeof this.plan.lifeEvents): void {
    const sf = le.schoolFees;
    const card = formCard('School Fees (FR-059)');
    const grid = h('div', 'ret-form-grid');
    grid.appendChild(checkbox(`Enable school fees for ${le.beneficiaryName || 'dependent'}`, sf.enabled, v => { sf.enabled = v; this.scheduleSave(); this.renderSection(); }));
    if (sf.enabled) {
      grid.appendChild(field('School Type', select(
        Object.fromEntries(Object.entries(SCHOOL_FEE_BENCHMARKS).map(([k, v]) => [k, v.label])),
        sf.schoolType, v => {
          sf.schoolType = v as typeof sf.schoolType;
          const b = SCHOOL_FEE_BENCHMARKS[sf.schoolType];
          sf.annualTuitionFee = Math.round((b.tuitionLow + b.tuitionHigh) / 2);
          this.scheduleSave(); this.renderSection();
        }
      )));
      const bench = SCHOOL_FEE_BENCHMARKS[sf.schoolType];
      note(grid, `NSW benchmark: ${fmtCurrency(bench.tuitionLow)} – ${fmtCurrency(bench.tuitionHigh)} tuition/yr`);
      grid.appendChild(field('Annual Tuition Fee ($)', currencyInput(sf.annualTuitionFee, v => { sf.annualTuitionFee = v; this.scheduleSave(); })));
      grid.appendChild(field('Annual Additional Costs ($)', currencyInput(sf.annualAdditionalCosts, v => { sf.annualAdditionalCosts = v; this.scheduleSave(); })));
      grid.appendChild(field('Fee Inflation Rate (% p.a.)', numInput(sf.feeInflationRate, v => { sf.feeInflationRate = v; this.scheduleSave(); })));
      note(grid, 'NSW school fees rising 5–7% p.a. in 2026 — well above CPI.');
      grid.appendChild(field('Funding Source', select(
        { cash: 'Household Cash Flow', 'education-bond': 'Education Bond (ETB applies)', combination: 'Combination' },
        sf.fundingSource, v => { sf.fundingSource = v as typeof sf.fundingSource; this.scheduleSave(); this.renderSection(); }
      )));
      if (sf.fundingSource === 'combination') {
        grid.appendChild(field('Bond Funding (%)', numInput(sf.bondFundingPercent, v => { sf.bondFundingPercent = v; this.scheduleSave(); })));
      }
    }
    card.appendChild(grid);
    wrap.appendChild(card);
  }

  private renderUniversity(wrap: HTMLElement, le: typeof this.plan.lifeEvents): void {
    const u = le.university;
    const card = formCard('University Fees (FR-060)');
    const grid = h('div', 'ret-form-grid');
    grid.appendChild(checkbox(`Enable university for ${le.beneficiaryName || 'dependent'}`, u.enabled, v => { u.enabled = v; this.scheduleSave(); this.renderSection(); }));
    if (u.enabled) {
      grid.appendChild(field('Study Band', select(
        Object.fromEntries(([1, 2, 3, 4] as const).map(b => [String(b), UNI_BAND_RANGES[b].label])),
        String(u.studyBand), v => { u.studyBand = parseInt(v) as typeof u.studyBand; this.scheduleSave(); }
      )));
      const band = UNI_BAND_RANGES[u.studyBand];
      note(grid, `Student contribution: ${fmtCurrency(band.low)} – ${fmtCurrency(band.high)}/yr`);
      grid.appendChild(field('Degree Duration (years)', numInput(u.degreeDuration, v => { u.degreeDuration = v; this.scheduleSave(); })));
      grid.appendChild(checkbox('Use HECS-HELP (no upfront tuition cost to household)', u.useHECS, v => { u.useHECS = v; this.scheduleSave(); }));
      note(grid, 'HECS repayment threshold: $54,435/yr (2026–27). HELP lifetime cap: $129,883.');
      grid.appendChild(field('Annual Living Support from Parents ($)', currencyInput(u.annualLivingSupport, v => { u.annualLivingSupport = v; this.scheduleSave(); })));
      note(grid, 'NSW student living costs benchmark: $25,000–$35,000/yr (rent, food, transport, textbooks).');
      grid.appendChild(field('Funding Source (living costs)', select(
        { cash: 'Household Cash Flow', 'education-bond': 'Education Bond (ETB on tuition only)', combination: 'Combination' },
        u.fundingSource, v => { u.fundingSource = v as typeof u.fundingSource; this.scheduleSave(); }
      )));
      const etbNote = h('div', 'ret-info-box');
      etbNote.innerHTML = '<strong>Note:</strong> University/TAFE tuition and textbooks are eligible for ETB. General living costs are NOT eligible — must be paid from cash.';
      grid.appendChild(etbNote);
    }
    card.appendChild(grid);
    wrap.appendChild(card);
  }

  private renderWedding(wrap: HTMLElement, le: typeof this.plan.lifeEvents): void {
    const w = le.wedding;
    const card = formCard('Wedding (FR-061)');
    const grid = h('div', 'ret-form-grid');
    grid.appendChild(checkbox(`Enable wedding contribution for ${le.beneficiaryName || 'dependent'}`, w.enabled, v => { w.enabled = v; this.scheduleSave(); this.renderSection(); }));
    if (w.enabled) {
      grid.appendChild(field('Estimated Wedding Year', numInput(w.estimatedYear, v => { w.estimatedYear = v; this.scheduleSave(); })));
      grid.appendChild(field('Parental Contribution (today\'s $)', currencyInput(w.parentalContribution, v => { w.parentalContribution = v; this.scheduleSave(); })));
      grid.appendChild(field('Inflation Rate (%)', numInput(w.inflationRate, v => { w.inflationRate = v; this.scheduleSave(); })));
      const inflated = Math.round(w.parentalContribution * Math.pow(1 + w.inflationRate / 100, Math.max(0, w.estimatedYear - currentYear())));
      note(grid, `NSW average wedding 2026: $42,322. Sydney: $40,000–$50,000+. Your inflated contribution: ${fmtCurrency(inflated)}`);
      grid.appendChild(field('Funding Source', select({
        cash: 'Household Cash', 'bond-post-10yr': 'Education Bond (post-10yr, tax-free)',
        'investment-sale': 'Investment Sale', combination: 'Combination',
      }, w.fundingSource, v => { w.fundingSource = v as typeof w.fundingSource; this.scheduleSave(); })));
      note(grid, 'Wedding costs are NOT eligible for Education Bond ETB. However, a post-10-year tax-free bond withdrawal can fund the contribution.');
    }
    card.appendChild(grid);
    wrap.appendChild(card);
  }

  private renderHouseDeposit(wrap: HTMLElement, le: typeof this.plan.lifeEvents): void {
    const hd = le.houseDeposit;
    const card = formCard('House Deposit (FR-062)');
    const grid = h('div', 'ret-form-grid');
    grid.appendChild(checkbox(`Enable house deposit gift for ${le.beneficiaryName || 'dependent'}`, hd.enabled, v => { hd.enabled = v; this.scheduleSave(); this.renderSection(); }));
    if (hd.enabled) {
      grid.appendChild(field('Estimated Purchase Year', numInput(hd.estimatedYear, v => { hd.estimatedYear = v; this.scheduleSave(); })));
      grid.appendChild(field('Deposit Size', select({
        '5-percent': '5% (First Home Guarantee — no LMI, ~$53K NSW)',
        '10-percent': '10% (~$106K NSW)',
        '20-percent': '20% — no LMI (~$206K–$265K NSW)',
        custom: 'Custom Amount',
      }, hd.depositType, v => { hd.depositType = v as typeof hd.depositType; this.scheduleSave(); this.renderSection(); })));
      if (hd.depositType === 'custom') {
        grid.appendChild(field('Custom Amount (today\'s $)', currencyInput(hd.customAmount, v => { hd.customAmount = v; this.scheduleSave(); })));
      }
      grid.appendChild(field('Gift or Loan', select({ gift: 'Outright Gift', loan: 'Family Loan' }, hd.giftOrLoan, v => { hd.giftOrLoan = v as typeof hd.giftOrLoan; this.scheduleSave(); this.renderSection(); })));
      if (hd.giftOrLoan === 'loan') {
        grid.appendChild(field('Annual Repayment Amount ($)', currencyInput(hd.loanRepaymentAmount, v => { hd.loanRepaymentAmount = v; this.scheduleSave(); })));
      }
      grid.appendChild(field('Funding Source', select({
        cash: 'Household Cash', 'bond-post-10yr': 'Education Bond (post-10yr, tax-free)',
        'investment-sale': 'Investment Sale', downsizing: 'Downsizing Proceeds', combination: 'Combination',
      }, hd.fundingSource, v => { hd.fundingSource = v as typeof hd.fundingSource; this.scheduleSave(); })));

      const govSchemes = h('div', 'ret-info-box');
      govSchemes.innerHTML = `
        <div class="ret-info-box-title">Government Schemes</div>
        <p><strong>First Home Guarantee:</strong> 5% deposit, no LMI. Income cap: $125,000 (single) / $200,000 (couple). NSW property cap: $900,000. Gwyneth's eligibility depends on her income.</p>
        <p><strong>First Home Super Saver Scheme (FHSSS):</strong> Gwyneth may withdraw up to $50,000 of voluntary super contributions for a deposit — reduces parental contribution needed.</p>
      `;
      grid.appendChild(govSchemes);

      const giftAmount = hd.depositType === 'custom' ? hd.customAmount :
        hd.depositType === '5-percent' ? 1060000 * 0.05 :
        hd.depositType === '10-percent' ? 1060000 * 0.10 : 1060000 * 0.20;

      if (hd.giftOrLoan === 'gift' && giftAmount > CENTRELINK_GIFTING.annualAllowance) {
        const alertEl = h('div', 'ret-warning-box');
        alertEl.innerHTML = `
          <strong>⚠️ Centrelink Gifting Rule:</strong>
          Gifts above <strong>${fmtCurrency(CENTRELINK_GIFTING.annualAllowance)}/yr</strong> or
          <strong>${fmtCurrency(CENTRELINK_GIFTING.fiveYearLimit)}</strong> over 5 years are treated as
          deprived assets in your Age Pension assets test for <strong>${CENTRELINK_GIFTING.deprivedAssetYears} years</strong>.
        `;
        grid.appendChild(alertEl);
      }
    }
    card.appendChild(grid);
    wrap.appendChild(card);
  }

  // ---------------------------------------------------------------------------
  // Section: Age Pension (FR-019 to FR-022)
  // ---------------------------------------------------------------------------

  private renderAgePension(wrap: HTMLElement): void {
    sectionHeader(wrap, '🇦🇺', 'Age Pension Calculator', 'FR-019 to FR-022');

    const threshCard = h('div', 'ret-info-bar');
    threshCard.innerHTML = `
      <span class="ret-info-item"><strong>Qualifying Age:</strong> 67</span>
      <span class="ret-info-item"><strong>Full Single Pension:</strong> ${fmtCurrency(AGE_PENSION.rates.singleFortnight)}/fortnight</span>
      <span class="ret-info-item"><strong>Full Couple Pension:</strong> ${fmtCurrency(AGE_PENSION.rates.coupleFortnight)}/fortnight</span>
      <span class="ret-info-item"><strong>Deeming:</strong> 1.25% / 3.25%</span>
    `;
    wrap.appendChild(threshCard);

    // Calculate current position
    const m1 = this.plan.profile.member1;
    const m2 = this.plan.profile.member2;
    const age1 = m1.dateOfBirth ? ageAt(m1.dateOfBirth, currentYear()) : 67;
    const age2 = m2?.dateOfBirth ? ageAt(m2.dateOfBirth, currentYear()) : null;
    const isCouple = !!m2;
    const isHomeowner = this.plan.property.ownsHome;

    // Assets
    const superBal = this.plan.superannuation.accounts.reduce((s, a) => s + a.currentBalance, 0);
    const investBal = this.plan.investments.assets.reduce((s, a) => s + a.currentValue, 0);
    const bondBal = this.plan.educationBond.bonds.reduce((s, b) => s + b.principalComponent + b.earningsComponent, 0);
    const financialAssets = superBal + investBal + bondBal;
    const propEquity = isHomeowner ? 0 : (this.plan.property.principalResidence.currentValue - this.plan.property.principalResidence.mortgageBalance);
    const ipEquity = this.plan.property.investmentProperties.reduce((s, p) => s + p.currentValue - p.loanBalance, 0);
    const totalAssessable = financialAssets + propEquity + ipEquity;

    // Income
    const rentalIncome = this.plan.property.investmentProperties.reduce((s, p) => s + p.annualRental - p.annualExpenses, 0);
    const deemInc = deemedIncome(financialAssets, isCouple);
    const totalIncome = rentalIncome + deemInc;

    const pension = calcAgePension(age1, age2, isHomeowner, totalAssessable, totalIncome, !!m2);

    const card = formCard('Current Age Pension Estimate');
    const grid = h('div', 'ret-age-pension-grid');

    grid.innerHTML = `
      <div class="ret-ap-row"><span>Financial assets (super + investments + bond)</span><strong>${fmtCurrency(financialAssets)}</strong></div>
      <div class="ret-ap-row"><span>Investment property equity</span><strong>${fmtCurrency(ipEquity)}</strong></div>
      <div class="ret-ap-row"><span>Total assessable assets</span><strong>${fmtCurrency(totalAssessable)}</strong></div>
      <div class="ret-ap-row"><span>Deemed income on financial assets</span><strong>${fmtCurrency(deemInc)}</strong></div>
      <div class="ret-ap-row"><span>Rental income (net)</span><strong>${fmtCurrency(rentalIncome)}</strong></div>
      <div class="ret-ap-row"><span>Total assessable income</span><strong>${fmtCurrency(totalIncome)}</strong></div>
      <div class="ret-ap-row ret-ap-divider"></div>
      <div class="ret-ap-row"><span>Situation</span><strong>${isCouple ? 'Couple' : 'Single'} ${isHomeowner ? 'Homeowner' : 'Non-homeowner'}</strong></div>
      <div class="ret-ap-row"><span>Full annual pension</span><strong>${fmtCurrency(pension.fullAnnual)}</strong></div>
      <div class="ret-ap-row"><span>Assets test result</span><strong>${fmtCurrency(pension.assetsTestAmount)}</strong></div>
      <div class="ret-ap-row"><span>Income test result</span><strong>${fmtCurrency(pension.incomeTestAmount)}</strong></div>
      <div class="ret-ap-row ret-ap-result">
        <span>${pension.eligible ? 'Estimated Annual Age Pension' : 'Age Pension — Not yet eligible (age < 67)'}</span>
        <strong class="${pension.finalAnnual > 0 ? 'ret-ap-amount' : ''}">${fmtCurrency(pension.finalAnnual)}</strong>
      </div>
    `;
    card.appendChild(grid);
    wrap.appendChild(card);

    const threshTable = formCard('Assets Test Thresholds (July 2026)');
    const tw = h('div', 'ret-table-wrap');
    tw.innerHTML = `
      <table class="ret-table">
        <thead><tr><th>Situation</th><th>Full Pension</th><th>Part Pension Cut-off</th></tr></thead>
        <tbody>
          <tr><td>Single Homeowner</td><td>${fmtCurrency(AGE_PENSION.assetsTest.singleHomeowner.full)}</td><td>${fmtCurrency(AGE_PENSION.assetsTest.singleHomeowner.cutoff)}</td></tr>
          <tr><td>Single Non-Homeowner</td><td>${fmtCurrency(AGE_PENSION.assetsTest.singleNonHomeowner.full)}</td><td>${fmtCurrency(AGE_PENSION.assetsTest.singleNonHomeowner.cutoff)}</td></tr>
          <tr><td>Couple Homeowner</td><td>${fmtCurrency(AGE_PENSION.assetsTest.coupleHomeowner.full)}</td><td>${fmtCurrency(AGE_PENSION.assetsTest.coupleHomeowner.cutoff)}</td></tr>
          <tr><td>Couple Non-Homeowner</td><td>${fmtCurrency(AGE_PENSION.assetsTest.coupleNonHomeowner.full)}</td><td>${fmtCurrency(AGE_PENSION.assetsTest.coupleNonHomeowner.cutoff)}</td></tr>
        </tbody>
      </table>
    `;
    threshTable.appendChild(tw);
    wrap.appendChild(threshTable);
  }

  // ---------------------------------------------------------------------------
  // Section: Projection (FR-033 to FR-038)
  // ---------------------------------------------------------------------------

  private renderProjection(wrap: HTMLElement): void {
    sectionHeader(wrap, '📊', 'Retirement Projection', 'FR-033 to FR-038');

    const projection = runProjection(this.plan);

    // Summary KPIs
    const kpiBar = h('div', 'ret-kpi-bar');
    const kpis = [
      { label: 'Retirement Year', value: String(projection.retirementYear) },
      { label: 'Net Worth at Horizon', value: fmtCurrency(projection.surplusAtHorizon, true) },
      { label: 'Lifetime Age Pension', value: fmtCurrency(projection.totalLifetimeAgePension, true) },
      { label: 'Lifetime Tax Paid', value: fmtCurrency(projection.totalLifetimeTaxPaid, true) },
      { label: 'Education Bond at 10yr', value: fmtCurrency(projection.educationBondTenYearValue, true) },
      { label: 'Gwyneth Events Total', value: fmtCurrency(projection.totalGwynetLifeEventCost, true) },
    ];
    if (projection.portfolioExhaustedAge) {
      kpis.unshift({ label: '⚠️ Portfolio Exhausted Age', value: String(projection.portfolioExhaustedAge) });
    }
    for (const kpi of kpis) {
      const k = h('div', 'ret-kpi');
      k.innerHTML = `<span class="ret-kpi-label">${kpi.label}</span><strong class="ret-kpi-value">${kpi.value}</strong>`;
      kpiBar.appendChild(k);
    }
    wrap.appendChild(kpiBar);

    // Canvas chart
    const chartWrap = h('div', 'ret-chart-wrap');
    const canvas = document.createElement('canvas');
    canvas.className = 'ret-chart-canvas';
    canvas.width = 800;
    canvas.height = 300;
    chartWrap.appendChild(canvas);
    wrap.appendChild(chartWrap);

    // Draw after DOM insert
    requestAnimationFrame(() => this.drawProjectionChart(canvas, projection.years));

    // Year-by-year table
    const tableCard = formCard('Year-by-Year Projection');
    const tw = h('div', 'ret-table-wrap');
    const rows = projection.years
      .filter(y => y.year % 5 === 0 || y.year === projection.retirementYear || y.year === currentYear())
      .slice(0, 30);
    tw.innerHTML = `
      <table class="ret-table ret-table-sm">
        <thead>
          <tr>
            <th>Year</th><th>Age</th><th>Super</th><th>Investments</th>
            <th>Bond</th><th>Net Worth</th><th>Income</th><th>Age Pension</th><th>Expenses</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => `
            <tr class="${r.year === projection.retirementYear ? 'ret-table-highlight' : ''}">
              <td>${r.year}</td>
              <td>${r.age1}${r.age2 !== null ? ` / ${r.age2}` : ''}</td>
              <td>${fmtCurrency(r.superBalance, true)}</td>
              <td>${fmtCurrency(r.investmentBalance, true)}</td>
              <td>${fmtCurrency(r.educationBondBalance, true)}</td>
              <td>${fmtCurrency(r.netWorth, true)}</td>
              <td>${fmtCurrency(r.totalIncome, true)}</td>
              <td>${fmtCurrency(r.agePensionIncome, true)}</td>
              <td>${fmtCurrency(r.totalExpenses, true)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    tableCard.appendChild(tw);
    wrap.appendChild(tableCard);
  }

  private drawProjectionChart(canvas: HTMLCanvasElement, years: ReturnType<typeof runProjection>['years']): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const pad = { top: 24, right: 20, bottom: 40, left: 72 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;

    const isDark = true; // app is always dark
    const bg = '#1a1a2e';
    const gridColor = '#2d3555';
    const textColor = '#8892b0';
    const accentColor = '#64ffda';
    const superColor = '#64ffda';
    const investColor = '#7aa2f7';
    const bondColor = '#f0c040';
    const pensionColor = '#9ece6a';

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    if (years.length === 0) return;

    const maxNW = Math.max(...years.map(y => y.netWorth));
    const minNW = Math.min(0, ...years.map(y => y.netWorth));
    const range = maxNW - minNW || 1;

    const xScale = (i: number) => pad.left + (i / (years.length - 1)) * chartW;
    const yScale = (v: number) => pad.top + chartH - ((v - minNW) / range) * chartH;

    // Grid lines
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (i / 4) * chartH;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + chartW, y); ctx.stroke();
      const val = maxNW - (i / 4) * range;
      ctx.fillStyle = textColor;
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(fmtCurrency(val, true), pad.left - 6, y + 4);
    }

    // Year labels
    const step = Math.max(1, Math.floor(years.length / 8));
    years.forEach((y, i) => {
      if (i % step === 0) {
        const x = xScale(i);
        ctx.fillStyle = textColor;
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(String(y.year), x, H - 8);
      }
    });

    // Draw lines
    const drawLine = (getter: (y: typeof years[0]) => number, color: string, dashed = false): void => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash(dashed ? [6, 3] : []);
      ctx.beginPath();
      years.forEach((yr, i) => {
        const x = xScale(i);
        const y = yScale(getter(yr));
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    };

    drawLine(y => y.netWorth, accentColor);
    drawLine(y => y.superBalance, superColor, true);
    drawLine(y => y.investmentBalance, investColor, true);
    drawLine(y => y.educationBondBalance, bondColor, true);

    // Legend
    const legend = [
      { color: accentColor, label: 'Net Worth' },
      { color: superColor, label: 'Super' },
      { color: investColor, label: 'Investments' },
      { color: bondColor, label: 'Ed. Bond' },
    ];
    legend.forEach((l, i) => {
      const lx = pad.left + i * 120;
      ctx.fillStyle = l.color;
      ctx.fillRect(lx, 6, 16, 3);
      ctx.fillStyle = textColor;
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(l.label, lx + 20, 12);
    });
  }

  // ---------------------------------------------------------------------------
  // Section: Assumptions (FR-042 to FR-043)
  // ---------------------------------------------------------------------------

  private renderAssumptions(wrap: HTMLElement): void {
    sectionHeader(wrap, '⚙️', 'Modifiable Assumptions', 'FR-042 to FR-043');
    const a = this.plan.assumptions;
    const card = formCard('Global Assumptions');
    const grid = h('div', 'ret-form-grid');

    grid.appendChild(field('CPI / Inflation Rate (%)', numInput(a.cpiRate, v => { a.cpiRate = v; this.scheduleSave(); })));
    grid.appendChild(field('Pre-Retirement Investment Return (%)', numInput(a.preRetirementReturn, v => { a.preRetirementReturn = v; this.scheduleSave(); })));
    grid.appendChild(field('Post-Retirement Investment Return (%)', numInput(a.postRetirementReturn, v => { a.postRetirementReturn = v; this.scheduleSave(); })));
    grid.appendChild(field('Super Fund Fee (% p.a.)', numInput(a.superFee, v => { a.superFee = v; this.scheduleSave(); })));
    grid.appendChild(field('Planning Horizon Age', numInput(a.planningHorizonAge, v => { a.planningHorizonAge = v; this.scheduleSave(); })));
    grid.appendChild(field('Wage Growth Rate (%)', numInput(a.wageGrowthRate, v => { a.wageGrowthRate = v; this.scheduleSave(); })));
    grid.appendChild(field('Property Growth Rate (%)', numInput(a.propertyGrowthRate, v => { a.propertyGrowthRate = v; this.scheduleSave(); })));
    grid.appendChild(field('Education Bond Expected Return (% gross)', numInput(a.educationBondReturn, v => { a.educationBondReturn = v; this.scheduleSave(); })));
    grid.appendChild(field('Education Bond Internal Tax Rate (%)', numInput(a.educationBondInternalTaxRate, v => { a.educationBondInternalTaxRate = v; this.scheduleSave(); })));

    note(grid, 'All projections use the Australian financial year: 1 July – 30 June.');

    card.appendChild(grid);
    wrap.appendChild(card);
  }
}

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------

function h(tag: string, className?: string): HTMLElement {
  const el = document.createElement(tag);
  if (className) el.className = className;
  return el;
}

function btn(label: string, className: string, onClick: () => void): HTMLButtonElement {
  const b = document.createElement('button');
  b.className = className;
  b.textContent = label;
  b.addEventListener('click', onClick);
  return b;
}

function sectionHeader(wrap: HTMLElement, icon: string, title: string, frRef: string): void {
  const el = h('div', 'ret-section-header');
  el.innerHTML = `
    <span class="ret-section-icon">${icon}</span>
    <div>
      <h2 class="ret-section-title">${title}</h2>
      <span class="ret-fr-ref">${frRef}</span>
    </div>
  `;
  wrap.appendChild(el);
}

function formCard(title: string): HTMLElement {
  const card = h('div', 'ret-card');
  const t = h('div', 'ret-card-title');
  t.textContent = title;
  card.appendChild(t);
  return card;
}

function field(label: string, inputEl: HTMLElement): HTMLElement {
  const wrap = h('div', 'ret-field');
  const lbl = document.createElement('label');
  lbl.className = 'ret-label';
  lbl.textContent = label;
  wrap.appendChild(lbl);
  wrap.appendChild(inputEl);
  return wrap;
}

function input(value: string, onChange: (v: string) => void, type = 'text', placeholder?: string): HTMLInputElement {
  const inp = document.createElement('input');
  inp.className = 'ret-input';
  inp.type = type;
  inp.value = value;
  if (placeholder) inp.placeholder = placeholder;
  inp.addEventListener('input', () => onChange(inp.value));
  return inp;
}

function numInput(value: number, onChange: (v: number) => void, placeholder?: string): HTMLInputElement {
  const inp = document.createElement('input');
  inp.className = 'ret-input ret-input-num';
  inp.type = 'number';
  inp.value = value ? String(value) : '';
  inp.step = '0.01';
  if (placeholder) inp.placeholder = placeholder;
  inp.addEventListener('input', () => {
    const v = parseFloat(inp.value);
    if (!isNaN(v)) onChange(v);
  });
  return inp;
}

function currencyInput(value: number, onChange: (v: number) => void): HTMLInputElement {
  const inp = document.createElement('input');
  inp.className = 'ret-input ret-input-currency';
  inp.type = 'number';
  inp.value = value ? String(value) : '';
  inp.min = '0';
  inp.step = '1000';
  inp.addEventListener('input', () => {
    const v = parseFloat(inp.value);
    if (!isNaN(v)) onChange(v);
  });
  return inp;
}

function select(options: Record<string, string>, value: string, onChange: (v: string) => void): HTMLSelectElement {
  const sel = document.createElement('select');
  sel.className = 'ret-select';
  for (const [k, v] of Object.entries(options)) {
    const opt = document.createElement('option');
    opt.value = k;
    opt.textContent = v;
    if (k === value) opt.selected = true;
    sel.appendChild(opt);
  }
  sel.addEventListener('change', () => onChange(sel.value));
  return sel;
}

function checkbox(label: string, checked: boolean, onChange: (v: boolean) => void): HTMLElement {
  const wrap = h('div', 'ret-checkbox-row');
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.className = 'ret-checkbox';
  cb.checked = checked;
  cb.addEventListener('change', () => onChange(cb.checked));
  const lbl = document.createElement('label');
  lbl.className = 'ret-checkbox-label';
  lbl.textContent = label;
  lbl.prepend(cb);
  wrap.appendChild(lbl);
  return wrap;
}

function note(parent: HTMLElement, text: string): void {
  const n = h('div', 'ret-note');
  n.textContent = text;
  parent.appendChild(n);
}

// Shim for marginalRate used inside renderBondForm
function require_marginalRate(income: number): number {
  if (income >= 180001) return 0.45;
  if (income >= 120001) return 0.37;
  if (income >= 45001)  return 0.325;
  if (income >= 18201)  return 0.19;
  return 0;
}
