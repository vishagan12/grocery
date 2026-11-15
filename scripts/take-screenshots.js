const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');

async function capture(url, outPath, lang = 'en', port = 9226) {
  console.log(`Capturing ${url} (${lang}) -> ${outPath}...`);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-ss-'));
  const proc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tmp}`,
    '--window-size=390,844',
    '--disable-gpu',
    '--no-sandbox',
    'about:blank'
  ]);

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const data = await new Promise((resolve, reject) => {
        const req = http.get(`http://127.0.0.1:${port}/json/list`, res => {
          let s = '';
          res.on('data', c => s += c);
          res.on('end', () => resolve(s));
        });
        req.on('error', reject);
      });
      const list = JSON.parse(data);
      const pageTarget = list.find(it => it.type === 'page');
      if (pageTarget && pageTarget.webSocketDebuggerUrl) {
        wsUrl = pageTarget.webSocketDebuggerUrl;
        break;
      }
    } catch {}
  }

  if (!wsUrl) {
    proc.kill();
    throw new Error('Failed to obtain WebSocket debugger URL');
  }

  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let id = 1;
  function send(method, params = {}) {
    return new Promise(resolve => {
      const msgId = id++;
      const handler = (event) => {
        const parsed = JSON.parse(event.data);
        if (parsed.id === msgId) {
          ws.removeEventListener('message', handler);
          resolve(parsed.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    mobile: true
  });

  await send('Page.navigate', { url });
  // Allow page to load & images to decode
  await new Promise(r => setTimeout(r, 4000));

  if (lang === 'ta') {
    await send('Runtime.evaluate', {
      expression: `
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('தமிழ்'));
        if (btn) btn.click();
      `
    });
    await new Promise(r => setTimeout(r, 1500));
  }

  const res = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(outPath, Buffer.from(res.data, 'base64'));
  console.log(`Saved ${outPath} (${fs.statSync(outPath).size} bytes)`);

  ws.close();
  proc.kill();
  await new Promise(r => setTimeout(r, 1000));
}

async function main() {
  if (!fs.existsSync('screenshots')) fs.mkdirSync('screenshots');
  await capture('https://grocery-git-opus-review-vishagan1206-5502s-projects.vercel.app/', 'screenshots/before-home-en.png', 'en', 9226);
  await capture('https://grocery-git-opus-review-vishagan1206-5502s-projects.vercel.app/', 'screenshots/before-home-ta.png', 'ta', 9227);
  await capture('https://grocery-git-opus-review-vishagan1206-5502s-projects.vercel.app/products', 'screenshots/before-products-en.png', 'en', 9228);
  await capture('https://grocery-git-opus-review-vishagan1206-5502s-projects.vercel.app/products', 'screenshots/before-products-ta.png', 'ta', 9229);
  console.log('All baseline screenshots captured successfully.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
