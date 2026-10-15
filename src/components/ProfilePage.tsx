'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import { products } from '@/data/products';
import {
  ChevronLeft,
  Pencil,
  Phone,
  Cake,
  ClipboardList,
  MessageSquareText,
  CreditCard,
  Sun,
  SlidersHorizontal,
  ShoppingBag,
  Heart,
  MapPin,
  FileText,
  Percent,
  Share2,
  Info,
  Lock,
  Bell,
  LogOut,
  ChevronRight,
  Check,
  Copy,
  Plus,
  Trash2,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';

type SubView =
  | 'none'
  | 'edit-identity'
  | 'support'
  | 'payments'
  | 'orders'
  | 'wishlist'
  | 'address-book'
  | 'gst'
  | 'payment-settings'
  | 'coupons'
  | 'about'
  | 'privacy'
  | 'notifications';

export default function ProfilePage() {
  const { state, dispatch, showToast } = useStore();
  const lang = state.lang;

  // Active sub-view inside the profile
  const [subView, setSubView] = useState<SubView>('none');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const el = document.getElementById('profile-content-container');
    if (el) el.scrollTop = 0;
  }, [subView]);

  // Editable Identity fields
  const [name, setName] = useState(state.userName || 'Vishagan');
  const [phone, setPhone] = useState(state.loginPhone || '+91-6379398981');
  const [dob, setDob] = useState(state.userDob || '12 Dec 2006');

  // Address Book state
  const [addresses, setAddresses] = useState([
    {
      id: 'addr-1',
      tag: 'Home',
      house: '12/B, Sri Meenakshi Residency',
      street: 'K.K. Nagar Main Road',
      city: 'Madurai',
      pincode: '625020',
      landmark: 'Near Meenakshi Temple',
      isDefault: true,
    },
    {
      id: 'addr-2',
      tag: 'Work',
      house: 'Plot 45, Anna Nagar East',
      street: '80 Feet Road',
      city: 'Madurai',
      pincode: '625020',
      landmark: 'Opposite State Bank',
      isDefault: false,
    },
  ]);
  const [newAddrTag, setNewAddrTag] = useState('Home');
  const [newAddrHouse, setNewAddrHouse] = useState('');
  const [newAddrStreet, setNewAddrStreet] = useState('');
  const [newAddrPincode, setNewAddrPincode] = useState('625020');
  const [showAddAddrForm, setShowAddAddrForm] = useState(false);

  // GST State
  const [businessName, setBusinessName] = useState('');
  const [gstin, setGstin] = useState('');

  // Payment settings state
  const [selectedPaymentPref, setSelectedPaymentPref] = useState<'upi' | 'cod'>('upi');
  const [upiId, setUpiId] = useState('vishagan@oksbi');

  // Notification Toggles state
  const [notifWhatsApp, setNotifWhatsApp] = useState(true);
  const [notifSms, setNotifSms] = useState(true);
  const [notifOffers, setNotifOffers] = useState(false);

  // Coupons
  const coupons = [
    { code: 'AMMA50', desc: 'Flat ₹50 OFF on orders above ₹499', expires: 'Valid till 31 Oct' },
    { code: 'FREEDEL', desc: 'Free express 30-min delivery on any order', expires: 'No minimum order' },
    { code: 'MALIGAI100', desc: 'Flat ₹100 OFF on Monthly Kudumba Grocery Bundles', expires: 'Valid once per month' },
  ];

  // Load saved state from localStorage
  useEffect(() => {
    try {
      const savedGst = localStorage.getItem('sriAmmaGst');
      if (savedGst) {
        const parsed = JSON.parse(savedGst);
        setBusinessName(parsed.businessName || '');
        setGstin(parsed.gstin || '');
      }

      const savedAddresses = localStorage.getItem('sriAmmaAddresses');
      if (savedAddresses) {
        setAddresses(JSON.parse(savedAddresses));
      }

      const savedNotifs = localStorage.getItem('sriAmmaNotifs');
      if (savedNotifs) {
        const parsed = JSON.parse(savedNotifs);
        setNotifWhatsApp(parsed.whatsapp ?? true);
        setNotifSms(parsed.sms ?? true);
        setNotifOffers(parsed.offers ?? false);
      }

      const savedPay = localStorage.getItem('sriAmmaPayPref');
      if (savedPay) {
        const parsed = JSON.parse(savedPay);
        setSelectedPaymentPref(parsed.pref || 'upi');
        setUpiId(parsed.upiId || 'vishagan@oksbi');
      }
    } catch {
      // ignore
    }
  }, []);

  // Save Identity Edits
  const handleSaveIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({
      type: 'SET_LOGIN',
      phone,
      name,
      dob,
      loggedIn: true,
    });
    setSubView('none');
    showToast('Profile information updated successfully');
  };

  // Add Address Handler
  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddrHouse || !newAddrStreet) return;
    const newEntry = {
      id: `addr-${Date.now()}`,
      tag: newAddrTag,
      house: newAddrHouse,
      street: newAddrStreet,
      city: 'Madurai',
      pincode: newAddrPincode || '625020',
      landmark: '',
      isDefault: false,
    };
    const updated = [...addresses, newEntry];
    setAddresses(updated);
    localStorage.setItem('sriAmmaAddresses', JSON.stringify(updated));
    setNewAddrHouse('');
    setNewAddrStreet('');
    setShowAddAddrForm(false);
    showToast('New address saved to Address Book');
  };

  const handleDeleteAddress = (id: string) => {
    const updated = addresses.filter((a) => a.id !== id);
    setAddresses(updated);
    localStorage.setItem('sriAmmaAddresses', JSON.stringify(updated));
    showToast('Address removed');
  };

  const handleSaveGst = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('sriAmmaGst', JSON.stringify({ businessName, gstin }));
    showToast('GST details saved successfully');
    setSubView('none');
  };

  const handleSavePaymentPref = (pref: 'upi' | 'cod') => {
    setSelectedPaymentPref(pref);
    localStorage.setItem('sriAmmaPayPref', JSON.stringify({ pref, upiId }));
    showToast(`Default payment preference set to ${pref === 'upi' ? 'UPI' : 'Cash on Delivery'}`);
  };

  const handleToggleNotif = (type: 'whatsapp' | 'sms' | 'offers') => {
    let nextWhatsApp = notifWhatsApp;
    let nextSms = notifSms;
    let nextOffers = notifOffers;
    if (type === 'whatsapp') {
      nextWhatsApp = !notifWhatsApp;
      setNotifWhatsApp(nextWhatsApp);
    } else if (type === 'sms') {
      nextSms = !notifSms;
      setNotifSms(nextSms);
    } else if (type === 'offers') {
      nextOffers = !notifOffers;
      setNotifOffers(nextOffers);
    }
    localStorage.setItem(
      'sriAmmaNotifs',
      JSON.stringify({ whatsapp: nextWhatsApp, sms: nextSms, offers: nextOffers })
    );
    showToast('Notification preference updated');
  };

  const handleCopyCoupon = (code: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      showToast(`Coupon code ${code} copied to clipboard`);
    } else {
      showToast(`Coupon: ${code}`);
    }
  };

  const handleShareApp = () => {
    const url = typeof window !== 'undefined' ? window.location.origin : 'https://sriammasupermarket.com';
    if (navigator.share) {
      navigator
        .share({
          title: 'Sri Amma Supermarket',
          text: 'Order daily groceries with 30-min express delivery in Madurai from Sri Amma Supermarket!',
          url,
        })
        .catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      showToast('Store link copied to clipboard');
    } else {
      showToast('Link copied');
    }
  };

  const handleClearPrivacyData = () => {
    try {
      localStorage.removeItem('sriAmmaAddresses');
      localStorage.removeItem('sriAmmaGst');
      localStorage.removeItem('sriAmmaNotifs');
      localStorage.removeItem('sriAmmaPayPref');
      showToast('Local account data cleared');
      setSubView('none');
    } catch {
      // ignore
    }
  };

  const handleLogoutToggle = () => {
    dispatch({ type: 'LOGOUT' });
    showToast('Logged out of your profile');
  };

  const handleLogBackIn = () => {
    dispatch({
      type: 'SET_LOGIN',
      phone: '+91-6379398981',
      name: 'Vishagan',
      dob: '12 Dec 2006',
      loggedIn: true,
    });
    setName('Vishagan');
    setPhone('+91-6379398981');
    setDob('12 Dec 2006');
    showToast('Logged back in as Vishagan');
  };

  // Products currently in wishlist
  const wishlistedItems = products.filter((p) => state.wishlist.includes(p.id));

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      <div className="w-full max-w-xl mx-auto min-h-screen bg-white flex flex-col">
        {/* A. Top Sticky Bar */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-3.5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (subView !== 'none') {
                setSubView('none');
              } else {
                dispatch({ type: 'SET_PAGE', page: 'home' });
              }
            }}
            className="w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200/60 flex items-center justify-center text-slate-800 transition-colors active:scale-95"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5 text-slate-800" />
          </button>

          <h1 className="text-base font-bold text-slate-900 tracking-tight">
            {subView === 'none' ? 'Profile' : 'Profile Details'}
          </h1>

          <div className="w-9" aria-hidden="true" />
        </div>

        {/* Dynamic Content: Sub-views vs Main Profile */}
        <div id="profile-content-container" className="flex-1 p-4 sm:p-5 overflow-y-auto">
          {/* SUB-VIEW 1: Edit Identity */}
          {subView === 'edit-identity' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">Edit Personal Information</h2>
                <button
                  type="button"
                  onClick={() => setSubView('none')}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSaveIdentity} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-semibold focus:outline-none focus:border-[#4CB01E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-semibold focus:outline-none focus:border-[#4CB01E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Date of Birth
                  </label>
                  <input
                    type="text"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    placeholder="e.g. 12 Dec 2006"
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-semibold focus:outline-none focus:border-[#4CB01E]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#4CB01E] hover:bg-[#3D9415] text-white font-bold py-3 rounded-xl text-sm transition-all shadow-sm active:scale-98"
                >
                  Save Changes
                </button>
              </form>
            </div>
          )}

          {/* SUB-VIEW 2: Support */}
          {subView === 'support' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">Sri Amma Customer Support</h2>
                <button
                  type="button"
                  onClick={() => setSubView('none')}
                  className="text-xs font-bold text-[#4CB01E]"
                >
                  Back to Profile
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <p className="text-sm font-semibold text-slate-800">
                  Madurai Express Delivery & Store Helpdesk
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Have an issue with your grocery delivery, missing items, or payment? Our store team is available directly.
                </p>
                <div className="pt-2 border-t border-slate-200 flex flex-col gap-2.5 text-xs text-slate-700 font-medium">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#4CB01E]" />
                    <span>Store Helpline: +91 94432 10890 / +91 63793 98981</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-[#4CB01E]" />
                    <span>WhatsApp: +91 63793 98981 (Instant Order Help)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-slate-400" />
                    <span>Operating Hours: 8:00 AM – 9:30 PM (All 7 Days)</span>
                  </div>
                </div>
              </div>

              <a
                href="https://wa.me/916379398981"
                target="_blank"
                rel="noreferrer"
                className="w-full bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
              >
                <MessageSquareText className="w-4 h-4" />
                <span>Chat with Store on WhatsApp</span>
              </a>
            </div>
          )}

          {/* SUB-VIEW 3: Payments */}
          {(subView === 'payments' || subView === 'payment-settings') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">Payment Preferences</h2>
                <button
                  type="button"
                  onClick={() => setSubView('none')}
                  className="text-xs font-bold text-[#4CB01E]"
                >
                  Back to Profile
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Choose your default payment method for fast 1-click checkout.
              </p>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => handleSavePaymentPref('upi')}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    selectedPaymentPref === 'upi'
                      ? 'border-[#4CB01E] bg-emerald-50/40 text-slate-900'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-slate-700" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">UPI (GPay / PhonePe / Paytm)</p>
                      <p className="text-xs text-slate-500">{upiId}</p>
                    </div>
                  </div>
                  {selectedPaymentPref === 'upi' && (
                    <Check className="w-5 h-5 text-[#4CB01E]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleSavePaymentPref('cod')}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    selectedPaymentPref === 'cod'
                      ? 'border-[#4CB01E] bg-emerald-50/40 text-slate-900'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
                      <ShoppingBag className="w-4 h-4 text-slate-700" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Cash / Dynamic QR on Delivery</p>
                      <p className="text-xs text-slate-500">Pay delivery rider upon receiving items</p>
                    </div>
                  </div>
                  {selectedPaymentPref === 'cod' && (
                    <Check className="w-5 h-5 text-[#4CB01E]" />
                  )}
                </button>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Update Preferred UPI ID
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="yourname@upi"
                    className="flex-1 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 font-semibold focus:outline-none focus:border-[#4CB01E]"
                  />
                  <button
                    type="button"
                    onClick={() => handleSavePaymentPref(selectedPaymentPref)}
                    className="bg-[#4CB01E] text-white px-4 py-2 rounded-xl text-xs font-bold"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SUB-VIEW 4: Orders */}
          {subView === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">
                  Your Orders ({state.orders.length})
                </h2>
                <button
                  type="button"
                  onClick={() => setSubView('none')}
                  className="text-xs font-bold text-[#4CB01E]"
                >
                  Back to Profile
                </button>
              </div>

              {state.orders.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-200">
                  <ShoppingBag className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">No orders placed yet</p>
                  <p className="text-xs text-slate-500 mt-1 mb-4">
                    Your placed orders will show up here with live status tracking.
                  </p>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'SET_PAGE', page: 'products' })}
                    className="bg-[#4CB01E] text-white px-5 py-2 rounded-xl text-xs font-bold"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {state.orders.map((order) => (
                    <div
                      key={order.id}
                      className="border border-slate-200 rounded-2xl p-4 bg-white space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{order.id}</span>
                        <span className="text-[11px] font-bold text-[#4CB01E] bg-emerald-50 px-2 py-0.5 rounded-full">
                          {order.status === 4 ? 'Delivered' : 'Order Placed'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {order.items.length} items • ₹{order.total} •{' '}
                        {order.paymentMethod.toUpperCase()}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">{order.address}</p>
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            order.items.forEach((item) => {
                              dispatch({
                                type: 'ADD_TO_CART',
                                productId: item.productId,
                                variantIndex: item.variantIndex,
                                quantity: item.quantity,
                              });
                            });
                            dispatch({ type: 'SET_CART_OPEN', open: true });
                            showToast('Items added to cart from previous order');
                          }}
                          className="text-xs font-bold text-[#4CB01E] hover:underline"
                        >
                          Reorder All Items
                        </button>
                        <button
                          type="button"
                          onClick={() => dispatch({ type: 'SET_PAGE', page: 'orders' })}
                          className="text-xs text-slate-500 font-semibold hover:text-slate-800"
                        >
                          Track Full Order →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SUB-VIEW 5: Wishlist */}
          {subView === 'wishlist' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">
                  Your Wishlist ({wishlistedItems.length})
                </h2>
                <button
                  type="button"
                  onClick={() => setSubView('none')}
                  className="text-xs font-bold text-[#4CB01E]"
                >
                  Back to Profile
                </button>
              </div>

              {wishlistedItems.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-200">
                  <Heart className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">Your wishlist is empty</p>
                  <p className="text-xs text-slate-500 mt-1 mb-4">
                    Tap the heart icon on any product to save it here.
                  </p>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'SET_PAGE', page: 'products' })}
                    className="bg-[#4CB01E] text-white px-5 py-2 rounded-xl text-xs font-bold"
                  >
                    Browse Catalog
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {wishlistedItems.map((prod) => (
                    <div
                      key={prod.id}
                      className="border border-slate-200 rounded-2xl p-3 flex items-center justify-between gap-3 bg-white"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={prod.image}
                          alt={prod.nameEn}
                          className="w-12 h-12 rounded-xl object-contain bg-slate-50 border border-slate-100 p-1"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {lang === 'ta' ? prod.nameTa : prod.nameEn}
                          </p>
                          <p className="text-xs text-slate-500 font-semibold mt-0.5">
                            ₹{prod.variants[0]?.price} • {prod.variants[0]?.label}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            dispatch({
                              type: 'ADD_TO_CART',
                              productId: prod.id,
                              variantIndex: 0,
                              quantity: 1,
                            });
                            showToast(`Added ${prod.nameEn} to cart`);
                          }}
                          className="bg-[#4CB01E] text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs active:scale-95"
                        >
                          ADD
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            dispatch({ type: 'TOGGLE_WISHLIST', productId: prod.id });
                            showToast('Item removed from wishlist');
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SUB-VIEW 6: Address Book */}
          {subView === 'address-book' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">Address Book</h2>
                <button
                  type="button"
                  onClick={() => setSubView('none')}
                  className="text-xs font-bold text-[#4CB01E]"
                >
                  Back to Profile
                </button>
              </div>

              <div className="space-y-2.5">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="border border-slate-200 rounded-2xl p-3.5 bg-white flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin className="w-4 h-4 text-slate-700" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{addr.tag}</span>
                          {addr.isDefault && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-snug">
                          {addr.house}, {addr.street}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {addr.city} - {addr.pincode}
                        </p>
                      </div>
                    </div>
                    {addresses.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="text-slate-400 hover:text-rose-500 p-1"
                        title="Delete address"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {!showAddAddrForm ? (
                <button
                  type="button"
                  onClick={() => setShowAddAddrForm(true)}
                  className="w-full border-2 border-dashed border-slate-200 hover:border-[#4CB01E] text-slate-600 hover:text-[#4CB01E] py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Address</span>
                </button>
              ) : (
                <form
                  onSubmit={handleAddAddress}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">New Address Details</span>
                    <button
                      type="button"
                      onClick={() => setShowAddAddrForm(false)}
                      className="text-xs text-slate-500 font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {['Home', 'Work', 'Other'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setNewAddrTag(tag)}
                        className={`py-1.5 text-xs font-bold rounded-xl border transition-all ${
                          newAddrTag === tag
                            ? 'bg-[#4CB01E] text-white border-[#4CB01E]'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="House / Flat / Door Number"
                    value={newAddrHouse}
                    onChange={(e) => setNewAddrHouse(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#4CB01E]"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Street / Area / Road Name"
                    value={newAddrStreet}
                    onChange={(e) => setNewAddrStreet(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#4CB01E]"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Pincode (e.g. 625020)"
                    value={newAddrPincode}
                    onChange={(e) => setNewAddrPincode(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#4CB01E]"
                  />
                  <button
                    type="submit"
                    className="w-full bg-[#4CB01E] text-white py-2.5 rounded-xl text-xs font-bold"
                  >
                    Save Address
                  </button>
                </form>
              )}
            </div>
          )}

          {/* SUB-VIEW 7: GST Details */}
          {subView === 'gst' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">GST Details</h2>
                <button
                  type="button"
                  onClick={() => setSubView('none')}
                  className="text-xs font-bold text-[#4CB01E]"
                >
                  Back to Profile
                </button>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Add your business details to receive B2B tax invoices with GST input credit on bulk/supermarket purchases.
              </p>

              <form onSubmit={handleSaveGst} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Registered Business Name
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Sri Amma Enterprises"
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#4CB01E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    15-Digit GSTIN
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="33AAAAA0000A1Z5"
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 uppercase focus:outline-none focus:border-[#4CB01E]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#4CB01E] hover:bg-[#3D9415] text-white font-bold py-3 rounded-xl text-sm transition-all shadow-sm active:scale-98"
                >
                  Save GST Details
                </button>
              </form>
            </div>
          )}

          {/* SUB-VIEW 8: Coupons & Rewards */}
          {subView === 'coupons' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">Available Coupons & Rewards</h2>
                <button
                  type="button"
                  onClick={() => setSubView('none')}
                  className="text-xs font-bold text-[#4CB01E]"
                >
                  Back to Profile
                </button>
              </div>

              <div className="space-y-3">
                {coupons.map((c) => (
                  <div
                    key={c.code}
                    className="border border-dashed border-emerald-300 bg-emerald-50/40 rounded-2xl p-4 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-black text-[#1E4D12] tracking-wider bg-white border border-emerald-200 px-2 py-0.5 rounded-md">
                          {c.code}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 font-semibold mt-1.5">{c.desc}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{c.expires}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyCoupon(c.code)}
                      className="inline-flex items-center gap-1 bg-[#4CB01E] hover:bg-[#3D9415] text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition-transform active:scale-95"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUB-VIEW 9: About Us */}
          {subView === 'about' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">About Sri Amma Supermarket</h2>
                <button
                  type="button"
                  onClick={() => setSubView('none')}
                  className="text-xs font-bold text-[#4CB01E]"
                >
                  Back to Profile
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs text-slate-600 leading-relaxed">
                <p className="text-sm font-bold text-slate-900">
                  Madurai’s Trusted Neighborhood Supermarket
                </p>
                <p>
                  Sri Amma Supermarket is a premier grocery and daily essentials destination in Madurai, Tamil Nadu. We specialize in farm-fresh produce, authentic regional staples, traditional millets, cold-pressed oils, and monthly provision maligai bundles.
                </p>
                <div className="pt-2 border-t border-slate-200 space-y-1.5 text-slate-700">
                  <p><strong>Head Office:</strong> 12/B, K.K. Nagar Main Road, Madurai - 625020</p>
                  <p><strong>Operating Hours:</strong> 8:00 AM – 9:30 PM (Daily)</p>
                  <p><strong>FSSAI License:</strong> 12423012000456 (Certified Food Safety)</p>
                  <p><strong>Delivery Guarantee:</strong> 30-Minute Counter-Fresh Delivery</p>
                </div>
              </div>
            </div>
          )}

          {/* SUB-VIEW 10: Account Privacy */}
          {subView === 'privacy' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">Account Privacy</h2>
                <button
                  type="button"
                  onClick={() => setSubView('none')}
                  className="text-xs font-bold text-[#4CB01E]"
                >
                  Back to Profile
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs text-slate-600 leading-relaxed">
                <p className="text-sm font-bold text-slate-900">Data Privacy & Local Storage</p>
                <p>
                  All your cart items, past orders, address book, and preferences are securely persisted in your device browser storage. Sri Amma Supermarket does not share your phone number or data with third-party telemarketers.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleClearPrivacyData}
                  className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold py-2.5 rounded-xl text-xs transition-colors"
                >
                  Clear Stored Addresses & Local Data
                </button>
              </div>
            </div>
          )}

          {/* SUB-VIEW 11: Notification Preferences */}
          {subView === 'notifications' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">Notification Preferences</h2>
                <button
                  type="button"
                  onClick={() => setSubView('none')}
                  className="text-xs font-bold text-[#4CB01E]"
                >
                  Back to Profile
                </button>
              </div>

              <div className="space-y-2.5">
                {[
                  {
                    key: 'whatsapp' as const,
                    active: notifWhatsApp,
                    label: 'WhatsApp Order Updates',
                    desc: 'Real-time rider assignment and dispatch notifications',
                  },
                  {
                    key: 'sms' as const,
                    active: notifSms,
                    label: 'SMS OTP Alerts',
                    desc: 'Security codes and bill receipts sent via SMS',
                  },
                  {
                    key: 'offers' as const,
                    active: notifOffers,
                    label: 'Weekly Maligai Offers',
                    desc: 'Exclusive Madurai discounts on monthly provisions',
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    onClick={() => handleToggleNotif(item.key)}
                    className="border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 bg-white cursor-pointer hover:border-[#4CB01E] transition-all"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">{item.label}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                    <div
                      className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                        item.active ? 'bg-[#4CB01E]' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                          item.active ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MAIN PROFILE VIEW (When subView === 'none') */}
          {subView === 'none' && (
            <div className="space-y-6">
              {/* B. User Identity Header */}
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {state.isLoggedIn ? name : 'Guest User'}
                  </h2>
                  {state.isLoggedIn && (
                    <button
                      type="button"
                      onClick={() => setSubView('edit-identity')}
                      className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
                      title="Edit personal info"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {state.isLoggedIn ? (
                  <div className="flex items-center gap-5 text-sm text-slate-500 mt-1 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span>{phone}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Cake className="w-4 h-4 text-slate-400" />
                      <span>{dob}</span>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleLogBackIn}
                    className="text-xs font-bold text-[#4CB01E] hover:underline mt-1 inline-block"
                  >
                    Log in as Vishagan
                  </button>
                )}
              </div>

              {/* C. Top 3 Rounded Square Action Cards */}
              <div className="grid grid-cols-3 gap-3 my-4">
                {/* 1. Monthly List */}
                <div
                  onClick={() => dispatch({ type: 'SET_PAGE', page: 'monthly-list' })}
                  className="border border-slate-200 rounded-2xl p-3.5 flex flex-col items-center justify-center gap-2 bg-white hover:border-[#4CB01E] cursor-pointer transition-colors shadow-2xs group"
                >
                  <div className="w-9 h-9 rounded-full bg-slate-100 group-hover:bg-emerald-50 flex items-center justify-center text-slate-700 group-hover:text-[#4CB01E] transition-colors">
                    <ClipboardList className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 text-center leading-tight">
                    Monthly List
                  </span>
                </div>

                {/* 2. Support */}
                <div
                  onClick={() => setSubView('support')}
                  className="border border-slate-200 rounded-2xl p-3.5 flex flex-col items-center justify-center gap-2 bg-white hover:border-[#4CB01E] cursor-pointer transition-colors shadow-2xs group"
                >
                  <div className="w-9 h-9 rounded-full bg-slate-100 group-hover:bg-emerald-50 flex items-center justify-center text-slate-700 group-hover:text-[#4CB01E] transition-colors">
                    <MessageSquareText className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 text-center leading-tight">
                    Support
                  </span>
                </div>

                {/* 3. Payments */}
                <div
                  onClick={() => setSubView('payments')}
                  className="border border-slate-200 rounded-2xl p-3.5 flex flex-col items-center justify-center gap-2 bg-white hover:border-[#4CB01E] cursor-pointer transition-colors shadow-2xs group"
                >
                  <div className="w-9 h-9 rounded-full bg-slate-100 group-hover:bg-emerald-50 flex items-center justify-center text-slate-700 group-hover:text-[#4CB01E] transition-colors">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 text-center leading-tight">
                    Payments
                  </span>
                </div>
              </div>

              {/* D. Language Preferences Card */}
              <div className="mb-6">
                <div className="border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between bg-white shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                      <SlidersHorizontal className="w-4 h-4" />
                    </div>
                    <span className="text-[15px] font-medium text-slate-800">
                      Language preferences
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = lang === 'en' ? 'ta' : 'en';
                      dispatch({ type: 'SET_LANG', lang: next });
                      showToast(next === 'ta' ? 'தமிழ் மொழி தேர்வு செய்யப்பட்டது' : 'Language set to English');
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {lang === 'en' ? 'English' : 'தமிழ்'}
                  </button>
                </div>
              </div>

              {/* SECTION 1: YOUR INFORMATION */}
              <div>
                <h3 className="text-xs font-bold tracking-wider uppercase text-slate-400 mb-2">
                  YOUR INFORMATION
                </h3>
                <div className="divide-y divide-slate-100">
                  {/* Your orders */}
                  <button
                    type="button"
                    onClick={() => setSubView('orders')}
                    className="w-full py-3 flex items-center justify-between hover:bg-slate-50/70 transition-colors rounded-xl px-1"
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <span className="text-[15px] font-medium text-slate-800 flex-1 ml-3.5 text-left">
                      Your orders
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </button>

                  {/* Your wishlist */}
                  <button
                    type="button"
                    onClick={() => setSubView('wishlist')}
                    className="w-full py-3 flex items-center justify-between hover:bg-slate-50/70 transition-colors rounded-xl px-1"
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                      <Heart className="w-4 h-4" />
                    </div>
                    <span className="text-[15px] font-medium text-slate-800 flex-1 ml-3.5 text-left">
                      Your wishlist ({state.wishlist.length})
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </button>

                  {/* Address book */}
                  <button
                    type="button"
                    onClick={() => setSubView('address-book')}
                    className="w-full py-3 flex items-center justify-between hover:bg-slate-50/70 transition-colors rounded-xl px-1"
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <span className="text-[15px] font-medium text-slate-800 flex-1 ml-3.5 text-left">
                      Address book
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </button>

                  {/* GST details */}
                  <button
                    type="button"
                    onClick={() => setSubView('gst')}
                    className="w-full py-3 flex items-center justify-between hover:bg-slate-50/70 transition-colors rounded-xl px-1"
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className="text-[15px] font-medium text-slate-800 flex-1 ml-3.5 text-left">
                      GST details
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </button>
                </div>
              </div>

              {/* SECTION 2: PAYMENT AND COUPONS */}
              <div>
                <h3 className="text-xs font-bold tracking-wider uppercase text-slate-400 mb-2">
                  PAYMENT AND COUPONS
                </h3>
                <div className="divide-y divide-slate-100">
                  {/* Payment settings */}
                  <button
                    type="button"
                    onClick={() => setSubView('payment-settings')}
                    className="w-full py-3 flex items-center justify-between hover:bg-slate-50/70 transition-colors rounded-xl px-1"
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <span className="text-[15px] font-medium text-slate-800 flex-1 ml-3.5 text-left">
                      Payment settings
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </button>

                  {/* Your collected rewards / Coupons */}
                  <button
                    type="button"
                    onClick={() => setSubView('coupons')}
                    className="w-full py-3 flex items-center justify-between hover:bg-slate-50/70 transition-colors rounded-xl px-1"
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                      <Percent className="w-4 h-4" />
                    </div>
                    <span className="text-[15px] font-medium text-slate-800 flex-1 ml-3.5 text-left">
                      Your collected rewards / Coupons
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </button>
                </div>
              </div>

              {/* SECTION 3: OTHER INFORMATION */}
              <div>
                <h3 className="text-xs font-bold tracking-wider uppercase text-slate-400 mb-2">
                  OTHER INFORMATION
                </h3>
                <div className="divide-y divide-slate-100">
                  {/* Share the app */}
                  <button
                    type="button"
                    onClick={handleShareApp}
                    className="w-full py-3 flex items-center justify-between hover:bg-slate-50/70 transition-colors rounded-xl px-1"
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                      <Share2 className="w-4 h-4" />
                    </div>
                    <span className="text-[15px] font-medium text-slate-800 flex-1 ml-3.5 text-left">
                      Share the app
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </button>

                  {/* About us */}
                  <button
                    type="button"
                    onClick={() => setSubView('about')}
                    className="w-full py-3 flex items-center justify-between hover:bg-slate-50/70 transition-colors rounded-xl px-1"
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                      <Info className="w-4 h-4" />
                    </div>
                    <span className="text-[15px] font-medium text-slate-800 flex-1 ml-3.5 text-left">
                      About us
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </button>

                  {/* Account privacy */}
                  <button
                    type="button"
                    onClick={() => setSubView('privacy')}
                    className="w-full py-3 flex items-center justify-between hover:bg-slate-50/70 transition-colors rounded-xl px-1"
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                      <Lock className="w-4 h-4" />
                    </div>
                    <span className="text-[15px] font-medium text-slate-800 flex-1 ml-3.5 text-left">
                      Account privacy
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </button>

                  {/* Notification preferences */}
                  <button
                    type="button"
                    onClick={() => setSubView('notifications')}
                    className="w-full py-3 flex items-center justify-between hover:bg-slate-50/70 transition-colors rounded-xl px-1"
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                      <Bell className="w-4 h-4" />
                    </div>
                    <span className="text-[15px] font-medium text-slate-800 flex-1 ml-3.5 text-left">
                      Notification preferences
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </button>

                  {/* Log out / Log back in */}
                  {state.isLoggedIn ? (
                    <button
                      type="button"
                      onClick={handleLogoutToggle}
                      className="w-full py-3 flex items-center justify-between hover:bg-slate-50/70 transition-colors rounded-xl px-1"
                    >
                      <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
                        <LogOut className="w-4 h-4" />
                      </div>
                      <span className="text-[15px] font-medium text-rose-600 flex-1 ml-3.5 text-left">
                        Log out
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleLogBackIn}
                      className="w-full py-3 flex items-center justify-between hover:bg-slate-50/70 transition-colors rounded-xl px-1"
                    >
                      <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-[#4CB01E] shrink-0">
                        <Check className="w-4 h-4" />
                      </div>
                      <span className="text-[15px] font-medium text-[#4CB01E] flex-1 ml-3.5 text-left">
                        Log back in as Vishagan
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
