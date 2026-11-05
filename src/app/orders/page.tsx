'use client';

import React, { useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import StorefrontView from '@/components/StorefrontView';

export default function OrdersRoute() {
  const { dispatch } = useStore();

  useEffect(() => {
    dispatch({ type: 'SET_PAGE', page: 'orders' });
  }, [dispatch]);

  return <StorefrontView initialPage="orders" />;
}
