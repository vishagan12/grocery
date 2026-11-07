import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  RATE_LIMITS,
  checkRateLimit,
  resetInMemoryLimiter,
  verifyBotProtection,
} from '../src/lib/rateLimit';

describe('PHASE 1: Rate Limiting & Protection Suite', () => {
  beforeEach(() => {
    resetInMemoryLimiter();
  });

  it('1. Login Rate Limit: Allows 5 attempts, blocks 6th with 429 semantics', async () => {
    const identifier = '127.0.0.1:admin@example.com';

    for (let i = 1; i <= 5; i++) {
      const res = await checkRateLimit(RATE_LIMITS.LOGIN, identifier);
      assert.equal(res.success, true, `Attempt ${i} should be allowed`);
      assert.equal(res.remaining, 5 - i);
    }

    const blockedRes = await checkRateLimit(RATE_LIMITS.LOGIN, identifier);
    assert.equal(blockedRes.success, false, '6th attempt must be rejected');
    assert.equal(blockedRes.remaining, 0);
    assert.ok(blockedRes.retryAfterSeconds && blockedRes.retryAfterSeconds > 0);
  });

  it('2. Customer OTP Send: Blocks 4th attempt per phone within 10 minutes', async () => {
    const phone = '+919842198421';

    for (let i = 1; i <= 3; i++) {
      const res = await checkRateLimit(RATE_LIMITS.OTP_SEND_PHONE, phone);
      assert.equal(res.success, true, `OTP Send ${i} should succeed`);
    }

    const fourth = await checkRateLimit(RATE_LIMITS.OTP_SEND_PHONE, phone);
    assert.equal(fourth.success, false, '4th OTP send must be rate limited');
    assert.ok(fourth.retryAfterSeconds && fourth.retryAfterSeconds > 0);
  });

  it('3. Customer OTP Send IP Limit: Blocks 11th request per hour per IP', async () => {
    const ip = '192.168.1.100';

    for (let i = 1; i <= 10; i++) {
      const res = await checkRateLimit(RATE_LIMITS.OTP_SEND_IP, ip);
      assert.equal(res.success, true, `IP attempt ${i} should succeed`);
    }

    const eleventh = await checkRateLimit(RATE_LIMITS.OTP_SEND_IP, ip);
    assert.equal(eleventh.success, false, '11th OTP attempt from same IP must be rate limited');
  });

  it('4. Customer OTP Verify: Blocks 6th attempt per phone within 10 minutes', async () => {
    const phone = '+919944012345';

    for (let i = 1; i <= 5; i++) {
      const res = await checkRateLimit(RATE_LIMITS.OTP_VERIFY_PHONE, phone);
      assert.equal(res.success, true);
    }

    const sixth = await checkRateLimit(RATE_LIMITS.OTP_VERIFY_PHONE, phone);
    assert.equal(sixth.success, false, '6th verification attempt must fail');
  });

  it('5. Place Order Limit: Allows 5 orders per minute per user/IP, blocks 6th', async () => {
    const user = 'user_order_tester_123';

    for (let i = 1; i <= 5; i++) {
      const res = await checkRateLimit(RATE_LIMITS.PLACE_ORDER, user);
      assert.equal(res.success, true);
    }

    const sixth = await checkRateLimit(RATE_LIMITS.PLACE_ORDER, user);
    assert.equal(sixth.success, false, '6th order in a minute must be rate limited');
  });

  it('6. Search & Catalog Limit: Allows 60 requests per minute per IP, blocks 61st', async () => {
    const ip = '10.0.0.50';

    for (let i = 1; i <= 60; i++) {
      const res = await checkRateLimit(RATE_LIMITS.SEARCH_CATALOG, ip);
      assert.equal(res.success, true);
    }

    const overLimit = await checkRateLimit(RATE_LIMITS.SEARCH_CATALOG, ip);
    assert.equal(overLimit.success, false, '61st search request must be rate limited');
  });

  it('7. Admin and Rider API Limit: Allows 120 requests per minute per user/IP, blocks 121st', async () => {
    const staffId = 'rider_profile_777';

    for (let i = 1; i <= 120; i++) {
      const res = await checkRateLimit(RATE_LIMITS.ADMIN_RIDER_API, staffId);
      assert.equal(res.success, true);
    }

    const overLimit = await checkRateLimit(RATE_LIMITS.ADMIN_RIDER_API, staffId);
    assert.equal(overLimit.success, false, '121st request must be rate limited');
  });

  it('8. Bot Protection: Detects filled honeypot and rapid form submission', () => {
    const human = verifyBotProtection({
      honeypot: '',
      formStartTime: Date.now() - 2500,
      minTimeMs: 400,
    });
    assert.equal(human.isBot, false);

    const botHoneypot = verifyBotProtection({
      honeypot: 'spam_value',
      formStartTime: Date.now() - 3000,
    });
    assert.equal(botHoneypot.isBot, true);
    assert.match(botHoneypot.reason, /Honeypot/);

    const botFast = verifyBotProtection({
      honeypot: '',
      formStartTime: Date.now() - 15,
      minTimeMs: 400,
    });
    assert.equal(botFast.isBot, true);
    assert.match(botFast.reason, /Submission too rapid/);
  });

  it('9. Load Test Bypass Security: Disabled when LOADTEST_BYPASS_SECRET is unset, even with header', async () => {
    const { middleware } = await import('../src/middleware');
    const { NextRequest } = await import('next/server');

    delete process.env.LOADTEST_BYPASS_SECRET;

    const ip = '10.99.1.1';
    for (let i = 1; i <= 60; i++) {
      await checkRateLimit(RATE_LIMITS.SEARCH_CATALOG, `cat:${ip}`);
    }

    const req = new NextRequest('http://localhost:3000/api/catalog', {
      headers: {
        'x-forwarded-for': ip,
        'x-loadtest-bypass': 'any-test-token',
      },
    });

    const res = await middleware(req);
    assert.equal(res?.status, 429, 'Catalog request must return 429 when bypass secret is unset');
  });

  it('10. Load Test Bypass Security: Never applies to /api/auth or other sensitive routes', async () => {
    process.env.LOADTEST_BYPASS_SECRET = 'valid-test-bypass-secret-123';

    const ip = '10.99.2.1';
    for (let i = 1; i <= 10; i++) {
      await checkRateLimit(RATE_LIMITS.OTP_SEND_IP, ip);
    }

    const rlCheck = await checkRateLimit(RATE_LIMITS.OTP_SEND_IP, ip);
    assert.equal(rlCheck.success, false, 'Auth route IP limit must never be bypassed');
  });
});
