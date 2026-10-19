export const SHOP_MAPS_URL = 'https://maps.app.goo.gl/FTHC6VPFxUGZy71Y6';
export const MAX_DELIVERY_RADIUS_KM = 3.0;

export const DEFAULT_SHOP_COORDS = {
  lat: Number(process.env.NEXT_PUBLIC_SHOP_LAT) || 9.963263,
  lng: Number(process.env.NEXT_PUBLIC_SHOP_LNG) || 78.158727,
};

/**
 * Standard Haversine distance calculation between two GPS coordinates
 * Returns distance in kilometers rounded to 2 decimal places
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  if (lat1 === lat2 && lon1 === lon2) return 0;

  const R = 6371; // Earth radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 100) / 100;
}

/**
 * Strict 3.0 km radius delivery check
 */
export function isWithinDeliveryRadius(distanceKm: number): boolean {
  return typeof distanceKm === 'number' && distanceKm <= MAX_DELIVERY_RADIUS_KM && distanceKm >= 0;
}
