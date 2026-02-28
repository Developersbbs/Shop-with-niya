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

  const productInWishlist = isInWishlist(product._id);
  const productInCart = isInCart(product._id);

  const {
    _id, name, selling_price, price, image_url, averageRating,
    numReviews, salePrice, slug, product_variants, product_structure,
    parentProductId: originalParentProductId, isVariant, _isVariant,
    _variantData, _parentProduct, _originalProductId, attributes,
    sku, stock, status, published, originalSlug, baseStock,
  } = product;

  // ✅ Unified stock check using status OR baseStock/stock fields
  const isOutOfStock = status === 'out_of_stock' || 
    (baseStock !== undefined && baseStock <= 0 && !product_variants?.length) ||
    (stock !== undefined && stock <= 0 && !product_variants?.length);

  const isVariantProduct = isVariant || _isVariant;
  const variantData = _variantData || product.variantData;
  const parentProductId = _originalProductId || originalParentProductId;

  const productLink = originalSlug
    ? `/product/${originalSlug}`
    : (isVariantProduct ? `/product/${parentProductId}` : `/product/${slug || _id}`);

  const toggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (productInWishlist) {
        await removeFromWishlist(product._id);
        toast.success('Removed from wishlist');
      } else {
        await addToWishlist(product);
        toast.success('Added to wishlist');
      }
    } catch (error) {
      toast.error('Failed to update wishlist');
    }
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAddingToCart) return;

    if (isVariantProduct && variantData) {
      setIsAddingToCart(true);
      try {
        const variantForCart = {
          ...variantData,
          _id: parentProductId,
          name: product.originalName || product.name,
          description: product.originalDescription || product.description,
          categories: product.originalCategories || product.categories
        };
        await addToCart(variantForCart, variantData, 1);
        toast.success('Added to cart');
      } catch (error) {
        toast.error('Failed to add to cart');
      } finally {
        setIsAddingToCart(false);
      }
    } else if (product_structure === 'variant' && product_variants?.length > 0) {
      navigate(`/product/${slug || _id}`);
    } else {
      setIsAddingToCart(true);
      try {
        await addToCart(product, null, 1);
        toast.success('Added to cart');
      } catch (error) {
        toast.error('Failed to add to cart');
      } finally {
        setIsAddingToCart(false);
      }
    }
  };

  // Price logic
  let displayPrice = null;
  if (isVariantProduct && variantData) {
    displayPrice = variantData.selling_price || variantData.salesPrice || selling_price || salePrice || price;
  } else if (product_structure === 'variant' && product_variants?.length > 0) {
    const firstVariant = product_variants[0];
    displayPrice = firstVariant.selling_price || firstVariant.salesPrice || firstVariant.cost_price;
  } else {
    displayPrice = salePrice || selling_price || price;
  }

  // Image logic
  let displayImage = null;
  if (isVariantProduct && variantData?.images?.length > 0) {
    displayImage = variantData.images[0];
  } else if (product_structure === 'variant' && product_variants?.length > 0) {
    const firstVariant = product_variants[0];
    if (firstVariant.images?.length > 0) displayImage = firstVariant.images[0];
  }

  const getPlaceholderImage = () => {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'>
      <rect width='300' height='200' fill='#f3f4f6'/>
      <text x='50%' y='50%' font-size='14' text-anchor='middle' dominant-baseline='middle' fill='#9ca3af' font-family='sans-serif'>No Image Available</text>
    </svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  const getMainImage = () => {
    if (displayImage) return displayImage.startsWith('http') ? displayImage : `/uploads/${displayImage}`;
    if (!image_url || !Array.isArray(image_url) || image_url.length === 0) return getPlaceholderImage();
    const validImage = image_url.find(img => img && (img.url || img));
    return validImage ? (validImage.url || validImage) : getPlaceholderImage();
  };

  const mainImage = getMainImage();
  const ratingValue = averageRating || 0;

  const getVariantAttributes = () => {
    if (!isVariantProduct || !variantData?.attributes) return null;
    const attrs = Object.entries(variantData.attributes).map(([key, value]) => `${key}: ${value}`);
    return attrs.length > 0 ? attrs.join(', ') : null;
  };
  const variantAttributes = getVariantAttributes();

  // ============ LIST VIEW ============
  if (viewMode === 'list') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 p-4">
        <div className="flex items-center space-x-4">
          {/* Image */}
          <Link to={productLink} className="flex-shrink-0">
            <div className="relative w-24 h-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden">
              <LazyImage
                src={mainImage}
                alt={name}
                className="w-full h-full object-contain p-2 hover:scale-105 transition-transform duration-200"
                placeholder={
                  <div className="flex items-center justify-center h-full">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                }
              />
              {salePrice && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">Sale</div>
              )}
            </div>
          </Link>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <Link to={productLink}>
              <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2 hover:text-blue-600 transition-colors duration-200">{name}</h3>
            </Link>

            {variantAttributes && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-2">
                {variantAttributes}
              </span>
            )}

            {isVariantProduct && sku && (
              <p className="text-xs text-gray-500 mb-2">SKU: {sku}</p>
            )}

            {/* Rating */}
            <div className="flex items-center space-x-2 mb-2">
              <div className="flex items-center bg-yellow-50 px-2 py-1 rounded">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className={`w-3 h-3 ${i < Math.round(ratingValue) ? 'text-yellow-500' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="text-xs font-medium text-gray-700 ml-1">{ratingValue > 0 ? ratingValue.toFixed(1) : '0.0'}</span>
              </div>
              <span className="text-xs text-gray-500">({numReviews || 0} reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-center space-x-3 mb-3">
              {(salePrice || (product_structure === 'variant' && product_variants?.[0]?.selling_price && product_variants[0].cost_price > product_variants[0].selling_price)) && (
                <span className="text-sm text-gray-400 line-through">
                  ₹{product_structure === 'variant' ? product_variants?.[0]?.cost_price?.toFixed(2) : selling_price?.toFixed(2) || price?.toFixed(2) || '0.00'}
                </span>
              )}
              <span className="text-xl font-bold text-gray-900">₹{displayPrice ? Number(displayPrice).toFixed(2) : '0.00'}</span>
              {salePrice && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                  {Math.round(((selling_price || price) - salePrice) / (selling_price || price) * 100)}% OFF
                </span>
              )}
            </div>

            {/* ✅ Fixed Stock Status */}
            <div className="flex items-center text-xs text-gray-600 mb-3">
              <div className={`w-2 h-2 rounded-full mr-2 ${isOutOfStock ? 'bg-red-500' : 'bg-green-500'}`}></div>
              {isOutOfStock ? 'Out of Stock' : 'In Stock'}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col space-y-2">
            <button
              onClick={toggleWishlist}
              className={`p-2 rounded-lg border transition-all duration-200 ${productInWishlist ? 'bg-red-50 border-red-200 text-red-600' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
            >
              <svg className="w-5 h-5" fill={productInWishlist ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
            <button
              onClick={handleAddToCart}
              // ✅ Fixed disabled check
              disabled={isAddingToCart || isOutOfStock}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${productInCart ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isAddingToCart ? 'Adding...' : productInCart ? 'In Cart' :
                (product_structure === 'variant' && product_variants?.length > 0) ? 'Select Options' : 
                isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============ GRID VIEW ============
  return (
    <div className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col overflow-hidden relative">
      <Link to={productLink} className="relative aspect-square block bg-gray-50 overflow-hidden">
        <LazyImage
          src={mainImage}
          alt={name}
          className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105 mix-blend-multiply"
          placeholder={
            <div className="flex items-center justify-center h-full bg-gray-50">
              <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          }
        />

        {/* ✅ Fixed badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {salePrice && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm tracking-wide">SALE</span>
          )}
          {isOutOfStock && (
            <span className="bg-gray-800 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm tracking-wide">OUT OF STOCK</span>
          )}
        </div>
      </Link>

      {/* Wishlist Button */}
      <button
        onClick={toggleWishlist}
        className={`absolute top-3 right-3 p-2 rounded-full shadow-md transition-all duration-200 z-10 ${productInWishlist ? 'bg-white text-red-500' : 'bg-white text-gray-400 hover:text-red-500 hover:scale-110'}`}
      >
        <svg className={`w-4 h-4 ${productInWishlist ? 'fill-current' : 'fill-none'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>

      {/* Product Details */}
      <div className="p-4 flex flex-col flex-1">
        <Link to={productLink} className="block mb-1 group-hover:text-blue-600 transition-colors">
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 h-10 leading-snug" title={name}>{name}</h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center mb-2">
          <div className="flex text-yellow-400">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className={`w-3 h-3 ${i < Math.round(ratingValue) ? 'fill-current' : 'text-gray-200 fill-gray-200'}`} viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-[10px] text-gray-400 ml-1.5">({numReviews})</span>
        </div>

        {/* Price + Cart */}
        <div className="mt-auto pt-3 border-t border-gray-50">
          <div className="flex items-end justify-between mb-3">
            <div className="flex flex-col">
              {(salePrice || (product_structure === 'variant' && product_variants?.[0]?.selling_price && product_variants[0].cost_price > product_variants[0].selling_price)) && (
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-xs text-gray-400 line-through">
                    ₹{product_structure === 'variant' ? product_variants?.[0]?.cost_price?.toFixed(2) : selling_price?.toFixed(2) || price?.toFixed(2) || '0.00'}
                  </span>
                  {salePrice && (
                    <span className="text-[10px] font-bold text-green-600">
                      {Math.round(((selling_price || price) - salePrice) / (selling_price || price) * 100)}% OFF
                    </span>
                  )}
                </div>
              )}
              <span className="text-lg font-bold text-gray-900">
                ₹{displayPrice ? Number(displayPrice).toFixed(2) : '0.00'}
              </span>
            </div>
          </div>

          {/* ✅ Fixed Add to Cart button */}
          <button
            onClick={handleAddToCart}
            disabled={isAddingToCart || isOutOfStock}
            className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              productInCart
                ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                : isOutOfStock
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-900 text-white hover:bg-black shadow-sm hover:shadow active:scale-95'
            }`}
          >
            {isAddingToCart ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : productInCart ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Added
              </>
            ) : isOutOfStock ? (
              'Out of Stock'
            ) : (
              product_structure === 'variant' && product_variants?.length > 0 ? 'Select Options' : 'Add to Cart'
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

export default ProductCard;