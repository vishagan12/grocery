'use client';

import React, { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
import { products, Product } from '@/data/products';
import { Lang } from '@/data/translations';

export type CartItem = {
  productId: string;
  variantIndex: number;
  quantity: number;
};

export type Order = {
  id: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  address: string;
  phone: string;
  status: number; // 0-4 milestone
  timestamp: number;
};

export type UserLocation = {
  area: string;
  city: string;
  pincode: string;
  landmark: string;
  distanceKm: number;
  deliveryMins: number;
};

type StoreState = {
  lang: Lang;
  cart: CartItem[];
  wishlist: string[]; // product IDs in wishlist
  orders: Order[];
  cartOpen: boolean;
  searchQuery: string;
  activeCategory: string;
  currentPage: string;
  loginPhone: string;
  userName: string;
  userDob: string;
  isLoggedIn: boolean;
  toastMessage: string;
  productDetailId: string | null;
  sortBy: string;
  location: UserLocation;
  locationModalOpen: boolean;
  appliedCoupon: string | null;
  couponDiscount: number;
};

type StoreAction =
  | { type: 'SET_LANG'; lang: Lang }
  | { type: 'ADD_TO_CART'; productId: string; variantIndex: number; quantity?: number }
  | { type: 'REMOVE_FROM_CART'; productId: string; variantIndex: number }
  | { type: 'UPDATE_QUANTITY'; productId: string; variantIndex: number; quantity: number }
  | { type: 'CLEAR_CART' }
  | { type: 'APPLY_COUPON'; code: string; discount: number }
  | { type: 'REMOVE_COUPON' }
  | { type: 'SET_CART_OPEN'; open: boolean }
  | { type: 'TOGGLE_WISHLIST'; productId: string }
  | { type: 'CLEAR_WISHLIST' }
  | { type: 'SET_SEARCH'; query: string }
  | { type: 'SET_CATEGORY'; category: string }
  | { type: 'SET_PAGE'; page: string }
  | { type: 'SET_LOGIN'; phone: string; name?: string; dob?: string; loggedIn: boolean }
  | { type: 'LOGOUT' }
  | { type: 'SHOW_TOAST'; message: string }
  | { type: 'HIDE_TOAST' }
  | { type: 'SET_PRODUCT_DETAIL'; id: string | null }
  | { type: 'ADD_ORDER'; order: Order }
  | { type: 'ADVANCE_ORDER'; orderId: string }
  | { type: 'SET_SORT'; sort: string }
  | { type: 'SET_LOCATION'; location: UserLocation }
  | { type: 'SET_LOCATION_MODAL'; open: boolean }
  | { type: 'LOAD_STATE'; state: Partial<StoreState> };

const defaultLocation: UserLocation = {
  area: 'K.K. Nagar',
  city: 'Madurai',
  pincode: '625020',
  landmark: 'Near Meenakshi Temple',
  distanceKm: 1.8,
  deliveryMins: 20,
};

const initialState: StoreState = {
  lang: 'en',
  cart: [],
  wishlist: [],
  orders: [],
  cartOpen: false,
  searchQuery: '',
  activeCategory: 'all',
  currentPage: 'home',
  loginPhone: '',
  userName: 'Vishagan',
  userDob: '12 Dec 2006',
  isLoggedIn: false,
  toastMessage: '',
  productDetailId: null,
  sortBy: 'popularity',
  location: defaultLocation,
  locationModalOpen: false,
  appliedCoupon: null,
  couponDiscount: 0,
};

function reducer(state: StoreState, action: StoreAction): StoreState {
  switch (action.type) {
    case 'SET_LANG':
      return { ...state, lang: action.lang };

    case 'ADD_TO_CART': {
      const existing = state.cart.find(
        (i) => i.productId === action.productId && i.variantIndex === action.variantIndex
      );
      if (existing) {
        return {
          ...state,
          cart: state.cart.map((i) =>
            i.productId === action.productId && i.variantIndex === action.variantIndex
              ? { ...i, quantity: i.quantity + (action.quantity || 1) }
              : i
          ),
        };
      }
      return {
        ...state,
        cart: [...state.cart, { productId: action.productId, variantIndex: action.variantIndex, quantity: action.quantity || 1 }],
      };
    }

    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cart: state.cart.filter(
          (i) => !(i.productId === action.productId && i.variantIndex === action.variantIndex)
        ),
      };

    case 'UPDATE_QUANTITY': {
      if (action.quantity <= 0) {
        return {
          ...state,
          cart: state.cart.filter(
            (i) => !(i.productId === action.productId && i.variantIndex === action.variantIndex)
          ),
        };
      }
      return {
        ...state,
        cart: state.cart.map((i) =>
          i.productId === action.productId && i.variantIndex === action.variantIndex
            ? { ...i, quantity: action.quantity }
            : i
        ),
      };
    }

    case 'CLEAR_CART':
      return { ...state, cart: [], appliedCoupon: null, couponDiscount: 0 };

    case 'APPLY_COUPON':
      return { ...state, appliedCoupon: action.code, couponDiscount: action.discount };

    case 'REMOVE_COUPON':
      return { ...state, appliedCoupon: null, couponDiscount: 0 };

    case 'SET_CART_OPEN':
      return { ...state, cartOpen: action.open };

    case 'TOGGLE_WISHLIST': {
      const exists = state.wishlist.includes(action.productId);
      return {
        ...state,
        wishlist: exists
          ? state.wishlist.filter((id) => id !== action.productId)
          : [...state.wishlist, action.productId],
      };
    }

    case 'CLEAR_WISHLIST':
      return { ...state, wishlist: [] };

    case 'SET_SEARCH':
      return { ...state, searchQuery: action.query };

    case 'SET_CATEGORY':
      return { ...state, activeCategory: action.category };

    case 'SET_PAGE':
      return { ...state, currentPage: action.page, productDetailId: action.page === 'home' ? null : state.productDetailId };

    case 'SET_LOGIN':
      return {
        ...state,
        loginPhone: action.phone,
        userName: action.name || state.userName || 'Vishagan',
        userDob: action.dob || state.userDob || '12 Dec 2006',
        isLoggedIn: action.loggedIn,
      };

    case 'LOGOUT':
      return {
        ...state,
        isLoggedIn: false,
        loginPhone: '',
        userName: '',
      };

    case 'SHOW_TOAST':
      return { ...state, toastMessage: action.message };

    case 'HIDE_TOAST':
      return { ...state, toastMessage: '' };

    case 'SET_PRODUCT_DETAIL':
      return { ...state, productDetailId: action.id };

    case 'ADD_ORDER':
      return { ...state, orders: [action.order, ...state.orders] };

    case 'ADVANCE_ORDER':
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.orderId ? { ...o, status: Math.min(o.status + 1, 4) } : o
        ),
      };

    case 'SET_SORT':
      return { ...state, sortBy: action.sort };

    case 'SET_LOCATION':
      return { ...state, location: action.location, locationModalOpen: false };

    case 'SET_LOCATION_MODAL':
      return { ...state, locationModalOpen: action.open };

    case 'LOAD_STATE':
      return { ...state, ...action.state };

    default:
      return state;
  }
}

