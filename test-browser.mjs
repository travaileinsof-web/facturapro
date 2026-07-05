import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER_CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER_ERROR:', err.message));
  
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle' });
  
  const content = await page.content();
  fs.writeFileSync('page_content.txt', content);
  
  await browser.close();
})();
