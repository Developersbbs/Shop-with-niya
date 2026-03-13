import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { MagnifyingGlassIcon, ArrowDownTrayIcon, TruckIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '../utils/format';
import LoadingSpinner from '../components/common/LoadingSpinner';
import OrderDetailsModal from '../components/orders/OrderDetailsModal';
import orderService from '../services/orderService';
import toast from 'react-hot-toast';

const STATUS_TABS = [
  { key: 'all',            label: 'All Orders' },
  { key: 'processing',     label: 'Processing' },
  { key: 'shipped',        label: 'Shipped' },
  { key: 'delivered',      label: 'Delivered' },
  { key: 'cancelled',      label: 'Cancelled' },
];

const STATUS_STYLE = {
  processing:      { color: '#D97706', bg: '#FFFBEB', dot: '#F59E0B' },
  shipped:         { color: '#0369A1', bg: '#F0F9FF', dot: '#38BDF8' },
  delivered:       { color: '#047857', bg: '#ECFDF5', dot: '#10B981' },
  cancelled:       { color: '#B91C1C', bg: '#FEF2F2', dot: '#F87171' },
  payment_pending: { color: '#6B7280', bg: '#F9FAFB', dot: '#9CA3AF' },
};

const STATUS_LABEL = {
  processing:      'Processing',
  shipped:         'Shipped',
  delivered:       'Delivered',
  cancelled:       'Cancelled',
  payment_pending: 'Payment Pending',
};

export default function MyOrdersPage() {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [orders, setOrders]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [searchQuery, setSearchQuery]     = useState('');
  const [statusFilter, setStatusFilter]   = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await orderService.getMyOrders(user.uid);
      if (response && response.length > 0) {
        const transformed = response.map(order => ({
          id:                order._id,
          orderNumber:       order.invoice_no,
          date:              order.order_time,
          status:            order.status,
          total:             order.total_amount,
          itemCount:         order.items ? order.items.reduce((s, i) => s + (i.quantity || 1), 0) : 0,
          estimatedDelivery: order.estimated_delivery,
          trackingNumber:    order.tracking_number,
          shippingAddress:   order.shipping_address || {},
          items: (order.items || []).map(item => ({
            ...item,
            id:       item._id || item.product_id,
            name:     item.product_name || item.name,
            image:    item.product_image || item.image,
            price:    item.price || item.product_price,
            quantity: item.quantity,
            color:    item.color || item.variant_color || null,
            size:     item.size  || item.variant_size  || null,
            slug:     item.slug  || item.product_slug  || item.product_id,
          })),
          paymentMethod: order.payment_method === 'cash' ? 'Cash on Delivery' : order.payment_method,
          subtotal:      order.total_amount * 0.9,
          shipping:      order.shipping_cost,
          tax:           order.total_amount * 0.1,
        }));
        setOrders(transformed);
      } else {
        setOrders([]);
      }
    } catch {
      setOrders([]);
      toast.error('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const filteredOrders = orders.filter(order => {
    const matchSearch =
      order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some(i => i.name?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleViewOrder = (order) => { setSelectedOrder(order); setShowOrderDetails(true); };
  const handleTrackOrder = async (trackingNumber) => {
    if (!trackingNumber) { toast.error('No tracking number available'); return; }
    try {
      const res = await orderService.trackOrder(trackingNumber);
      toast.success(`Order ${res.orderId} is ${res.status}`);
    } catch { toast.error('Unable to track order.'); }
  };
  const handleDownloadInvoice = async (orderId) => {
    try {
      await orderService.downloadInvoice(orderId);
      toast.success('Invoice downloaded');
    } catch { toast.error('Failed to download invoice.'); }
  };

  /* ── Not authenticated ── */
  if (!isAuthenticated) return (
    <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center max-w-sm w-full">
        <h2 className="text-xl font-semibold text-gray-900 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          Sign in to continue
        </h2>
        <p className="text-sm text-gray-400 mb-7">View and track all your orders in one place.</p>
        <Link to="/login" className="inline-block w-full py-3 bg-gray-900 text-white text-xs tracking-widest uppercase font-medium hover:bg-gray-700 transition-colors rounded-lg">
          Sign In
        </Link>
      </div>
    </div>
  );

  /* ── Loading ── */
  if (loading) return (
    <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="text-xs text-gray-400 mt-4 tracking-widest uppercase">Fetching your orders…</p>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');
        .mo-tab-active  { background:#1A1714; color:#fff; }
        .mo-tab-default { background:#fff; color:#6B7280; border:1px solid #E5E7EB; }
        .mo-tab-default:hover { border-color:#9CA3AF; color:#374151; }
        .mo-row:hover { background:#FAFAF9; }

        /* Mobile card view */
        @media (max-width: 640px) {
          .mo-thead { display: none; }
          .mo-row   { display: block; padding: 16px; border-bottom: 1px solid #F3F4F6; }
          .mo-row td { display: flex; align-items: flex-start; padding: 0; border: none; }
          .mo-cell-item    { flex-direction: column; gap: 10px; }
          .mo-cell-status  { margin-top: 8px; }
          .mo-cell-total   { margin-top: 4px; font-size: 13px; }
          .mo-cell-details { margin-top: 10px; }
          .mo-cell-details button { width: 100%; justify-content: center; }
        }
      `}</style>

      <div className="min-h-screen bg-[#F7F6F3]" style={{ fontFamily: "'Inter', sans-serif" }}>

        {/* ── Header ── */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-10 py-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
                Order History
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
              </p>
            </div>
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input
                type="text"
                placeholder="Search by order or product…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 w-64"
              />
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-10 py-8">

          {/* ── Status tabs ── */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {STATUS_TABS.map(tab => {
              const count = tab.key === 'all'
                ? orders.length
                : orders.filter(o => o.status === tab.key).length;
              return (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg tracking-wide transition-all ${
                    statusFilter === tab.key ? 'mo-tab-active' : 'mo-tab-default'
                  }`}
                >
                  {tab.label}
                  {count > 0 && (
                    <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      statusFilter === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── Empty state ── */}
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
              <div className="text-5xl mb-4">📦</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                No orders found
              </h3>
              <p className="text-sm text-gray-400 mb-7">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter.'
                  : "You haven't placed any orders yet."}
              </p>
              <Link to="/products"
                className="inline-block px-8 py-3 bg-gray-900 text-white text-xs tracking-widest uppercase rounded-lg hover:bg-gray-700 transition-colors">
                Start Shopping
              </Link>
            </div>
          ) : (

            /* ── Orders Table ── */
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full border-collapse">

                {/* Table head */}
                <thead className="mo-thead">
                  <tr className="border-b border-gray-100">
                    {['Item', 'Status', 'Total', 'Details'].map((h, i) => (
                      <th
                        key={h}
                        className="px-6 py-4 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-widest"
                        style={{ width: i === 0 ? '50%' : i === 3 ? '15%' : '17.5%' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-50">
                  {filteredOrders.map(order => {
                    const st = STATUS_STYLE[order.status] || STATUS_STYLE.payment_pending;
                    const label = STATUS_LABEL[order.status] || order.status;

                    /* one row per order — shows first item prominently, rest collapsed */
                    const firstItem  = order.items[0];
                    const extraCount = order.items.length - 1;

                    return (
                      <tr key={order.id} className="mo-row transition-colors align-middle">

                        {/* ── Item column ── */}
                        <td className="mo-cell-item px-6 py-5">
                          <div className="flex items-center gap-4">
                            {/* Image */}
                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                              {firstItem?.image ? (
                                <img
                                  src={firstItem.image}
                                  alt={firstItem.name}
                                  className="w-full h-full object-cover"
                                  onError={e => { e.target.src = '/images/products/placeholder-product.svg'; }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xl text-gray-200">📦</div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
                                {firstItem?.name || 'Product'}
                              </p>
                              <div className="flex flex-wrap gap-x-3 mt-1">
                                {firstItem?.color && (
                                  <span className="text-xs text-gray-400">Color: <span className="text-gray-600">{firstItem.color}</span></span>
                                )}
                                {firstItem?.size && (
                                  <span className="text-xs text-gray-400">Size: <span className="text-gray-600">{firstItem.size}</span></span>
                                )}
                                <span className="text-xs text-gray-400">Qty: <span className="text-gray-600">{firstItem?.quantity || 1}</span></span>
                              </div>
                              {/* Order number + date */}
                              <div className="flex flex-wrap gap-x-3 mt-1.5">
                                <span className="text-[11px] text-gray-400">#{order.orderNumber}</span>
                                <span className="text-[11px] text-gray-300">·</span>
                                <span className="text-[11px] text-gray-400">{formatDate(order.date)}</span>
                              </div>
                              {/* Extra items badge */}
                              {extraCount > 0 && (
                                <span className="inline-block mt-1.5 text-[11px] font-medium text-gray-400 bg-gray-50 border border-gray-100 rounded-full px-2 py-0.5">
                                  +{extraCount} more item{extraCount > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* ── Status column ── */}
                        <td className="mo-cell-status px-6 py-5">
                          <span
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                            style={{ color: st.color, background: st.bg }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: st.dot }} />
                            {label}
                          </span>
                          {order.status === 'shipped' && order.estimatedDelivery && (
                            <p className="text-[11px] text-gray-400 mt-1.5 pl-1">
                              Est. {formatDate(order.estimatedDelivery)}
                            </p>
                          )}
                        </td>

                        {/* ── Total column ── */}
                        <td className="mo-cell-total px-6 py-5">
                          <p className="text-sm font-bold text-gray-900">
                            {formatCurrency(order.total)}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{order.paymentMethod}</p>
                        </td>

                        {/* ── Details column ── */}
                        <td className="mo-cell-details px-6 py-5">
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => handleViewOrder(order)}
                              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                            >
                              Order Details
                            </button>
                            <button
                              onClick={() => handleDownloadInvoice(order.id)}
                              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white hover:bg-gray-50 text-gray-600 text-xs font-medium rounded-lg border border-gray-200 transition-colors whitespace-nowrap"
                            >
                              <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                              Invoice
                            </button>
                            {order.trackingNumber && (
                              <button
                                onClick={() => handleTrackOrder(order.trackingNumber)}
                                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white hover:bg-gray-50 text-gray-600 text-xs font-medium rounded-lg border border-gray-200 transition-colors whitespace-nowrap"
                              >
                                <TruckIcon className="w-3.5 h-3.5" />
                                Track
                              </button>
                            )}
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Order Details Modal ── */}
      {showOrderDetails && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          isOpen={showOrderDetails}
          onClose={() => setShowOrderDetails(false)}
          onTrackOrder={handleTrackOrder}
          onDownloadInvoice={handleDownloadInvoice}
        />
      )}
    </>
  );
}