type StoreContextType = {
  state: StoreState;
  dispatch: React.Dispatch<StoreAction>;
  getProduct: (id: string) => Product | undefined;
  getCartItemCount: () => number;
  getCartSubtotal: () => number;
  getCartMrpTotal: () => number;
  getCartDiscount: () => number;
  getDeliveryFee: () => number;
  getCartTotal: () => number;
  getItemQuantity: (productId: string, variantIndex: number) => number;
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string) => void;
  showToast: (msg: string) => void;
};

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('sriAmmanStore');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Clear out legacy mock default wishlist if it contains the old mock 3 items
        let initialWishlist: string[] = Array.isArray(parsed.wishlist) ? parsed.wishlist : [];
        const isLegacyMock =
          initialWishlist.length === 3 &&
          initialWishlist.includes('mil-1') &&
          initialWishlist.includes('ric-1') &&
          initialWishlist.includes('oil-1');
        if (isLegacyMock) {
          initialWishlist = [];
        }

        dispatch({
          type: 'LOAD_STATE',
          state: {
            cart: parsed.cart || [],
            wishlist: initialWishlist,
            orders: parsed.orders || [],
            lang: parsed.lang || 'en',
            isLoggedIn: false, // User requested: everytime I refresh I must logout and login again, it shouldn't show logged in the moment I open it
            loginPhone: parsed.loginPhone || '',
            userName: parsed.userName || 'Vishagan',
            userDob: parsed.userDob || '12 Dec 2006',
            location: parsed.location || defaultLocation,
          },
        });
      }
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem('sriAmmanStore', JSON.stringify({
        cart: state.cart,
        wishlist: state.wishlist,
        orders: state.orders,
        lang: state.lang,
        isLoggedIn: state.isLoggedIn,
        loginPhone: state.loginPhone,
        userName: state.userName,
        userDob: state.userDob,
        location: state.location,
      }));
    } catch (e) {
      // ignore
    }
  }, [state.cart, state.wishlist, state.orders, state.lang, state.isLoggedIn, state.loginPhone, state.userName, state.userDob, state.location, mounted]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = state.lang;
      document.documentElement.setAttribute('data-lang', state.lang);
    }
  }, [state.lang]);

  const getProduct = useCallback((id: string) => products.find((p) => p.id === id), []);

  const getCartItemCount = useCallback(() => state.cart.reduce((sum, i) => sum + i.quantity, 0), [state.cart]);

  const getCartSubtotal = useCallback(() => {
    return state.cart.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return sum;
      const variant = product.variants[item.variantIndex];
      if (!variant) return sum;
      return sum + variant.price * item.quantity;
    }, 0);
  }, [state.cart]);

  const getCartMrpTotal = useCallback(() => {
    return state.cart.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return sum;
      const variant = product.variants[item.variantIndex];
      if (!variant) return sum;
      return sum + variant.mrp * item.quantity;
    }, 0);
  }, [state.cart]);

  const getCartDiscount = useCallback(() => getCartMrpTotal() - getCartSubtotal(), [getCartMrpTotal, getCartSubtotal]);

  const getDeliveryFee = useCallback(() => (state.cart.length === 0 || getCartSubtotal() >= 499 ? 0 : 30), [state.cart.length, getCartSubtotal]);

  const getCartTotal = useCallback(() => {
    if (state.cart.length === 0) return 0;
    const rawTotal = getCartSubtotal() + getDeliveryFee();
    return Math.max(0, rawTotal - state.couponDiscount);
  }, [state.cart.length, getCartSubtotal, getDeliveryFee, state.couponDiscount]);

  const getItemQuantity = useCallback(
    (productId: string, variantIndex: number) => {
      const item = state.cart.find((i) => i.productId === productId && i.variantIndex === variantIndex);
      return item ? item.quantity : 0;
    },
    [state.cart]
  );

  const showToast = useCallback(
    (msg: string) => {
      dispatch({ type: 'SHOW_TOAST', message: msg });
      setTimeout(() => dispatch({ type: 'HIDE_TOAST' }), 2500);
    },
    []
  );

  const isWishlisted = useCallback((productId: string) => state.wishlist.includes(productId), [state.wishlist]);

  const toggleWishlist = useCallback(
    (productId: string) => {
      const exists = state.wishlist.includes(productId);
      dispatch({ type: 'TOGGLE_WISHLIST', productId });
      const p = products.find((prod) => prod.id === productId);
      const name = p ? (state.lang === 'ta' ? p.nameTa : p.nameEn) : 'Item';
      if (exists) {
        showToast(state.lang === 'ta' ? `${name} விருப்பப்பட்டியலில் இருந்து நீக்கப்பட்டது` : `${name} removed from wishlist`);
      } else {
        showToast(state.lang === 'ta' ? `${name} விருப்பப்பட்டியலில் சேர்க்கப்பட்டது` : `${name} added to wishlist`);
      }
    },
    [state.wishlist, state.lang, showToast]
  );

  return (
    <StoreContext.Provider
      value={{
        state,
        dispatch,
        getProduct,
        getCartItemCount,
        getCartSubtotal,
        getCartMrpTotal,
        getCartDiscount,
        getDeliveryFee,
        getCartTotal,
        getItemQuantity,
        isWishlisted,
        toggleWishlist,
        showToast,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
