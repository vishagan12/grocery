'use client';

import React, { useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import AppShell from '@/components/AppShell';
import OrdersPage from '@/components/OrdersPage';

export default function OrdersRoute() {
  const { dispatch } = useStore();

  useEffect(() => {
    dispatch({ type: 'SET_PAGE', page: 'orders' });
  }, [dispatch]);

  return (
    <AppShell>
      <OrdersPage />
    </AppShell>
  );
}
