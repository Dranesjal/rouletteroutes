import { chromium } from '@playwright/test';
const SCRATCHPAD = '/tmp/claude-1000/-home-hong-ngoc-vu-iginis-alaris/0a3b9977-1940-4ce6-b9cf-975ba9e35cd2/scratchpad';

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
await page.screenshot({ path: `${SCRATCHPAD}/rrr-home.png` });
console.log('home done');

await page.goto('http://localhost:3000/wandelingen', { waitUntil: 'networkidle' });
await page.screenshot({ path: `${SCRATCHPAD}/rrr-wandelingen.png` });
console.log('wandelingen done');

await page.goto('http://localhost:3000/wandelingen/hoge-veluwe-okt-2026', { waitUntil: 'networkidle' });
await page.screenshot({ path: `${SCRATCHPAD}/rrr-detail.png` });
console.log('detail done');

await page.goto('http://localhost:3000/aanmelden?wandeling=hoge-veluwe-okt-2026', { waitUntil: 'networkidle' });
await page.screenshot({ path: `${SCRATCHPAD}/rrr-aanmelden.png` });
console.log('aanmelden done');

await browser.close();
