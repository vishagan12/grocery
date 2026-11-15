const { CdpBrowser } = require('./cdp-client');

async function checkLogin() {
  const browser = new CdpBrowser(9255);
  await browser.launch(true);
  await browser.navigate('https://grocery-git-opus-review-vishagan1206-5502s-projects.vercel.app/');
  
  const buttons = await browser.evaluate(`
    Array.from(document.querySelectorAll('button')).map(b => ({
      aria: b.getAttribute('aria-label'),
      text: b.textContent.trim(),
      className: b.className
    }))
  `);
  console.log('Header buttons with aria-label:', buttons.filter(b => b.aria));

  // Click the account/login button
  const clicked = await browser.evaluate(`
    const btn = document.querySelector('button[aria-label="Log in"], button[aria-label="My account"], button[aria-label="உள்நுழைக"]');
    if (btn) { btn.click(); true; } else false;
  `);
  console.log('Button clicked:', clicked);
  await new Promise(r => setTimeout(r, 1500));

  const text = await browser.evaluate('document.body.innerText');
  console.log('Body text snippet after click:', text.slice(0, 300));
  await browser.screenshot('screenshots/test-login-opened.png');
  await browser.close();
}

checkLogin();

