'use client';

import React, { useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import Home from '@/app/page';

export default function MonthlyListRoute() {
  const { dispatch } = useStore();

  useEffect(() => {
    dispatch({ type: 'SET_PAGE', page: 'monthly-list' });
  }, [dispatch]);

  return <Home />;
}
