'use client';

import React, { useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import HeroSection from '@/components/HeroSection';
import CategoryGrid from '@/components/CategoryGrid';
import PromoBanners from '@/components/PromoBanners';
import FeaturedProducts from '@/components/FeaturedProducts';
import ProductsPage from '@/components/ProductsPage';
import OrderAgainPage from '@/components/OrderAgainPage';
import CheckoutPage from '@/components/CheckoutPage';
import OrdersPage from '@/components/OrdersPage';
import ProductDetailPage from '@/components/ProductDetailPage';
import ProfilePage from '@/components/ProfilePage';
import WishlistPage from '@/components/WishlistPage';
import AppShell from '@/components/AppShell';
import { WhyChooseUs, CustomerReviews } from '@/components/HomeExtras';

export default function Home() {
  const { state } = useStore();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [state.currentPage]);

  const renderPage = () => {
    switch (state.currentPage) {
      case 'home':
        return (
          <>
            <HeroSection />
            <CategoryGrid />
            <PromoBanners />
            <FeaturedProducts />
            <WhyChooseUs />
            <CustomerReviews />
          </>
        );
      case 'products':
        return <ProductsPage />;
      case 'monthly-list':
        return <OrderAgainPage />;
      case 'checkout':
        return <CheckoutPage />;
      case 'orders':
        return <OrdersPage />;
      case 'product-detail':
        return <ProductDetailPage />;
      case 'profile':
        return <ProfilePage />;
      case 'wishlist':
        return <WishlistPage />;
      default:
        return (
          <>
            <HeroSection />
            <CategoryGrid />
            <PromoBanners />
            <FeaturedProducts />
            <WhyChooseUs />
            <CustomerReviews />
          </>
        );
    }
  };

  return <AppShell>{renderPage()}</AppShell>;
}
