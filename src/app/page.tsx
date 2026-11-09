import type { Metadata } from 'next';
import StorefrontView from '@/components/StorefrontView';

export const metadata: Metadata = {
  title: 'Sri Amman Supermarket | Express Grocery Delivery in Madurai',
  description: 'Order fresh groceries in English or Tamil with fast 3 km doorstep delivery in Madurai.',
};

export default function Home() {
  return (
    <>
      <link
        rel="preload"
        as="image"
        href="/images/hero-bundle.webp"
        fetchPriority="high"
      />
      <StorefrontView />
    </>
  );
}
