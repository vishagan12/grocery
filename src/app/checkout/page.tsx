'use client';

import React, { useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import StorefrontView from '@/components/StorefrontView';

export default function CheckoutRoute() {
  const { dispatch } = useStore();

  useEffect(() => {
    dispatch({ type: 'SET_PAGE', page: 'checkout' });
  }, [dispatch]);

  return <StorefrontView initialPage="checkout" />;
}
