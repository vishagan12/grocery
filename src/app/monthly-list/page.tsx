'use client';

import React, { useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import StorefrontView from '@/components/StorefrontView';

export default function MonthlyListRoute() {
  const { dispatch } = useStore();

  useEffect(() => {
    dispatch({ type: 'SET_PAGE', page: 'monthly-list' });
  }, [dispatch]);

  return <StorefrontView initialPage="monthly-list" />;
}
