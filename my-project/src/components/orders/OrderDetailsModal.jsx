import React from 'react';
import { 
  XMarkIcon,
  TruckIcon,
  ArrowDownTrayIcon,
  MapPinIcon,
  CreditCardIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { formatCurrency } from '../../utils/format';
import OrderItem from './OrderItem';

const STATUS_CONFIG = {
  delivered:  { icon: CheckCircleIcon, color: 'text-emerald-600', bg: 'bg-emerald-50',  ring: 'ring-emerald-100', dot: 'bg-emerald-400', bar: 'bg-gradient-to-r from-emerald-300 to-emerald-500' },
  shipped:    { icon: TruckIcon,        color: 'text-sky-600',     bg: 'bg-sky-50',      ring: 'ring-sky-100',     dot: 'bg-sky-400',     bar: 'bg-gradient-to-r from-sky-300 to-sky-500' },
  processing: { icon: ClockIcon,        color: 'text-amber-600',   bg: 'bg-amber-50',    ring: 'ring-amber-100',   dot: 'bg-amber-400',   bar: 'bg-gradient-to-r from-amber-300 to-amber-400' },
  cancelled:  { icon: XCircleIcon,      color: 'text-rose-500',    bg: 'bg-rose-50',     ring: 'ring-rose-100',    dot: 'bg-rose-400',    bar: 'bg-gradient-to-r from-rose-300 to-rose-400' },
};

const DEFAULT_CONFIG = {
  icon: ClockIcon,
  color: 'text-stone-500', bg: 'bg-stone-50', ring: 'ring-stone-100', dot: 'bg-stone-300', bar: 'bg-stone-200'
};

const OrderDetailsModal = ({ order, isOpen, onClose, onTrackOrder, onDownloadInvoice }) => {
  if (!isOpen || !order) return null;

  const cfg = STATUS_CONFIG[order.status] || DEFAULT_CONFIG;
  const Icon = cfg.icon;

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden z-10">

          {/* Colored top bar */}
          <div className={`h-1 w-full ${cfg.bar}`} />

          {/* ── Header ── */}
          <div className="px-7 pt-6 pb-5 border-b border-stone-100 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl ${cfg.bg} ring-1 ${cfg.ring} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${cfg.color}`} />
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-[0.18em] text-stone-400 uppercase mb-0.5">Order Details</p>
                <h2 className="text-lg font-bold text-stone-900 tracking-tight leading-tight">{order.orderNumber}</h2>
                <p className="text-xs text-stone-400 mt-0.5">{formatDate(order.date)}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-400 hover:text-stone-600 transition-colors flex-shrink-0"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>

          {/* ── Scrollable Body ── */}
          <div className="max-h-[65vh] overflow-y-auto px-7 py-5 space-y-6">

            {/* Status strip */}
            <div className={`${cfg.bg} ring-1 ${cfg.ring} rounded-2xl px-4 py-3 flex items-center justify-between flex-wrap gap-3`}>
              <div className="flex items-center gap-2.5">
                <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                <span className={`text-sm font-semibold capitalize tracking-wide ${cfg.color}`}>{order.status}</span>
                {order.trackingNumber && (
                  <span className="text-xs text-stone-400 font-medium">· #{order.trackingNumber}</span>
                )}
              </div>
              {order.estimatedDelivery && (
                <div className="flex items-center gap-1.5 text-xs text-stone-500">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  Est. {new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </div>
              )}
            </div>

            {/* Order Items */}
            <div>
              <p className="text-[10px] font-bold tracking-[0.18em] text-stone-400 uppercase mb-3">
                Items · {order.items.length}
              </p>
              <div className="space-y-2">
                {order.items.map(item => (
                  <div key={item.id} className="flex items-center gap-4 bg-stone-50 rounded-2xl p-3 border border-stone-100">
                    <img
                      src={item.image || '/images/products/placeholder-product.svg'}
                      alt={item.name}
                      className="w-14 h-14 object-cover rounded-xl border border-stone-100 flex-shrink-0"
                      onError={e => { e.target.onerror = null; e.target.src = '/images/products/placeholder-product.svg'; }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-stone-800 truncate">{item.name}</p>
                      {item.sku && <p className="text-[11px] text-stone-400 mt-0.5">SKU: {item.sku}</p>}
                      <p className="text-xs text-stone-400 mt-0.5">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-stone-900">{formatCurrency(item.price)}</p>
                      <p className="text-[11px] text-stone-400 mt-0.5">{formatCurrency(item.price * item.quantity)} total</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Two-col: Shipping + Payment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Shipping */}
              <div>
                <p className="text-[10px] font-bold tracking-[0.18em] text-stone-400 uppercase mb-2 flex items-center gap-1.5">
                  <MapPinIcon className="w-3.5 h-3.5" /> Shipping Address
                </p>
                <div className="bg-stone-50 ring-1 ring-stone-100 rounded-2xl p-4 text-sm text-stone-700 space-y-0.5">
                  {order.shippingAddress?.name ? (
                    <>
                      <p className="font-semibold text-stone-900">{order.shippingAddress.name}</p>
                      <p className="text-stone-500 text-xs leading-relaxed">
                        {order.shippingAddress.street}, {order.shippingAddress.city},{' '}
                        {order.shippingAddress.state} {order.shippingAddress.zipCode}
                      </p>
                      <p className="text-stone-500 text-xs">{order.shippingAddress.country || 'India'}</p>
                      {order.shippingAddress.phone && (
                        <p className="text-stone-400 text-xs mt-1">{order.shippingAddress.phone}</p>
                      )}
                      {order.shippingAddress.email && (
                        <p className="text-stone-400 text-xs">{order.shippingAddress.email}</p>
                      )}
                    </>
                  ) : typeof order.shippingAddress === 'string' ? (
                    <p className="font-medium">{order.shippingAddress}</p>
                  ) : (
                    <p className="text-stone-400 text-xs">Address not available</p>
                  )}
                </div>
              </div>

              {/* Payment */}
              <div>
                <p className="text-[10px] font-bold tracking-[0.18em] text-stone-400 uppercase mb-2 flex items-center gap-1.5">
                  <CreditCardIcon className="w-3.5 h-3.5" /> Payment
                </p>
                <div className="bg-stone-50 ring-1 ring-stone-100 rounded-2xl p-4 h-[calc(100%-28px)]">
                  <p className="text-sm font-semibold text-stone-800">{order.paymentMethod}</p>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <p className="text-[10px] font-bold tracking-[0.18em] text-stone-400 uppercase mb-3">Order Summary</p>
              <div className="bg-stone-50 ring-1 ring-stone-100 rounded-2xl p-4 space-y-2.5">
                {[
                  { label: 'Subtotal', value: formatCurrency(order.subtotal) },
                  { label: 'Shipping', value: order.shipping === 0 ? 'Free' : formatCurrency(order.shipping) },
                  { label: 'Tax', value: formatCurrency(order.tax) },
                ].map(row => (
                  <div key={row.label} className="flex justify-between text-xs text-stone-500">
                    <span>{row.label}</span>
                    <span className="font-medium text-stone-700">{row.value}</span>
                  </div>
                ))}
                <div className="border-t border-stone-200 pt-2.5 flex justify-between items-center">
                  <span className="text-sm font-bold text-stone-900">Total</span>
                  <span className="text-base font-bold text-stone-900">{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="px-7 py-4 border-t border-stone-100 bg-stone-50/60 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex gap-2 flex-wrap">
              {order.trackingNumber && (
                <button
                  onClick={() => onTrackOrder(order.trackingNumber)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white text-emerald-600 text-xs font-semibold rounded-xl border border-emerald-100 hover:bg-emerald-50 transition-colors tracking-wide"
                >
                  <TruckIcon className="w-3.5 h-3.5" />
                  Track Order
                </button>
              )}
              <button
                onClick={() => onDownloadInvoice(order.id)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-stone-500 text-xs font-semibold rounded-xl border border-stone-200 hover:border-stone-300 hover:text-stone-700 transition-colors tracking-wide"
              >
                <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                Invoice
              </button>
            </div>
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 px-5 py-2 bg-stone-900 text-white text-xs font-semibold rounded-xl hover:bg-stone-700 transition-colors tracking-wide"
            >
              <XMarkIcon className="w-3.5 h-3.5" />
              Close
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;