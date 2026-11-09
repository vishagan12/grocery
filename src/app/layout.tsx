import type { Metadata, Viewport } from 'next';
import { Inter, Noto_Sans_Tamil } from 'next/font/google';
import './globals.css';
import { StoreProvider } from '@/context/StoreContext';
import SeoSchema from '@/components/SeoSchema';
import MetaPixel from '@/components/MetaPixel';
import { BRAND_PRIMARY } from '@/lib/brand';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-inter',
});

const notoSansTamil = Noto_Sans_Tamil({
  subsets: ['tamil'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-noto-tamil',
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://sriammansupermarket.in'),
  title: {
    default: 'Sri Amman Supermarket | Express Grocery Delivery in Madurai | ஸ்ரீ அம்மன் சூப்பர்மார்க்கெட்',
    template: '%s | Sri Amman Supermarket Madurai',
  },
  description:
    'Order fresh vegetables, Ponni boiled rice, dals, cooking oils, Aavin milk, and daily essentials online from Sri Amman Supermarket, Madurai. Fast doorstep delivery within 3 km. மதுரையில் விரைவான மளிகை டெலிவரி.',
  applicationName: 'Sri Amman Supermarket',
  keywords: [
    'Sri Amman Supermarket',
    'Madurai supermarket online',
    'grocery delivery Madurai',
    'ஸ்ரீ அம்மன் சூப்பர்மார்க்கெட்',
    'மதுரை மளிகை கடை',
    'Ponni rice Madurai',
    'fresh vegetables delivery Madurai',
    'arisi',
    'paruppu',
    'nallennai',
    'supermarket near me Madurai',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    alternateLocale: ['ta_IN'],
    siteName: 'Sri Amman Supermarket Madurai',
    title: 'Sri Amman Supermarket | Express 3 km Grocery Delivery in Madurai',
    description:
      'Fresh groceries, Ponni rice, farm vegetables & daily essentials delivered fast within 3 km in Madurai. ஸ்ரீ அம்மன் சூப்பர்மார்க்கெட்.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sri Amman Supermarket | Madurai Express Grocery Delivery',
    description:
      'Order fresh groceries in English or Tamil with fast 3 km doorstep delivery in Madurai.',
  },
  manifest: '/manifest.json',
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: BRAND_PRIMARY,
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${notoSansTamil.variable}`}
      suppressHydrationWarning
    >
      <head>
        <SeoSchema />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <StoreProvider>
          {children}
          <MetaPixel />
        </StoreProvider>
      </body>
    </html>
  );
}
