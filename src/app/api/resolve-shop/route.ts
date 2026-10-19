import { NextResponse } from 'next/server';
import { DEFAULT_SHOP_COORDS, SHOP_MAPS_URL } from '@/lib/geofence';

interface ShopCoords {
  lat: number;
  lng: number;
  shopUrl: string;
}

let cachedCoords: ShopCoords | null = null;

export async function GET() {
  if (cachedCoords) {
    return NextResponse.json(cachedCoords);
  }

  const envLat = process.env.NEXT_PUBLIC_SHOP_LAT;
  const envLng = process.env.NEXT_PUBLIC_SHOP_LNG;

  if (envLat && envLng && !isNaN(Number(envLat)) && !isNaN(Number(envLng))) {
    cachedCoords = {
      lat: Number(envLat),
      lng: Number(envLng),
      shopUrl: SHOP_MAPS_URL,
    };
    return NextResponse.json(cachedCoords);
  }

  try {
    const res = await fetch(SHOP_MAPS_URL, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      next: { revalidate: 86400 }, // Cache for 24 hours
    });

    const finalUrl = res.url || '';
    const text = await res.text();

    const match =
      finalUrl.match(/search\/(-?\d+\.\d+),\+?(-?\d+\.\d+)/) ||
      finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
      finalUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) ||
      finalUrl.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/) ||
      text.match(/search\/(-?\d+\.\d+),\+?(-?\d+\.\d+)/) ||
      text.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
      text.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);

    if (match && match[1] && match[2]) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (!isNaN(lat) && !isNaN(lng)) {
        cachedCoords = {
          lat,
          lng,
          shopUrl: SHOP_MAPS_URL,
        };
        return NextResponse.json(cachedCoords);
      }
    }
  } catch (err) {
    console.warn('Failed to dynamically resolve shop coordinates, using default shop coordinates:', err);
  }

  cachedCoords = {
    ...DEFAULT_SHOP_COORDS,
    shopUrl: SHOP_MAPS_URL,
  };

  return NextResponse.json(cachedCoords);
}
