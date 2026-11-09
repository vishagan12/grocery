import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'All Products | Sri Amman Supermarket Madurai',
  description: 'Explore full grocery catalog with wholesale counter prices and 20-minute delivery in Madurai.',
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}

