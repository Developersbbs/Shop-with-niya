import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/format';
import CartItem from '../components/cart/CartItem';
import CartSummary from '../components/cart/CartSummary';
import LoadingSpinner from '../components/common/LoadingSpinner';
import UnauthenticatedEmptyState from '../components/common/UnauthenticatedEmptyState';
import toast from 'react-hot-toast';

const CartPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const {
    items: cartItems,
    loading,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotal,
  } = useCart();

  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    try {
      navigate('/checkout');
    } catch (error) {
      toast.error('Failed to proceed to checkout');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart();
      toast.success('Cart cleared');
    } catch (error) {
      toast.error('Failed to clear cart');
    }
  };

  const subtotal = getTotal(); // price × quantity for all items
  const shipping = subtotal > 0 ? 50 : 0; // ✅ flat ₹50 always, removed free shipping logic
  const discount = 0;

  // ✅ Tax applied ONCE per product line regardless of quantity
  // Formula: item.price * item.taxRate (not multiplied by quantity)
  // e.g. Kurti ₹500 × qty 3 + ₹50 tax = ₹1550
  const taxTotal = cartItems.reduce((sum, item) => {
    const taxAmount = item.price * (item.taxRate || 0); // tax on single unit price only
    return sum + taxAmount;
  }, 0);

  const total = subtotal + shipping - discount + taxTotal;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your cart..." className="min-h-64" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">

        {/* Page Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-10 bg-[#1a3c2e]/30" />
            <span className="text-[#1a3c2e]/40 text-sm">✦</span>
            <div className="h-px w-10 bg-[#1a3c2e]/30" />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs tracking-[0.25em] uppercase text-[#1a3c2e]/50 mb-2 font-medium">
                Your Selection
              </p>
              <h1
                className="text-[#1a3c2e] leading-tight"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 700 }}
              >
                Shopping Cart
              </h1>
              <p className="text-[#1a3c2e]/50 text-sm mt-1 tracking-wide">
                {cartItems.length > 0
                  ? `${cartItems.length} ${cartItems.length === 1 ? 'item' : 'items'} in your cart`
                  : 'Your cart is empty'}
              </p>
            </div>

            {cartItems.length > 0 && (
              <button
                onClick={handleClearCart}
                className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 text-red-500 text-xs tracking-widest uppercase hover:bg-red-50 transition-colors duration-200 self-start sm:self-auto"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear Cart
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 mt-6">
            <div className="h-px flex-1 bg-[#1a3c2e]/10" />
            <span className="text-[#1a3c2e]/20 text-lg">❧</span>
            <div className="h-px flex-1 bg-[#1a3c2e]/10" />
          </div>
        </div>

        {/* Empty States */}
        {cartItems.length === 0 ? (
          !isAuthenticated ? (
            <UnauthenticatedEmptyState type="cart" />
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-full bg-[#1a3c2e]/8 flex items-center justify-center mb-6">
                <ShoppingCartIcon className="w-9 h-9 text-[#1a3c2e]/40" />
              </div>
              <h2
                className="text-[#1a3c2e] mb-3"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '26px', fontWeight: 700 }}
              >
                Your cart is empty
              </h2>
              <p className="text-[#1a3c2e]/50 text-sm leading-relaxed max-w-xs mb-8">
                Looks like you haven't added anything yet. Explore our latest collection.
              </p>
              <Link
                to="/products"
                className="px-8 py-3 bg-[#1a3c2e] text-white text-xs tracking-widest uppercase hover:bg-[#2d5a42] transition-colors duration-300"
              >
                Browse Collection
              </Link>
            </div>
          )
        ) : (
          <div className="lg:flex gap-8 items-start">

            {/* Cart Items */}
            <div className="lg:w-2/3">
              <div className="bg-white border border-[#1a3c2e]/10 overflow-hidden">
                <div className="hidden sm:grid grid-cols-12 px-6 py-3 bg-[#1a3c2e]/5 border-b border-[#1a3c2e]/10">
                  <p className="col-span-6 text-xs tracking-widest uppercase text-[#1a3c2e]/50">Product</p>
                  <p className="col-span-2 text-xs tracking-widest uppercase text-[#1a3c2e]/50 text-center">Qty</p>
                  <p className="col-span-2 text-xs tracking-widest uppercase text-[#1a3c2e]/50 text-center">Price</p>
                  <p className="col-span-2 text-xs tracking-widest uppercase text-[#1a3c2e]/50 text-right">Total</p>
                </div>

                {cartItems.map((item, index) => (
                  <div
                    key={`${item.id}-${item.cartItemId || item._id || index}-${item.variant ? JSON.stringify(item.variant) : 'no-variant'}`}
                    className="border-b border-[#1a3c2e]/8 last:border-b-0"
                  >
                    <CartItem
                      item={item}
                      onUpdateQuantity={updateQuantity}
                      onRemove={removeFromCart}
                      loading={loading}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-5">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-[#1a3c2e]/60 hover:text-[#1a3c2e] transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Continue Shopping
                </Link>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:w-1/3 mt-8 lg:mt-0 sticky top-6">
              <div className="bg-white border border-[#1a3c2e]/10 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <p
                    className="text-[#1a3c2e]"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: 700 }}
                  >
                    Order Summary
                  </p>
                  <div className="h-px flex-1 bg-[#1a3c2e]/10" />
                </div>

                <CartSummary
                  items={cartItems}
                  subtotal={subtotal}
                  shipping={shipping}
                  discount={discount}
                  total={total}
                  taxPercentage={0}       // ✅ per-item taxRate used, not global
                  onCheckout={handleCheckout}
                  loading={isCheckingOut}
                />

                {/* ✅ Removed free shipping note, flat ₹50 always */}

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
              </div>
            </div>

          </div>
        )}
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&display=swap');`}</style>
    </div>
  );
};

export default CartPage;