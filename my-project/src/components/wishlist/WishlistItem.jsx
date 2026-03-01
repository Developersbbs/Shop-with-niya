import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrashIcon, ShoppingCartIcon, EyeIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '../../utils/format';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';

const WishlistItem = ({
  item,
  onRemove,
  loading = false,
  viewMode = 'grid',
  isSelected = false,
  onSelect
}) => {
  const { addToCart } = useCart();
  const [isRemoving, setIsRemoving] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isOutOfStock, setIsOutOfStock] = useState(false);

useEffect(() => {
  const checkStock = async () => {
    try {
      const productId = item._id || item.id;
      const token = localStorage.getItem('authToken') || localStorage.getItem('jwt_token');
      
      const res = await fetch(`http://localhost:5000/api/products/${productId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      
      const product = data?.data || data;
      
      // ✅ Your API uses these two fields
      if (product?.status === 'out_of_stock' || product?.baseStock === 0) {
        setIsOutOfStock(true);
      }
    } catch {
      // if check fails, allow adding
    }
  };
  checkStock();
}, [item._id, item.id]);

  const handleRemove = async () => {
    if (isRemoving) return;
    setIsRemoving(true);
    try {
      const productId = item._id || item.id;
      await onRemove(productId);
      toast.success('Removed from wishlist');
    } catch (error) {
      toast.error('Failed to remove item');
    } finally {
      setIsRemoving(false);
    }
  };

  const handleAddToCart = async () => {
    if (isAddingToCart || isOutOfStock) return;
    setIsAddingToCart(true);
    try {
      const productId = item._id || item.id || item.productId;
      const price = item.price || item.selling_price || 0;
      const images = item.image_url
        ? item.image_url
        : item.image
        ? [item.image]
        : [];

      await addToCart({
        _id: productId,
        name: item.name,
        selling_price: price,
        image_url: images,
        quantity: 1,
      });
      toast.success('Added to cart!');
    } catch (error) {
      console.error('Add to cart error:', error, 'Item:', item);

      // ✅ Check if backend said out of stock
      const msg = error?.response?.data?.message || '';
      if (
        msg.toLowerCase().includes('stock') ||
        msg.toLowerCase().includes('maximum') ||
        msg.toLowerCase().includes('out of stock')
      ) {
        setIsOutOfStock(true);
        toast.error(msg || 'This item is out of stock');
      } else {
        toast.error('Failed to add to cart');
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  const defaultImage = '/images/products/placeholder-product.svg';
  const productLink = `/product/${item.slug || item._id || item.id}`;

  const addToCartButtonText = isAddingToCart
    ? 'Adding...'
    : isOutOfStock
    ? 'Out of Stock'
    : 'Add to Cart';

  // ── LIST VIEW ──────────────────────────────────────────────
  if (viewMode === 'list') {
    return (
      <div className={`bg-white border transition-all ${
        isSelected ? 'border-[#1a3c2e]' : 'border-[#1a3c2e]/10'
      }`}>
        <div className="p-4 flex items-center gap-4">

          {onSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="rounded border-[#1a3c2e]/30 text-[#1a3c2e] focus:ring-[#1a3c2e] shrink-0"
            />
          )}

          <Link to={productLink} className="shrink-0">
            <img
              src={item.image || defaultImage}
              alt={item.name}
              className="w-20 h-20 object-cover"
              onError={(e) => { e.target.onerror = null; e.target.src = defaultImage; }}
              loading="lazy"
            />
          </Link>

          <div className="flex-1 min-w-0">
            <Link to={productLink}>
              <h3 className="font-medium text-[#1a3c2e] hover:text-[#2d5a42] transition-colors truncate text-sm">
                {item.name}
              </h3>
            </Link>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-base font-bold text-[#1a3c2e]">
                {formatCurrency(item.price || item.selling_price)}
              </span>
              {item.originalPrice && item.originalPrice > (item.price || item.selling_price) && (
                <>
                  <span className="text-xs text-[#1a3c2e]/40 line-through">
                    {formatCurrency(item.originalPrice)}
                  </span>
                  <span className="text-xs bg-[#1a3c2e]/8 text-[#1a3c2e] px-2 py-0.5">
                    {Math.round(((item.originalPrice - (item.price || item.selling_price)) / item.originalPrice) * 100)}% OFF
                  </span>
                </>
              )}
            </div>
            {item.addedAt && (
              <p className="text-xs text-[#1a3c2e]/40 mt-1">
                Added {new Date(item.addedAt).toLocaleDateString()}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart || loading || isOutOfStock}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs tracking-wider uppercase transition-colors disabled:cursor-not-allowed
                ${isOutOfStock
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-[#1a3c2e] text-white hover:bg-[#2d5a42] disabled:opacity-40'
                }`}
            >
              <ShoppingCartIcon className="w-3.5 h-3.5" />
              {addToCartButtonText}
            </button>
            <button
              onClick={handleRemove}
              disabled={isRemoving || loading}
              className="p-2 border border-red-200 text-red-400 hover:bg-red-50 transition-colors disabled:opacity-40"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── GRID VIEW ──────────────────────────────────────────────
  return (
    <div className={`bg-white border overflow-hidden group relative transition-all ${
      isSelected ? 'border-[#1a3c2e]' : 'border-[#1a3c2e]/10'
    }`}>

      {/* Checkbox */}
      {onSelect && (
        <div className="absolute top-2 left-2 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="rounded border-[#1a3c2e]/30 text-[#1a3c2e] focus:ring-[#1a3c2e] bg-white shadow-sm"
          />
        </div>
      )}

      {/* Image */}
      <div className="relative overflow-hidden">
        <Link to={productLink}>
          <img
            src={item.image || defaultImage}
            alt={item.name}
            className="w-full aspect-[1/1] object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { e.target.onerror = null; e.target.src = defaultImage; }}
            loading="lazy"
          />
        </Link>

        {/* Hover overlay actions */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link
            to={productLink}
            className="p-1.5 bg-white/90 backdrop-blur-sm shadow hover:bg-white transition-colors"
            aria-label="View product"
          >
            <EyeIcon className="w-3.5 h-3.5 text-[#1a3c2e]" />
          </Link>
          <button
            onClick={handleRemove}
            disabled={isRemoving || loading}
            className="p-1.5 bg-white/90 backdrop-blur-sm shadow hover:bg-red-50 transition-colors disabled:opacity-40"
            aria-label="Remove"
          >
            <TrashIcon className="w-3.5 h-3.5 text-red-400" />
          </button>
        </div>

        {/* ✅ Out of Stock overlay using isOutOfStock state */}
        {isOutOfStock && (
          <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-xs text-center py-1 tracking-wider uppercase">
            Out of Stock
          </div>
        )}
        {!isOutOfStock && item.stock > 0 && item.stock <= 5 && (
          <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-0.5 tracking-wide">
            Only {item.stock} left
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-3 sm:p-4">
        <Link to={productLink}>
          <h3 className="text-sm font-medium text-[#1a3c2e] hover:text-[#2d5a42] transition-colors line-clamp-2 mb-2 leading-snug">
            {item.name}
          </h3>
        </Link>

        {/* Price */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className="text-base font-bold text-[#1a3c2e]">
            {formatCurrency(item.price || item.selling_price)}
          </span>
          {item.originalPrice && item.originalPrice > (item.price || item.selling_price) && (
            <>
              <span className="text-xs text-[#1a3c2e]/40 line-through">
                {formatCurrency(item.originalPrice)}
              </span>
              <span className="text-xs bg-[#1a3c2e]/8 text-[#1a3c2e] px-1.5 py-0.5">
                {Math.round(((item.originalPrice - (item.price || item.selling_price)) / item.originalPrice) * 100)}% OFF
              </span>
            </>
          )}
        </div>

        {/* ✅ Buttons using isOutOfStock state */}
        <div className="flex gap-2">
          <button
            onClick={handleAddToCart}
            disabled={isAddingToCart || loading || isOutOfStock}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs tracking-wider uppercase transition-colors disabled:cursor-not-allowed
              ${isOutOfStock
                ? 'bg-gray-200 text-gray-400'
                : 'bg-[#1a3c2e] text-white hover:bg-[#2d5a42] disabled:opacity-40'
              }`}
          >
            <ShoppingCartIcon className="w-3.5 h-3.5" />
            {addToCartButtonText}
          </button>
          <button
            onClick={handleRemove}
            disabled={isRemoving || loading}
            className="p-2 border border-[#1a3c2e]/15 hover:border-red-200 hover:bg-red-50 transition-colors disabled:opacity-40"
            aria-label="Remove"
          >
            <TrashIcon className="w-3.5 h-3.5 text-[#1a3c2e]/50 hover:text-red-400" />
          </button>
        </div>

        {item.addedAt && (
          <p className="mt-2 text-xs text-[#1a3c2e]/30 text-center">
            Added {new Date(item.addedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
};

export default WishlistItem;