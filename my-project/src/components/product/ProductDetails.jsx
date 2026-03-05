import React, { useState, useEffect, useMemo } from 'react';
import { formatCurrency } from '../../utils/format';
import toast from 'react-hot-toast';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon, HeartIcon, ShoppingCartIcon, EyeIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import RatingReview from './RatingReview';

const ProductDetails = ({ product, isLoading, isError, onCartUpdate }) => {
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showImageModal, setShowImageModal] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);

  const { addToCart: addToCartContext } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const navigate = useNavigate();

  const displayProduct = product;

  useEffect(() => {
    if (displayProduct?.product_structure === 'variant' && displayProduct?.product_variants?.length > 0) {
      setSelectedVariant(displayProduct.product_variants[0]);
      if (displayProduct.product_variants[0].attributes) {
        setSelectedAttributes({ ...displayProduct.product_variants[0].attributes });
      }
    }
  }, [displayProduct]);

  // Reset quantity to 1 when variant changes
  useEffect(() => {
    setQuantity(1);
  }, [selectedVariant]);

  const handleAttributeChange = (attribute, value) => {
    const newAttributes = { ...selectedAttributes, [attribute]: value };
    setSelectedAttributes(newAttributes);
    if (displayProduct?.product_variants) {
      const matchingVariant = displayProduct.product_variants.find(variant => {
        if (!variant.attributes) return false;
        return Object.entries(newAttributes).every(([key, val]) => {
          const attrValue = getAttributeValue(variant.attributes, key);
          return attrValue === val;
        });
      });
      if (matchingVariant) setSelectedVariant(matchingVariant);
    }
  };

  const getAttributeValue = (attributes, key) => {
    if (!attributes) return null;
    if (attributes instanceof Map) return attributes.get(key);
    return attributes[key];
  };

  const getAttributeOptions = (attributeName) => {
    if (!displayProduct?.product_variants) return [];
    const options = new Set();
    displayProduct.product_variants.forEach(variant => {
      const value = getAttributeValue(variant.attributes, attributeName);
      if (value) options.add(value);
    });
    return Array.from(options);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (isError || !displayProduct) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800">Product Not Found</h1>
          <p className="text-gray-600 mt-2">The product you're looking for doesn't exist or has been removed.</p>
          <button onClick={() => navigate('/products')} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  const displayPrice = displayProduct.product_structure === 'simple'
    ? displayProduct.selling_price
    : selectedVariant?.selling_price || 0;

  // ✅ FIX 1: ?? instead of || so stock value of 0 is respected
  const displayStock = displayProduct.product_structure === 'simple'
    ? (displayProduct.baseStock ?? 0)
    : (selectedVariant?.stock ?? 0);

  const originalPrice = displayProduct.price || displayProduct.cost_price || null;
  const discount = originalPrice && originalPrice > displayPrice
    ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100)
    : null;

  const allImages = useMemo(() => {
    if (displayProduct?.product_structure === 'variant' && selectedVariant?.images?.length > 0) {
      return selectedVariant.images;
    }
    return displayProduct?.image_url && displayProduct.image_url.length > 0
      ? displayProduct.image_url
      : ['/images/products/placeholder-product.svg'];
  }, [displayProduct, selectedVariant]);

  const currentImage = allImages[selectedImageIndex] || '/images/products/placeholder-product.svg';

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [allImages]);

  const handleAddToCart = async () => {
    if (isAddingToCart) return;
    setIsAddingToCart(true);
    try {
      await addToCartContext(displayProduct, selectedVariant, quantity);
      toast.success(`${quantity} item(s) added to cart!`);
      if (onCartUpdate) onCartUpdate();
    } catch (error) {
      toast.error(error?.message || 'Failed to add item to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (isBuyingNow) return;
    setIsBuyingNow(true);
    try {
      await addToCartContext(displayProduct, selectedVariant, quantity);
      if (onCartUpdate) onCartUpdate();
      navigate('/checkout');
    } catch (error) {
      toast.error(error?.message || 'Failed to proceed to checkout');
      setIsBuyingNow(false);
    }
  };

  const handleWishlistToggle = async () => {
    try {
      if (isInWishlist(displayProduct._id)) {
        await removeFromWishlist(displayProduct._id);
        toast.success('Removed from wishlist');
      } else {
        await addToWishlist(displayProduct, selectedVariant);
        toast.success('Added to wishlist');
      }
    } catch (error) {
      toast.error('Failed to update wishlist');
    }
  };

  const inWishlist = isInWishlist(displayProduct._id);

  // ✅ FIX 2: Comprehensive out-of-stock check
  const isOutOfStock = displayProduct.product_type === 'physical' && (
    displayProduct.status === 'out_of_stock' ||
    displayStock <= 0 ||
    (displayProduct.product_structure === 'variant' &&
      (selectedVariant?.status === 'out_of_stock' || !selectedVariant?.published))
  );

  const ratingValue = displayProduct?.averageRating || 0;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex text-sm">
            <ol className="flex items-center space-x-2">
              <li><a href="/" className="text-gray-500 hover:text-gray-700">Home</a></li>
              <li><span className="text-gray-400 mx-1">/</span></li>
              <li><a href="/products" className="text-gray-500 hover:text-gray-700">Products</a></li>
              <li><span className="text-gray-400 mx-1">/</span></li>
              <li className="text-gray-900 font-medium truncate max-w-xs">{displayProduct.name}</li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-x-10 lg:items-start">

          {/* ── Image Gallery ── */}
          <div>
            <div className="relative bg-white rounded-2xl shadow-sm overflow-hidden group aspect-square flex items-center justify-center border border-gray-100">
              <img
                src={currentImage}
                alt={displayProduct.name}
                className="w-full h-full object-contain p-6 transition-transform duration-500 group-hover:scale-105"
                onError={(e) => { e.target.src = '/images/products/placeholder-product.svg'; }}
              />

              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {discount && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                    -{discount}% OFF
                  </span>
                )}
                {isOutOfStock && (
                  <span className="bg-gray-800 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                    Out of Stock
                  </span>
                )}
              </div>

              <button
                onClick={() => setShowImageModal(true)}
                className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50"
              >
                <EyeIcon className="h-4 w-4 text-gray-600" />
              </button>

              {allImages.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImageIndex(prev => prev === 0 ? allImages.length - 1 : prev - 1)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => setSelectedImageIndex(prev => prev === allImages.length - 1 ? 0 : prev + 1)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRightIcon className="h-5 w-5 text-gray-600" />
                  </button>
                </>
              )}
            </div>

            {allImages.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                {allImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                      index === selectedImageIndex
                        ? 'border-blue-500 shadow-md'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${displayProduct.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = '/images/products/placeholder-product.svg'; }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Product Info ── */}
          <div className="mt-10 lg:mt-0">

            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 leading-tight">
              {displayProduct.name}
            </h1>

            <div className="mt-3 flex items-center gap-3">
              <div className="flex items-center">
                {[0,1,2,3,4].map(i => (
                  <StarSolidIcon
                    key={i}
                    className={`h-5 w-5 ${i < Math.round(ratingValue) ? 'text-yellow-400' : 'text-gray-200'}`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500">
                {ratingValue > 0 ? ratingValue.toFixed(1) : '0.0'}
                {displayProduct?.totalReviews > 0 && (
                  <a href="#ratings" className="ml-1 text-blue-600 hover:underline">
                    ({displayProduct.totalReviews} reviews)
                  </a>
                )}
              </span>
            </div>

            <div className="mt-5">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-gray-900">
                  {formatCurrency(displayPrice)}
                </span>
                {originalPrice && originalPrice > displayPrice && (
                  <span className="text-xl text-gray-400 line-through">
                    {formatCurrency(originalPrice)}
                  </span>
                )}
                {discount && (
                  <span className="text-sm font-semibold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                    {discount}% OFF
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">Inclusive of all taxes</p>
            </div>

            <div className="mt-3">
              {isOutOfStock ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span> Out of Stock
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  In Stock {displayStock > 0 && displayStock <= 10 && `— Only ${displayStock} left!`}
                </span>
              )}
            </div>

            <hr className="my-5 border-gray-100" />

            {/* Variant Selection */}
            {displayProduct.product_structure === 'variant' && displayProduct.product_variants && (
              <div className="mb-5 space-y-4">
                {Array.from(new Set(
                  displayProduct.product_variants.flatMap(v => {
                    if (!v.attributes) return [];
                    if (v.attributes instanceof Map) return Array.from(v.attributes.keys());
                    return Object.keys(v.attributes);
                  }).filter(Boolean)
                )).map(attributeName => (
                  <div key={attributeName}>
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      {attributeName}:&nbsp;
                      <span className="text-blue-600 font-medium">{selectedAttributes[attributeName]}</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {getAttributeOptions(attributeName).map(option => (
                        <button
                          key={option}
                          onClick={() => handleAttributeChange(attributeName, option)}
                          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                            selectedAttributes[attributeName] === option
                              ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                              : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-700 mb-2">Quantity</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden w-fit">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors font-bold text-lg"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={displayStock || 1}
                    value={quantity}
                    onChange={(e) => {
                      const val = Math.min(
                        Math.max(1, parseInt(e.target.value) || 1),
                        displayStock || 1
                      );
                      setQuantity(val);
                    }}
                    className="w-14 py-2 text-center font-semibold text-sm border-x border-gray-300 focus:outline-none"
                  />
                  {/* ✅ FIX 3: + button capped at displayStock */}
                  <button
                    onClick={() => setQuantity(Math.min(quantity + 1, displayStock || 1))}
                    disabled={quantity >= displayStock || isOutOfStock}
                    className={`px-4 py-2 font-bold text-lg transition-colors ${
                      quantity >= displayStock || isOutOfStock
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    +
                  </button>
                </div>
                <span className="text-sm text-gray-500">
                  Total:&nbsp;
                  <span className="font-bold text-gray-900">{formatCurrency(displayPrice * quantity)}</span>
                </span>
              </div>
              {/* Stock hint
              {!isOutOfStock && displayStock > 0 && (
                <p className="mt-1.5 text-xs text-gray-400">Max {displayStock} available</p>
              )} */}
            </div>

            {/* ── Action Buttons ── */}
            <div className="flex gap-3 mb-3">
              <button
                onClick={handleWishlistToggle}
                className={`flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
                  inWishlist
                    ? 'border-red-400 bg-red-50 text-red-600 hover:bg-red-100'
                    : 'border-gray-300 bg-white text-gray-600 hover:border-red-300 hover:text-red-500 hover:bg-red-50'
                }`}
              >
                {inWishlist
                  ? <HeartSolidIcon className="h-5 w-5 text-red-500" />
                  : <HeartIcon className="h-5 w-5" />
                }
                {inWishlist ? 'Wishlisted' : 'Wishlist'}
              </button>

              {/* ✅ FIX 4: Out of Stock label on button */}
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart || isOutOfStock}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border-2 text-sm font-semibold transition-all duration-200 active:scale-95 ${
                  isOutOfStock
                    ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'border-blue-600 bg-white text-blue-600 hover:bg-blue-50'
                }`}
              >
                {isAddingToCart ? (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                ) : (
                  <ShoppingCartIcon className="h-5 w-5" />
                )}
                {isAddingToCart ? 'Adding...' : isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>

            <div className="flex justify-center mb-6">
              {/* ✅ FIX 4: Out of Stock label on button */}
              <button
                onClick={handleBuyNow}
                disabled={isBuyingNow || isOutOfStock}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm active:scale-95 ${
                  isOutOfStock
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                }`}
              >
                {isBuyingNow ? (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )}
                {isBuyingNow ? 'Processing...' : isOutOfStock ? 'Out of Stock' : 'Buy Now'}
              </button>
            </div>

            {/* Perks */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { icon: '🚚', label: 'Free Delivery', sub: 'On orders over ₹1000' },
                { icon: '↩️', label: 'Easy Returns', sub: '7-days return policy' },
                { icon: '✅', label: 'Genuine', sub: '100% authentic' },
              ].map(({ icon, label, sub }) => (
                <div key={label} className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="text-xl mb-1">{icon}</div>
                  <div className="text-xs font-semibold text-gray-700">{label}</div>
                  <div className="text-xs text-gray-400">{sub}</div>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Description</h3>
              <div
                className="text-sm text-gray-600 leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: displayProduct.description || 'No description available.' }}
              />
            </div>
          </div>
        </div>

        <div id="ratings" className="mt-12">
          <RatingReview productId={displayProduct._id} />
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          onClick={() => setShowImageModal(false)}
        >
          <div
            className="relative bg-white rounded-2xl overflow-hidden max-w-3xl w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow hover:bg-gray-100"
            >
              <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={currentImage}
              alt={displayProduct.name}
              className="w-full h-auto max-h-[85vh] object-contain p-6"
              onError={(e) => { e.target.src = '/images/products/placeholder-product.svg'; }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;