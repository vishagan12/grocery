const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');

class CdpBrowser {
  constructor(port = 9240) {
    this.port = port;
    this.proc = null;
    this.ws = null;
    this.msgId = 1;
    this.pending = new Map();
    this.tmpDir = null;
  }

  async launch(mobile = true) {
    this.tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-e2e-'));
    this.proc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
      '--headless=new',
      `--remote-debugging-port=${this.port}`,
      `--user-data-dir=${this.tmpDir}`,
      mobile ? '--window-size=390,844' : '--window-size=1280,800',
      '--disable-gpu',
      '--no-sandbox',
      'about:blank'
    ]);

    let wsUrl = null;
    for (let i = 0; i < 40; i++) {
      await new Promise(r => setTimeout(r, 200));
      try {
        const data = await new Promise((resolve, reject) => {
          const req = http.get(`http://127.0.0.1:${this.port}/json/list`, res => {
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
      if (this.proc) this.proc.kill();
      throw new Error('Failed to obtain WebSocket debugger URL for Chrome CDP');
    }

    this.ws = new WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.id && this.pending.has(parsed.id)) {
          const { resolve, reject } = this.pending.get(parsed.id);
          this.pending.delete(parsed.id);
          if (parsed.error) reject(new Error(parsed.error.message || JSON.stringify(parsed.error)));
          else resolve(parsed.result);
        }
      } catch {}
    };

    await this.send('Page.enable');
    await this.send('Network.enable');
    await this.send('Runtime.enable');

    if (mobile) {
      await this.send('Emulation.setDeviceMetricsOverride', {
        width: 390,
        height: 844,
        deviceScaleFactor: 3,
        mobile: true
      });
      await this.send('Network.setUserAgentOverride', {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1'
      });
    }
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.msgId++;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async navigate(url, waitMs = 3500) {
    await this.send('Page.navigate', { url });
    await new Promise(r => setTimeout(r, waitMs));
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    return res?.result?.value;
  }

  async waitForFunction(fnStr, timeoutMs = 15000, pollIntervalMs = 250) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        const val = await this.evaluate(`(${fnStr})()`);
        if (val) return val;
      } catch {}
      await new Promise(r => setTimeout(r, pollIntervalMs));
    }
    throw new Error(`Timeout waiting for function: ${fnStr}`);
  }

  async screenshot(outPath) {
    const dir = path.dirname(outPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(outPath, Buffer.from(res.data, 'base64'));
    return outPath;
  }

  async setOffline(offline = true) {
    await this.send('Network.emulateNetworkConditions', {
      offline,
      latency: offline ? 0 : 20,
      downloadThroughput: offline ? 0 : 5000000,
      uploadThroughput: offline ? 0 : 2000000
    });
  }

  async close() {
    try { if (this.ws) this.ws.close(); } catch {}
    try { if (this.proc) this.proc.kill(); } catch {}
    try {
      if (this.tmpDir && fs.existsSync(this.tmpDir)) {
        fs.rmSync(this.tmpDir, { recursive: true, force: true });
      }
    } catch {}
  }
}

module.exports = { CdpBrowser };

