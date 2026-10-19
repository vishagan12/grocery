export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '';

/**
 * Safe Meta Pixel tracking helper functions.
 * Completely dormant unless process.env.NEXT_PUBLIC_META_PIXEL_ID is defined.
 */

export function trackPageView() {
  if (typeof window !== 'undefined' && (window as any).fbq && FB_PIXEL_ID) {
    (window as any).fbq('track', 'PageView');
  }
}

export function trackAddToCart(productName: string, price: number) {
  if (typeof window !== 'undefined' && (window as any).fbq && FB_PIXEL_ID) {
    (window as any).fbq('track', 'AddToCart', {
      content_name: productName,
      value: price,
      currency: 'INR',
    });
  }
}

export function trackInitiateCheckout(total: number) {
  if (typeof window !== 'undefined' && (window as any).fbq && FB_PIXEL_ID) {
    (window as any).fbq('track', 'InitiateCheckout', {
      value: total,
      currency: 'INR',
    });
  }
}

export function trackPurchase(orderId: string, total: number) {
  if (typeof window !== 'undefined' && (window as any).fbq && FB_PIXEL_ID) {
    (window as any).fbq('track', 'Purchase', {
      value: total,
      currency: 'INR',
      order_id: orderId,
    });
  }
}
