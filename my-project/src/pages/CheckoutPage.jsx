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

  const [currentStep, setCurrentStep] = useState(2);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    address: '', address2: '', city: '', state: '', zipCode: '',
    country: 'India', paymentMethod: 'cod', saveInfo: false,
  });

  const [loading, setLoading]                         = useState(false);
  const [orderPlaced, setOrderPlaced]                 = useState(false);
  const [orderDetails, setOrderDetails]               = useState(null);
  const [razorpayAvailable, setRazorpayAvailable]     = useState(false);
  const [savedAddresses, setSavedAddresses]           = useState([]);
  const [addressesLoading, setAddressesLoading]       = useState(false);
  const [selectedAddressId, setSelectedAddressId]     = useState(null);
  const [showAddressForm, setShowAddressForm]         = useState(true);
  const [addressSelectionKey, setAddressSelectionKey] = useState(0);

  useEffect(() => {
    const checkRazorpay = async () => {
      try {
        const config = await paymentService.getRazorpayConfig();
        setRazorpayAvailable(config.configured || false);
      } catch { setRazorpayAvailable(true); }
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
      address: '', address2: '', city: '', state: '', zipCode: '', country: 'India'
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
          } else {
            setShowAddressForm(true);
          }
        }
      } catch {
        toast.error('Failed to load addresses');
        setShowAddressForm(true);
      } finally {
        setAddressesLoading(false);
      }
    };
    fetchAddresses();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please login to place an order');
      navigate('/login');
      return;
    }
    // ✅ FIX: Only redirect to cart if order has NOT been placed yet.
    // After placing an order, cart gets cleared — without this guard
    // the page would immediately redirect to /cart instead of showing
    // the order confirmation screen.
    if (cartItems.length === 0 && !orderPlaced) {
      toast.error('Your cart is empty');
      navigate('/cart');
      return;
    }
  }, [isAuthenticated, cartItems, navigate, orderPlaced]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 0 ? 50 : 0;
  const taxTotal = cartItems.reduce((sum, item) => sum + (item.price * (item.taxRate || 0)), 0);
  const total    = subtotal + shipping + taxTotal;

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
          unit_price: item.price,
          taxRate: item.taxRate || 0,
        })),
        shipping_cost: shipping,
        tax_amount: taxTotal,
        coupon_id: null
      };

      if (formData.paymentMethod === 'razorpay') {
        await paymentService.initializeRazorpayPayment(
          orderData,
          (result) => {
            clearCart(true);
            setOrderDetails(result.order);
            setOrderPlaced(true);
            // ✅ FIX: do NOT navigate away — show success screen here
          },
          (err) => { console.error('Payment failed:', err); setLoading(false); }
        );
      } else {
        const response = await orderService.placeOrder(orderData);
        if (response.success) {
          clearCart(true);
          setOrderDetails(response.order);
          setOrderPlaced(true);
          // ✅ FIX: do NOT auto-navigate — user sees confirmation screen
          toast.success('Order placed!');
        } else throw new Error(response.message || 'Failed to place order');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  /* ══════════════ ORDER CONFIRMED SCREEN ══════════════ */
  if (orderPlaced && orderDetails) {
    return (
      <>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');`}</style>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4"
          style={{ fontFamily: "'Inter', sans-serif" }}>
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10 text-center max-w-md w-full">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
              <CheckCircleIcon className="w-9 h-9 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Order Confirmed!</h2>
            <p className="text-sm text-gray-400 mb-6">Your order has been placed successfully.</p>
            <div className="bg-gray-50 rounded-2xl p-5 mb-6 text-left border border-gray-100">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Order Details</p>
              <p className="text-lg font-bold text-gray-900">{orderDetails.invoice_no}</p>
              <p className="text-sm text-gray-500 mt-1">
                Total: <span className="font-semibold text-gray-800">
                  {formatCurrency(orderDetails.total || orderDetails.total_amount)}
                </span>
              </p>
              <div className="flex items-center gap-2 mt-3">
                {orderDetails.payment_method === 'razorpay'
                  ? <><CreditCardIcon className="w-4 h-4 text-indigo-500" /><span className="text-xs text-gray-500">Payment Successful</span></>
                  : <><TruckIcon className="w-4 h-4 text-gray-400" /><span className="text-xs text-gray-500">Cash on Delivery</span></>
                }
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Link to="/my-orders"
                className="w-full py-3 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 transition-colors rounded-xl">
                View My Orders
              </Link>
              <Link to="/products"
                className="w-full py-3 text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors rounded-xl">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  const inputCls = "w-full px-4 py-3 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 text-gray-800 placeholder-gray-300 transition-all";
  const labelCls = "block text-xs font-medium text-gray-500 mb-1.5";

  /* ══════════════ MAIN CHECKOUT ══════════════ */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        .step-line { height: 2px; flex: 1; background: #e5e7eb; }
        .step-line.active { background: #6366f1; }
        .addr-card:hover { border-color: #a5b4fc; }
      `}</style>

      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8"
        style={{ fontFamily: "'Inter', sans-serif" }}>

        <div className="max-w-7xl mx-auto">

          {/* ── Page Title ── */}
          <h1 className="text-2xl font-bold text-gray-900 mb-8 text-center">Order Summaries</h1>

          <form onSubmit={handleSubmit}>
            <div className="flex flex-col xl:flex-row gap-6 items-start">

              {/* ══════════════════════════════
                  LEFT — Billing Form
              ══════════════════════════════ */}
              <div className="w-full xl:w-[58%] bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">

                {/* Step indicator */}
                <div className="flex items-center mb-8">
                  {[
                    { num: 1, label: 'Account' },
                    { num: 2, label: 'Shipping' },
                    { num: 3, label: 'Summary' },
                  ].map((step, i) => (
                    <React.Fragment key={step.num}>
                      <div className="flex flex-col items-center gap-1 flex-shrink-0">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          currentStep >= step.num ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {step.num}
                        </div>
                        <span className={`text-[11px] font-medium whitespace-nowrap ${
                          currentStep >= step.num ? 'text-indigo-500' : 'text-gray-400'
                        }`}>
                          {step.label}
                        </span>
                      </div>
                      {i < 2 && (
                        <div className={`step-line mx-3 mb-4 ${currentStep > step.num ? 'active' : ''}`} />
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* ── Saved Addresses ── */}
                {savedAddresses.length > 0 && !addressesLoading && (
                  <div className="mb-7">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
                      Saved Addresses
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" key={addressSelectionKey}>
                      {savedAddresses.filter(a => a.firstName && a.lastName).map((address) => {
                        const isSelected = selectedAddressId === address._id;
                        return (
                          <div
                            key={address._id}
                            onClick={() => handleAddressSelect(address)}
                            className={`addr-card relative border-2 p-4 rounded-2xl cursor-pointer transition-all ${
                              isSelected
                                ? 'border-indigo-400 bg-indigo-50'
                                : 'border-gray-200'
                            }`}
                          >
                            {/* Check mark */}
                            {isSelected && (
                              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                            {/* Default badge */}
                            {address.is_default && (
                              <span className="inline-block text-[9px] font-semibold uppercase tracking-wider bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full mb-1.5">
                                Default
                              </span>
                            )}
                            {/* Full address display */}
                            <p className="text-sm font-bold text-gray-900">
                              {address.firstName} {address.lastName}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                              {address.street}
                            </p>
                            <p className="text-xs text-gray-500">
                              {address.city}{address.state ? `, ${address.state}` : ''} {address.zipCode}
                            </p>
                            <p className="text-xs text-gray-500">
                              {address.country || 'India'}
                            </p>
                            {address.phone && (
                              <p className="text-xs text-gray-400 mt-1">{address.phone}</p>
                            )}
                            {address.email && (
                              <p className="text-xs text-gray-400">{address.email}</p>
                            )}
                          </div>
                        );
                      })}

                      {/* Add new address card */}
                      <div
                        onClick={handleNewAddress}
                        className={`addr-card border-2 border-dashed p-4 rounded-2xl cursor-pointer transition-all flex flex-col items-center justify-center gap-2 min-h-[120px] ${
                          !selectedAddressId
                            ? 'border-indigo-400 bg-indigo-50'
                            : 'border-gray-200 hover:border-indigo-200'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <p className="text-xs font-semibold text-gray-500">Add New Address</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Billing Information ── */}
                <h2 className="text-lg font-bold text-gray-900 mb-5">Billing Information</h2>

                <div className="space-y-4">

                  {/* First + Last Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>First Name</label>
                      <input type="text" name="firstName" value={formData.firstName}
                        onChange={handleChange} placeholder="Christine"
                        className={inputCls} required />
                    </div>
                    <div>
                      <label className={labelCls}>Last Name</label>
                      <input type="text" name="lastName" value={formData.lastName}
                        onChange={handleChange} placeholder="Johnson"
                        className={inputCls} required />
                    </div>
                  </div>

                  {/* Email + Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Email Address</label>
                      <input type="email" name="email" value={formData.email}
                        onChange={handleChange} placeholder="you@email.com"
                        className={inputCls} required />
                    </div>
                    <div>
                      <label className={labelCls}>Phone Number</label>
                      <input type="tel" name="phone" value={formData.phone}
                        onChange={handleChange} placeholder="+91 98765 43210"
                        className={inputCls} required />
                    </div>
                  </div>

                  {/* Address 1 + Address 2 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Address 1</label>
                      <input type="text" name="address" value={formData.address}
                        onChange={handleChange} placeholder="Street address"
                        className={inputCls} required />
                    </div>
                    <div>
                      <label className={labelCls}>Address 2 <span className="text-gray-300">(optional)</span></label>
                      <input type="text" name="address2" value={formData.address2 || ''}
                        onChange={handleChange} placeholder="Apt, suite, landmark…"
                        className={inputCls} />
                    </div>
                  </div>

                  {/* City + State + ZIP */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className={labelCls}>City</label>
                      <input type="text" name="city" value={formData.city}
                        onChange={handleChange} placeholder="Chennai"
                        className={inputCls} required />
                    </div>
                    <div>
                      <label className={labelCls}>State</label>
                      <input type="text" name="state" value={formData.state}
                        onChange={handleChange} placeholder="Tamil Nadu"
                        className={inputCls} required />
                    </div>
                    <div>
                      <label className={labelCls}>ZIP Code</label>
                      <input type="text" name="zipCode" value={formData.zipCode}
                        onChange={handleChange} placeholder="600001"
                        className={inputCls} required />
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className={labelCls}>Payment Method</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* COD */}
                      <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        formData.paymentMethod === 'cod'
                          ? 'border-indigo-400 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-200'
                      }`}>
                        <input type="radio" name="paymentMethod" value="cod"
                          checked={formData.paymentMethod === 'cod'}
                          onChange={handleChange} className="sr-only" />
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          formData.paymentMethod === 'cod' ? 'border-indigo-500' : 'border-gray-300'
                        }`}>
                          {formData.paymentMethod === 'cod' && (
                            <div className="w-2 h-2 rounded-full bg-indigo-500" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">Cash on Delivery</p>
                          <p className="text-xs text-gray-400">Pay when your order arrives</p>
                        </div>
                      </label>

                      {/* Razorpay */}
                      <label className={`flex items-center gap-3 p-4 border-2 rounded-xl transition-all ${
                        !razorpayAvailable
                          ? 'border-gray-100 opacity-40 cursor-not-allowed'
                          : formData.paymentMethod === 'razorpay'
                            ? 'border-indigo-400 bg-indigo-50 cursor-pointer'
                            : 'border-gray-200 hover:border-indigo-200 cursor-pointer'
                      }`}>
                        <input type="radio" name="paymentMethod" value="razorpay"
                          checked={formData.paymentMethod === 'razorpay'}
                          onChange={handleChange} disabled={!razorpayAvailable}
                          className="sr-only" />
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          formData.paymentMethod === 'razorpay' ? 'border-indigo-500' : 'border-gray-300'
                        }`}>
                          {formData.paymentMethod === 'razorpay' && (
                            <div className="w-2 h-2 rounded-full bg-indigo-500" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">Razorpay</p>
                          <p className="text-xs text-gray-400">
                            {razorpayAvailable ? 'UPI · Cards · Net Banking' : 'Not configured'}
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Save address checkbox */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                      formData.saveInfo ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'
                    }`}>
                      {formData.saveInfo && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <input type="checkbox" name="saveInfo" checked={formData.saveInfo}
                      onChange={handleChange} className="sr-only" />
                    <span className="text-sm text-gray-500">Save this address for future orders</span>
                  </label>
                </div>

                {/* Confirm Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-7 w-full py-4 text-sm font-semibold text-white bg-indigo-500 hover:bg-indigo-600 active:scale-[0.99] transition-all rounded-xl disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      {formData.paymentMethod === 'razorpay' ? 'Processing Payment…' : 'Placing Order…'}
                    </>
                  ) : (
                    formData.paymentMethod === 'razorpay'
                      ? `Pay ${formatCurrency(total)} Securely`
                      : 'Confirm Order'
                  )}
                </button>

                <Link to="/cart"
                  className="mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors py-2">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Cart
                </Link>
              </div>

              {/* ══════════════════════════════
                  RIGHT — Order Summary
              ══════════════════════════════ */}
              <div className="w-full xl:w-[42%] space-y-4 xl:sticky xl:top-6">

                {/* ── Price Breakdown ── */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-base font-bold text-gray-900 mb-4">Order Summary</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Product Price</span>
                      <span className="font-semibold text-gray-800">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Shipping Charge</span>
                      <span className="font-semibold text-gray-800">{formatCurrency(shipping)}</span>
                    </div>
                    {taxTotal > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Tax</span>
                        <span className="font-semibold text-gray-800">{formatCurrency(taxTotal)}</span>
                      </div>
                    )}
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-base font-bold text-gray-900">Total</span>
                      <span className="text-xl font-bold text-indigo-500">{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>

                {/* ── Cart Items ── */}
                <div className="space-y-3">
                  {cartItems.map((item, index) => (
                    <div
                      key={`${item.id}-${index}`}
                      className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 flex items-center gap-4"
                    >
                      {/* Image */}
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
                        <img
                          src={item.image || '/images/products/placeholder-product.svg'}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={e => { e.target.src = '/images/products/placeholder-product.svg'; }}
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2">
                          {item.name}
                        </p>

                        {/* Variant attributes */}
                        {item.variant && Object.keys(item.variant).filter(k =>
                          !['_id','images','stock','selling_price','tax_percentage'].includes(k)
                        ).length > 0 && (
                          <p className="text-xs text-gray-400 mt-1">
                            {Object.entries(item.variant)
                              .filter(([k]) => !['_id','images','stock','selling_price','tax_percentage'].includes(k))
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(' · ')}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-100">
                            Qty: {item.quantity}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatCurrency(item.price)} each
                          </span>
                        </div>
                      </div>

                      {/* Price */}
                      <p className="text-sm font-bold text-indigo-500 flex-shrink-0">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* ── Trust badges ── */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {[
                      { icon: '🔒', label: 'Secure Payment' },
                      { icon: '🚚', label: 'Fast Delivery' },
                      { icon: '↩️', label: 'Easy Returns' },
                    ].map(({ icon, label }) => (
                      <div key={label}>
                        <div className="text-xl mb-1">{icon}</div>
                        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CheckoutPage;