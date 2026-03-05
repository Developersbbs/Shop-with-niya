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

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 0 ? (subtotal > 500 ? 0 : 50) : 0;

  // ✅ Per-product tax calculation
  const tax = cartItems.reduce((total, item) => {
    const itemSubtotal = item.price * item.quantity;
    const itemTaxRate = (item.tax_percentage || 0) / 100;
    return total + (itemSubtotal * itemTaxRate);
  }, 0);

  const total = subtotal + shipping + tax;

  // ✅ Dynamic tax label
  const getTaxLabel = () => {
    const rates = [...new Set(cartItems.map(item => item.tax_percentage || 0).filter(r => r > 0))];
    if (rates.length === 0) return 'Tax';
    if (rates.length === 1) return `Tax (${rates[0]}%)`;
    return 'Tax (mixed rates)';
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

  if (orderPlaced && orderDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#f7f5f0' }}>
        <div className="bg-white rounded-3xl shadow-xl p-10 text-center max-w-md w-full border border-gray-100">
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
            <CheckCircleIcon className="w-10 h-10 text-green-500" />
          </div>
          <p className="text-xs font-semibold tracking-[0.2em] text-gray-400 uppercase mb-2">Order Confirmed</p>
          <h2 className="text-3xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Georgia, serif' }}>Thank You!</h2>
          <p className="text-sm text-gray-500 mb-8">Your order has been placed successfully.</p>
          <div className="bg-gray-50 rounded-2xl p-5 mb-6 text-left">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Order Details</p>
            <p className="text-lg font-bold text-gray-900">{orderDetails.invoice_no}</p>
            <p className="text-sm text-gray-500 mt-1">Total: <span className="font-semibold text-gray-800">{formatCurrency(orderDetails.total)}</span></p>
            <div className="flex items-center gap-2 mt-3">
              {orderDetails.payment_method === 'razorpay'
                ? <><CreditCardIcon className="w-4 h-4 text-green-500" /><span className="text-xs text-green-600 font-medium">Payment Successful</span></>
                : <><TruckIcon className="w-4 h-4 text-blue-500" /><span className="text-xs text-blue-600 font-medium">Cash on Delivery</span></>
              }
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Link to="/my-orders" className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all" style={{ background: '#1a3c34' }}>
              View My Orders
            </Link>
            <Link to="/products" className="w-full py-3 rounded-xl text-sm font-semibold text-gray-700 border border-gray-200 hover:bg-gray-50 transition-all">
              Continue Shopping
            </Link>
          </div>
          <p className="text-xs text-gray-400 mt-5">Redirecting to orders in a few seconds…</p>
        </div>
      </div>
    );
  }

  const inputCls = "w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 focus:ring-0 text-gray-800 placeholder-gray-300 transition-colors";
  const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5";

  return (
    <div className="min-h-screen" style={{ background: '#f7f5f0', fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <div className="max-w-screen-xl mx-auto px-4 sm:px-8 pt-10 pb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-px w-8 bg-gray-400" />
          <span className="text-[10px] font-bold tracking-[0.25em] text-gray-400 uppercase">Secure Checkout</span>
          <div className="h-px w-8 bg-gray-400" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>Checkout</h1>
        <p className="text-sm text-gray-400 mt-1">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your order</p>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-8 pb-16">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col lg:flex-row gap-8 items-start">

            {/* LEFT — Address + Payment */}
            <div className="flex-1 min-w-0 space-y-6">

              {savedAddresses.length > 0 && !addressesLoading && (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                  <p className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-1">Step 1</p>
                  <h2 className="text-xl font-bold text-gray-900 mb-5" style={{ fontFamily: 'Georgia, serif' }}>Delivery Address</h2>
                  {savedAddresses.some(a => !a.firstName || !a.lastName) && (
                    <div className="mb-4 flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
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
                          className={`relative rounded-2xl border-2 p-4 transition-all ${isSelected ? 'border-gray-800 bg-gray-50' : isLegacy ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed' : 'border-gray-100 hover:border-gray-300 cursor-pointer'}`}>
                          {isSelected && (
                            <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#1a3c34' }}>
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">{address.type}</span>
                            {address.is_default && <span className="text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full uppercase" style={{ background: '#e8f5e9', color: '#2e7d32' }}>Default</span>}
                            {isLegacy && <span className="text-[9px] font-bold px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full uppercase">Legacy</span>}
                          </div>
                          {address.firstName ? (
                            <div className="text-sm text-gray-700 space-y-0.5">
                              <p className="font-semibold text-gray-900">{address.firstName} {address.lastName}</p>
                              <p className="text-xs text-gray-500">{address.street}, {address.city}</p>
                              <p className="text-xs text-gray-500">{address.state} {address.zipCode}, {address.country || 'India'}</p>
                              <p className="text-xs text-gray-500 mt-1">{address.phone}</p>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400">{address.address || 'Address unavailable'}</p>
                          )}
                        </div>
                      );
                    })}
                    <div onClick={handleNewAddress}
                      className={`rounded-2xl border-2 border-dashed p-4 cursor-pointer transition-all flex items-center justify-center min-h-[120px] ${!selectedAddressId && showAddressForm ? 'border-gray-800 bg-gray-50' : 'border-gray-200 hover:border-gray-400'}`}>
                      <div className="text-center">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
                          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <p className="text-sm font-semibold text-gray-700">Add New</p>
                        <p className="text-xs text-gray-400">New delivery address</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">{selectedAddressId ? '✓ Address selected — details pre-filled below' : 'Select or add a new address'}</p>
                    {selectedAddressId && (
                      <button type="button" onClick={() => { setSelectedAddressId(null); setFormData(p => ({ ...p, firstName: '', lastName: '', email: '', phone: '', address: '', city: '', state: '', zipCode: '', country: 'India' })); }}
                        className="text-xs font-semibold text-gray-500 hover:text-gray-800 underline underline-offset-2 transition-colors">
                        Use different address
                      </button>
                    )}
                  </div>
                </div>
              )}

              {showAddressForm && (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-0.5">{savedAddresses.length > 0 ? 'Step 1b' : 'Step 1'}</p>
                      <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>{selectedAddressId ? 'Confirm Address' : 'Billing & Shipping'}</h2>
                    </div>
                    {savedAddresses.length > 0 && (
                      <button type="button" onClick={() => setShowAddressForm(false)} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Cancel</button>
                    )}
                  </div>
                  {selectedAddressId && (
                    <div className="flex items-center gap-2 mb-5 px-4 py-3 bg-green-50 border border-green-100 rounded-xl">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <p className="text-xs text-green-700 font-medium">Address pre-filled — edit if needed.</p>
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
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${formData.saveInfo ? 'border-gray-800 bg-gray-800' : 'border-gray-300 group-hover:border-gray-400'}`}>
                        {formData.saveInfo && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <input type="checkbox" name="saveInfo" checked={formData.saveInfo} onChange={handleChange} className="sr-only" />
                      <span className="text-sm text-gray-600">Save this address for future orders</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Payment Method */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                <p className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-0.5">Step 2</p>
                <h2 className="text-xl font-bold text-gray-900 mb-5" style={{ fontFamily: 'Georgia, serif' }}>Payment</h2>
                <div className="space-y-3">
                  <label className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${formData.paymentMethod === 'cod' ? 'border-gray-800 bg-gray-50' : 'border-gray-100 hover:border-gray-200'}`}>
                    <input type="radio" name="paymentMethod" value="cod" checked={formData.paymentMethod === 'cod'} onChange={handleChange} className="sr-only" />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${formData.paymentMethod === 'cod' ? 'border-gray-800' : 'border-gray-300'}`}>
                      {formData.paymentMethod === 'cod' && <div className="w-2.5 h-2.5 rounded-full bg-gray-800" />}
                    </div>
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0"><TruckIcon className="w-5 h-5 text-green-600" /></div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Cash on Delivery</p>
                        <p className="text-xs text-gray-400">Pay when your order arrives</p>
                      </div>
                      <span className="ml-auto text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full uppercase" style={{ background: '#e8f5e9', color: '#2e7d32' }}>Recommended</span>
                    </div>
                  </label>

                  <label className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${!razorpayAvailable ? 'border-gray-100 opacity-50 cursor-not-allowed' : formData.paymentMethod === 'razorpay' ? 'border-gray-800 bg-gray-50 cursor-pointer' : 'border-gray-100 hover:border-gray-200 cursor-pointer'}`}>
                    <input type="radio" name="paymentMethod" value="razorpay" checked={formData.paymentMethod === 'razorpay'} onChange={handleChange} disabled={!razorpayAvailable} className="sr-only" />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${formData.paymentMethod === 'razorpay' ? 'border-gray-800' : 'border-gray-300'}`}>
                      {formData.paymentMethod === 'razorpay' && <div className="w-2.5 h-2.5 rounded-full bg-gray-800" />}
                    </div>
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0"><CreditCardIcon className="w-5 h-5 text-blue-600" /></div>
                      <div>
                        <p className={`text-sm font-semibold ${!razorpayAvailable ? 'text-gray-400' : 'text-gray-900'}`}>Razorpay</p>
                        <p className="text-xs text-gray-400">{razorpayAvailable ? 'UPI, Cards, Net Banking' : 'Not configured'}</p>
                      </div>
                      {razorpayAvailable && <span className="ml-auto text-[10px] font-bold tracking-wider px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full uppercase">Secure</span>}
                    </div>
                  </label>

                  {['Credit Card', 'PayPal'].map(method => (
                    <div key={method} className="flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100 opacity-40 cursor-not-allowed">
                      <div className="w-5 h-5 rounded-full border-2 border-gray-200 flex-shrink-0" />
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0"><CreditCardIcon className="w-5 h-5 text-gray-300" /></div>
                        <p className="text-sm font-medium text-gray-400">{method}</p>
                        <span className="ml-auto text-[10px] font-bold tracking-wider px-2.5 py-1 bg-gray-100 text-gray-400 rounded-full uppercase">Soon</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT — Order Summary */}
            <div className="w-full lg:w-96 flex-shrink-0 sticky top-6">
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 pt-6 pb-4 border-b border-gray-50">
                  <p className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-1">Your Selection</p>
                  <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>Order Summary</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</p>
                </div>

                <div className="px-6 py-4 space-y-4 max-h-72 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
                        <img src={item.image || '/images/products/placeholder-product.svg'} alt={item.name}
                          className="w-full h-full object-cover"
                          onError={e => { e.target.onerror = null; e.target.src = '/images/products/placeholder-product.svg'; }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity}</p>
                        {/* ✅ Show per-item tax rate if set */}
                        {item.tax_percentage > 0 && (
                          <p className="text-xs text-yellow-600 mt-0.5">Tax: {item.tax_percentage}%</p>
                        )}
                      </div>
                      <p className="text-sm font-bold text-gray-900 flex-shrink-0">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>

                <div className="px-6 py-4 border-t border-gray-50 space-y-3">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Subtotal</span>
                    <span className="font-medium text-gray-700">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Shipping</span>
                    <span className={`font-semibold ${shipping === 0 ? 'text-green-600' : 'text-gray-700'}`}>
                      {shipping === 0 ? 'Free' : formatCurrency(shipping)}
                    </span>
                  </div>
                  {/* ✅ Dynamic tax label + hide if zero */}
                  {tax > 0 && (
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>{getTaxLabel()}</span>
                      <span className="font-medium text-gray-700">{formatCurrency(tax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <span className="text-base font-bold text-gray-900">Total</span>
                    <span className="text-2xl font-black text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>{formatCurrency(total)}</span>
                  </div>
                </div>

                <div className="px-6 pb-6 space-y-3">
                  <button type="submit" disabled={loading}
                    className="w-full py-4 rounded-2xl text-sm font-bold tracking-wide text-white transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{ background: '#1a3c34' }}>
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

                  <Link to="/cart" className="w-full py-3 rounded-2xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Cart
                  </Link>

                  {shipping === 0 && <p className="text-center text-xs text-green-600 font-medium">🎉 You qualify for free shipping!</p>}

                  <p className="text-center text-xs text-gray-400 leading-relaxed">
                    By placing your order you agree to our{' '}
                    <Link to="/terms" className="underline underline-offset-2 hover:text-gray-600">Terms</Link> &{' '}
                    <Link to="/privacy" className="underline underline-offset-2 hover:text-gray-600">Privacy Policy</Link>
                  </p>
                </div>
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutPage;