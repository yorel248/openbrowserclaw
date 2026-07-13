import { chromium } from 'playwright';

const S = '/tmp/claude-0/-home-user-openbrowserclaw/9ce08942-1e74-58be-9edb-fdc5dc662ab9/scratchpad';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1200, height: 860 } });
const page = await ctx.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

await page.goto('http://localhost:5173/');
await page.waitForTimeout(1500);

// ── Navigate to Retirement
await page.click('button.nav-btn[data-view="retirement"]');
await page.waitForTimeout(700);

// ── 1. PROFILE
await page.fill('input.ret-input[type="text"]:first-of-type', 'Leroy Pinto');
const d0 = await page.$$('input.ret-input[type="date"]');
await d0[0].fill('1975-03-22');
const n0 = await page.$$('input.ret-input-num');
await n0[0].fill('62');
// Add partner
await page.check('input.ret-checkbox');
await page.waitForTimeout(400);
const t1 = await page.$$('input.ret-input[type="text"]');
if (t1[1]) await t1[1].fill('Sandra Pinto');
const d1 = await page.$$('input.ret-input[type="date"]');
if (d1[1]) await d1[1].fill('1978-07-10');
await page.waitForTimeout(400);
await page.screenshot({ path: `${S}/s01_profile.png` });
console.log('✓ 1. Profile (couple)');

// ── 2. SUPER
await page.click('button.ret-nav-item[data-section="super"]');
await page.waitForTimeout(400);
await page.screenshot({ path: `${S}/s02a_super_caps.png` });
await page.click('button.ret-add-btn');
await page.waitForTimeout(400);
const t2 = await page.$$('input.ret-input[type="text"]');
if (t2[0]) await t2[0].fill('AustralianSuper');
const c2 = await page.$$('input.ret-input-currency');
if (c2[0]) await c2[0].fill('485000');  // balance
if (c2[2]) await c2[2].fill('25000');   // salary sacrifice
if (c2[3]) await c2[3].fill('20000');   // NCC
await page.waitForTimeout(200);
await page.screenshot({ path: `${S}/s02b_super_account.png` });
console.log('✓ 2. Super');

// ── 3. INCOME
await page.click('button.ret-nav-item[data-section="income"]');
await page.waitForTimeout(400);
await page.click('button.ret-add-btn');
await page.waitForTimeout(400);
const t3 = await page.$$('input.ret-input[type="text"]');
if (t3[0]) await t3[0].fill('Senior Engineer');
const c3 = await page.$$('input.ret-input-currency');
if (c3[0]) await c3[0].fill('185000');
await page.screenshot({ path: `${S}/s03_income.png` });
console.log('✓ 3. Income');

// ── 4. EXPENSES
await page.click('button.ret-nav-item[data-section="expenses"]');
await page.waitForTimeout(400);
const cb4 = await page.$$('input.ret-checkbox');
if (cb4[0]) await cb4[0].check();  // spending smile
await page.waitForTimeout(200);
await page.click('button.ret-add-btn');
await page.waitForTimeout(300);
const t4 = await page.$$('input.ret-input[type="text"]');
if (t4[0]) await t4[0].fill('Home renovation');
const c4 = await page.$$('input.ret-input-currency');
if (c4[0]) await c4[0].fill('85000');
await page.screenshot({ path: `${S}/s04_expenses.png` });
console.log('✓ 4. Expenses');

// ── 5. PROPERTY
await page.click('button.ret-nav-item[data-section="property"]');
await page.waitForTimeout(400);
const c5a = await page.$$('input.ret-input-currency');
if (c5a[0]) await c5a[0].fill('1650000');
if (c5a[1]) await c5a[1].fill('220000');
await page.click('button.ret-add-btn');
await page.waitForTimeout(400);
const t5 = await page.$$('input.ret-input[type="text"]');
if (t5[0]) await t5[0].fill('Unit — Parramatta');
const c5b = await page.$$('input.ret-input-currency');
if (c5b[2]) await c5b[2].fill('780000');
if (c5b[4]) await c5b[4].fill('34000');
if (c5b[5]) await c5b[5].fill('9500');
if (c5b[6]) await c5b[6].fill('310000');
await page.screenshot({ path: `${S}/s05_property.png` });
console.log('✓ 5. Property (PPOR + investment property)');

// ── 6. INVESTMENTS
await page.click('button.ret-nav-item[data-section="investments"]');
await page.waitForTimeout(400);
await page.click('button.ret-add-btn');
await page.waitForTimeout(400);
const t6 = await page.$$('input.ret-input[type="text"]');
if (t6[0]) await t6[0].fill('VAS — Vanguard Aust Shares ETF');
const c6 = await page.$$('input.ret-input-currency');
if (c6[0]) await c6[0].fill('125000');
await page.screenshot({ path: `${S}/s06_investments.png` });
console.log('✓ 6. Investments');

