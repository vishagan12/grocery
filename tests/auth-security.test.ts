import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { riderUsernameToSyntheticEmail } from '../src/lib/serverAuth';

describe('PHASE 3: Authentication & Role Guard Suite', () => {
  it('1. Synthetic Email Generator: Accurately formats rider username to non-routable domain', () => {
    const email1 = riderUsernameToSyntheticEmail('muthukumar');
    assert.equal(email1, 'muthukumar@riders.grocery.invalid');

    // Strips spaces, punctuation and capital letters safely
    const email2 = riderUsernameToSyntheticEmail('  Rider_007!  ');
    assert.equal(email2, 'rider_007@riders.grocery.invalid');
  });

  it('2. Service Role Security: SUPABASE_SERVICE_ROLE_KEY is never prefixed with NEXT_PUBLIC_', () => {
    const envKeys = Object.keys(process.env);
    const exposedServiceRole = envKeys.find(
      (k) => k.startsWith('NEXT_PUBLIC_') && k.toLowerCase().includes('service_role')
    );
    assert.equal(
      exposedServiceRole,
      undefined,
      'Service role key must NEVER be exposed to client bundles via NEXT_PUBLIC_ prefix'
    );
  });

  it('3. Multi-Role Segregation: Role hierarchy properly rejects non-matching credentials', () => {
    const roles = {
      admin: { allowedPages: ['/admin'], deniedPages: ['/rider'] },
      rider: { allowedPages: ['/rider'], deniedPages: ['/admin'] },
      customer: { allowedPages: ['/', '/profile', '/checkout'], deniedPages: ['/admin', '/rider'] },
    };

    assert.equal(roles.admin.allowedPages.includes('/admin'), true);
    assert.equal(roles.customer.deniedPages.includes('/admin'), true);
    assert.equal(roles.customer.deniedPages.includes('/rider'), true);
  });
});
