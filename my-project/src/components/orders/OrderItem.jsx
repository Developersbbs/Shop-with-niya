import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

// ✅ Helper: pick the correct image
// Priority: variant images → product images → fallback
const getItemImage = (item) => {
  // 1. Variant has its own images array
  if (item.variant?.images?.length > 0) return item.variant.images[0];

  // 2. Variant image stored as single string
  if (item.variant?.image) return item.variant.image;

  // 3. item-level image (already resolved by backend)
  if (item.product_image) return item.product_image;
  if (item.image) return item.image;

  // 4. Fallback
  return '/images/products/placeholder-product.svg';
};

const OrderItem = ({ item }) => {
  const [slug, setSlug] = useState(item.slug || item.product_slug || null);
  const image = getItemImage(item);

  useEffect(() => {
    if (!slug && (item.product_id || item._id)) {
      const id = item.product_id || item._id;
      fetch(`${import.meta.env.VITE_API_URL}/api/products/${id}`)
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
      className="flex items-center gap-3 p-3 border border-[#1a3c2e]/8 hover:border-[#1a3c2e]/20 hover:bg-[#faf8f5] transition-all"
    >
      {/* ✅ Uses variant image if available */}
      <div className="w-14 h-14 flex-shrink-0 overflow-hidden border border-[#1a3c2e]/10 bg-[#1a3c2e]/5">
        <img
          src={image}
          alt={item.name || item.product_name}
          className="w-full h-full object-cover"
          onError={e => { e.target.onerror = null; e.target.src = '/images/products/placeholder-product.svg'; }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#1a3c2e] truncate">
          {item.name || item.product_name}
        </p>
        {/* Show variant attributes if present */}
        {item.variant && Object.keys(item.variant)
          .filter(k => !['_id', 'images', 'image', 'stock', 'selling_price', 'tax_percentage'].includes(k))
          .length > 0 && (
          <p className="text-[10px] text-[#1a3c2e]/40 mt-0.5">
            {Object.entries(item.variant)
              .filter(([k]) => !['_id', 'images', 'image', 'stock', 'selling_price', 'tax_percentage'].includes(k))
              .map(([k, v]) => `${k}: ${v}`)
              .join(', ')}
          </p>
        )}
        <p className="text-xs text-[#1a3c2e]/40">Qty: {item.quantity}</p>
        <p className="text-xs font-semibold text-[#1a3c2e] mt-0.5">₹{item.price}</p>
      </div>
    </Link>
  );
};

export default OrderItem;