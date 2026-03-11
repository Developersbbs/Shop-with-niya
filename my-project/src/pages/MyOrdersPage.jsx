import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  MagnifyingGlassIcon,
  EyeIcon,
  TruckIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowDownTrayIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { formatCurrency } from '../utils/format';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import OrderItem from '../components/orders/OrderItem';
import OrderDetailsModal from '../components/orders/OrderDetailsModal';
import orderService from '../services/orderService';
import toast from 'react-hot-toast';

const STATUS_TABS = [
  { key: 'all',        label: 'All' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped',    label: 'Shipped' },
  { key: 'delivered',  label: 'Delivered' },
  { key: 'cancelled',  label: 'Cancelled' },
];

const STATUS_CONFIG = {
  processing: {
    icon: ClockIcon,
    badge: 'bg-amber-50 text-amber-600 border border-amber-200',
    bar: 'bg-gradient-to-r from-amber-300 to-amber-400',
    dot: 'bg-amber-400',
    pill: 'bg-amber-50 text-amber-600 border-amber-200',
  },
  shipped: {
    icon: TruckIcon,
    badge: 'bg-sky-50 text-sky-600 border border-sky-200',
    bar: 'bg-gradient-to-r from-sky-300 to-sky-500',
    dot: 'bg-sky-400',
    pill: 'bg-sky-50 text-sky-600 border-sky-200',
  },
  delivered: {
    icon: CheckCircleIcon,
    badge: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
    bar: 'bg-gradient-to-r from-emerald-300 to-emerald-500',
    dot: 'bg-emerald-400',
    pill: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  },
  cancelled: {
    icon: XCircleIcon,
    badge: 'bg-rose-50 text-rose-500 border border-rose-200',
    bar: 'bg-gradient-to-r from-rose-300 to-rose-400',
    dot: 'bg-rose-400',
    pill: 'bg-rose-50 text-rose-500 border-rose-200',
  },
};

const DEFAULT_CONFIG = {
  icon: ClockIcon,
  badge: 'bg-gray-100 text-gray-500 border border-gray-200',
  bar: 'bg-gray-200',
  dot: 'bg-gray-300',
  pill: 'bg-gray-100 text-gray-500 border-gray-200',
};

export default function MyOrdersPage() {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await orderService.getMyOrders(user.uid);
      if (response && response.length > 0) {
        const transformedOrders = response.map(order => ({
          id: order._id,
          orderNumber: order.invoice_no,
          date: order.order_time,
          status: order.status,
          total: order.total_amount,
          itemCount: order.items ? order.items.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0,
          estimatedDelivery: order.estimated_delivery,
          trackingNumber: order.tracking_number,
          shippingAddress: order.shipping_address || {},
          items: (order.items || []).map(item => ({
            ...item,
            id: item._id || item.product_id,
            name: item.product_name || item.name,
            image: item.variant?.images?.[0] || item.variant?.image || item.product_image || item.image,
            variant: item.variant || null, 
            price: item.price || item.product_price,
            quantity: item.quantity,
            slug: item.slug || item.product_slug || item.product_id || item.productId,
          })),
          paymentMethod: order.payment_method === 'cash' ? 'Cash on Delivery' : order.payment_method,
          subtotal: order.total_amount * 0.9,
          shipping: order.shipping_cost,
          tax: order.total_amount * 0.1,
        }));
        setOrders(transformedOrders);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
      toast.error('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const countByStatus = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some(item => item.name?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleViewOrder = (order) => { setSelectedOrder(order); setShowOrderDetails(true); };

  const handleTrackOrder = async (trackingNumber) => {
    if (!trackingNumber) { toast.error('No tracking number available'); return; }
    try {
      const response = await orderService.trackOrder(trackingNumber);
      toast.success(`Order ${response.orderId} is ${response.status}`);
    } catch { toast.error('Unable to track order.'); }
  };

  const handleDownloadInvoice = async (orderId) => {
    try {
      await orderService.downloadInvoice(orderId);
      toast.success('Invoice downloaded');
    } catch { toast.error('Failed to download invoice.'); }
  };

  if (!isAuthenticated) return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center px-4">
      <div className="bg-white border border-[#1a3c2e]/10 p-12 text-center max-w-sm w-full">
        <div className="flex items-center gap-3 justify-center mb-6">
          <div className="h-px w-10 bg-[#1a3c2e]/20" />
          <span className="text-[#1a3c2e]/30">✦</span>
          <div className="h-px w-10 bg-[#1a3c2e]/20" />
        </div>
        <div className="w-12 h-12 rounded-full bg-[#1a3c2e]/6 flex items-center justify-center mx-auto mb-5">
          <ClockIcon className="w-6 h-6 text-[#1a3c2e]/40" />
        </div>
        <h2
          className="text-[#1a3c2e] mb-2"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 700 }}
        >
          Sign in to continue
        </h2>
        <p className="text-sm text-[#1a3c2e]/40 mb-7 leading-relaxed">View and track all your orders in one place.</p>
        <Link to="/login" className="inline-block w-full py-3 bg-[#1a3c2e] text-white text-xs tracking-widest uppercase font-medium hover:bg-[#2d5a42] transition-colors">
          Sign In
        </Link>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="text-xs text-[#1a3c2e]/40 mt-4 tracking-widest uppercase">Fetching your orders…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf8f5]">

      {/* ── Header ── */}
      <div className="bg-white border-b border-[#1a3c2e]/10">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 py-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-8 bg-[#1a3c2e]/20" />
            <span className="text-[#1a3c2e]/30 text-xs">✦</span>
            <div className="h-px w-8 bg-[#1a3c2e]/20" />
          </div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs tracking-[0.25em] uppercase text-[#1a3c2e]/40 mb-1 font-medium">My Account</p>
              <h1
                className="text-[#1a3c2e] leading-tight"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 700 }}
              >
                Order History
              </h1>
              <p className="text-xs text-[#1a3c2e]/40 mt-1 tracking-wide">
                {orders.length} order{orders.length !== 1 ? 's' : ''} placed
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-5">
            <div className="h-px flex-1 bg-[#1a3c2e]/8" />
            <span className="text-[#1a3c2e]/20 text-base">❧</span>
            <div className="h-px flex-1 bg-[#1a3c2e]/8" />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-7 space-y-5">

        {/* ── Search + Filter ── */}
        <div className="bg-white border border-[#1a3c2e]/10 px-5 py-4 flex flex-wrap gap-3 items-center justify-between">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1a3c2e]/25" />
            <input
              type="text"
              placeholder="Search orders…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-[#faf8f5] border border-[#1a3c2e]/10 focus:outline-none focus:border-[#1a3c2e]/30 text-[#1a3c2e] placeholder-[#1a3c2e]/25 transition-all"
            />
          </div>

          {/* Status Pills */}
          <div className="flex flex-wrap gap-2">
            {STATUS_TABS.map(tab => {
              const isActive = statusFilter === tab.key;
              const cfg = STATUS_CONFIG[tab.key];
              const count = tab.key === 'all' ? orders.length : (countByStatus[tab.key] || 0);
              return (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium tracking-wide border transition-all
                    ${isActive
                      ? tab.key === 'all'
                        ? 'bg-[#1a3c2e] text-white border-[#1a3c2e]'
                        : `${cfg?.pill || 'bg-gray-100 text-gray-500 border-gray-200'}`
                      : 'bg-white text-[#1a3c2e]/40 border-[#1a3c2e]/10 hover:border-[#1a3c2e]/25 hover:text-[#1a3c2e]/60'
                    }`}
                >
                  {cfg && <span className={`w-1.5 h-1.5 rounded-full ${isActive ? cfg.dot : 'bg-[#1a3c2e]/20'}`} />}
                  {tab.label}
                  {count > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5
                      ${isActive && tab.key !== 'all'
                        ? 'bg-white/70 text-current rounded-full'
                        : isActive
                          ? 'bg-white/20 text-white rounded-full'
                          : 'bg-[#1a3c2e]/6 text-[#1a3c2e]/40 rounded-full'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Orders List ── */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white border border-[#1a3c2e]/10 p-16 text-center">
            <div className="w-14 h-14 rounded-full bg-[#1a3c2e]/5 flex items-center justify-center mx-auto mb-5">
              <ClockIcon className="w-7 h-7 text-[#1a3c2e]/25" />
            </div>
            <h3
              className="text-[#1a3c2e] mb-2"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: 700 }}
            >
              No orders found
            </h3>
            <p className="text-xs text-[#1a3c2e]/40 mb-7">
              {searchQuery || statusFilter !== 'all' ? 'Try adjusting your search or filter.' : "You haven't placed any orders yet."}
            </p>
            <Link to="/products" className="inline-block px-8 py-3 bg-[#1a3c2e] text-white text-xs tracking-widest uppercase hover:bg-[#2d5a42] transition-colors">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => {
              const cfg = STATUS_CONFIG[order.status] || DEFAULT_CONFIG;
              const Icon = cfg.icon;
              return (
                <div key={order.id} className="bg-white border border-[#1a3c2e]/8 overflow-hidden hover:border-[#1a3c2e]/20 transition-all">

                  {/* Accent bar */}
                  <div className={`h-[3px] w-full ${cfg.bar}`} />

                  {/* Card Header */}
                  <div className="px-6 pt-5 pb-4 flex flex-wrap items-start justify-between gap-3 border-b border-[#1a3c2e]/6">
                    <div>
                      <p className="text-[10px] font-medium tracking-[0.2em] text-[#1a3c2e]/35 uppercase mb-0.5">Order</p>
                      <p className="text-sm font-bold text-[#1a3c2e] tracking-tight">{order.orderNumber}</p>
                      <p className="text-xs text-[#1a3c2e]/40 mt-0.5">{formatDate(order.date)}</p>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium ${cfg.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        <Icon className="w-3.5 h-3.5" />
                        <span className="capitalize">{order.status}</span>
                      </span>
                      <div className="text-right">
                        <p
                          className="text-lg font-bold text-[#1a3c2e]"
                          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                        >
                          {formatCurrency(order.total)}
                        </p>
                        <p className="text-[11px] text-[#1a3c2e]/35 tracking-wide">{order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 border-b border-[#1a3c2e]/6">
                    {order.items.slice(0, 3).map(item => (
                      <OrderItem key={item.id} item={item} />
                    ))}
                    {order.items.length > 3 && (
                      <div className="flex items-center justify-center border border-dashed border-[#1a3c2e]/15 p-4 text-xs font-medium text-[#1a3c2e]/35 tracking-wide">
                        +{order.items.length - 3} more
                      </div>
                    )}
                  </div>

                  {/* Shipping */}
                  <div className="px-6 py-3 flex items-center gap-2.5 bg-[#faf8f5] border-b border-[#1a3c2e]/6">
                    <MapPinIcon className="w-3.5 h-3.5 text-[#1a3c2e]/30 flex-shrink-0" />
                    <p className="text-[10px] font-bold tracking-[0.15em] text-[#1a3c2e]/30 uppercase mr-1">Ship to</p>
                    <p className="text-xs text-[#1a3c2e]/60 truncate">
                      {order.shippingAddress?.name
                        ? `${order.shippingAddress.name} · ${order.shippingAddress.city}, ${order.shippingAddress.state}`
                        : typeof order.shippingAddress === 'string'
                          ? order.shippingAddress
                          : 'Address not available'}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => handleViewOrder(order)}
                        className="inline-flex items-center gap-2 px-5 py-2 bg-[#1a3c2e] text-white text-xs tracking-widest uppercase font-medium hover:bg-[#2d5a42] transition-colors"
                      >
                        <EyeIcon className="w-3.5 h-3.5" />
                        View Details
                      </button>
                      {order.trackingNumber && (
                        <button
                          onClick={() => handleTrackOrder(order.trackingNumber)}
                          className="inline-flex items-center gap-2 px-5 py-2 border border-[#1a3c2e]/20 text-[#1a3c2e] text-xs tracking-widest uppercase font-medium hover:bg-[#1a3c2e]/5 transition-colors"
                        >
                          <TruckIcon className="w-3.5 h-3.5" />
                          Track
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => handleDownloadInvoice(order.id)}
                      className="inline-flex items-center gap-2 px-5 py-2 border border-[#1a3c2e]/10 text-[#1a3c2e]/40 text-xs tracking-widest uppercase font-medium hover:border-[#1a3c2e]/25 hover:text-[#1a3c2e]/60 transition-colors"
                    >
                      <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                      Invoice
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showOrderDetails && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          isOpen={showOrderDetails}
          onClose={() => setShowOrderDetails(false)}
          onTrackOrder={handleTrackOrder}
          onDownloadInvoice={handleDownloadInvoice}
        />
      )}

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap');`}</style>
    </div>
  );
}