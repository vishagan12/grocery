import { describe, it } from 'node:test';
import assert from 'node:assert';
import { sanitizeLogData, maskPhoneNumber, handleApiError } from '../src/lib/logger';

describe('Phase 4: Reliability & Enterprise Logging', () => {
  it('should mask phone numbers keeping only the last 4 digits', () => {
    assert.strictEqual(maskPhoneNumber('9876543210'), '+91******3210');
    assert.strictEqual(maskPhoneNumber('+91 98765 43210'), '+91******3210');
    assert.strictEqual(maskPhoneNumber('123'), '[REDACTED_PHONE]');
  });

  it('should redact sensitive credentials and auth tokens from log objects', () => {
    const rawData = {
      user: 'admin_test',
      password: 'superSecretPassword123!',
      apiKey: 'sbp_live_abcdef1234567890',
      token: 'bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy',
      phone: '9842112345',
      nested: {
        authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy',
        recipientPhone: '9443298765',
        safeField: 'normal information',
      },
    };

    const sanitized = sanitizeLogData(rawData);

    assert.strictEqual(sanitized.password, '[REDACTED_SECRET]');
    assert.strictEqual(sanitized.apiKey, '[REDACTED_SECRET]');
    assert.strictEqual(sanitized.token, '[REDACTED_SECRET]');
    assert.strictEqual(sanitized.phone, '+91******2345');
    assert.strictEqual(sanitized.nested.authorization, '[REDACTED_SECRET]');
    assert.strictEqual(sanitized.nested.recipientPhone, '+91******8765');
    assert.strictEqual(sanitized.nested.safeField, 'normal information');
  });

  it('should sanitize inline phone numbers and tokens in string log messages', () => {
    const msg = 'User requested OTP for mobile 9876543210 with Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.sig';
    const sanitized = sanitizeLogData(msg);

    assert(!sanitized.includes('9876543210'), 'Phone number should be masked');
    assert(sanitized.includes('+91******3210'), 'Masked phone format expected');
    assert(!sanitized.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'), 'Token should be redacted');
  });

  it('should format API errors with standard contract via handleApiError', () => {
    const errorObj = new Error('Database connection reset');
    const result = handleApiError(errorObj, 'TEST_ERROR_EVENT', 'req-12345', 'Internal Server Error', 500);

    assert.strictEqual(result.error, 'Internal Server Error');
    assert.strictEqual(result.status, 500);
    assert.strictEqual(result.requestId, 'req-12345');
  });
});
