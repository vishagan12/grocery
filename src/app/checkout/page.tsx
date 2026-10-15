'use client';

import React, { useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import AppShell from '@/components/AppShell';
import CheckoutPage from '@/components/CheckoutPage';

export default function CheckoutRoute() {
  const { dispatch } = useStore();

  useEffect(() => {
    dispatch({ type: 'SET_PAGE', page: 'checkout' });
  }, [dispatch]);

  return (
    <AppShell>
      <CheckoutPage />
    </AppShell>
  );
}
