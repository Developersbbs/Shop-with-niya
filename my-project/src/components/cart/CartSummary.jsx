import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBagIcon, TruckIcon, TagIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '../../utils/format';

const CartSummary = ({ 
  items = [], 
  subtotal = 0, 
  shipping = 0, 
  discount = 0, 
  total = 0,
  taxPercentage = 0,
  onCheckout,
  loading = false 
}) => {
  const itemCount = items.reduce((count, item) => count + item.quantity, 0);

  const taxRate = taxPercentage / 100;

  // ✅ Tax applied ONCE per product line (not × quantity)
  // Formula: item.price × taxRate only (quantity is NOT included)
  // e.g. Kurti ₹500 × qty 3, tax 10% → tax = ₹500 × 0.10 = ₹50 (fixed, not ₹150)
  const taxTotal = items.reduce((sum, item) => {
    const rate = item.taxRate ?? taxRate;
    return sum + (item.price * rate); // ✅ no quantity here
  }, 0);

  const calculatedTotal = subtotal - discount + shipping + taxTotal;

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden">

      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-gray-100">
        <h2 className="text-base font-semibold flex items-center gap-2 text-gray-800">
          <ShoppingBagIcon className="h-5 w-5 text-blue-600" />
          Order Summary
        </h2>
      </div>

      {/* Total Summary Row */}
      <div className="flex items-center gap-4 px-5 py-4">

        {/* First item thumbnail */}
        {items[0]?.image && (
          <div className="h-14 w-14 rounded-xl overflow-hidden border border-gray-100 shrink-0">
            <img 
              src={items[0].image} 
              alt={items[0].name} 
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Item count label */}
        <div className="flex-1">
          <p className="font-bold text-gray-900 text-base">Total</p>
          <p className="text-sm text-gray-400">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </p>
        </div>

        {/* Price + Tax + Savings */}
        <div className="text-right">
          <div className="flex items-center gap-1 justify-end">
            <span className="text-xs text-gray-400 font-medium">INR</span>
            <span className="text-xl font-bold text-gray-900">
              {formatCurrency(calculatedTotal)}
            </span>
          </div>

          {taxTotal > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">
              Including {formatCurrency(taxTotal)} in taxes
            </p>
          )}

          {discount > 0 && (
            <p className="text-xs text-green-600 flex items-center justify-end gap-1 mt-0.5">
              <TagIcon className="h-3 w-3" />
              Total savings {formatCurrency(discount)}
            </p>
          )}
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="px-5 py-3 bg-gray-50 space-y-2.5 border-t border-gray-100">
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Subtotal</span>
          <span className="font-medium text-gray-800">{formatCurrency(subtotal)}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span className="flex items-center gap-1">
              <TagIcon className="h-3.5 w-3.5" />
              Discount
            </span>
            <span className="font-medium">-{formatCurrency(discount)}</span>
          </div>
        )}

        {/* ✅ Flat shipping, no free shipping label */}
        <div className="flex justify-between text-sm">
          <span className="flex items-center gap-1 text-gray-500">
            <TruckIcon className="h-3.5 w-3.5" />
            Shipping
          </span>
          <span className="font-medium text-gray-800">
            {formatCurrency(shipping)}
          </span>
        </div>

        {/* ✅ Tax row — once per product line */}
        {taxTotal > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">
              Tax {taxPercentage > 0 && `(${taxPercentage}%)`}
            </span>
            <span className="font-medium text-gray-800">
              +{formatCurrency(taxTotal)}
            </span>
          </div>
        )}

        {/* Final Total */}
        <div className="border-t border-gray-200 pt-2.5 flex justify-between font-semibold text-base">
          <span className="text-gray-800">Total</span>
          <span className="text-blue-600">{formatCurrency(calculatedTotal)}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-5 py-4 space-y-2">
        <button 
          onClick={onCheckout}
          disabled={loading || itemCount === 0}
          className="w-full bg-blue-600 text-white py-3.5 rounded-2xl hover:bg-blue-700 active:scale-95 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold text-base"
        >
          {loading ? 'Processing...' : 'Proceed to Checkout'}
        </button>

        <Link 
          to="/products" 
          className="block w-full text-center py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Continue Shopping
        </Link>
      </div>

    </div>
  );
};

export default CartSummary;