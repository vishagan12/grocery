import { ImageResponse } from 'next/og';
import { BRAND_FOREST, BRAND_PRIMARY } from '@/lib/brand';

// Node-runtime @vercel/og fails to load on Windows builds in Next 14, so keep edge.
export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

// Mirrors src/app/icon.svg; iOS ignores SVG touch icons so a PNG is generated here.
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="180" height="180">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${BRAND_PRIMARY}" />
      <stop offset="100%" stop-color="${BRAND_FOREST}" />
    </linearGradient>
  </defs>
  <rect width="100" height="100" fill="url(#bg)" />
  <path d="M25 32 h12 l8 32 h30 l6 -22 h-48" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
  <circle cx="48" cy="72" r="5" fill="#FFFFFF" />
  <circle cx="72" cy="72" r="5" fill="#FFFFFF" />
  <path d="M68 22 C68 22 78 24 80 32 C82 40 74 44 74 44 C74 44 72 34 68 32 Z" fill="#FDE047" />
</svg>`;

export default function AppleIcon() {
  const src = `data:image/svg+xml,${encodeURIComponent(iconSvg)}`;

  return new ImageResponse(
    (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} width={180} height={180} alt="" />
    ),
    size
  );
}
