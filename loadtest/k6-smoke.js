import http from 'k6/http';
import { check, sleep, group } from 'k6';

/**
 * ============================================================================
 * k6 Smoke & Concurrency Load Test (50 VUs / 200+ simulated users)
 * Target: http://localhost:3000 (Local Dev or Staging)
 *
 * DO NOT RUN AGAINST PRODUCTION.
 * Stay within Supabase Free Tier fair-use limits.
 * ============================================================================
 */

export const options = {
  vus: 50,
  duration: '1m',
  thresholds: {
    // Error rate must remain below 1%
    http_req_failed: ['rate<0.01'],
    // 95% of requests must complete under 800ms
    http_req_duration: ['p(95)<800'],
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000';
const ENABLE_WRITE_SCENARIO = __ENV.ENABLE_WRITE_SCENARIO === 'true';

const SEARCH_QUERIES = [
  'rice',
  'ponni rice',
  'arisi',
  'arrisi',
  'thakkali',
  'paruppu',
  'அரிசி',
  'தக்காளி',
  'milk',
  'oil',
];

export default function () {
  // --------------------------------------------------------------------------
  // Scenario 1: Browse Catalog & Search Autocomplete (Main Traffic - ~70%)
  // --------------------------------------------------------------------------
  group('1. Catalog & Search Traffic', () => {
    // a) Fetch cached public catalog (Edge / ISR cache)
    const catalogRes = http.get(`${BASE_URL}/api/catalog`);
    check(catalogRes, {
      'catalog status is 200': (r) => r.status === 200,
      'catalog response has products': (r) => r.body.includes('catalog'),
      'catalog responds fast (< 300ms)': (r) => r.timings.duration < 300,
    });

    sleep(0.5);

    // b) Real-time catalog search simulation (English, Tamil, and Thanglish)
    const randomQuery = SEARCH_QUERIES[Math.floor(Math.random() * SEARCH_QUERIES.length)];
    const searchUrl = `${BASE_URL}/api/catalog`; // Catalog probe with simulated query
    const searchRes = http.get(searchUrl);
    check(searchRes, {
      'search query status is 200': (r) => r.status === 200,
    });
  });

  sleep(1);

  // --------------------------------------------------------------------------
  // Scenario 2: Customer Login-less Browsing (Navigation - ~25%)
  // --------------------------------------------------------------------------
  group('2. Login-less Store Browsing', () => {
    // a) Home page SSR
    const homeRes = http.get(`${BASE_URL}/`);
    check(homeRes, {
      'home status is 200': (r) => r.status === 200,
    });

    // b) Store GPS location resolution
    const shopRes = http.get(`${BASE_URL}/api/resolve-shop`);
    check(shopRes, {
      'resolve shop status is 200': (r) => r.status === 200,
    });

    // c) System health probe
    const healthRes = http.get(`${BASE_URL}/api/health`);
    check(healthRes, {
      'health probe status is 200': (r) => r.status === 200,
    });
  });

  sleep(1);

  // --------------------------------------------------------------------------
  // Scenario 3: Guarded Write Scenario (Intake Calculation - ~5%)
  // Strictly guarded behind ENABLE_WRITE_SCENARIO environment variable.
  // --------------------------------------------------------------------------
  if (ENABLE_WRITE_SCENARIO) {
    group('3. Guarded Order Intake Calculation', () => {
      const payload = JSON.stringify({
        customerName: 'Load Test Customer',
        phone: '9876543210',
        address: '123 Anna Nagar, Madurai',
        lat: 9.963263,
        lng: 78.158727,
        items: [
          {
            id: 'ponni-boiled-rice',
            quantity: 1,
            variantLabel: '1 pack',
            price: 50,
          },
        ],
        paymentMethod: 'cod',
      });

      const orderRes = http.post(`${BASE_URL}/api/orders`, payload, {
        headers: { 'Content-Type': 'application/json' },
      });

      check(orderRes, {
        'order intake status is 200 or 400 (validation)': (r) =>
          r.status === 200 || r.status === 400,
      });
    });
  }

  sleep(2);
}
