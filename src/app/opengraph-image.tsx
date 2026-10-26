import { ImageResponse } from 'next/og';
import { BRAND_DEEP, BRAND_FOREST, BRAND_PRIMARY } from '@/lib/brand';

// Node-runtime @vercel/og fails to load on Windows builds in Next 14, so keep edge.
export const runtime = 'edge';
export const alt = 'Sri Amman Supermarket - Madurai Express Grocery Delivery';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: `linear-gradient(135deg, ${BRAND_FOREST} 0%, ${BRAND_DEEP} 60%, ${BRAND_FOREST} 100%)`,
          padding: '60px 80px',
          boxSizing: 'border-box',
          border: `14px solid ${BRAND_PRIMARY}`,
        }}
      >
        {/* Top Badge Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: BRAND_PRIMARY,
            color: BRAND_FOREST,
            padding: '12px 28px',
            borderRadius: '9999px',
            fontSize: '18px',
            fontWeight: 800,
            letterSpacing: '1.5px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
          }}
        >
          MADURAI EXPRESS GROCERY DELIVERY • WITHIN 3 KM
        </div>

        {/* Center Hero Block */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              fontSize: '64px',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-1px',
              lineHeight: 1.1,
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
            }}
          >
            Sri Amman Supermarket
          </div>
          <div
            style={{
              fontSize: '32px',
              fontWeight: 600,
              color: '#a7f3d0',
              lineHeight: 1.3,
              maxWidth: '960px',
            }}
          >
            Fresh Vegetables, Ponni Rice, Oils, Dairy & Daily Essentials
          </div>
        </div>

        {/* Bottom Trust Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: '16px',
              fontSize: '20px',
              fontWeight: 700,
            }}
          >
            100% Fresh & Quality Checked
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: '16px',
              fontSize: '20px',
              fontWeight: 700,
            }}
          >
            3 km Fast Local Delivery
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: '16px',
              fontSize: '20px',
              fontWeight: 700,
            }}
          >
            Order in English & Tamil
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
