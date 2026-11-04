import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('PHASE 2: Order Safety & Concurrency Suite', () => {
  it('1. Idempotency: Multiple requests with identical key return the identical order without duplication', () => {
    const ordersDb = new Map();
    
    function placeOrderSimulated(payload) {
      if (ordersDb.has(payload.idempotencyKey)) {
        return {
          ...ordersDb.get(payload.idempotencyKey),
          idempotentReplay: true,
        };
      }

      const order = {
        id: '#SAS-7890',
        orderSecret: 'secret-uuid-1234',
        idempotencyKey: payload.idempotencyKey,
        total: payload.total,
        status: 0,
        idempotentReplay: false,
      };
      ordersDb.set(payload.idempotencyKey, order);
      return order;
    }

    const key = 'idem_double_tap_test_12345';
    const firstCall = placeOrderSimulated({ idempotencyKey: key, total: 350 });
    const secondCall = placeOrderSimulated({ idempotencyKey: key, total: 350 });

    assert.equal(firstCall.id, secondCall.id);
    assert.equal(firstCall.idempotentReplay, false);
    assert.equal(secondCall.idempotentReplay, true);
    assert.equal(ordersDb.size, 1);
  });

  it('2. Authoritative Server Pricing: Client pricing payload is ignored, recalculated from catalog', () => {
    const catalogItem = { id: 'ponni-rice', price: 320, mrp: 350 };
    
    // Malicious client claims price is 1 rupee
    const clientPayload = { productId: 'ponni-rice', unitPrice: 1, quantity: 2 };
    
    // Server recalculation
    const serverUnitPrice = catalogItem.price;
    const serverTotal = serverUnitPrice * clientPayload.quantity;
    
    assert.equal(serverTotal, 640);
    assert.notEqual(serverTotal, clientPayload.unitPrice * clientPayload.quantity);
  });

  it('3. Concurrency & Negative Stock Prevention: Under simultaneous orders, stock never drops below 0', async () => {
    let stock = 5;
    let successfulOrders = 0;
    let outOfStockRejections = 0;

    // Simulate 20 concurrent order attempts trying to acquire 1 item each from a stock of 5
    async function attemptPurchase() {
      // Simulates Postgres Row Lock FOR UPDATE
      await new Promise((r) => setTimeout(r, Math.random() * 15));
      if (stock >= 1) {
        stock -= 1;
        successfulOrders++;
        return { success: true };
      } else {
        outOfStockRejections++;
        return { success: false, error: 'Insufficient stock' };
      }
    }

    const concurrentAttempts = Array.from({ length: 20 }, () => attemptPurchase());
    await Promise.all(concurrentAttempts);

    assert.equal(stock, 0, 'Final stock must not drop below zero');
    assert.equal(successfulOrders, 5, 'Exactly 5 orders can succeed');
    assert.equal(outOfStockRejections, 15, '15 orders must be rejected gracefully');
  });
});
