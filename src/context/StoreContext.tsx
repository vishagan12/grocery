'use client';

import React, { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
import { products, Product } from '@/data/products';
import { Lang } from '@/data/translations';
import { supabase } from '@/lib/supabase';
import { DEFAULT_SHOP_COORDS, SHOP_MAPS_URL } from '@/lib/geofence';

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
  lat?: number;
  lng?: number;
};

export interface SavedAddress {
  id: string;
  tag: 'Home' | 'Work' | 'Other';
  customLabel?: string; // Used when tag === 'Other' (e.g., "Mom's House", "Shop")
  houseNo: string;      // Door / Flat No. / Building Name
  street: string;       // Street / Road Name
  area: string;         // Locality / Area
  landmark?: string;
  city: string;         // 'Madurai'
  pincode: string;      // 6-digit pincode
  lat: number;
  lng: number;
  distanceKm: number;
  isDefault: boolean;
}

type StoreState = {
  lang: Lang;
  catalog: Product[];
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
  savedAddresses: SavedAddress[];
  selectedAddressId: string | null;
  shopCoords: { lat: number; lng: number; shopUrl: string };
  sessionExpiresAt?: number | null;
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
  | { type: 'PLACE_ORDER'; order: Order }
  | { type: 'ADVANCE_ORDER'; orderId: string }
  | { type: 'SET_SORT'; sort: string }
  | { type: 'SET_LOCATION'; location: UserLocation }
  | { type: 'SET_LOCATION_MODAL'; open: boolean }
  | { type: 'SET_CATALOG'; products: Product[] }
  | { type: 'UPDATE_ORDER_STATUS_LIVE'; orderId: string; status: number }
  | { type: 'SET_ADDRESSES'; addresses: SavedAddress[]; selectedId?: string | null }
  | { type: 'ADD_ADDRESS'; address: SavedAddress }
  | { type: 'SELECT_ADDRESS'; id: string }
  | { type: 'DELETE_ADDRESS'; id: string }
  | { type: 'SET_SHOP_COORDS'; coords: { lat: number; lng: number; shopUrl: string } }
  | { type: 'LOAD_STATE'; state: Partial<StoreState> };

const defaultLocation: UserLocation = {
  area: '',
  city: 'Madurai',
  pincode: '',
  landmark: '',
  distanceKm: 0,
  deliveryMins: 20,
};

const initialState: StoreState = {
  lang: 'en',
  catalog: products,
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
  savedAddresses: [],
  selectedAddressId: null,
  shopCoords: { ...DEFAULT_SHOP_COORDS, shopUrl: SHOP_MAPS_URL },
  sessionExpiresAt: null,
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
        sessionExpiresAt: action.loggedIn ? Date.now() + 7 * 24 * 60 * 60 * 1000 : null,
      };

    case 'LOGOUT':
      return {
        ...state,
        isLoggedIn: false,
        loginPhone: '',
        userName: '',
        savedAddresses: [],
        selectedAddressId: null,
        sessionExpiresAt: null,
      };

    case 'SHOW_TOAST':
      return { ...state, toastMessage: action.message };

    case 'HIDE_TOAST':
      return { ...state, toastMessage: '' };

    case 'SET_PRODUCT_DETAIL':
      return { ...state, productDetailId: action.id };

    case 'ADD_ORDER':
    case 'PLACE_ORDER':
      return { ...state, orders: [action.order, ...state.orders] };

    case 'ADVANCE_ORDER':
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.orderId ? { ...o, status: Math.min(o.status + 1, 4) } : o
        ),
      };

    case 'SET_CATALOG':
      return { ...state, catalog: action.products };

    case 'UPDATE_ORDER_STATUS_LIVE':
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.orderId ? { ...o, status: action.status } : o
        ),
      };

    case 'SET_SORT':
      return { ...state, sortBy: action.sort };

    case 'SET_LOCATION':
      return { ...state, location: action.location, locationModalOpen: false };

    case 'SET_LOCATION_MODAL':
      return { ...state, locationModalOpen: action.open };

    case 'SET_ADDRESSES': {
      const selectedId =
        action.selectedId !== undefined
          ? action.selectedId
          : action.addresses.find((a) => a.isDefault && a.distanceKm <= 3.0)?.id ||
            action.addresses.find((a) => a.distanceKm <= 3.0)?.id ||
            action.addresses[0]?.id ||
            null;
      return {
        ...state,
        savedAddresses: action.addresses,
        selectedAddressId: selectedId,
      };
    }

    case 'ADD_ADDRESS': {
      const updated = [action.address, ...state.savedAddresses.filter((a) => a.id !== action.address.id)];
      if (action.address.isDefault) {
        updated.forEach((a) => {
          if (a.id !== action.address.id) a.isDefault = false;
        });
      }
      return {
        ...state,
        savedAddresses: updated,
        selectedAddressId: action.address.id,
      };
    }

    case 'SELECT_ADDRESS': {
      const chosen = state.savedAddresses.find((a) => a.id === action.id);
      return {
        ...state,
        selectedAddressId: action.id,
        location: chosen
          ? {
              area: chosen.area || chosen.street,
              city: chosen.city || 'Madurai',
              pincode: chosen.pincode,
              landmark: chosen.landmark || '',
              distanceKm: chosen.distanceKm,
              deliveryMins: Math.min(30, Math.max(15, Math.round(chosen.distanceKm * 7))),
              lat: chosen.lat,
              lng: chosen.lng,
            }
          : state.location,
      };
    }

    case 'DELETE_ADDRESS': {
      const remaining = state.savedAddresses.filter((a) => a.id !== action.id);
      const newSelected = state.selectedAddressId === action.id ? remaining[0]?.id || null : state.selectedAddressId;
      return {
        ...state,
        savedAddresses: remaining,
        selectedAddressId: newSelected,
      };
    }

    case 'SET_SHOP_COORDS':
      return { ...state, shopCoords: action.coords };

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
  saveAddress: (addr: Omit<SavedAddress, 'id'>) => Promise<SavedAddress>;
  deleteAddress: (id: string) => Promise<void>;
  selectAddress: (id: string) => void;
};

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [mounted, setMounted] = useState(false);

  // Load shop coordinates from dynamic resolver
  useEffect(() => {
    fetch('/api/resolve-shop')
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data.lat === 'number' && typeof data.lng === 'number') {
          dispatch({
            type: 'SET_SHOP_COORDS',
            coords: {
              lat: data.lat,
              lng: data.lng,
              shopUrl: data.shopUrl || SHOP_MAPS_URL,
            },
          });
        }
      })
      .catch(() => {});
  }, []);

  // Initial local state restoration
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('sriAmmanStore');
      if (saved) {
        const parsed = JSON.parse(saved);
        let initialWishlist: string[] = Array.isArray(parsed.wishlist) ? parsed.wishlist : [];
        const isLegacyMock =
          initialWishlist.length === 3 &&
          initialWishlist.includes('mil-1') &&
          initialWishlist.includes('ric-1') &&
          initialWishlist.includes('oil-1');
        if (isLegacyMock) {
          initialWishlist = [];
        }

        // Clean out legacy mock default location if it has the old hardcoded 1.8km mock
        const parsedLoc = parsed.location;
        const isLegacyLoc = parsedLoc && parsedLoc.area === 'K.K. Nagar' && parsedLoc.distanceKm === 1.8;

        // Check session expiration (7 days TTL)
        const sessionExpiresAt = parsed.sessionExpiresAt;
        const isSessionValid =
          Boolean(parsed.isLoggedIn) &&
          typeof sessionExpiresAt === 'number' &&
          Date.now() < sessionExpiresAt;

        dispatch({
          type: 'LOAD_STATE',
          state: {
            cart: parsed.cart || [],
            wishlist: initialWishlist,
            orders: parsed.orders || [],
            lang: parsed.lang || 'en',
            isLoggedIn: isSessionValid,
            loginPhone: isSessionValid ? parsed.loginPhone || '' : '',
            userName: isSessionValid ? parsed.userName || 'Vishagan' : 'Vishagan',
            userDob: isSessionValid ? parsed.userDob || '12 Dec 2006' : '12 Dec 2006',
            location: isLegacyLoc ? defaultLocation : parsed.location || defaultLocation,
            sessionExpiresAt: isSessionValid ? sessionExpiresAt : null,
          },
        });
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Sync addresses whenever loginPhone changes or on initial mount
  useEffect(() => {
    const currentPhone = state.loginPhone || 'guest';
    let loadedAddresses: SavedAddress[] = [];

    try {
      const local = localStorage.getItem(`sas_addresses_${currentPhone}`);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) {
          loadedAddresses = parsed;
        }
      }
    } catch {}

    // Also fetch from Supabase if phone is set
    async function fetchSupabaseAddresses() {
      if (!state.loginPhone) {
        if (loadedAddresses.length > 0) {
          dispatch({ type: 'SET_ADDRESSES', addresses: loadedAddresses });
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from('addresses')
          .select('*')
          .eq('phone', state.loginPhone);

        if (!error && Array.isArray(data) && data.length > 0) {
          const supaList: SavedAddress[] = data.map((row: any) => ({
            id: String(row.id),
            tag: row.tag || 'Home',
            customLabel: row.custom_label || undefined,
            houseNo: row.house_no || '',
            street: row.street || '',
            area: row.area || '',
            landmark: row.landmark || undefined,
            city: row.city || 'Madurai',
            pincode: row.pincode || '',
            lat: Number(row.lat) || 0,
            lng: Number(row.lng) || 0,
            distanceKm: Number(row.distance_km) || 0,
            isDefault: Boolean(row.is_default),
          }));

          const mergedMap = new Map<string, SavedAddress>();
          [...supaList, ...loadedAddresses].forEach((a) => {
            const key = `${a.houseNo.toLowerCase().trim()}_${a.street.toLowerCase().trim()}`;
            if (!mergedMap.has(key)) {
              mergedMap.set(key, a);
            }
          });
          const merged = Array.from(mergedMap.values());
          dispatch({ type: 'SET_ADDRESSES', addresses: merged });
          localStorage.setItem(`sas_addresses_${currentPhone}`, JSON.stringify(merged));
          return;
        }
      } catch (err) {
        // Fallback to local
      }

      if (loadedAddresses.length > 0) {
        dispatch({ type: 'SET_ADDRESSES', addresses: loadedAddresses });
      }
    }

    fetchSupabaseAddresses();
  }, [state.loginPhone]);

  // Persist store state to localStorage
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(
        'sriAmmanStore',
        JSON.stringify({
          cart: state.cart,
          wishlist: state.wishlist,
          orders: state.orders,
          lang: state.lang,
          isLoggedIn: state.isLoggedIn,
          loginPhone: state.loginPhone,
          userName: state.userName,
          userDob: state.userDob,
          location: state.location,
          sessionExpiresAt: state.sessionExpiresAt,
        })
      );
    } catch (e) {
      // ignore
    }
  }, [state.cart, state.wishlist, state.orders, state.lang, state.isLoggedIn, state.loginPhone, state.userName, state.userDob, state.location, state.sessionExpiresAt, mounted]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = state.lang;
      document.documentElement.setAttribute('data-lang', state.lang);
    }
  }, [state.lang]);

  // Live Supabase Catalog & Real-Time Orders Sync
  useEffect(() => {
    let isSubscribed = true;

    async function fetchLiveCatalog() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*, product_variants(label, price, mrp, stock_qty)');

        if (!error && data && data.length > 0 && isSubscribed) {
          const liveProducts: Product[] = data.map((row: any) => ({
            id: row.id,
            nameEn: row.name_en,
            nameTa: row.name_ta,
            category: row.category_id,
            image: row.image,
            inStock: Boolean(row.in_stock),
            badge: row.badge || undefined,
            badgeTa: row.badge_ta || undefined,
            variants:
              Array.isArray(row.product_variants) && row.product_variants.length > 0
                ? row.product_variants.map((v: any) => ({
                    label: v.label,
                    price: Number(v.price),
                    mrp: Number(v.mrp),
                    stock_qty: typeof v.stock_qty === 'number' ? v.stock_qty : undefined,
                  }))
                : Array.isArray(row.variants) && row.variants.length > 0
                ? row.variants
                : [{ label: '1 pack', price: 50, mrp: 60 }],
          }));
          dispatch({ type: 'SET_CATALOG', products: liveProducts });
        }
      } catch {
        // Fallback gracefully to default local products
      }
    }

    fetchLiveCatalog();

    const channel = supabase
      .channel('live-orders')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.new && payload.new.id && typeof payload.new.status === 'number') {
            dispatch({
              type: 'UPDATE_ORDER_STATUS_LIVE',
              orderId: payload.new.id,
              status: payload.new.status,
            });
          }
        }
      )
      .subscribe();

    return () => {
      isSubscribed = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const getProduct = useCallback(
    (id: string) => (state.catalog || products).find((p) => p.id === id) || products.find((p) => p.id === id),
    [state.catalog]
  );

  const getCartItemCount = useCallback(() => state.cart.reduce((sum, i) => sum + i.quantity, 0), [state.cart]);

  const getCartSubtotal = useCallback(() => {
    return state.cart.reduce((sum, item) => {
      const product = (state.catalog || products).find((p) => p.id === item.productId) || products.find((p) => p.id === item.productId);
      if (!product) return sum;
      const variant = product.variants[item.variantIndex];
      if (!variant) return sum;
      return sum + variant.price * item.quantity;
    }, 0);
  }, [state.cart, state.catalog]);

  const getCartMrpTotal = useCallback(() => {
    return state.cart.reduce((sum, item) => {
      const product = (state.catalog || products).find((p) => p.id === item.productId) || products.find((p) => p.id === item.productId);
      if (!product) return sum;
      const variant = product.variants[item.variantIndex];
      if (!variant) return sum;
      return sum + variant.mrp * item.quantity;
    }, 0);
  }, [state.cart, state.catalog]);

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

  const saveAddress = useCallback(
    async (addr: Omit<SavedAddress, 'id'>): Promise<SavedAddress> => {
      const newAddr: SavedAddress = {
        id: `addr-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        ...addr,
      };

      dispatch({ type: 'ADD_ADDRESS', address: newAddr });

      // Update location immediately to this address
      dispatch({
        type: 'SET_LOCATION',
        location: {
          area: newAddr.area || newAddr.street,
          city: newAddr.city || 'Madurai',
          pincode: newAddr.pincode,
          landmark: newAddr.landmark || '',
          distanceKm: newAddr.distanceKm,
          deliveryMins: Math.min(30, Math.max(15, Math.round(newAddr.distanceKm * 7))),
          lat: newAddr.lat,
          lng: newAddr.lng,
        },
      });

      // Update localStorage
      const currentPhone = state.loginPhone || 'guest';
      const existing = state.savedAddresses.filter((a) => a.id !== newAddr.id);
      if (newAddr.isDefault) {
        existing.forEach((a) => {
          a.isDefault = false;
        });
      }
      const updated = [newAddr, ...existing];
      try {
        localStorage.setItem(`sas_addresses_${currentPhone}`, JSON.stringify(updated));
      } catch {}

      // Sync to Supabase
      if (state.loginPhone) {
        try {
          await supabase.from('addresses').insert({
            phone: state.loginPhone,
            tag: newAddr.tag,
            custom_label: newAddr.customLabel || null,
            house_no: newAddr.houseNo,
            street: newAddr.street,
            area: newAddr.area,
            landmark: newAddr.landmark || null,
            city: newAddr.city || 'Madurai',
            pincode: newAddr.pincode,
            lat: newAddr.lat,
            lng: newAddr.lng,
            distance_km: newAddr.distanceKm,
            is_default: newAddr.isDefault,
          });
        } catch (err) {
          console.warn('Supabase address insert failed:', err);
        }
      }

      return newAddr;
    },
    [state.loginPhone, state.savedAddresses]
  );

  const deleteAddress = useCallback(
    async (id: string): Promise<void> => {
      dispatch({ type: 'DELETE_ADDRESS', id });

      const currentPhone = state.loginPhone || 'guest';
      const updated = state.savedAddresses.filter((a) => a.id !== id);
      try {
        localStorage.setItem(`sas_addresses_${currentPhone}`, JSON.stringify(updated));
      } catch {}

      if (state.loginPhone) {
        try {
          await supabase.from('addresses').delete().eq('id', id);
        } catch (err) {
          console.warn('Supabase address delete failed:', err);
        }
      }
    },
    [state.loginPhone, state.savedAddresses]
  );

  const selectAddress = useCallback(
    (id: string) => {
      dispatch({ type: 'SELECT_ADDRESS', id });
    },
    []
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
        saveAddress,
        deleteAddress,
        selectAddress,
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
