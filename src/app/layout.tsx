import type { Metadata, Viewport } from 'next';
import './globals.css';
import { StoreProvider } from '@/context/StoreContext';

export const metadata: Metadata = {
  title: 'Sri Amman Supermarket — Fresh Groceries Delivered in 20 Minutes',
  description: 'Your trusted neighbourhood grocery store in Madurai. Order rice, dals, oils, dairy, vegetables, snacks and household items online. Free delivery above ₹499. Cash/UPI on delivery.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' }
    ],
    apple: [
      { url: '/icon.svg' }
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#1E4D12',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}

