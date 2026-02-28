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
  ArrowPathIcon,
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
    badge: 'bg-amber-50 text-amber-600 ring-1 ring-amber-200',
    bar: 'bg-gradient-to-r from-amber-300 to-amber-400',
    dot: 'bg-amber-400',
  },
  shipped: {
    icon: TruckIcon,
    badge: 'bg-sky-50 text-sky-600 ring-1 ring-sky-200',
    bar: 'bg-gradient-to-r from-sky-300 to-sky-500',
    dot: 'bg-sky-400',
  },
  delivered: {
    icon: CheckCircleIcon,
    badge: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200',
    bar: 'bg-gradient-to-r from-emerald-300 to-emerald-500',
    dot: 'bg-emerald-400',
  },
  cancelled: {
    icon: XCircleIcon,
    badge: 'bg-rose-50 text-rose-500 ring-1 ring-rose-200',
    bar: 'bg-gradient-to-r from-rose-300 to-rose-400',
    dot: 'bg-rose-400',
  },
};

const DEFAULT_CONFIG = {
  icon: ClockIcon,
  badge: 'bg-gray-100 text-gray-500 ring-1 ring-gray-200',
  bar: 'bg-gray-200',
  dot: 'bg-gray-300',
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
          itemCount: order.items ? order.items.length : 0,
          estimatedDelivery: order.estimated_delivery,
          trackingNumber: order.tracking_number,
          shippingAddress: order.shipping_address || {},
          items: (order.items || []).map(item => ({
            ...item,
            id: item._id || item.product_id,
            name: item.product_name || item.name,
            image: item.product_image || item.image,
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
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f7f5f2' }}>
      <div className="bg-white border border-gray-100 rounded-2xl shadow-xl p-12 text-center max-w-sm w-full">
        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-5">
          <ClockIcon className="w-7 h-7 text-gray-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2 tracking-tight">Sign in to continue</h2>
        <p className="text-sm text-gray-400 mb-7 leading-relaxed">View and track all your orders in one place.</p>
        <Link to="/login" className="inline-block w-full py-3 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors tracking-wide">
          Sign In
        </Link>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f7f5f2' }}>
      <div className="bg-white rounded-2xl shadow-xl p-12 text-center max-w-sm w-full">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-gray-400 mt-5 tracking-wide">Fetching your orders…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: '#f7f5f2' }}>

      {/* ── Top Header Banner ── */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 py-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            {/* <p className="text-[10px] font-semibold tracking-[0.2em] text-gray-400 uppercase mb-1.5">My Account</p> */}
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Order History</h1>
            <p className="text-xs text-gray-400 mt-1 tracking-wide">
              {orders.length} order{orders.length !== 1 ? 's' : ''} placed
            </p>
          </div>

        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-7 space-y-5">

        {/* ── Search + Filter Row ── */}
{/* ── Search + Filter Row ── */}
<div className="bg-white rounded-2xl shadow-sm border border-stone-100 px-5 py-4 flex flex-wrap gap-3 items-center justify-between">
  <div className="relative flex-1 min-w-[200px] max-w-xs">
    <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
    <input
      type="text"
      placeholder="Search orders…"
      value={searchQuery}
      onChange={e => setSearchQuery(e.target.value)}
      className="w-full pl-10 pr-4 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-stone-400 text-stone-700 placeholder-stone-300 transition"
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
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide border transition-all
            ${isActive
              ? tab.key === 'all'
                ? 'bg-stone-800 text-white border-stone-800 shadow-sm'
                : `${cfg.badge} shadow-sm scale-105`
              : 'bg-white text-stone-400 border-stone-200 hover:border-stone-300 hover:text-stone-600 hover:bg-stone-50'
            }`}
        >
          {cfg && (
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? cfg.dot : 'bg-stone-300'}`} />
          )}
          {tab.label}
          {count > 0 && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
              ${isActive && tab.key !== 'all'
                ? 'bg-white/70 text-current'
                : isActive
                  ? 'bg-stone-600 text-white'
                  : 'bg-stone-100 text-stone-400'
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
          <EmptyState
            icon={ClockIcon}
            title="No orders found"
            description={searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search or filter.'
              : "You haven't placed any orders yet."}
            actionText="Start Shopping"
            actionLink="/products"
          />
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => {
              const cfg = STATUS_CONFIG[order.status] || DEFAULT_CONFIG;
              const Icon = cfg.icon;
              return (
                <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">

                  {/* Colored accent bar */}
                  <div className={`h-[3px] w-full ${cfg.bar}`} />

                  {/* Card Header */}
                  <div className="px-6 pt-5 pb-4 flex flex-wrap items-start justify-between gap-3 border-b border-gray-50">
                    <div>
                      <p className="text-[11px] font-semibold tracking-[0.15em] text-gray-400 uppercase mb-0.5">Order</p>
                      <p className="text-sm font-bold text-gray-900 tracking-tight">{order.orderNumber}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(order.date)}</p>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cfg.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        <Icon className="w-3.5 h-3.5" />
                        <span className="capitalize">{order.status}</span>
                      </span>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900 tracking-tight">{formatCurrency(order.total)}</p>
                        <p className="text-[11px] text-gray-400 tracking-wide">{order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 border-b border-gray-50">
                    {order.items.slice(0, 3).map(item => (
                      <OrderItem key={item.id} item={item} />
                    ))}
                    {order.items.length > 3 && (
                      <div className="flex items-center justify-center border-2 border-dashed border-gray-100 rounded-xl p-4 text-xs font-medium text-gray-400 tracking-wide">
                        +{order.items.length - 3} more
                      </div>
                    )}
                  </div>

                  {/* Shipping */}
                  <div className="px-6 py-3 flex items-center gap-2.5 bg-gray-50 border-b border-gray-100">
                    <MapPinIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <p className="text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase mr-1">Ship to</p>
                    <p className="text-xs text-gray-600 truncate">
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
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-xl hover:bg-gray-700 transition-colors tracking-wide"
                      >
                        <EyeIcon className="w-3.5 h-3.5" />
                        View Details
                      </button>
                      {order.trackingNumber && (
                        <button
                          onClick={() => handleTrackOrder(order.trackingNumber)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-white text-emerald-600 text-xs font-semibold rounded-xl border border-emerald-100 hover:bg-emerald-50 transition-colors tracking-wide"
                        >
                          <TruckIcon className="w-3.5 h-3.5" />
                          Track
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => handleDownloadInvoice(order.id)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-400 text-xs font-semibold rounded-xl border border-gray-100 hover:border-gray-200 hover:text-gray-600 transition-colors tracking-wide"
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
    </div>
  );
}