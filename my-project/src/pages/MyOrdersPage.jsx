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
  { key: 'all',        label: 'All Orders' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped',    label: 'Shipped' },
  { key: 'delivered',  label: 'Delivered' },
  { key: 'cancelled',  label: 'Cancelled' },
];

const STATUS_COLOR = {
  processing:      'text-amber-500',
  shipped:         'text-sky-500',
  delivered:       'text-emerald-500',
  cancelled:       'text-rose-500',
  payment_pending: 'text-gray-400',
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
          itemCount:         order.items
            ? order.items.reduce((s, i) => s + (i.quantity || 1), 0)
            : 0,
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

  const handleViewOrder   = (order) => { setSelectedOrder(order); setShowOrderDetails(true); };
  const handleTrackOrder  = async (trackingNumber) => {
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center max-w-sm w-full">
        <h2 className="text-xl font-bold text-gray-900 mb-2"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          Sign in to continue
        </h2>
        <p className="text-sm text-gray-400 mb-7">View and track all your orders in one place.</p>
        <Link to="/login"
          className="inline-block w-full py-3 bg-gray-900 text-white text-xs tracking-widest uppercase font-medium hover:bg-gray-800 transition-colors rounded-xl">
          Sign In
        </Link>
      </div>
    </div>
  );

  /* ── Loading ── */
  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
        .order-card { transition: box-shadow 0.2s ease; }
        .order-card:hover { box-shadow: 0 4px 24px rgba(0,0,0,0.07); }
      `}</style>

      <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Inter', sans-serif" }}>

        {/* ── Page Header ── */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-3xl mx-auto px-5 sm:px-8 py-6 flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Your Orders
            </h1>
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input
                type="text"
                placeholder="Search orders…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 w-56"
              />
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-7">

          {/* ── Status tabs ── */}
          <div className="flex gap-1 mb-6 flex-wrap">
            {STATUS_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                  statusFilter === tab.key
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Empty state ── */}
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-sm">
              <div className="text-5xl mb-4">📦</div>
              <h3 className="text-lg font-bold text-gray-800 mb-2"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                No orders found
              </h3>
              <p className="text-sm text-gray-400 mb-7">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter.'
                  : "You haven't placed any orders yet."}
              </p>
              <Link to="/products"
                className="inline-block px-8 py-3 bg-gray-900 text-white text-xs tracking-widest uppercase rounded-xl hover:bg-gray-800 transition-colors">
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredOrders.map(order => (
                <div key={order.id} className="order-card bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">

                  {/* ══ Order meta header row ══ */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-gray-100">
                    {[
                      { label: 'Order Number', value: `#${order.orderNumber}` },
                      { label: 'Order Date',   value: formatDate(order.date) },
                      {
                        label: 'Delivery Date',
                        value: order.estimatedDelivery
                          ? formatDate(order.estimatedDelivery)
                          : '—'
                      },
                      {
                        label: 'Ship To',
                        value: order.shippingAddress?.city
                          ? `${order.shippingAddress.city}, ${order.shippingAddress.state}, India`
                          : typeof order.shippingAddress === 'string'
                            ? order.shippingAddress
                            : '—'
                      },
                    ].map((col, i, arr) => (
                      <div
                        key={col.label}
                        className={`px-5 py-3.5 ${i < arr.length - 1 ? 'border-r border-gray-100' : ''}`}
                      >
                        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">
                          {col.label}
                        </p>
                        <p className="text-sm font-semibold text-gray-800 truncate">{col.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* ══ Items ══ */}
                  <div className="divide-y divide-gray-50">
                    {order.items.length === 0 ? (
                      <div className="px-6 py-8 text-center text-sm text-gray-300">
                        No items found for this order.
                      </div>
                    ) : order.items.map((item, idx) => (
                      <div key={item.id || idx} className="px-5 py-4 flex items-center gap-4">

                        {/* Image */}
                        <div className="w-[72px] h-[72px] rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={e => { e.target.src = '/images/products/placeholder-product.svg'; }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl text-gray-200">📦</div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2">
                            {item.name || 'Product'}
                          </p>
                          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5">
                            {item.color && (
                              <span className="text-xs text-gray-400">
                                Color : <span className="text-gray-600">{item.color}</span>
                              </span>
                            )}
                            {item.size && (
                              <span className="text-xs text-gray-400">
                                Size : <span className="text-gray-600">{item.size}</span>
                              </span>
                            )}
                            {!item.color && !item.size && (
                              <span className="text-xs text-gray-400">
                                Qty : <span className="text-gray-600">{item.quantity || 1}</span>
                              </span>
                            )}
                          </div>
                          {/* Status under name */}
                          <div className="mt-1.5 flex items-center gap-3">
                            <span className={`text-xs font-semibold ${STATUS_COLOR[order.status] || 'text-gray-400'}`}>
                              {STATUS_LABEL[order.status] || order.status}
                            </span>
                            {/* Rate Now button */}
                            {order.status === 'delivered' && (
                              <button className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-600 font-medium transition-colors">
                                <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                </svg>
                                Rate Now
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Price */}
                        <p className="text-sm font-bold text-gray-900 flex-shrink-0"
                          style={{ fontFamily: "'Inter', sans-serif" }}>
                          {formatCurrency((item.price || 0) * (item.quantity || 1))}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* ══ Footer ══ */}
                  <div className="px-5 py-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 text-sm text-gray-700">
                      <span className="font-medium text-gray-500">Total Amount :</span>
                      <span className="font-bold text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>
                        {formatCurrency(order.total)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {order.trackingNumber && (
                        <button
                          onClick={() => handleTrackOrder(order.trackingNumber)}
                          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          <TruckIcon className="w-4 h-4" />
                          Track Order
                        </button>
                      )}
                      <button
                        onClick={() => handleDownloadInvoice(order.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-indigo-500 hover:text-indigo-600 transition-colors"
                      >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        Download Invoice
                      </button>
                    </div>
                  </div>

                </div>
              ))}
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