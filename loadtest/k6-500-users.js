import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';

/**
 * ============================================================================
 * k6 Concurrency & Scale Load Test (500 Virtual Users)
 * Sri Amman Supermarket Quick-Commerce Engine
 *
 * Target: Staging environment (__ENV.TARGET_URL || 'http://localhost:3000')
 *
 * Traffic Distribution:
 * - 70% Browse & Search
 * - 20% Add to Cart Flow
 * - 10% Checkout Flow
 * ============================================================================
 */

const catalogTrend = new Trend('duration_api_catalog');
const resolveShopTrend = new Trend('duration_api_resolve_shop');
const healthTrend = new Trend('duration_api_health');
const homeTrend = new Trend('duration_home_page');
const ordersTrend = new Trend('duration_api_orders');
const failureRate = new Rate('custom_failure_rate');

export const options = {
  stages: [
    { duration: '20s', target: 200 }, // Ramp-up
    { duration: '30s', target: 500 }, // Ramp to 500 VUs
    { duration: '40s', target: 500 }, // Steady state 500 VUs
    { duration: '20s', target: 0 },   // Ramp-down
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<300'],
    custom_failure_rate: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000';
const ENABLE_CHECKOUT = __ENV.ENABLE_CHECKOUT !== 'false';

const SEARCH_QUERIES = [
  'rice',
  'ponni rice',
  'arisi',
  'thakkali',
  'paruppu',
  'அரிசி',
  'தக்காளி',
  'milk',
  'oil',
  'ghee',
  'salt',
  'dal',
];

export default function () {
  // Simulated distinct client IP per VU
  const clientIp = `192.168.${Math.floor(__VU / 256)}.${__VU % 256}`;
  const headers = {
    'x-forwarded-for': clientIp,
  };

  const rand = Math.random();

  // --------------------------------------------------------------------------
  // Scenario A: 70% of Traffic - Browse and Search
  // --------------------------------------------------------------------------
  if (rand < 0.70) {
    group('70% Browse & Search', () => {
      // 1. Fetch public ISR-cached catalog
      const catRes = http.get(`${BASE_URL}/api/catalog`, { headers, tags: { endpoint: '/api/catalog' } });
      catalogTrend.add(catRes.timings.duration);
      const catOk = check(catRes, {
        'catalog 200': (r) => r.status === 200,
      });
      if (!catOk) failureRate.add(1);
      else failureRate.add(0);

      sleep(0.3);

      // 2. Search query simulation
      const q = SEARCH_QUERIES[Math.floor(Math.random() * SEARCH_QUERIES.length)];
      const searchRes = http.get(`${BASE_URL}/api/catalog?q=${encodeURIComponent(q)}`, { headers, tags: { endpoint: '/api/catalog?q' } });
      catalogTrend.add(searchRes.timings.duration);
      check(searchRes, {
        'search 200': (r) => r.status === 200,
      });

      sleep(0.4);

      // 3. Resolve shop location & geofence
      const shopRes = http.get(`${BASE_URL}/api/resolve-shop`, { headers, tags: { endpoint: '/api/resolve-shop' } });
      resolveShopTrend.add(shopRes.timings.duration);
      check(shopRes, {
        'resolve-shop 200': (r) => r.status === 200,
      });
    });
  }
  // --------------------------------------------------------------------------
  // Scenario B: 20% of Traffic - Add to Cart Flow
  // --------------------------------------------------------------------------
  else if (rand < 0.90) {
    group('20% Add to Cart Flow', () => {
      // 1. Visit Storefront Home Shell
      const homeRes = http.get(`${BASE_URL}/`, { headers, tags: { endpoint: '/' } });
      homeTrend.add(homeRes.timings.duration);
      check(homeRes, {
        'home 200': (r) => r.status === 200,
      });

      sleep(0.2);

      // 2. Fetch Catalog for inventory check
      const catRes = http.get(`${BASE_URL}/api/catalog`, { headers, tags: { endpoint: '/api/catalog' } });
      catalogTrend.add(catRes.timings.duration);
      check(catRes, {
        'catalog 200': (r) => r.status === 200,
      });

      sleep(0.5);

      // 3. Health check
      const healthRes = http.get(`${BASE_URL}/api/health`, { headers, tags: { endpoint: '/api/health' } });
      healthTrend.add(healthRes.timings.duration);
      check(healthRes, {
        'health 200': (r) => r.status === 200,
      });
    });
  }
  // --------------------------------------------------------------------------
  // Scenario C: 10% of Traffic - Checkout & Order Placement
  // --------------------------------------------------------------------------
  else {
    group('10% Checkout Flow', () => {
      if (ENABLE_CHECKOUT) {
        const uniqueId = `${__VU}-${__ITER}-${Date.now()}`;
        const payload = JSON.stringify({
          idempotencyKey: `k6-500vu-${uniqueId}`,
          customerName: `K6 Load Tester ${__VU}`,
          phone: `98765${String(__VU).padStart(5, '0').slice(-5)}`,
          address: '123 K.K. Nagar, Madurai, Tamil Nadu 625020',
          lat: 9.9252,
          lng: 78.1198,
          items: [
            {
              productId: 'ponni-boiled-rice',
              variantIndex: 0,
              variantLabel: '1 kg',
              quantity: 1,
            },
          ],
          paymentMethod: 'cod',
          deliverySlot: 'express',
        });

        const orderHeaders = {
          'Content-Type': 'application/json',
          'x-forwarded-for': clientIp,
        };

        const orderRes = http.post(`${BASE_URL}/api/orders`, payload, {
          headers: orderHeaders,
          tags: { endpoint: '/api/orders' },
        });

        ordersTrend.add(orderRes.timings.duration);
        const orderOk = check(orderRes, {
          'order status 200 or 400 (validation)': (r) => r.status === 200 || r.status === 400,
        });
        if (!orderOk) failureRate.add(1);
        else failureRate.add(0);
      }
    });
  }

  sleep(1);
}
