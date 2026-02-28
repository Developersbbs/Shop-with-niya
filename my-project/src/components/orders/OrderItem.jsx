import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import orderService from '../../services/orderService'; // use existing service

const OrderItem = ({ item }) => {
  const [slug, setSlug] = useState(item.slug || item.product_slug || null);

  useEffect(() => {
    if (!slug && (item.product_id || item._id)) {
      const id = item.product_id || item._id;
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/products/${id}`)
        .then(res => res.json())
        .then(data => {
          const product = data.data || data.product || data;
          if (product?.slug) setSlug(product.slug);
        })
        .catch(() => {});
    }
  }, []);

  return (
    <Link 
      to={`/product/${slug || item.product_id || item._id}`}
      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
    >
      <img
        src={item.image || item.product_image}
        alt={item.name || item.product_name}
        className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {item.name || item.product_name}
        </p>
        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
        <p className="text-sm font-semibold text-gray-900">₹{item.price}</p>
      </div>
    </Link>
  );
};

export default OrderItem;