'use client';

import React, { useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import Home from '@/app/page';

export default function ProductsRoute() {
  const { dispatch } = useStore();

  useEffect(() => {
    dispatch({ type: 'SET_PAGE', page: 'products' });
  }, [dispatch]);

  return <Home />;
}
