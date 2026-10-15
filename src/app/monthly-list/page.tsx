'use client';

import React, { useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import AppShell from '@/components/AppShell';
import MonthlyListPage from '@/components/MonthlyListPage';

export default function MonthlyListRoute() {
  const { dispatch } = useStore();

  useEffect(() => {
    dispatch({ type: 'SET_PAGE', page: 'monthly-list' });
  }, [dispatch]);

  return (
    <AppShell>
      <MonthlyListPage />
    </AppShell>
  );
}