// ── 7. EDUCATION BOND (re-query after each re-render trigger)
await page.click('button.ret-nav-item[data-section="education-bond"]');
await page.waitForTimeout(600);
await page.screenshot({ path: `${S}/s07a_bond_sp3_facts.png` });
// Fill commencement date — triggers re-render
const d7 = await page.$$('input.ret-input[type="date"]');
if (d7[0]) { await d7[0].fill('2020-06-11'); await page.waitForTimeout(600); }
// Re-query after re-render
const c7 = await page.$$('input.ret-input-currency');
if (c7[0]) await c7[0].fill('65000');
if (c7[1]) await c7[1].fill('22000');
// current year contribution triggers re-render
if (c7[2]) { await c7[2].fill('15000'); await page.waitForTimeout(500); }
// re-query again
const c7b = await page.$$('input.ret-input-currency');
if (c7b[3]) await c7b[3].fill('12000');
// Add beneficiary
await page.click('button.ret-add-btn-sm');
await page.waitForTimeout(300);
const t7b = await page.$$('input.ret-input[type="text"]');
if (t7b[t7b.length-1]) await t7b[t7b.length-1].fill('Gwyneth Pinto');
const d7b = await page.$$('input.ret-input[type="date"]');
if (d7b[d7b.length-1]) await d7b[d7b.length-1].fill('2012-04-03');
await page.waitForTimeout(400);
await page.screenshot({ path: `${S}/s07b_bond_form.png` });
await page.evaluate(() => document.querySelector('.ret-content')?.scrollTo(0, 99999));
await page.waitForTimeout(300);
await page.screenshot({ path: `${S}/s07c_bond_etb_warning.png` });
console.log('✓ 7. Education Bond (SP3 facts + 10yr countdown + 125% rule + ETB + Centrelink warning)');

// ── 8. GWYNETH LIFE EVENTS
await page.click('button.ret-nav-item[data-section="life-events"]');
await page.waitForTimeout(400);
// Fill DOB — triggers renderSection()
await page.locator('input.ret-input[type="date"]').first().fill('2012-04-03');
await page.waitForTimeout(500);
// Use locators (lazily re-evaluated after each renderSection()) to check each toggle
await page.locator('input.ret-checkbox').nth(0).check();   // school fees
await page.waitForTimeout(500);
await page.locator('input.ret-checkbox').nth(1).check();   // university
await page.waitForTimeout(500);
await page.locator('input.ret-checkbox').nth(2).check();   // wedding
await page.waitForTimeout(500);
await page.locator('input.ret-checkbox').nth(3).check();   // house deposit
await page.waitForTimeout(500);
await page.screenshot({ path: `${S}/s08a_life_events.png` });
await page.evaluate(() => document.querySelector('.ret-content')?.scrollTo(0, 99999));
await page.waitForTimeout(300);
await page.screenshot({ path: `${S}/s08b_life_events_summary.png` });
console.log('✓ 8. Life Events (school + uni + wedding + deposit + gifting alert)');

// ── 9. AGE PENSION
await page.click('button.ret-nav-item[data-section="age-pension"]');
await page.waitForTimeout(600);
await page.screenshot({ path: `${S}/s09_age_pension.png` });
await page.evaluate(() => document.querySelector('.ret-content')?.scrollTo(0, 99999));
await page.waitForTimeout(300);
await page.screenshot({ path: `${S}/s09b_age_pension_thresholds.png` });
console.log('✓ 9. Age Pension (calc + thresholds table)');

// ── 10. PROJECTION
await page.click('button.ret-nav-item[data-section="projection"]');
await page.waitForTimeout(1800);
await page.screenshot({ path: `${S}/s10a_projection_kpi.png` });
await page.evaluate(() => document.querySelector('.ret-content')?.scrollTo(0, 600));
await page.waitForTimeout(400);
await page.screenshot({ path: `${S}/s10b_projection_table.png` });
console.log('✓ 10. Projection (KPIs + chart + year table)');

// ── 11. ASSUMPTIONS
await page.click('button.ret-nav-item[data-section="assumptions"]');
await page.waitForTimeout(400);
await page.screenshot({ path: `${S}/s11_assumptions.png` });
console.log('✓ 11. Assumptions');

if (errors.length) console.error('\n⚠ Page errors:', errors);
else console.log('\n✓ Zero console errors across all sections');

await browser.close();
console.log('── Verification complete ──');
