'use client';

import React, { useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import AppShell from '@/components/AppShell';
import ProductsPage from '@/components/ProductsPage';

export default function ProductsRoute() {
  const { dispatch } = useStore();

  useEffect(() => {
    dispatch({ type: 'SET_PAGE', page: 'products' });
  }, [dispatch]);

  return (
    <AppShell>
      <ProductsPage />
    </AppShell>
  );
}
