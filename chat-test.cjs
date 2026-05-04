const { chromium } = require('C:/Users/Sathish/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:/Users/Sathish/AppData/Local/ms-playwright/chromium-1217/chrome-win64/chrome.exe'
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto('http://localhost:3000/chat');
  await page.waitForTimeout(2000);

  // Fill first panel (Gemini)
  const inputs = await page.locator('input[placeholder*="iPhone"]').all();
  if (inputs.length > 0) {
    await inputs[0].fill('iPhone 16 Pro Max');
    await page.waitForTimeout(500);
    const buttons = await page.locator('button:has-text("Begin Session")').all();
    if (buttons.length > 0) {
      await buttons[0].click();
      await page.waitForTimeout(4000);
    }
  }

  // Take screenshot of active chat
  await page.screenshot({ path: 'chat-active.png' });
  await browser.close();
  console.log('Screenshot saved to chat-active.png');
})();
