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
  const [hovered, setHovered] = useState(false);

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

  // ── Images ──────────────────────────────────────────────
  const getPlaceholderImage = () => {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'><rect width='400' height='500' fill='#f0ede8'/><text x='50%' y='50%' font-size='13' text-anchor='middle' dominant-baseline='middle' fill='#c4bfb8' font-family='Georgia,serif'>No Image</text></svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  const resolveImg = (img) => {
    if (!img) return null;
    const src = img.url || img;
    if (typeof src !== 'string') return null;
    return src.startsWith('http') ? src : `/uploads/${src}`;
  };

  // Primary image
  let primaryImage = null;
  if (isVariantProduct && variantData?.images?.length > 0) primaryImage = resolveImg(variantData.images[0]);
  else if (product_structure === 'variant' && product_variants?.[0]?.images?.length > 0)
    primaryImage = resolveImg(product_variants[0].images[0]);
  if (!primaryImage && Array.isArray(image_url) && image_url.length > 0)
    primaryImage = resolveImg(image_url[0]);
  if (!primaryImage) primaryImage = getPlaceholderImage();

  // Hover image (second image if available)
  let hoverImage = null;
  if (Array.isArray(image_url) && image_url.length > 1) hoverImage = resolveImg(image_url[1]);
  else if (product_structure === 'variant' && product_variants?.[0]?.images?.length > 1)
    hoverImage = resolveImg(product_variants[0].images[1]);

  // ── Price ───────────────────────────────────────────────
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

  // ── Actions ─────────────────────────────────────────────
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
        await addToCart({ ...variantData, _id: parentProductId, name: product.originalName || product.name }, variantData, 1);
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

  const ratingValue = averageRating || 0;

  // ── LIST VIEW ────────────────────────────────────────────
  if (viewMode === 'list') {
    return (
      <div
        className="group w-full bg-white border border-[#e8e2da] hover:border-[#1a3c2e]/30 overflow-hidden transition-all duration-300 hover:shadow-md flex"
        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
      >
        <Link to={productLink} className="relative flex-shrink-0 bg-[#f7f4f0] overflow-hidden" style={{ width: 140, height: 140 }}>
          <img src={primaryImage} alt={name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
              <span className="text-[10px] tracking-widest uppercase text-[#1a3c2e]/60 bg-white px-3 py-1 border border-[#1a3c2e]/20">Sold Out</span>
            </div>
          )}
          {discountPct && (
            <span className="absolute top-2 left-2 bg-[#c9a96e] text-white text-[9px] tracking-widest uppercase px-2 py-0.5">-{discountPct}%</span>
          )}
        </Link>

        <div className="flex flex-col flex-1 p-4 justify-between min-w-0">
          <div>
            <Link to={productLink}>
              {/* ✅ Playfair Display for product name */}
              <h3
                className="text-[#1a3c2e] leading-snug hover:text-[#c9a96e] transition-colors line-clamp-2"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 15,
                  fontWeight: 600,
                }}
              >
                {name}
              </h3>
            </Link>
            <div className="flex gap-0.5 mt-1.5">
              {[...Array(5)].map((_, i) => (
                <svg key={i} viewBox="0 0 20 20" className={`w-3 h-3 ${i < Math.round(ratingValue) ? 'text-[#c9a96e]' : 'text-gray-200'} fill-current`}>
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="text-[#1a3c2e]/40 text-[10px] ml-1">({numReviews || 0})</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3">
            <div>
              {/* ✅ Playfair Display for cost price (strikethrough) */}
              {originalPrice && (
                <p
                  className="text-[#1a3c2e]/30 line-through"
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 12,
                  }}
                >
                  ₹{Number(originalPrice).toFixed(0)}
                </p>
              )}
              {/* ✅ Playfair Display for selling price */}
              <p
                className="text-[#1a3c2e] font-bold text-lg"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                ₹{displayPrice ? Number(displayPrice).toFixed(0) : '—'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={toggleWishlist}
                className={`w-9 h-9 flex items-center justify-center border transition-all ${productInWishlist ? 'border-rose-300 text-rose-500 bg-rose-50' : 'border-[#1a3c2e]/20 text-[#1a3c2e]/40 hover:text-rose-500'}`}
              >
                <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4" fill={productInWishlist ? 'currentColor' : 'none'}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart || isOutOfStock}
                className={`px-5 h-9 text-xs tracking-widest uppercase font-medium transition-all ${productInCart ? 'bg-[#1a3c2e]/10 text-[#1a3c2e]' : isOutOfStock ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-[#1a3c2e] text-white hover:bg-[#2d5a42]'}`}
              >
                {isAddingToCart ? '…' : productInCart ? '✓ Added' : isOutOfStock ? 'Sold Out' : product_structure === 'variant' ? 'Options' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── GRID VIEW ────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap');
        .niya-card { transition: box-shadow 0.4s ease, transform 0.4s ease; }
        .niya-card:hover { box-shadow: 0 20px 60px rgba(26,60,46,0.12); transform: translateY(-4px); }
        .niya-img-primary { transition: opacity 0.5s ease, transform 0.7s ease; }
        .niya-img-hover { transition: opacity 0.5s ease, transform 0.7s ease; }
        .niya-card:hover .niya-img-primary { opacity: 0; transform: scale(1.06); }
        .niya-card:hover .niya-img-hover { opacity: 1; transform: scale(1.04); }
        .niya-card .niya-img-hover { opacity: 0; }
        .niya-wish { transition: opacity 0.25s ease; opacity: 0; }
        .niya-card:hover .niya-wish { opacity: 1; }
        .niya-wish-active { opacity: 1 !important; }
      `}</style>

      <div
        className="niya-card relative bg-white flex flex-col w-full overflow-hidden"
        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", border: '1px solid #ede8e0' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* ── Image Area ── */}
        <Link to={productLink} className="relative block w-full bg-[#f7f4f0] overflow-hidden flex-shrink-0" style={{ paddingTop: '125%' }}>

          {/* Primary image */}
          <img
            src={primaryImage}
            alt={name}
            className="niya-img-primary absolute inset-0 w-full h-full object-cover"
            onError={e => { e.target.src = getPlaceholderImage(); }}
          />

          {/* Hover image */}
          {hoverImage && (
            <img
              src={hoverImage}
              alt={`${name} - alternate`}
              className="niya-img-hover absolute inset-0 w-full h-full object-cover"
              onError={e => { e.target.style.display = 'none'; }}
            />
          )}

          {/* Sold out overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
              <span className="text-[10px] tracking-[0.3em] uppercase text-[#1a3c2e]/50 bg-white/90 px-4 py-1.5 border border-[#1a3c2e]/15">
                Sold Out
              </span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-20">
            {discountPct && (
              <span className="bg-[#c9a96e] text-white text-[9px] tracking-[0.2em] uppercase px-2.5 py-1 font-medium">
                -{discountPct}%
              </span>
            )}
            {product_structure === 'variant' && (
              <span className="bg-[#1a3c2e] text-white text-[9px] tracking-[0.15em] uppercase px-2.5 py-1">
                Options
              </span>
            )}
          </div>

          {/* Wishlist button */}
          <button
            onClick={toggleWishlist}
            className={`niya-wish ${productInWishlist ? 'niya-wish-active' : ''} absolute top-2.5 right-2.5 z-20 w-9 h-9 flex items-center justify-center bg-white/90 border transition-all hover:scale-110`}
            style={{ border: productInWishlist ? '1px solid #fca5a5' : '1px solid rgba(26,60,46,0.15)' }}
          >
            <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
              className={`w-4 h-4 ${productInWishlist ? 'text-rose-500' : 'text-[#1a3c2e]/50'}`}
              fill={productInWishlist ? 'currentColor' : 'none'}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </Link>

        {/* ── Product Info ── */}
        <div className="flex flex-col p-3 sm:p-4">

          {/* ✅ Name — Playfair Display */}
          <Link to={productLink}>
            <h3
              className="text-[#1a3c2e] leading-snug line-clamp-2 hover:text-[#c9a96e] transition-colors"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 'clamp(13px, 1.4vw, 15px)',
                fontWeight: 600,
                minHeight: '2.4em',
                letterSpacing: '0.01em',
              }}
            >
              {name}
            </h3>
          </Link>

          {/* Stars */}
          <div className="flex items-center gap-1 mt-1">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <svg key={i} viewBox="0 0 20 20" className={`w-2.5 h-2.5 ${i < Math.round(ratingValue) ? 'text-[#c9a96e]' : 'text-gray-200'} fill-current`}>
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-[#1a3c2e]/30 text-[9px]">({numReviews || 0})</span>
          </div>

          {/* Price + stock */}
          <div className="flex items-center justify-between mt-2 mb-3">
            <div>
              {/* ✅ Cost price — Playfair Display strikethrough */}
              {originalPrice && (
                <p
                  className="text-[#1a3c2e]/30 line-through leading-none mb-0.5"
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 11,
                  }}
                >
                  ₹{Number(originalPrice).toFixed(0)}
                </p>
              )}
              {/* ✅ Selling price — Playfair Display */}
              <p
                className="text-[#1a3c2e] leading-none"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 'clamp(16px, 2.2vw, 20px)',
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                }}
              >
                ₹{displayPrice ? Number(displayPrice).toFixed(0) : '—'}
              </p>
            </div>
            <div className={`flex items-center gap-1 text-[9px] tracking-widest uppercase font-medium ${isOutOfStock ? 'text-rose-400' : 'text-emerald-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isOutOfStock ? 'bg-rose-400' : 'bg-emerald-400'}`} />
              {isOutOfStock ? 'Sold Out' : 'In Stock'}
            </div>
          </div>

          {/* Add to Cart button */}
          <button
            onClick={handleAddToCart}
            disabled={isAddingToCart || isOutOfStock}
            className={`w-full py-2.5 text-[10px] tracking-[0.22em] uppercase font-medium transition-all duration-300 ${
              productInCart
                ? 'bg-[#1a3c2e]/8 text-[#1a3c2e] border border-[#1a3c2e]/25'
                : isOutOfStock
                ? 'bg-gray-100 text-gray-300 cursor-not-allowed border border-gray-100'
                : 'bg-[#1a3c2e] text-white hover:bg-[#2d5a42] border border-[#1a3c2e]'
            }`}
          >
            {isAddingToCart ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Adding…
              </span>
            ) : productInCart ? '✓ Added to Cart'
              : isOutOfStock ? 'Out of Stock'
              : product_structure === 'variant' && product_variants?.length > 0 ? 'Select Options'
              : 'Add to Cart'}
          </button>
        </div>
      </div>
    </>
  );
});

export default ProductCard;