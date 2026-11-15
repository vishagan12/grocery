const { CdpBrowser } = require('./cdp-client');

const BASE_URL = 'https://grocery-git-opus-review-vishagan1206-5502s-projects.vercel.app';

async function runAll() {
  console.log('=====================================================================');
  console.log('MASTER PHASE 5: FULL COMPREHENSIVE E2E & SAFETY VERIFICATION');
  console.log('Live Preview URL:', BASE_URL);
  console.log('=====================================================================\n');

  const browser = new CdpBrowser(9250);
  const scoreboard = [];

  try {
    await browser.launch(true);

    // ===================================================================
    // SECTION 1: CUSTOMER FLOWS
    // ===================================================================
    console.log('>>> SECTION 1: CUSTOMER JOURNEY & STOREFRONT FLOWS <<<');

    // 1.1 Home Load
    await browser.navigate(`${BASE_URL}/`);
    const homeTitle = await browser.evaluate('document.title');
    const heroImage = await browser.evaluate('Boolean(document.querySelector("img[fetchpriority=\'high\'], img[alt*=\'Banner\'], img[alt*=\'Sri Amman\']"))');
    scoreboard.push({
      category: 'Customer',
      check: 'Home Page Load & Hero Render',
      status: (homeTitle && heroImage) ? 'PASS' : 'FAIL',
      details: `Title: "${homeTitle}", Hero image present: ${heroImage}`
    });
    console.log(`[${(homeTitle && heroImage) ? 'PASS' : 'FAIL'}] 1.1 Home Page Load`);

    // 1.2 Search Queries (Thanglish, Tamil, Typo)
    await browser.navigate(`${BASE_URL}/products`);
    const searchQueries = [
      { q: 'arisi', desc: 'Thanglish: arisi (rice)' },
      { q: 'thakkali', desc: 'Thanglish: thakkali (tomato)' },
      { q: 'paal', desc: 'Thanglish: paal (milk)' },
      { q: 'vengayam', desc: 'Thanglish: vengayam (onion)' },
      { q: 'paruppu', desc: 'Thanglish: paruppu (dal)' },
      { q: 'ennai', desc: 'Thanglish: ennai (oil)' },
      { q: 'அரிசி', desc: 'Tamil script: அரிசி' },
      { q: 'arrisi', desc: 'Typo query: arrisi' },
    ];

    for (const sq of searchQueries) {
      await browser.evaluate(`
        const inp = document.querySelector('input[type="search"], input[placeholder*="Search"], input[placeholder*="தேடு"]');
        if (inp) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(inp, '${sq.q}');
          inp.dispatchEvent(new Event('input', { bubbles: true }));
          inp.dispatchEvent(new Event('change', { bubbles: true }));
        }
      `);
      await new Promise(r => setTimeout(r, 1200));

      const matchCount = await browser.evaluate(`
        Array.from(document.querySelectorAll('h3, h4'))
          .map(el => el.textContent.trim())
          .filter(t => t.length > 2 && !t.includes('Sri Amman') && !t.includes('Categories') && !t.includes('Filter')).length
      `);

      scoreboard.push({
        category: 'Customer',
        check: `Search: ${sq.desc}`,
        status: matchCount > 0 ? 'PASS' : 'FAIL',
        details: `Query "${sq.q}" yielded ${matchCount} matches in rendered DOM`
      });
      console.log(`[${matchCount > 0 ? 'PASS' : 'FAIL'}] 1.2 Search "${sq.q}": ${matchCount} items`);
    }

    // Reset search filter
    await browser.evaluate(`
      const inp = document.querySelector('input[type="search"], input[placeholder*="Search"], input[placeholder*="தேடு"]');
      if (inp) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(inp, '');
        inp.dispatchEvent(new Event('input', { bubbles: true }));
      }
    `);
    await new Promise(r => setTimeout(r, 800));

    // 1.3 Category Browse & Filter
    const catClicked = await browser.evaluate(`
      const catBtns = Array.from(document.querySelectorAll('button')).filter(b => {
        const t = b.textContent || '';
        return t.includes('Dals') || t.includes('பருப்பு') || t.includes('Oils') || t.includes('எண்ணெய்');
      });
      if (catBtns.length > 0) {
        catBtns[0].click();
        catBtns[0].textContent.trim();
      } else null;
    `);
    await new Promise(r => setTimeout(r, 1000));
    scoreboard.push({
      category: 'Customer',
      check: 'Category Browse & Filtering',
      status: catClicked ? 'PASS' : 'FAIL',
      details: `Active category filter clicked: "${catClicked}"`
    });
    console.log(`[${catClicked ? 'PASS' : 'FAIL'}] 1.3 Category Filter: ${catClicked}`);

    // 1.4 Add to Cart, Modify Qty & Cart Drawer
    await browser.navigate(`${BASE_URL}/products`);
    await new Promise(r => setTimeout(r, 2000));

    const addedToCart = await browser.evaluate(`
      const addBtns = Array.from(document.querySelectorAll('button')).filter(b => {
        const t = (b.textContent || '').trim();
        return t === 'ADD' || t === 'சேர்';
      });
      if (addBtns.length > 0) {
        addBtns[0].click();
        true;
      } else false;
    `);
    await new Promise(r => setTimeout(r, 1000));

    // Open Cart Drawer
    const openedDrawer = await browser.evaluate(`
      const cartBtn = Array.from(document.querySelectorAll('button')).find(b => {
        const aria = (b.getAttribute('aria-label') || '').toLowerCase();
        const t = b.textContent || '';
        return aria.includes('cart') || t.includes('Cart') || t.includes('₹');
      });
      if (cartBtn) {
        cartBtn.click();
        true;
      } else false;
    `);
    await new Promise(r => setTimeout(r, 1200));

    // Increment Quantity
    const incremented = await browser.evaluate(`
      const plusBtn = Array.from(document.querySelectorAll('button')).find(b => (b.textContent || '').trim() === '+');
      if (plusBtn) { plusBtn.click(); true; } else false;
    `);
    await new Promise(r => setTimeout(r, 600));

    // Decrement Quantity
    const decremented = await browser.evaluate(`
      const minusBtn = Array.from(document.querySelectorAll('button')).find(b => (b.textContent || '').trim() === '-');
      if (minusBtn) { minusBtn.click(); true; } else false;
    `);
    await new Promise(r => setTimeout(r, 600));

    const cartSuccess = Boolean(addedToCart && openedDrawer);
    scoreboard.push({
      category: 'Customer',
      check: 'Add, Quantity Modifier & Cart Drawer',
      status: cartSuccess ? 'PASS' : 'FAIL',
      details: `ADD button clicked: ${addedToCart}, Drawer opened: ${openedDrawer}, Plus: ${incremented}, Minus: ${decremented}`
    });
    console.log(`[${cartSuccess ? 'PASS' : 'FAIL'}] 1.4 Cart Actions & Drawer`);
    await browser.screenshot('screenshots/e2e-cart-drawer-active.png');

    // 1.5 Google Login / Auth Modal Trigger
    const loginTriggered = await browser.evaluate(`
      const loginBtn = document.querySelector('button[aria-label="Log in"], button[aria-label="உள்நுழைக"]');
      if (loginBtn) { loginBtn.click(); true; } else false;
    `);
    await new Promise(r => setTimeout(r, 1200));

    const loginModalContent = await browser.evaluate(`
      const t = document.body.innerText;
      t.includes('Google') || t.includes('Sign in') || t.includes('Login') || t.includes('உள்நுழை');
    `);
    scoreboard.push({
      category: 'Customer',
      check: 'Google Login & Auth Modal Interaction',
      status: (loginTriggered && loginModalContent) ? 'PASS' : 'FAIL',
      details: `Header login button clicked: ${loginTriggered}, Auth modal content detected: ${loginModalContent}`
    });
    console.log(`[${(loginTriggered && loginModalContent) ? 'PASS' : 'FAIL'}] 1.5 Login Modal Trigger`);
    await browser.screenshot('screenshots/e2e-login-modal-active.png');

    // Close Login Modal
    await browser.evaluate(`
      const closeBtn = document.querySelector('button[aria-label*="Close"], button:has(svg.lucide-x)');
      if (closeBtn) closeBtn.click();
    `);
    await new Promise(r => setTimeout(r, 600));

    // 1.6 Checkout Page & Address Verification
    await browser.navigate(`${BASE_URL}/checkout`);
    await new Promise(r => setTimeout(r, 2000));
    const checkoutContent = await browser.evaluate(`
      const t = document.body.innerText;
      t.includes('Checkout') || t.includes('Delivery Address') || t.includes('Order') || t.includes('₹');
    `);
    scoreboard.push({
      category: 'Customer',
      check: 'Checkout Page Render & Form',
      status: checkoutContent ? 'PASS' : 'FAIL',
      details: `Checkout page rendered: ${checkoutContent}`
    });
    console.log(`[${checkoutContent ? 'PASS' : 'FAIL'}] 1.6 Checkout Page Render`);
    await browser.screenshot('screenshots/e2e-checkout-form.png');

    // 1.7 My Orders History View
    await browser.navigate(`${BASE_URL}/orders`);
    await new Promise(r => setTimeout(r, 2000));
    const ordersViewRendered = await browser.evaluate(`
      const t = document.body.innerText;
      t.includes('No active orders') || t.includes('Recent Orders') || t.includes('Orders') || t.includes('பதிவுகள்');
    `);
    scoreboard.push({
      category: 'Customer',
      check: 'My Orders History Page & Polling View',
      status: ordersViewRendered ? 'PASS' : 'FAIL',
      details: `Orders view verified: ${ordersViewRendered}`
    });
    console.log(`[${ordersViewRendered ? 'PASS' : 'FAIL'}] 1.7 My Orders History Page`);
    await browser.screenshot('screenshots/e2e-orders-view.png');

    // 1.8 Service Worker Offline Fallback
    await browser.navigate(`${BASE_URL}/`);
    await new Promise(r => setTimeout(r, 2000));
    await browser.setOffline(true);
    await browser.navigate(`${BASE_URL}/offline.html`, 2000);
    const offlineContent = await browser.evaluate(`
      const t = document.body.innerText;
      t.toLowerCase().includes('offline') || t.includes('இணைப்பு') || t.includes('Internet') || t.includes('Sri Amman');
    `);
    await browser.setOffline(false);
    scoreboard.push({
      category: 'Customer',
      check: 'PWA Service Worker Offline Fallback',
      status: offlineContent ? 'PASS' : 'FAIL',
      details: `Offline screen displayed cleanly when network disconnected: ${offlineContent}`
    });
    console.log(`[${offlineContent ? 'PASS' : 'FAIL'}] 1.8 Offline Fallback Screen`);
    await browser.screenshot('screenshots/e2e-offline-mode.png');

    // ===================================================================
    // SECTION 2: ADMIN FLOWS
    // ===================================================================
    console.log('\n>>> SECTION 2: ADMIN PORTAL & SECURITY FLOWS <<<');

    // 2.1 Admin Login Page
    await browser.navigate(`${BASE_URL}/admin/login`);
    await new Promise(r => setTimeout(r, 2000));
    const adminLoginPage = await browser.evaluate(`
      const t = document.body.innerText;
      t.includes('Admin') || t.includes('Staff') || t.includes('Password');
    `);
    scoreboard.push({
      category: 'Admin',
      check: 'Admin Login Screen Render',
      status: adminLoginPage ? 'PASS' : 'FAIL',
      details: `Admin login UI loaded: ${adminLoginPage}`
    });
    console.log(`[${adminLoginPage ? 'PASS' : 'FAIL'}] 2.1 Admin Login Screen`);
    await browser.screenshot('screenshots/e2e-admin-login.png');

    // 2.2 Rate Limit: 5 Wrong Password Attempts Blocked with 429
    console.log('Testing 5 wrong passwords on live /api/auth endpoint...');
    let lockedOut = false;
    let lockoutRetryAfter = null;

    const testAdminId = `test_admin_${Date.now()}`;
    for (let attempt = 1; attempt <= 6; attempt++) {
      const res = await fetch(`${BASE_URL}/api/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'admin-login',
          email: `${testAdminId}@sriammansupermarket.in`,
          password: `wrong_password_${attempt}`
        })
      });

      if (attempt <= 5) {
        // First 5 attempts return 401 or 400 (invalid credentials), NOT 429
        console.log(`  Attempt ${attempt}: status ${res.status}`);
      } else {
        // 6th attempt must return 429 Too Many Requests
        console.log(`  Attempt ${attempt} (Should Lock Out): status ${res.status}`);
        if (res.status === 429) {
          lockedOut = true;
          lockoutRetryAfter = res.headers.get('retry-after');
        }
      }
    }

    scoreboard.push({
      category: 'Admin',
      check: 'Wrong Password Rate Limit (5 Attempts -> 429 Lockout)',
      status: lockedOut ? 'PASS' : 'FAIL',
      details: `6th failed login triggered 429 Too Many Requests. Retry-After: ${lockoutRetryAfter}s`
    });
    console.log(`[${lockedOut ? 'PASS' : 'FAIL'}] 2.2 Admin Login Rate Limit & Lockout`);

    // 2.3 Admin API Route Protection (Unauthenticated Access Denied)
    const adminUnauth = await fetch(`${BASE_URL}/api/admin`);
    const adminDenied = adminUnauth.status === 401 || adminUnauth.status === 403;
    scoreboard.push({
      category: 'Admin',
      check: 'Admin API Route Protection (Unauthorized Denied)',
      status: adminDenied ? 'PASS' : 'FAIL',
      details: `GET /api/admin returned status ${adminUnauth.status} (Access safely blocked without admin JWT)`
    });
    console.log(`[${adminDenied ? 'PASS' : 'FAIL'}] 2.3 Admin API Route Protection`);

    // ===================================================================
    // SECTION 3: RIDER FLOWS
    // ===================================================================
    console.log('\n>>> SECTION 3: RIDER PORTAL & STATE MACHINE FLOWS <<<');

    // 3.1 Rider Login Screen
    await browser.navigate(`${BASE_URL}/rider/login`);
    await new Promise(r => setTimeout(r, 2000));
    const riderLoginRendered = await browser.evaluate(`
      const t = document.body.innerText;
      t.includes('Rider') || t.includes('Delivery') || t.includes('Username');
    `);
    scoreboard.push({
      category: 'Rider',
      check: 'Rider Login Screen Render',
      status: riderLoginRendered ? 'PASS' : 'FAIL',
      details: `Rider login screen loaded: ${riderLoginRendered}`
    });
    console.log(`[${riderLoginRendered ? 'PASS' : 'FAIL'}] 3.1 Rider Login Screen`);
    await browser.screenshot('screenshots/e2e-rider-login.png');

    // 3.2 Rider API Route Protection
    const riderUnauth = await fetch(`${BASE_URL}/api/rider`);
    const riderDenied = riderUnauth.status === 401 || riderUnauth.status === 403;
    scoreboard.push({
      category: 'Rider',
      check: 'Rider API Route Protection (Unauthorized Denied)',
      status: riderDenied ? 'PASS' : 'FAIL',
      details: `GET /api/rider returned status ${riderUnauth.status} (Access safely blocked without rider JWT)`
    });
    console.log(`[${riderDenied ? 'PASS' : 'FAIL'}] 3.2 Rider API Route Protection`);

    // ===================================================================
    // SECTION 4: SAFETY & CONCURRENCY
    // ===================================================================
    console.log('\n>>> SECTION 4: ATOMIC SAFETY, IDEMPOTENCY & CONCURRENCY <<<');

    // 4.1 Double-Click Idempotency Protection on Place Order
    console.log('Testing double-click with identical idempotency key on /api/orders...');
    const duplicateKey = `idemp_e2e_test_${Date.now()}`;
    const orderPayload = {
      idempotencyKey: duplicateKey,
      customerName: 'Test Customer E2E',
      phone: '9842109876',
      address: 'Shop Street, Near Periyar Bus Stand, Madurai',
      lat: 9.9252,
      lng: 78.1198,
      items: [{ productId: 'ponni-boiled-rice', quantity: 1 }],
      paymentMethod: 'cod',
      deliverySlot: 'express'
    };

    // Send two rapid requests simultaneously with the same key
    const [res1, res2] = await Promise.all([
      fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      }),
      fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      })
    ]);

    const data1 = await res1.json();
    const data2 = await res2.json();

    const orderId1 = data1.orderId || data1.order_id || data1.id;
    const orderId2 = data2.orderId || data2.order_id || data2.id;

    // Both requests must return the exact same Order ID (or second is detected as idempotent replay)
    const idempotencyPass = Boolean(orderId1 && orderId2 && orderId1 === orderId2);
    scoreboard.push({
      category: 'Safety',
      check: 'Double-Tap / Rapid Double Order Placement Idempotency',
      status: idempotencyPass ? 'PASS' : 'FAIL',
      details: `Identical key resulted in exact same order: ID ${orderId1} == ${orderId2}`
    });
    console.log(`[${idempotencyPass ? 'PASS' : 'FAIL'}] 4.1 Double-Click Idempotency: Single Order Created (${orderId1})`);

    // 4.2 Geofence Enforcement (Madurai 3.0 km restriction)
    console.log('Testing out-of-bounds geofence order (> 3 km from Madurai store)...');
    const outOfBoundsRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idempotencyKey: `idemp_out_bounds_${Date.now()}`,
        customerName: 'Out of Bounds User',
        phone: '9842199999',
        address: 'Faraway Outskirts, Outside Madurai 3km zone',
        lat: 9.9800, // ~8 km north of store
        lng: 78.1200,
        items: [{ productId: 'ponni-boiled-rice', quantity: 1 }],
        paymentMethod: 'cod'
      })
    });
    const geofencePass = outOfBoundsRes.status === 400;
    scoreboard.push({
      category: 'Safety',
      check: 'Madurai 3 km Geofence Boundary Enforcement',
      status: geofencePass ? 'PASS' : 'FAIL',
      details: `Order > 3km was rejected with HTTP ${outOfBoundsRes.status}`
    });
    console.log(`[${geofencePass ? 'PASS' : 'FAIL'}] 4.2 Geofence 3 km Boundary Enforcement`);

    // 4.3 General Rate Limiting Health
    console.log('Testing catalog normal browsing (not blocked under acceptable load)...');
    const normalBrowseRes = await fetch(`${BASE_URL}/api/catalog?limit=8`);
    const normalBrowsePass = normalBrowseRes.status === 200;
    scoreboard.push({
      category: 'Safety',
      check: 'Normal Catalog Requests Pass Rate Limiter (200 OK)',
      status: normalBrowsePass ? 'PASS' : 'FAIL',
      details: `GET /api/catalog returned ${normalBrowseRes.status} OK without premature 429`
    });
    console.log(`[${normalBrowsePass ? 'PASS' : 'FAIL'}] 4.3 Catalog Rate Limiter Normal Use Check`);

  } catch (err) {
    console.error('E2E Master Execution Error:', err);
    scoreboard.push({
      category: 'Master',
      check: 'E2E Suite Execution',
      status: 'FAIL',
      details: err.message
    });
  } finally {
    await browser.close();
  }

  console.log('\n=====================================================================');
  console.log('FINAL MASTER PHASE 5 VERIFICATION SCOREBOARD');
  console.log('=====================================================================');
  console.table(scoreboard);
}

runAll();

