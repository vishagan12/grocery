'use client';

import React, { useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import HeroSection from '@/components/HeroSection';
import CategoryGrid from '@/components/CategoryGrid';
import PromoBanners from '@/components/PromoBanners';
import FeaturedProducts from '@/components/FeaturedProducts';
import dynamic from 'next/dynamic';

const PageSkeleton = () => (
  <div className="w-full max-w-7xl mx-auto px-4 py-8 animate-pulse space-y-4 min-h-[60vh]">
    <div className="h-8 bg-slate-200 rounded w-1/4" />
    <div className="h-64 bg-slate-100 rounded-2xl" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="h-48 bg-slate-100 rounded-xl" />
      <div className="h-48 bg-slate-100 rounded-xl" />
      <div className="h-48 bg-slate-100 rounded-xl" />
      <div className="h-48 bg-slate-100 rounded-xl" />
    </div>
  </div>
);

const ProductsPage = dynamic(() => import('@/components/ProductsPage'), { loading: () => <PageSkeleton /> });
const OrderAgainPage = dynamic(() => import('@/components/OrderAgainPage'), { loading: () => <PageSkeleton /> });
const CheckoutPage = dynamic(() => import('@/components/CheckoutPage'), { loading: () => <PageSkeleton /> });
const OrdersPage = dynamic(() => import('@/components/OrdersPage'), { loading: () => <PageSkeleton /> });
const ProductDetailPage = dynamic(() => import('@/components/ProductDetailPage'), { loading: () => <PageSkeleton /> });
const ProfilePage = dynamic(() => import('@/components/ProfilePage'), { loading: () => <PageSkeleton /> });
const WishlistPage = dynamic(() => import('@/components/WishlistPage'), { loading: () => <PageSkeleton /> });
import AppShell from '@/components/AppShell';
import { WhyChooseUs, CustomerReviews } from '@/components/HomeExtras';

export default function StorefrontView({ initialPage }: { initialPage?: string } = {}) {
  const { state } = useStore();
  const activePage = (state.currentPage !== 'home' ? state.currentPage : (initialPage || state.currentPage));

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activePage]);

  const renderPage = () => {
    switch (activePage) {
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

