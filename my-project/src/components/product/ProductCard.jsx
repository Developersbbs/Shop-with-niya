import React, { useState, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import toast from 'react-hot-toast';
import LazyImage from '../common/LazyImage';

const ProductCard = memo(({ product, viewMode = 'grid' }) => {
  const { addToCart, isInCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const navigate = useNavigate();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [imgHovered, setImgHovered] = useState(false);

  const productInWishlist = isInWishlist(product._id);
  const productInCart = isInCart(product._id);

  const {
    _id, name, selling_price, price, image_url, averageRating,
    numReviews, salePrice, slug, product_variants, product_structure,
    parentProductId: originalParentProductId, isVariant, _isVariant,
    _variantData, _originalProductId,
    sku, stock, status, originalSlug, baseStock,
  } = product;

  const isOutOfStock =
    status === 'out_of_stock' ||
    (baseStock !== undefined && baseStock <= 0 && !product_variants?.length) ||
    (stock !== undefined && stock <= 0 && !product_variants?.length);

  const isVariantProduct = isVariant || _isVariant;
  const variantData = _variantData || product.variantData;
  const parentProductId = _originalProductId || originalParentProductId;

  const productLink = originalSlug
    ? `/product/${originalSlug}`
    : isVariantProduct
    ? `/product/${parentProductId}`
    : `/product/${slug || _id}`;

  const toggleWishlist = async (e) => {
    e.preventDefault(); e.stopPropagation();
    try {
      if (productInWishlist) { await removeFromWishlist(product._id); toast.success('Removed from wishlist'); }
      else { await addToWishlist(product); toast.success('Added to wishlist'); }
    } catch { toast.error('Failed to update wishlist'); }
  };

  const handleAddToCart = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (isAddingToCart) return;
    if (isVariantProduct && variantData) {
      setIsAddingToCart(true);
      try {
        await addToCart({
          ...variantData, _id: parentProductId,
          name: product.originalName || product.name,
          description: product.originalDescription || product.description,
          categories: product.originalCategories || product.categories,
        }, variantData, 1);
        toast.success('Added to cart');
      } catch { toast.error('Failed to add to cart'); }
      finally { setIsAddingToCart(false); }
    } else if (product_structure === 'variant' && product_variants?.length > 0) {
      navigate(`/product/${slug || _id}`);
    } else {
      setIsAddingToCart(true);
      try { await addToCart(product, null, 1); toast.success('Added to cart'); }
      catch { toast.error('Failed to add to cart'); }
      finally { setIsAddingToCart(false); }
    }
  };

  // Price
  let displayPrice = null;
  if (isVariantProduct && variantData) {
    displayPrice = variantData.selling_price || variantData.salesPrice || selling_price || salePrice || price;
  } else if (product_structure === 'variant' && product_variants?.length > 0) {
    const fv = product_variants[0];
    displayPrice = fv.selling_price || fv.salesPrice || fv.cost_price;
  } else {
    displayPrice = salePrice || selling_price || price;
  }

  let originalPrice = null;
  if (salePrice) originalPrice = selling_price || price;
  else if (product_structure === 'variant' &&
    product_variants?.[0]?.cost_price > product_variants?.[0]?.selling_price)
    originalPrice = product_variants[0].cost_price;

  const discountPct = originalPrice && displayPrice
    ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100) : null;

  // Image
  let displayImage = null;
  if (isVariantProduct && variantData?.images?.length > 0) displayImage = variantData.images[0];
  else if (product_structure === 'variant' && product_variants?.[0]?.images?.length > 0)
    displayImage = product_variants[0].images[0];

  const getPlaceholderImage = () => {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'><rect width='300' height='300' fill='#f3f4f6'/><text x='50%' y='50%' font-size='13' text-anchor='middle' dominant-baseline='middle' fill='#d1d5db' font-family='sans-serif'>No Image</text></svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  const getMainImage = () => {
    if (displayImage) return displayImage.startsWith('http') ? displayImage : `/uploads/${displayImage}`;
    if (!image_url || !Array.isArray(image_url) || image_url.length === 0) return getPlaceholderImage();
    const valid = image_url.find(img => img && (img.url || img));
    return valid ? (valid.url || valid) : getPlaceholderImage();
  };

  const mainImage = getMainImage();
  const ratingValue = averageRating || 0;

  const getVariantAttributes = () => {
    if (!isVariantProduct || !variantData?.attributes) return null;
    const attrs = Object.entries(variantData.attributes).map(([k, v]) => `${k}: ${v}`);
    return attrs.length > 0 ? attrs.join(' · ') : null;
  };
  const variantAttributes = getVariantAttributes();

  const Stars = () => (
    <div className="flex gap-0.5 flex-shrink-0">
      {[...Array(5)].map((_, i) => (
        <svg key={i} viewBox="0 0 20 20"
          className={`w-2.5 h-2.5 ${i < Math.round(ratingValue) ? 'text-amber-400 fill-current' : 'text-gray-200 fill-current'}`}>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );

  const HeartIcon = () => (
    <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
      className="w-3.5 h-3.5" fill={productInWishlist ? 'currentColor' : 'none'}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );

  const Spin = () => (
    <svg className="animate-spin w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );

  const ImgPlaceholder = () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-50">
      <svg className="w-8 h-8 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  );

  // ══════════════════════════════
  //  LIST VIEW
  // ══════════════════════════════
  if (viewMode === 'list') {
    return (
      <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
        style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
        <div className="flex" style={{ minHeight: '120px' }}>
          <Link to={productLink}
            className="relative flex-shrink-0 bg-gray-50 overflow-hidden"
            style={{ width: '110px' }}>
            <LazyImage src={mainImage} alt={name}
              className="absolute inset-0 w-full h-full object-contain p-3"
              placeholder={<ImgPlaceholder />} />
            {discountPct && (
              <span className="absolute top-2 left-2 text-white font-bold rounded-full"
                style={{ fontSize: '9px', padding: '2px 6px', background: '#f43f5e' }}>
                -{discountPct}%
              </span>
            )}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                <span className="text-gray-500 font-semibold bg-white/90 border border-gray-200 rounded-full"
                  style={{ fontSize: '9px', padding: '2px 8px' }}>Sold Out</span>
              </div>
            )}
          </Link>
          <div className="flex flex-col flex-1 min-w-0 p-3 gap-1">
            <Link to={productLink}>
              <h3 className="font-semibold text-gray-900 leading-snug hover:text-indigo-600 transition-colors line-clamp-2"
                style={{ fontSize: '13px' }}>{name}</h3>
            </Link>
            {variantAttributes && (
              <p className="text-indigo-500 font-medium truncate" style={{ fontSize: '10px' }}>{variantAttributes}</p>
            )}
            <div className="flex items-center gap-1">
              <Stars />
              <span className="text-gray-400" style={{ fontSize: '10px' }}>({numReviews || 0})</span>
            </div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              {originalPrice && (
                <span className="text-gray-400 line-through" style={{ fontSize: '11px' }}>
                  ₹{Number(originalPrice).toFixed(2)}
                </span>
              )}
              <span className="font-bold text-gray-900" style={{ fontSize: '15px' }}>
                ₹{displayPrice ? Number(displayPrice).toFixed(2) : '0.00'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 mt-auto pt-1 flex-wrap">
              <div className={`flex items-center gap-1 rounded-full font-semibold flex-shrink-0 ${isOutOfStock ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}
                style={{ fontSize: '9px', padding: '3px 8px' }}>
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isOutOfStock ? 'bg-red-400' : 'bg-emerald-400'}`} />
                {isOutOfStock ? 'Out of Stock' : 'In Stock'}
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={toggleWishlist}
                  className={`flex items-center justify-center rounded-lg border transition-colors ${productInWishlist ? 'bg-rose-50 border-rose-200 text-rose-500' : 'bg-gray-50 border-gray-200 text-gray-400 hover:text-rose-500'}`}
                  style={{ width: '32px', height: '32px' }}>
                  <HeartIcon />
                </button>
                <button onClick={handleAddToCart} disabled={isAddingToCart || isOutOfStock}
                  className={`flex items-center justify-center gap-1 rounded-lg font-semibold transition-all active:scale-95 ${productInCart ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : isOutOfStock ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'text-white'}`}
                  style={{ height: '32px', padding: '0 12px', fontSize: '11px', backgroundColor: !productInCart && !isOutOfStock ? '#4b5563' : undefined, minWidth: '70px' }}>
                  {isAddingToCart ? <Spin /> : productInCart ? (
                    <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>In Cart</>
                  ) : isOutOfStock ? 'Sold Out'
                    : product_structure === 'variant' && product_variants?.length > 0 ? 'Options'
                    : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════
  //  GRID VIEW — fixed for 2-col mobile
  // ══════════════════════════════════════════
  return (
    <>
      <style>{`
        .pc-card { box-shadow: 0 1px 4px rgba(0,0,0,0.08); transition: box-shadow 0.3s, transform 0.3s; }
        @media (hover: hover) {
          .pc-card:hover { box-shadow: 0 12px 36px rgba(0,0,0,0.13); transform: translateY(-3px); }
        }
        .pc-wish { opacity: 1; transition: opacity 0.2s; }
        @media (hover: hover) {
          .pc-wish { opacity: 0; }
          .pc-card:hover .pc-wish { opacity: 1; }
        }
        .pc-wish-on { opacity: 1 !important; }
      `}</style>

      <div className="pc-card relative bg-white rounded-xl overflow-hidden flex flex-col w-full h-full"
        style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>

        {/* ── Square image via padding trick ── */}
        <Link to={productLink} className="relative block w-full flex-shrink-0 bg-gray-50 overflow-hidden"
          style={{ paddingTop: '100%' }}
          onMouseEnter={() => setImgHovered(true)}
          onMouseLeave={() => setImgHovered(false)}>
          <div className="absolute inset-0">
            <LazyImage
              src={mainImage} alt={name}
              className="w-full h-full object-contain p-2 sm:p-4"
              style={{
                mixBlendMode: 'multiply',
                transition: 'transform 0.5s ease',
                transform: imgHovered ? 'scale(1.06)' : 'scale(1)',
              }}
              placeholder={<ImgPlaceholder />}
            />
          </div>

          {/* Badges */}
          <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 z-10"
            style={{ maxWidth: 'calc(100% - 36px)' }}>
            {discountPct && (
              <span className="text-white font-bold rounded-full self-start"
                style={{ fontSize: '8px', padding: '2px 6px', background: '#f43f5e', whiteSpace: 'nowrap' }}>
                -{discountPct}%
              </span>
            )}
            {isOutOfStock && (
              <span className="text-white font-semibold rounded-full self-start"
                style={{ fontSize: '8px', padding: '2px 6px', background: '#374151', whiteSpace: 'nowrap' }}>
                SOLD OUT
              </span>
            )}
          </div>

          {isOutOfStock && <div className="absolute inset-0 bg-white/40" />}
        </Link>

        {/* Wishlist — always visible on touch devices */}
        <button
          onClick={toggleWishlist}
          className={`pc-wish ${productInWishlist ? 'pc-wish-on' : ''} absolute top-1.5 right-1.5 z-20 flex items-center justify-center rounded-full border shadow-sm transition-all ${
            productInWishlist
              ? 'bg-white border-rose-200 text-rose-500'
              : 'bg-white/90 border-gray-200 text-gray-400'
          }`}
          style={{ width: '30px', height: '30px', minWidth: '30px', minHeight: '30px' }}
        >
          <HeartIcon />
        </button>

        {/* ── Info ── */}
        <div className="flex flex-col flex-1 p-2 sm:p-3 min-w-0">

          {variantAttributes && (
            <p className="text-indigo-500 font-semibold uppercase truncate mb-0.5"
              style={{ fontSize: '8px', letterSpacing: '0.06em' }}>
              {variantAttributes}
            </p>
          )}

          {/* Name */}
          <Link to={productLink} className="block mb-1 min-w-0">
            <h3
              className="font-semibold text-gray-800 line-clamp-2 leading-tight hover:text-indigo-600 transition-colors"
              style={{ fontSize: '11px', minHeight: '2em' }}
              title={name}
            >
              {name}
            </h3>
          </Link>

          {/* Stars */}
          <div className="flex items-center gap-1 mb-1.5 flex-wrap">
            <Stars />
            <span className="text-gray-400" style={{ fontSize: '9px' }}>
              ({numReviews || 0})
            </span>
          </div>

          <div className="flex-1" />

          {/* Price + stock pill */}
          <div className="flex items-end justify-between gap-1 mb-2 min-w-0">
            <div className="min-w-0 flex-1 overflow-hidden">
              {originalPrice && (
                <p className="text-gray-400 line-through leading-none mb-0.5"
                  style={{ fontSize: '9px' }}>
                  ₹{Number(originalPrice).toFixed(0)}
                </p>
              )}
              <p className="font-bold text-gray-900 leading-none truncate"
                style={{ fontSize: '13px' }}>
                ₹{displayPrice ? Number(displayPrice).toFixed(0) : '—'}
              </p>
            </div>

            {/* Stock pill */}
            <div
              className={`flex items-center gap-0.5 rounded-full font-semibold flex-shrink-0 ${
                isOutOfStock ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'
              }`}
              style={{ fontSize: '8px', padding: '2px 6px', whiteSpace: 'nowrap' }}
            >
              <span className={`w-1 h-1 rounded-full flex-shrink-0 ${isOutOfStock ? 'bg-red-400' : 'bg-emerald-400'}`} />
              {isOutOfStock ? 'Out' : 'Stock'}
            </div>
          </div>

          {/* Cart button — full width, 40px tall tap target */}
          <button
            onClick={handleAddToCart}
            disabled={isAddingToCart || isOutOfStock}
            className={`w-full flex items-center justify-center gap-1 rounded-lg font-semibold transition-all active:scale-95 ${
              productInCart
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : isOutOfStock
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'text-white'
            }`}
            style={{
              height: '36px',
              fontSize: '11px',
              backgroundColor: !productInCart && !isOutOfStock ? '#4b5563' : undefined,
            }}
          >
            {isAddingToCart ? (
              <Spin />
            ) : productInCart ? (
              <>
                <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Added
              </>
            ) : isOutOfStock ? 'Out of Stock'
              : product_structure === 'variant' && product_variants?.length > 0
              ? 'Options'
              : (
                <>
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Add to Cart
                </>
              )}
          </button>
        </div>
      </div>
    </>
  );
});

export default ProductCard;