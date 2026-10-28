/**
 * Utility functions for parsing and formatting delivery slot preferences
 * and persistent rider assignment encoding.
 */

export function parseDeliverySlot(slotString?: string | null): {
  slot: string;
  riderName?: string;
  riderPhone?: string;
} {
  if (!slotString) {
    return { slot: 'express', riderName: undefined, riderPhone: undefined };
  }

  const parts = slotString.split('|rider:');
  const slot = parts[0] || 'express';

  if (parts.length > 1) {
    const riderInfo = parts[1].split(':');
    const riderName = riderInfo[0]?.trim() || undefined;
    const riderPhone = riderInfo[1]?.trim() || undefined;
    return { slot, riderName, riderPhone };
  }

  return { slot, riderName: undefined, riderPhone: undefined };
}

export function formatDeliverySlot(
  baseSlot?: string | null,
  riderName?: string | null,
  riderPhone?: string | null
): string {
  const cleanBase = (baseSlot || 'express').split('|rider:')[0] || 'express';
  if (riderName || riderPhone) {
    return `${cleanBase}|rider:${riderName || ''}:${riderPhone || ''}`;
  }
  return cleanBase;
}

export interface OrderOverlayState {
  status?: number;
  paymentStatus?: string;
  deliverySlot?: string;
  assignedRiderName?: string;
  assignedRiderPhone?: string;
}

// Global server-side map that holds live mutations across API routes
const globalOrderOverlays = new Map<string, OrderOverlayState>();

export function setOrderOverlay(orderId: string, updates: Partial<OrderOverlayState>) {
  const existing = globalOrderOverlays.get(orderId) || {};
  globalOrderOverlays.set(orderId, { ...existing, ...updates });
}

export function getOrderOverlay(orderId: string): OrderOverlayState | undefined {
  return globalOrderOverlays.get(orderId);
}

export function applyOrderOverlay<T extends { id: string }>(order: T): T {
  const overlay = getOrderOverlay(order.id);
  if (!overlay) return order;

  const result: any = { ...order };
  if (typeof overlay.status === 'number') {
    result.status = overlay.status;
  }
  if (overlay.paymentStatus) {
    result.payment_status = overlay.paymentStatus;
    result.paymentStatus = overlay.paymentStatus;
  }
  if (overlay.deliverySlot) {
    result.delivery_slot = overlay.deliverySlot;
    result.deliverySlot = overlay.deliverySlot;
  }
  if (overlay.assignedRiderName) {
    result.assigned_rider_name = overlay.assignedRiderName;
    result.assignedRiderName = overlay.assignedRiderName;
  }
  if (overlay.assignedRiderPhone) {
    result.assigned_rider_phone = overlay.assignedRiderPhone;
    result.assignedRiderPhone = overlay.assignedRiderPhone;
  }
  return result as T;
}
