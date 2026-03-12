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

const STATUS_CONFIG = {
  delivered:  { icon: CheckCircleIcon, color: 'text-emerald-700', bg: 'bg-emerald-50',  ring: 'ring-emerald-200', dot: 'bg-emerald-500', bar: 'bg-emerald-500' },
  shipped:    { icon: TruckIcon,        color: 'text-blue-700',    bg: 'bg-blue-50',     ring: 'ring-blue-200',    dot: 'bg-blue-500',    bar: 'bg-blue-500' },
  processing: { icon: ClockIcon,        color: 'text-amber-700',   bg: 'bg-amber-50',    ring: 'ring-amber-200',   dot: 'bg-amber-500',   bar: 'bg-amber-400' },
  cancelled:  { icon: XCircleIcon,      color: 'text-red-600',     bg: 'bg-red-50',      ring: 'ring-red-200',     dot: 'bg-red-500',     bar: 'bg-red-400' },
};

const DEFAULT_CONFIG = {
  icon: ClockIcon,
  color: 'text-stone-500', bg: 'bg-stone-50', ring: 'ring-stone-200', dot: 'bg-stone-400', bar: 'bg-stone-300'
};

/* ── Formal price component — lining tabular numerals, no decorative fonts ── */
const Price = ({ value, size = 'base', muted = false }) => (
  <span
    className={muted ? 'text-[#6b5e4e]' : 'text-[#1e1810]'}
    style={{
      fontFamily: "'Source Serif 4', Georgia, 'Times New Roman', serif",
      fontVariantNumeric: 'lining-nums tabular-nums',
      fontFeatureSettings: '"lnum" 1, "tnum" 1',
      fontWeight: size === 'lg' ? 700 : 600,
      fontSize: size === 'lg' ? '1.1rem' : size === 'sm' ? '0.78rem' : '0.875rem',
      letterSpacing: '0.01em',
    }}
  >
    {formatCurrency(value)}
  </span>
);

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
        className="fixed inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <div className="relative w-full max-w-2xl bg-[#faf8f4] border border-[#d4ccc0] shadow-2xl overflow-hidden z-10">

          {/* Colored top bar */}
          <div className={`h-[3px] w-full ${cfg.bar}`} />

          {/* ── Header ── */}
          <div className="px-7 pt-6 pb-5 border-b border-[#e8e0d4] bg-white flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 ${cfg.bg} ring-1 ${cfg.ring} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${cfg.color}`} />
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-[0.25em] text-[#9c8e7e] uppercase mb-0.5" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>Order Details</p>
                <h2 className="text-lg font-bold text-[#1e1810] tracking-tight" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 700 }}>{order.orderNumber}</h2>
                <p className="text-xs text-[#9c8e7e] mt-0.5" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>{formatDate(order.date)}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center bg-[#f0ece4] hover:bg-[#e4ddd2] text-[#6b5e4e] hover:text-[#2c2418] transition-colors flex-shrink-0 border border-[#d4ccc0]"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>

          {/* ── Scrollable Body ── */}
          <div className="max-h-[65vh] overflow-y-auto px-7 py-6 space-y-6">

            {/* Status strip */}
            <div className={`${cfg.bg} ring-1 ${cfg.ring} px-4 py-3 flex items-center justify-between flex-wrap gap-3`}>
              <div className="flex items-center gap-2.5">
                <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                <span className={`text-sm font-semibold capitalize tracking-wide ${cfg.color}`} style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>{order.status}</span>
                {order.trackingNumber && (
                  <span className="text-xs text-[#9c8e7e] font-medium" style={{ fontFamily: "'DM Mono', 'Courier New', monospace" }}>· #{order.trackingNumber}</span>
                )}
              </div>
              {order.estimatedDelivery && (
                <div className="flex items-center gap-1.5 text-xs text-[#6b5e4e]" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
                  <CalendarIcon className="w-3.5 h-3.5" />
                  Est. {new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </div>
              )}
            </div>

            {/* Order Items */}
            <div>
              <p className="text-[10px] font-bold tracking-[0.25em] text-[#9c8e7e] uppercase mb-3" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
                Items · {order.items.length}
              </p>
              <div className="space-y-2">
                {order.items.map(item => (
                  <div key={item.id} className="flex items-center gap-4 bg-white border border-[#e8e0d4] p-3">
                    <img
                      src={item.image || '/images/products/placeholder-product.svg'}
                      alt={item.name}
                      className="w-14 h-14 object-cover border border-[#e8e0d4] flex-shrink-0"
                      onError={e => { e.target.onerror = null; e.target.src = '/images/products/placeholder-product.svg'; }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#2c2418] truncate" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>{item.name}</p>
                      {item.sku && (
                        <p className="text-[11px] text-[#9c8e7e] mt-0.5" style={{ fontFamily: "'DM Mono', 'Courier New', monospace" }}>SKU: {item.sku}</p>
                      )}
                      <p className="text-xs text-[#9c8e7e] mt-0.5" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <Price value={item.price} />
                      <p className="block mt-0.5">
                        <Price value={item.price * item.quantity} size="sm" muted />
                        <span className="text-[10px] text-[#9c8e7e] ml-1" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>total</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Two-col: Shipping + Payment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Shipping */}
              <div>
                <p className="text-[10px] font-bold tracking-[0.25em] text-[#9c8e7e] uppercase mb-2 flex items-center gap-1.5" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
                  <MapPinIcon className="w-3.5 h-3.5" /> Shipping Address
                </p>
                <div className="bg-white border border-[#e8e0d4] p-4 text-sm text-[#4a3f32] space-y-0.5 h-[calc(100%-28px)]">
                  {order.shippingAddress?.name ? (
                    <>
                      <p className="font-bold text-[#2c2418]" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>{order.shippingAddress.name}</p>
                      <p className="text-[#7a6e62] text-xs leading-relaxed" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
                        {order.shippingAddress.street}, {order.shippingAddress.city},{' '}
                        {order.shippingAddress.state} {order.shippingAddress.zipCode}
                      </p>
                      <p className="text-[#7a6e62] text-xs" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>{order.shippingAddress.country || 'India'}</p>
                      {order.shippingAddress.phone && (
                        <p className="text-[#9c8e7e] text-xs mt-1" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>{order.shippingAddress.phone}</p>
                      )}
                    </>
                  ) : typeof order.shippingAddress === 'string' ? (
                    <p className="font-medium" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>{order.shippingAddress}</p>
                  ) : (
                    <p className="text-[#9c8e7e] text-xs" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>Address not available</p>
                  )}
                </div>
              </div>

              {/* Payment */}
              <div>
                <p className="text-[10px] font-bold tracking-[0.25em] text-[#9c8e7e] uppercase mb-2 flex items-center gap-1.5" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
                  <CreditCardIcon className="w-3.5 h-3.5" /> Payment
                </p>
                <div className="bg-white border border-[#e8e0d4] p-4 h-[calc(100%-28px)]">
                  <p className="text-sm font-semibold text-[#2c2418]" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>{order.paymentMethod}</p>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <p className="text-[10px] font-bold tracking-[0.25em] text-[#9c8e7e] uppercase mb-3" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>Order Summary</p>
              <div className="bg-white border border-[#e8e0d4]">
                {[
                  { label: 'Subtotal', value: order.subtotal },
                  { label: 'Shipping', value: order.shipping, free: order.shipping === 0 },
                  { label: 'Tax', value: order.tax },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center px-5 py-3 border-b border-[#f0ece4] last:border-0">
                    <span className="text-xs text-[#7a6e62]" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>{row.label}</span>
                    {row.free
                      ? <span className="text-xs font-semibold text-emerald-600" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>Free</span>
                      : <Price value={row.value} size="sm" muted />
                    }
                  </div>
                ))}
                <div className="flex justify-between items-center px-5 py-4 bg-[#f5f1eb]">
                  <span className="text-sm font-bold text-[#2c2418]" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>Total</span>
                  <Price value={order.total} size="lg" />
                </div>
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="px-7 py-4 border-t border-[#e8e0d4] bg-white flex items-center justify-between gap-3 flex-wrap">
            <div className="flex gap-2 flex-wrap">
              {order.trackingNumber && (
                <button
                  onClick={() => onTrackOrder(order.trackingNumber)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200 hover:bg-emerald-100 transition-colors tracking-wide"
                  style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
                >
                  <TruckIcon className="w-3.5 h-3.5" />
                  Track Order
                </button>
              )}
              <button
                onClick={() => onDownloadInvoice(order.id)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#f9f7f4] text-[#6b5e4e] text-[11px] font-semibold border border-[#d4ccc0] hover:border-[#8c7355] hover:text-[#2c2418] transition-colors tracking-wide"
                style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
              >
                <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                Invoice
              </button>
            </div>
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 px-5 py-2 bg-[#2c2418] text-white text-[11px] font-semibold hover:bg-[#3d3020] transition-colors tracking-[0.15em] uppercase"
              style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
            >
              <XMarkIcon className="w-3.5 h-3.5" />
              Close
            </button>
          </div>

        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&family=DM+Mono:wght@400;500&display=swap');
      `}</style>
    </div>
  );
};

export default OrderDetailsModal;