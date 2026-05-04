const { chromium } = require('C:/Users/Sathish/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:/Users/Sathish/AppData/Local/ms-playwright/chromium-1217/chrome-win64/chrome.exe'
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto('http://localhost:3000/chat');
  await page.waitForTimeout(3000);

  // Use native value setter to trigger React onChange
  await page.evaluate(() => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    const inputs = document.querySelectorAll('input[placeholder*="iPhone"]');
    inputs.forEach(input => {
      setter.call(input, 'iPhone 16 Pro Max');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const buttons = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('Begin Session'));
    buttons.forEach(b => b.click());
  });

  await page.waitForTimeout(6000);
  await page.screenshot({ path: 'chat-all-started.png' });

  // Send follow-up in first panel
  await page.evaluate(() => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    const inputs = document.querySelectorAll('input[placeholder*="Type your response"]');
    if (inputs.length > 0) {
      setter.call(inputs[0], 'What makes the Samsung camera better?');
      inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
      inputs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    }
  });

  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'chat-all-reply.png' });
  await browser.close();
  console.log('Done');
})();
