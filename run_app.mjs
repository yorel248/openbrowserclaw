import { chromium } from 'playwright';

const S = '/tmp/claude-0/-home-user-openbrowserclaw/9ce08942-1e74-58be-9edb-fdc5dc662ab9/scratchpad';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

await page.goto('http://localhost:5173/');
await page.waitForTimeout(1800);
await page.screenshot({ path: `${S}/app_chat.png` });
console.log('Chat view loaded');

// Navigate to retirement planner
await page.click('button.nav-btn[data-view="retirement"]');
await page.waitForTimeout(800);
await page.screenshot({ path: `${S}/app_retire_landing.png` });
console.log('Retirement landing');

// Fill profile
await page.fill('input.ret-input[type="text"]:first-of-type', 'Leroy Pinto');
const dobs = await page.$$('input.ret-input[type="date"]');
if (dobs[0]) await dobs[0].fill('1975-03-22');
const nums = await page.$$('input.ret-input-num');
if (nums[0]) await nums[0].fill('62');
await page.check('input.ret-checkbox');
await page.waitForTimeout(400);
const texts = await page.$$('input.ret-input[type="text"]');
if (texts[1]) await texts[1].fill('Sandra Pinto');
const dobs2 = await page.$$('input.ret-input[type="date"]');
if (dobs2[1]) await dobs2[1].fill('1978-07-10');
await page.waitForTimeout(400);
await page.screenshot({ path: `${S}/app_profile.png` });
console.log('Profile filled (couple)');

// Super
await page.click('button.ret-nav-item[data-section="super"]');
await page.waitForTimeout(400);
await page.click('button.ret-add-btn');
await page.waitForTimeout(300);
const st = await page.$$('input.ret-input[type="text"]');
if (st[0]) await st[0].fill('AustralianSuper');
const sc = await page.$$('input.ret-input-currency');
if (sc[0]) await sc[0].fill('485000');
if (sc[2]) await sc[2].fill('25000');
if (sc[3]) await sc[3].fill('20000');
await page.screenshot({ path: `${S}/app_super.png` });
console.log('Super filled');

// Income
await page.click('button.ret-nav-item[data-section="income"]');
await page.waitForTimeout(400);
await page.click('button.ret-add-btn');
await page.waitForTimeout(300);
const it = await page.$$('input.ret-input[type="text"]');
if (it[0]) await it[0].fill('Senior Engineer');
const ic = await page.$$('input.ret-input-currency');
if (ic[0]) await ic[0].fill('185000');
await page.screenshot({ path: `${S}/app_income.png` });
console.log('Income filled');

// Age Pension
await page.click('button.ret-nav-item[data-section="age-pension"]');
await page.waitForTimeout(600);
await page.screenshot({ path: `${S}/app_age_pension.png` });
console.log('Age Pension');

// Projection
await page.click('button.ret-nav-item[data-section="projection"]');
await page.waitForTimeout(2000);
await page.screenshot({ path: `${S}/app_projection_kpi.png` });
await page.evaluate(() => document.querySelector('.ret-content')?.scrollTo(0, 600));
await page.waitForTimeout(400);
await page.screenshot({ path: `${S}/app_projection_table.png` });
console.log('Projection chart + table');

if (errors.length) console.error('Console errors:', errors);
else console.log('Zero console errors');

await browser.close();
