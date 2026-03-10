import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/format';
import orderService from '../services/orderService';
import paymentService from '../services/paymentService';
import addressService from '../services/addressService';
import toast from 'react-hot-toast';
import { CheckCircleIcon, TruckIcon, CreditCardIcon } from '@heroicons/react/24/outline';

const CheckoutPage = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { items: cartItems, clearCart } = useCart();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    address: '', city: '', state: '', zipCode: '',
    country: 'India', sameAsBilling: true, paymentMethod: 'cod', saveInfo: false,
  });

  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [razorpayAvailable, setRazorpayAvailable] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(true);
  const [addressSelectionKey, setAddressSelectionKey] = useState(0);

  useEffect(() => {
    const checkRazorpay = async () => {
      try {
        const config = await paymentService.getRazorpayConfig();
        setRazorpayAvailable(config.configured || false);
      } catch { setRazorpayAvailable(false); }
    };
    checkRazorpay();
  }, []);

  const handleAddressSelect = (address) => {
    if (!address.firstName || !address.lastName) {
      toast.error('Outdated address format. Please add a new address.');
      return;
    }
    setFormData(prev => ({
      ...prev,
      firstName: address.firstName || '', lastName: address.lastName || '',
      email: address.email || '', phone: address.phone || '',
      address: address.street || '', city: address.city || '',
      state: address.state || '', zipCode: address.zipCode || '',
      country: address.country || 'India'
    }));
    setSelectedAddressId(address._id);
    setShowAddressForm(true);
  };

  const handleNewAddress = () => {
    setSelectedAddressId(null);
    setShowAddressForm(true);
    setAddressSelectionKey(prev => prev + 1);
    setFormData(prev => ({
      ...prev, firstName: '', lastName: '', email: '', phone: '',
      address: '', city: '', state: '', zipCode: '', country: 'India'
    }));
  };

  useEffect(() => {
    const fetchAddresses = async () => {
      if (!isAuthenticated) return;
      setAddressesLoading(true);
      try {
        const response = await addressService.getAddresses();
        if (response.success) {
          const addresses = response.data || [];
          setSavedAddresses(addresses);
          if (addresses.length > 0) {
            setShowAddressForm(true);
            const def = addresses.find(a => a.is_default);
            if (def?.firstName && def?.lastName) {
              setSelectedAddressId(def._id);
              handleAddressSelect(def);
            }
          } else { setShowAddressForm(true); }
        }
      } catch { toast.error('Failed to load addresses'); setShowAddressForm(true); }
      finally { setAddressesLoading(false); }
    };
    fetchAddresses();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) { toast.error('Please login to place an order'); navigate('/login'); return; }
    if (cartItems.length === 0) { toast.error('Your cart is empty'); navigate('/cart'); return; }
  }, [isAuthenticated, cartItems, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // ✅ Exactly matches CartPage:
  // subtotal = price × quantity for all items
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // ✅ Flat ₹50 shipping always (no free shipping threshold)
  const shipping = subtotal > 0 ? 50 : 0;

  // ✅ Tax = item.price × item.taxRate (on single unit price only, NOT × quantity)
  // Same formula as CartPage: const taxAmount = item.price * (item.taxRate || 0)
  const taxTotal = cartItems.reduce((sum, item) => {
    const taxAmount = item.price * (item.taxRate || 0); // tax on single unit price only
    return sum + taxAmount;
  }, 0);

  const total = subtotal + shipping + taxTotal;

  // ✅ Dynamic tax label from per-item taxRate
  const getTaxLabel = () => {
    const rates = [...new Set(
      cartItems.map(item => Math.round((item.taxRate || 0) * 100)).filter(r => r > 0)
    )];
    // if (rates.length === 0) return 'Tax';
    // if (rates.length === 1) return `Tax (${rates[0]}%)`;
    return 'Tax';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated || !user) { toast.error('Please login'); return; }
    if (cartItems.length === 0) { toast.error('Cart is empty'); return; }
    if (formData.saveInfo && showAddressForm && !selectedAddressId) {
      try {
        const r = await addressService.createAddress({
          type: 'Home', firstName: formData.firstName, lastName: formData.lastName,
          email: formData.email, phone: formData.phone, street: formData.address,
          city: formData.city, state: formData.state, zipCode: formData.zipCode,
          country: formData.country, is_default: false
        });
        if (r.success) {
          toast.success('Address saved');
          const res = await addressService.getAddresses();
          if (res.success) setSavedAddresses(res.data || []);
        }
      } catch { toast.error('Failed to save address, but order can still be placed'); }
    }
    setLoading(true);
    try {
      const orderData = {
        payment_method: formData.paymentMethod === 'cod' ? 'cash' : 'razorpay',
        shipping_address: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email, phone: formData.phone,
          street: formData.address, city: formData.city,
          state: formData.state, zipCode: formData.zipCode, country: formData.country
        },
        items: cartItems.map(item => ({
          product_id: item.id || item.product_id,
          variant_id: item.variant_id || null,
          quantity: item.quantity,
          unit_price: item.price
        })),
        shipping_cost: shipping,
        coupon_id: null
      };
      if (formData.paymentMethod === 'razorpay') {
        await paymentService.initializeRazorpayPayment(orderData,
          (result) => { clearCart(true); setOrderDetails(result.order); setOrderPlaced(true); setTimeout(() => navigate('/my-orders'), 3000); },
          (err) => console.error('Payment failed:', err)
        );
      } else {
        const response = await orderService.placeOrder(orderData);
        if (response.success) {
          clearCart(true); setOrderDetails(response.order); setOrderPlaced(true);
          toast.success('Order placed!');
          setTimeout(() => navigate('/my-orders'), 3000);
        } else throw new Error(response.message || 'Failed to place order');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Failed to place order');
    } finally { setLoading(false); }
  };

  // ── Order Confirmed ────────────────────────────────────────────────────────
  if (orderPlaced && orderDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#faf8f5]">
        <div className="bg-white border border-[#1a3c2e]/10 p-10 text-center max-w-md w-full">
          <div className="w-20 h-20 rounded-full bg-[#1a3c2e]/8 flex items-center justify-center mx-auto mb-6">
            <CheckCircleIcon className="w-10 h-10 text-[#1a3c2e]" />
          </div>
          <p className="text-xs tracking-[0.25em] uppercase text-[#1a3c2e]/50 mb-2 font-medium">Order Confirmed</p>
          <h2 className="text-[#1a3c2e] mb-1"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '32px', fontWeight: 700 }}>
            Thank You!
          </h2>
          <p className="text-sm text-[#1a3c2e]/50 mb-8">Your order has been placed successfully.</p>
          <div className="bg-[#1a3c2e]/5 border border-[#1a3c2e]/10 p-5 mb-6 text-left">
            <p className="text-xs tracking-widest uppercase text-[#1a3c2e]/40 mb-3">Order Details</p>
            <p className="text-lg font-bold text-[#1a3c2e]"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              {orderDetails.invoice_no}
            </p>
            <p className="text-sm text-[#1a3c2e]/60 mt-1">
              Total: <span className="font-semibold text-[#1a3c2e]">{formatCurrency(orderDetails.total)}</span>
            </p>
            <div className="flex items-center gap-2 mt-3">
              {orderDetails.payment_method === 'razorpay'
                ? <><CreditCardIcon className="w-4 h-4 text-[#1a3c2e]" /><span className="text-xs text-[#1a3c2e]/70">Payment Successful</span></>
                : <><TruckIcon className="w-4 h-4 text-[#1a3c2e]" /><span className="text-xs text-[#1a3c2e]/70">Cash on Delivery</span></>
              }
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Link to="/my-orders"
              className="w-full py-3 text-xs tracking-widest uppercase font-medium text-white bg-[#1a3c2e] hover:bg-[#2d5a42] transition-colors">
              View My Orders
            </Link>
            <Link to="/products"
              className="w-full py-3 text-xs tracking-widest uppercase font-medium text-[#1a3c2e]/60 border border-[#1a3c2e]/20 hover:bg-[#1a3c2e]/5 transition-colors">
              Continue Shopping
            </Link>
          </div>
          <p className="text-xs text-[#1a3c2e]/30 mt-5">Redirecting to orders in a few seconds…</p>
        </div>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap');`}</style>
      </div>
    );
  }

  const inputCls = "w-full px-4 py-2.5 text-sm bg-white border border-[#1a3c2e]/20 focus:outline-none focus:border-[#1a3c2e]/50 focus:ring-0 text-[#1a3c2e] placeholder-[#1a3c2e]/30 transition-colors";
  const labelCls = "block text-[10px] font-medium tracking-widest uppercase text-[#1a3c2e]/50 mb-1.5";

  return (
    <div className="min-h-screen bg-[#faf8f5]">

      {/* ── Page Header ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px w-10 bg-[#1a3c2e]/30" />
          <span className="text-[#1a3c2e]/40 text-sm">✦</span>
          <div className="h-px w-10 bg-[#1a3c2e]/30" />
        </div>
        <p className="text-xs tracking-[0.25em] uppercase text-[#1a3c2e]/50 mb-2 font-medium">Secure Checkout</p>
        <h1 className="text-[#1a3c2e] leading-tight"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 700 }}>
          Checkout
        </h1>
        <p className="text-[#1a3c2e]/50 text-sm mt-1 tracking-wide">
          {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your order
        </p>
        <div className="flex items-center gap-3 mt-6">
          <div className="h-px flex-1 bg-[#1a3c2e]/10" />
          <span className="text-[#1a3c2e]/20 text-lg">❧</span>
          <div className="h-px flex-1 bg-[#1a3c2e]/10" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <form onSubmit={handleSubmit}>
          <div className="lg:flex gap-8 items-start">

            {/* ── LEFT — Address + Payment ── */}
            <div className="lg:w-2/3 space-y-6">

              {/* Saved Addresses */}
              {savedAddresses.length > 0 && !addressesLoading && (
                <div className="bg-white border border-[#1a3c2e]/10 p-6">
                  <p className="text-[10px] tracking-widest uppercase text-[#1a3c2e]/40 mb-1">Step 1</p>
                  <h2 className="text-[#1a3c2e] mb-5"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: 700 }}>
                    Delivery Address
                  </h2>
                  {savedAddresses.some(a => !a.firstName || !a.lastName) && (
                    <div className="mb-4 flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 text-xs text-amber-700">
                      <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Some addresses use an older format. Please add a new one for the best experience.
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5" key={addressSelectionKey}>
                    {savedAddresses.map((address) => {
                      const isLegacy = !address.firstName || !address.lastName;
                      const isSelected = selectedAddressId === address._id;
                      return (
                        <div key={address._id} onClick={() => !isLegacy && handleAddressSelect(address)}
                          className={`relative border-2 p-4 transition-all ${isSelected ? 'border-[#1a3c2e] bg-[#1a3c2e]/5' : isLegacy ? 'border-[#1a3c2e]/10 opacity-50 cursor-not-allowed' : 'border-[#1a3c2e]/10 hover:border-[#1a3c2e]/30 cursor-pointer'}`}>
                          {isSelected && (
                            <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#1a3c2e] flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] tracking-widest uppercase text-[#1a3c2e]/40">{address.type}</span>
                            {address.is_default && <span className="text-[9px] px-2 py-0.5 uppercase bg-[#1a3c2e]/10 text-[#1a3c2e]/60">Default</span>}
                            {isLegacy && <span className="text-[9px] px-2 py-0.5 bg-amber-100 text-amber-700 uppercase">Legacy</span>}
                          </div>
                          {address.firstName ? (
                            <div className="text-sm space-y-0.5">
                              <p className="font-semibold text-[#1a3c2e]">{address.firstName} {address.lastName}</p>
                              <p className="text-xs text-[#1a3c2e]/50">{address.street}, {address.city}</p>
                              <p className="text-xs text-[#1a3c2e]/50">{address.state} {address.zipCode}, {address.country || 'India'}</p>
                              <p className="text-xs text-[#1a3c2e]/50 mt-1">{address.phone}</p>
                            </div>
                          ) : (
                            <p className="text-xs text-[#1a3c2e]/30">{address.address || 'Address unavailable'}</p>
                          )}
                        </div>
                      );
                    })}
                    <div onClick={handleNewAddress}
                      className={`border-2 border-dashed p-4 cursor-pointer transition-all flex items-center justify-center min-h-[120px] ${!selectedAddressId && showAddressForm ? 'border-[#1a3c2e] bg-[#1a3c2e]/5' : 'border-[#1a3c2e]/20 hover:border-[#1a3c2e]/40'}`}>
                      <div className="text-center">
                        <div className="w-10 h-10 rounded-full bg-[#1a3c2e]/8 flex items-center justify-center mx-auto mb-2">
                          <svg className="w-5 h-5 text-[#1a3c2e]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-[#1a3c2e]/70">Add New</p>
                        <p className="text-xs text-[#1a3c2e]/40">New delivery address</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[#1a3c2e]/40">
                      {selectedAddressId ? '✓ Address selected — details pre-filled below' : 'Select or add a new address'}
                    </p>
                    {selectedAddressId && (
                      <button type="button"
                        onClick={() => { setSelectedAddressId(null); setFormData(p => ({ ...p, firstName: '', lastName: '', email: '', phone: '', address: '', city: '', state: '', zipCode: '', country: 'India' })); }}
                        className="text-xs text-[#1a3c2e]/40 hover:text-[#1a3c2e] underline underline-offset-2 transition-colors">
                        Use different address
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Address Form */}
              {showAddressForm && (
                <div className="bg-white border border-[#1a3c2e]/10 p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-[10px] tracking-widest uppercase text-[#1a3c2e]/40 mb-0.5">
                        {savedAddresses.length > 0 ? 'Step 1b' : 'Step 1'}
                      </p>
                      <h2 className="text-[#1a3c2e]"
                        style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: 700 }}>
                        {selectedAddressId ? 'Confirm Address' : 'Billing & Shipping'}
                      </h2>
                    </div>
                    {savedAddresses.length > 0 && (
                      <button type="button" onClick={() => setShowAddressForm(false)}
                        className="text-xs text-[#1a3c2e]/40 hover:text-[#1a3c2e] transition-colors">Cancel</button>
                    )}
                  </div>
                  {selectedAddressId && (
                    <div className="flex items-center gap-2 mb-5 px-4 py-3 bg-[#1a3c2e]/5 border border-[#1a3c2e]/15">
                      <svg className="w-4 h-4 text-[#1a3c2e] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <p className="text-xs text-[#1a3c2e]/70">Address pre-filled — edit if needed.</p>
                    </div>
                  )}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className={labelCls}>First Name *</label><input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className={inputCls} required /></div>
                      <div><label className={labelCls}>Last Name *</label><input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className={inputCls} required /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className={labelCls}>Email *</label><input type="email" name="email" value={formData.email} onChange={handleChange} className={inputCls} required /></div>
                      <div><label className={labelCls}>Phone *</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputCls} required /></div>
                    </div>
                    <div><label className={labelCls}>Street Address *</label><input type="text" name="address" value={formData.address} onChange={handleChange} className={inputCls} required /></div>
                    <div className="grid grid-cols-3 gap-4">
                      <div><label className={labelCls}>City *</label><input type="text" name="city" value={formData.city} onChange={handleChange} className={inputCls} required /></div>
                      <div><label className={labelCls}>State *</label><input type="text" name="state" value={formData.state} onChange={handleChange} className={inputCls} required /></div>
                      <div><label className={labelCls}>ZIP *</label><input type="text" name="zipCode" value={formData.zipCode} onChange={handleChange} className={inputCls} required /></div>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 border-2 flex items-center justify-center transition-all ${formData.saveInfo ? 'border-[#1a3c2e] bg-[#1a3c2e]' : 'border-[#1a3c2e]/30 group-hover:border-[#1a3c2e]/50'}`}>
                        {formData.saveInfo && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <input type="checkbox" name="saveInfo" checked={formData.saveInfo} onChange={handleChange} className="sr-only" />
                      <span className="text-sm text-[#1a3c2e]/60">Save this address for future orders</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Payment Method */}
              <div className="bg-white border border-[#1a3c2e]/10 p-6">
                <p className="text-[10px] tracking-widest uppercase text-[#1a3c2e]/40 mb-0.5">Step 2</p>
                <h2 className="text-[#1a3c2e] mb-5"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: 700 }}>
                  Payment
                </h2>
                <div className="space-y-3">
                  <label className={`flex items-center gap-4 p-4 border-2 cursor-pointer transition-all ${formData.paymentMethod === 'cod' ? 'border-[#1a3c2e] bg-[#1a3c2e]/5' : 'border-[#1a3c2e]/10 hover:border-[#1a3c2e]/25'}`}>
                    <input type="radio" name="paymentMethod" value="cod" checked={formData.paymentMethod === 'cod'} onChange={handleChange} className="sr-only" />
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${formData.paymentMethod === 'cod' ? 'border-[#1a3c2e]' : 'border-[#1a3c2e]/30'}`}>
                      {formData.paymentMethod === 'cod' && <div className="w-2 h-2 rounded-full bg-[#1a3c2e]" />}
                    </div>
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-9 h-9 bg-[#1a3c2e]/8 flex items-center justify-center flex-shrink-0">
                        <TruckIcon className="w-5 h-5 text-[#1a3c2e]/60" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1a3c2e]">Cash on Delivery</p>
                        <p className="text-xs text-[#1a3c2e]/40">Pay when your order arrives</p>
                      </div>
                      <span className="ml-auto text-[10px] tracking-widest px-2.5 py-1 uppercase bg-[#1a3c2e]/10 text-[#1a3c2e]/60">Recommended</span>
                    </div>
                  </label>

                  <label className={`flex items-center gap-4 p-4 border-2 transition-all ${!razorpayAvailable ? 'border-[#1a3c2e]/10 opacity-50 cursor-not-allowed' : formData.paymentMethod === 'razorpay' ? 'border-[#1a3c2e] bg-[#1a3c2e]/5 cursor-pointer' : 'border-[#1a3c2e]/10 hover:border-[#1a3c2e]/25 cursor-pointer'}`}>
                    <input type="radio" name="paymentMethod" value="razorpay" checked={formData.paymentMethod === 'razorpay'} onChange={handleChange} disabled={!razorpayAvailable} className="sr-only" />
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${formData.paymentMethod === 'razorpay' ? 'border-[#1a3c2e]' : 'border-[#1a3c2e]/30'}`}>
                      {formData.paymentMethod === 'razorpay' && <div className="w-2 h-2 rounded-full bg-[#1a3c2e]" />}
                    </div>
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-9 h-9 bg-[#1a3c2e]/8 flex items-center justify-center flex-shrink-0">
                        <CreditCardIcon className="w-5 h-5 text-[#1a3c2e]/60" />
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${!razorpayAvailable ? 'text-[#1a3c2e]/30' : 'text-[#1a3c2e]'}`}>Razorpay</p>
                        <p className="text-xs text-[#1a3c2e]/40">{razorpayAvailable ? 'UPI, Cards, Net Banking' : 'Not configured'}</p>
                      </div>
                      {razorpayAvailable && <span className="ml-auto text-[10px] tracking-widest px-2.5 py-1 uppercase bg-[#1a3c2e]/10 text-[#1a3c2e]/60">Secure</span>}
                    </div>
                  </label>

                  {['Credit Card', 'PayPal'].map(method => (
                    <div key={method} className="flex items-center gap-4 p-4 border-2 border-[#1a3c2e]/8 opacity-40 cursor-not-allowed">
                      <div className="w-4 h-4 rounded-full border-2 border-[#1a3c2e]/20 flex-shrink-0" />
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-9 h-9 bg-[#1a3c2e]/5 flex items-center justify-center flex-shrink-0">
                          <CreditCardIcon className="w-5 h-5 text-[#1a3c2e]/20" />
                        </div>
                        <p className="text-sm text-[#1a3c2e]/30">{method}</p>
                        <span className="ml-auto text-[10px] tracking-widest px-2.5 py-1 uppercase bg-[#1a3c2e]/5 text-[#1a3c2e]/30">Soon</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── RIGHT — Order Summary ── */}
            <div className="lg:w-1/3 mt-8 lg:mt-0 sticky top-6">
              <div className="bg-white border border-[#1a3c2e]/10 p-6">

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                  <p className="text-[#1a3c2e]"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: 700 }}>
                    Order Summary
                  </p>
                  <div className="h-px flex-1 bg-[#1a3c2e]/10" />
                </div>

                {/* Item list */}
                <div className="space-y-4 mb-5 max-h-64 overflow-y-auto">
                  {cartItems.map((item, index) => (
                    <div key={`${item.id}-${index}`} className="flex items-center gap-3">
                      <div className="w-14 h-14 flex-shrink-0 overflow-hidden border border-[#1a3c2e]/10 bg-[#1a3c2e]/5">
                        <img
                          src={item.image || '/images/products/placeholder-product.svg'}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={e => { e.target.onerror = null; e.target.src = '/images/products/placeholder-product.svg'; }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1a3c2e] truncate">{item.name}</p>
                        {item.variant && Object.keys(item.variant).filter(k =>
                          !['_id','images','stock','selling_price','tax_percentage'].includes(k)
                        ).length > 0 && (
                          <p className="text-xs text-[#1a3c2e]/40 mt-0.5">
                            {Object.entries(item.variant)
                              .filter(([k]) => !['_id','images','stock','selling_price','tax_percentage'].includes(k))
                              .map(([k, v]) => `${k}: ${v}`).join(', ')}
                          </p>
                        )}
                        <p className="text-xs text-[#1a3c2e]/40 mt-0.5">Qty: {item.quantity}</p>
                        {/* ✅ Show per-item tax rate from taxRate (same field CartPage uses) */}
               
                      </div>
                      {/* ✅ Show (price × qty) — subtotal per line */}
                      <p className="text-sm font-semibold text-[#1a3c2e] flex-shrink-0">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t border-[#1a3c2e]/10 pt-4 space-y-2.5 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#1a3c2e]/50">Subtotal</span>
                    <span className="text-[#1a3c2e]/70 font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  {/* ✅ Flat ₹50 shipping always */}
                  <div className="flex justify-between text-sm">
                    <span className="text-[#1a3c2e]/50">Shipping</span>
                    <span className="text-[#1a3c2e]/70 font-medium">{formatCurrency(shipping)}</span>
                  </div>
                  {/* ✅ Tax: per-item taxRate on single unit price only */}
                  {taxTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#1a3c2e]/50">{getTaxLabel()}</span>
                      <span className="text-[#1a3c2e]/70 font-medium">{formatCurrency(taxTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-baseline pt-2 border-t border-[#1a3c2e]/10">
                    <span className="text-xs tracking-widest uppercase font-semibold text-[#1a3c2e]">Total</span>
                    <span className="text-[#1a3c2e] font-bold"
                      style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px' }}>
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <button type="submit" disabled={loading}
                  className="w-full py-4 text-xs tracking-widest uppercase font-medium text-white bg-[#1a3c2e] hover:bg-[#2d5a42] transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {formData.paymentMethod === 'razorpay' ? 'Processing…' : 'Placing Order…'}
                    </>
                  ) : formData.paymentMethod === 'razorpay'
                    ? `Pay ${formatCurrency(total)} Securely`
                    : `Place Order — ${formatCurrency(total)}`
                  }
                </button>

                {/* Back to cart */}
                <div className="mt-4">
                  <Link to="/cart"
                    className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-[#1a3c2e]/50 hover:text-[#1a3c2e] transition-colors w-full justify-center py-2">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Cart
                  </Link>
                </div>

                {/* Trust badges */}
                <div className="mt-6 pt-5 border-t border-[#1a3c2e]/10 grid grid-cols-3 gap-3 text-center">
                  {[
                    { icon: '🔒', label: 'Secure Payment' },
                    { icon: '🚚', label: 'Fast Delivery' },
                    { icon: '↩️', label: 'Easy Returns' },
                  ].map(({ icon, label }) => (
                    <div key={label}>
                      <div className="text-lg mb-1">{icon}</div>
                      <p className="text-[10px] tracking-wide text-[#1a3c2e]/40 uppercase">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Terms */}
                <p className="text-center text-xs text-[#1a3c2e]/30 leading-relaxed mt-4">
                  By placing your order you agree to our{' '}
                  <Link to="/terms" className="underline underline-offset-2 hover:text-[#1a3c2e]/60">Terms</Link>
                  {' '}& <Link to="/privacy" className="underline underline-offset-2 hover:text-[#1a3c2e]/60">Privacy Policy</Link>
                </p>
              </div>
            </div>

          </div>
        </form>
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap');`}</style>
    </div>
  );
};

export default CheckoutPage;