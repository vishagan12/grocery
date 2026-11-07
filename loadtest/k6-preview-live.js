import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Counter } from 'k6/metrics';

/**
 * Live Vercel Preview Load Test (Read & Browse Only - No Real Orders)
 */

export const options = {
  stages: [
    { duration: '20s', target: 200 },
    { duration: '30s', target: 500 },
    { duration: '40s', target: 500 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    'http_req_duration{endpoint:/api/catalog}': ['p(95)<300'],
    'http_req_duration{endpoint:/api/catalog?q}': ['p(95)<300'],
    'http_req_duration{endpoint:/api/resolve-shop}': ['p(95)<300'],
    'http_req_duration{endpoint:/api/health}': ['p(95)<300'],
    'http_req_duration{endpoint:/checkout}': ['p(95)<300'],
  },
};

const BASE_URL = __ENV.TARGET_URL || 'https://grocery-git-opus-review-vishagan1206-5502s-projects.vercel.app';

const rateLimitCount = new Counter('rate_limited_429');
const realErrorCount = new Counter('real_errors_5xx_4xx');
const successCount = new Counter('successful_requests');

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
  // Generates unique client IP across 500 VUs so search rate limit (60/min/IP) isn't artificially hit
  const clientIp = `192.168.${Math.floor(__VU / 256)}.${__VU % 256}`;
  const headers = {
    'x-forwarded-for': clientIp,
  };

  const rand = Math.random();

  // Helper function to track response
  function handleResponse(res, name) {
    if (res.status === 429) {
      rateLimitCount.add(1);
    } else if (res.status >= 400) {
      realErrorCount.add(1);
    } else {
      successCount.add(1);
    }
  }

  // 70% Browse and Search
  if (rand < 0.70) {
    group('Browse & Search', () => {
      const catRes = http.get(`${BASE_URL}/api/catalog`, { headers, tags: { endpoint: '/api/catalog' } });
      handleResponse(catRes, '/api/catalog');

      sleep(0.3);

      const q = SEARCH_QUERIES[Math.floor(Math.random() * SEARCH_QUERIES.length)];
      const searchRes = http.get(`${BASE_URL}/api/catalog?q=${encodeURIComponent(q)}`, { headers, tags: { endpoint: '/api/catalog?q' } });
      handleResponse(searchRes, '/api/catalog?q');

      sleep(0.4);

      const shopRes = http.get(`${BASE_URL}/api/resolve-shop`, { headers, tags: { endpoint: '/api/resolve-shop' } });
      handleResponse(shopRes, '/api/resolve-shop');
    });
  }
  // 20% Add to Cart Flow (Reads)
  else if (rand < 0.90) {
    group('Add to Cart Flow', () => {
      const homeRes = http.get(`${BASE_URL}/`, { headers, tags: { endpoint: '/' } });
      handleResponse(homeRes, '/');

      sleep(0.2);

      const catRes = http.get(`${BASE_URL}/api/catalog`, { headers, tags: { endpoint: '/api/catalog' } });
      handleResponse(catRes, '/api/catalog');

      sleep(0.5);

      const healthRes = http.get(`${BASE_URL}/api/health`, { headers, tags: { endpoint: '/api/health' } });
      handleResponse(healthRes, '/api/health');
    });
  }
  // 10% Checkout Read Flow (NO Real Orders Created)
  else {
    group('Checkout Read Flow', () => {
      // Hits checkout page shell and resolve-shop delivery check
      const chkRes = http.get(`${BASE_URL}/checkout`, { headers, tags: { endpoint: '/checkout' } });
      handleResponse(chkRes, '/checkout');

      sleep(0.3);

      const shopRes = http.get(`${BASE_URL}/api/resolve-shop`, { headers, tags: { endpoint: '/api/resolve-shop' } });
      handleResponse(shopRes, '/api/resolve-shop');
    });
  }

  sleep(1);
}

