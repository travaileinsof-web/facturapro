import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('BROWSER_ERROR:', msg.text());
  });
  page.on('pageerror', err => console.log('BROWSER_CRASH:', err.message));
  
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle' });
  
  const buttons = await page.locator('nav button').all();
  for (const btn of buttons) {
    const text = await btn.textContent();
    console.log('Clicking:', text);
    await btn.click();
    await page.waitForTimeout(500); // UI render
  }
  
  await browser.close();
  console.log('Playwright test completed without crashes');
})();
