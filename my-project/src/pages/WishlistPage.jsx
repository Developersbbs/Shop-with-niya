import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  HeartIcon,
  ShoppingBagIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ChevronDownIcon,
  XMarkIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import WishlistItem from '../components/wishlist/WishlistItem';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import UnauthenticatedEmptyState from '../components/common/UnauthenticatedEmptyState';
import toast from 'react-hot-toast';

export default function WishlistPage() {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { items: wishlistItems, removeFromWishlist, clearWishlist, loading } = useWishlist();
  const { addToCart } = useCart();
  const [isAddingAllToCart, setIsAddingAllToCart] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });

  const filteredAndSortedItems = useMemo(() => {
    let filtered = [...wishlistItems];
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (priceRange.min || priceRange.max) {
      filtered = filtered.filter(item => {
        const price = item.price || item.selling_price || 0;
        const min = priceRange.min ? parseFloat(priceRange.min) : 0;
        const max = priceRange.max ? parseFloat(priceRange.max) : Infinity;
        return price >= min && price <= max;
      });
    }
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name': return (a.name || '').localeCompare(b.name || '');
        case 'price-low': return (a.price || a.selling_price || 0) - (b.price || b.selling_price || 0);
        case 'price-high': return (b.price || b.selling_price || 0) - (a.price || a.selling_price || 0);
        case 'oldest': return new Date(a.addedAt || 0) - new Date(b.addedAt || 0);
        default: return new Date(b.addedAt || 0) - new Date(a.addedAt || 0);
      }
    });
    return filtered;
  }, [wishlistItems, searchQuery, priceRange, sortBy]);

  // ✅ FIXED: handleAddAllToCart is now properly defined
const handleAddAllToCart = async (items = filteredAndSortedItems) => {
  if (items.length === 0) return;
  setIsAddingAllToCart(true);
  let successCount = 0;
  let failCount = 0;

  for (const item of items) {
    try {
      const productId = item._id || item.id;
      await addToCart({
        _id: productId,
        name: item.name,
        selling_price: item.price || 1,
        price: item.price || 1,
        image_url: item.image ? [item.image] : [],
      });
      successCount++;
    } catch (err) {
      failCount++;
      console.error('Failed item:', item.name, err.message);
    }
  }

  // ✅ Only ONE summary toast at the end
  if (successCount > 0 && failCount === 0) {
    toast.success(`${successCount} item${successCount > 1 ? 's' : ''} added to cart!`);
  } else if (successCount > 0 && failCount > 0) {
    toast.success(`${successCount} item${successCount > 1 ? 's' : ''} added to cart`);
    toast.error(`${failCount} item${failCount > 1 ? 's' : ''} could not be added`);
  } else {
    toast.error('Failed to add items to cart');
  }

  setIsAddingAllToCart(false);
};

  const handleAddSelectedToCart = async () => {
    const selected = filteredAndSortedItems.filter(item => selectedItems.has(item._id || item.id));
    await handleAddAllToCart(selected);
  };

  const handleRemoveSelected = async () => {
    if (selectedItems.size === 0) return;
    try {
      for (const itemId of selectedItems) await removeFromWishlist(itemId);
      setSelectedItems(new Set());
      toast.success(`Removed ${selectedItems.size} items`);
    } catch {
      toast.error('Failed to remove selected items');
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.size === filteredAndSortedItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredAndSortedItems.map(item => item._id || item.id)));
    }
  };

  const handleItemSelect = (itemId) => {
    const newSelected = new Set(selectedItems);
    newSelected.has(itemId) ? newSelected.delete(itemId) : newSelected.add(itemId);
    setSelectedItems(newSelected);
  };

  const handleClearWishlist = async () => {
    try {
      await clearWishlist();
      toast.success('Wishlist cleared');
    } catch {
      toast.error('Failed to clear wishlist');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your wishlist..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px w-10 bg-[#1a3c2e]/30" />
            <span className="text-[#1a3c2e]/40 text-sm">✦</span>
            <div className="h-px w-10 bg-[#1a3c2e]/30" />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1a3c2e]/8 flex items-center justify-center shrink-0">
                <HeartSolidIcon className="w-5 h-5 text-[#1a3c2e]/50" />
              </div>
              <div>
                <p className="text-xs tracking-[0.25em] uppercase text-[#1a3c2e]/50 font-medium">Your Saved Items</p>
                <h1
                  className="text-[#1a3c2e] leading-tight"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 700 }}
                >
                  My Wishlist
                </h1>
                <p className="text-[#1a3c2e]/40 text-xs mt-0.5">
                  {filteredAndSortedItems.length} {filteredAndSortedItems.length === 1 ? 'item' : 'items'} saved
                </p>
              </div>
            </div>

            {filteredAndSortedItems.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {selectedItems.size > 0 && (
                  <>
                    <button
                      onClick={handleAddSelectedToCart}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-[#1a3c2e] text-white text-xs tracking-wider uppercase hover:bg-[#2d5a42] transition-colors"
                    >
                      <ShoppingBagIcon className="w-3.5 h-3.5" />
                      Add Selected ({selectedItems.size})
                    </button>
                    <button
                      onClick={handleRemoveSelected}
                      className="px-3 py-2 border border-red-200 text-red-400 text-xs tracking-wider uppercase hover:bg-red-50 transition-colors"
                    >
                      Remove
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleAddAllToCart()}
                  disabled={isAddingAllToCart}
                  className="inline-flex items-center gap-2 px-3 py-2 border border-[#1a3c2e] text-[#1a3c2e] text-xs tracking-wider uppercase hover:bg-[#1a3c2e] hover:text-white transition-all disabled:opacity-50"
                >
                  <ShoppingBagIcon className="w-3.5 h-3.5" />
                  {isAddingAllToCart ? 'Adding...' : 'Add All to Cart'}
                </button>
                <button
                  onClick={handleClearWishlist}
                  className="px-3 py-2 border border-red-200 text-red-400 text-xs tracking-wider uppercase hover:bg-red-50 transition-colors"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 mt-6">
            <div className="h-px flex-1 bg-[#1a3c2e]/10" />
            <span className="text-[#1a3c2e]/20 text-lg">❧</span>
            <div className="h-px flex-1 bg-[#1a3c2e]/10" />
          </div>
        </div>

        {/* Empty States */}
        {filteredAndSortedItems.length === 0 && wishlistItems.length === 0 ? (
          !isAuthenticated ? (
            <UnauthenticatedEmptyState type="wishlist" />
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-full bg-[#1a3c2e]/6 flex items-center justify-center mb-5">
                <HeartIcon className="w-8 h-8 text-[#1a3c2e]/25" />
              </div>
              <h2
                className="text-[#1a3c2e] mb-2"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '24px', fontWeight: 700 }}
              >
                Your wishlist is empty
              </h2>
              <p className="text-[#1a3c2e]/40 text-sm mb-7 max-w-xs">
                Save pieces you love and find them here whenever you're ready.
              </p>
              <Link
                to="/products"
                className="px-7 py-3 bg-[#1a3c2e] text-white text-xs tracking-widest uppercase hover:bg-[#2d5a42] transition-colors"
              >
                Explore Collection
              </Link>
            </div>
          )
        ) : (
          <>
            {/* Filters */}
            {wishlistItems.length > 0 && (
              <div className="bg-white border border-[#1a3c2e]/10 mb-6 p-4">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  {/* Search */}
                  <div className="relative w-full sm:max-w-xs">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1a3c2e]/30" />
                    <input
                      type="text"
                      placeholder="Search wishlist..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-3 py-2 w-full border border-[#1a3c2e]/15 text-sm text-[#1a3c2e] placeholder-[#1a3c2e]/30 focus:outline-none focus:border-[#1a3c2e]/40 bg-[#faf8f5]"
                    />
                  </div>

                  {/* Price Range */}
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="number"
                      placeholder="Min ₹"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange(p => ({ ...p, min: e.target.value }))}
                      className="w-20 px-2 py-2 border border-[#1a3c2e]/15 text-sm text-[#1a3c2e] focus:outline-none bg-[#faf8f5]"
                    />
                    <span className="text-[#1a3c2e]/30">—</span>
                    <input
                      type="number"
                      placeholder="Max ₹"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange(p => ({ ...p, max: e.target.value }))}
                      className="w-20 px-2 py-2 border border-[#1a3c2e]/15 text-sm text-[#1a3c2e] focus:outline-none bg-[#faf8f5]"
                    />
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    {/* Sort */}
                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="appearance-none bg-[#faf8f5] border border-[#1a3c2e]/15 text-[#1a3c2e] text-xs tracking-wide px-3 py-2 pr-7 focus:outline-none"
                      >
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                        <option value="name">Name A–Z</option>
                        <option value="price-low">Price ↑</option>
                        <option value="price-high">Price ↓</option>
                      </select>
                      <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#1a3c2e]/40 pointer-events-none" />
                    </div>

                    {/* View Toggle */}
                    <div className="flex border border-[#1a3c2e]/15 overflow-hidden">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-[#1a3c2e] text-white' : 'text-[#1a3c2e]/40 hover:text-[#1a3c2e]'}`}
                      >
                        <Squares2X2Icon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-[#1a3c2e] text-white' : 'text-[#1a3c2e]/40 hover:text-[#1a3c2e]'}`}
                      >
                        <ListBulletIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Select All */}
                {filteredAndSortedItems.length > 0 && (
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#1a3c2e]/8">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedItems.size === filteredAndSortedItems.length && filteredAndSortedItems.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-[#1a3c2e]/30 text-[#1a3c2e] focus:ring-[#1a3c2e]"
                      />
                      <span className="text-xs tracking-wide text-[#1a3c2e]/50 uppercase">
                        Select All ({filteredAndSortedItems.length})
                        {selectedItems.size > 0 && <span className="text-[#1a3c2e] ml-1 font-medium">· {selectedItems.size} selected</span>}
                      </span>
                    </label>
                    {(searchQuery || priceRange.min || priceRange.max) && (
                      <button
                        onClick={() => { setSearchQuery(''); setPriceRange({ min: '', max: '' }); }}
                        className="flex items-center gap-1 text-xs text-[#1a3c2e]/40 hover:text-[#1a3c2e]"
                      >
                        <XMarkIcon className="w-3.5 h-3.5" /> Clear Filters
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* No results after filter */}
            {filteredAndSortedItems.length === 0 && wishlistItems.length > 0 && (
              <div className="text-center py-20">
                <MagnifyingGlassIcon className="w-10 h-10 text-[#1a3c2e]/20 mx-auto mb-4" />
                <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className="text-[#1a3c2e] text-xl font-bold mb-2">No items found</h3>
                <p className="text-[#1a3c2e]/40 text-sm mb-5">Try adjusting your search or filters</p>
                <button
                  onClick={() => { setSearchQuery(''); setPriceRange({ min: '', max: '' }); }}
                  className="text-xs tracking-widest uppercase text-[#1a3c2e] underline underline-offset-4"
                >
                  Clear all filters
                </button>
              </div>
            )}

            {/* Items Grid / List */}
            {filteredAndSortedItems.length > 0 && (
              <div className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-5 items-start'
                  : 'space-y-4'
              }>
                {filteredAndSortedItems.map((item) => (
                  <WishlistItem
                    key={item.wishlistItemId || item._id || item.id}
                    item={item}
                    onRemove={removeFromWishlist}
                    loading={loading}
                    viewMode={viewMode}
                    isSelected={selectedItems.has(item._id || item.id)}
                    onSelect={() => handleItemSelect(item._id || item.id)}
                  />
                ))}
              </div>
            )}

            {/* You might also like */}
            {filteredAndSortedItems.length > 0 && (
              <div className="mt-14 bg-white border border-[#1a3c2e]/10 p-8 text-center">
                <div className="flex items-center gap-3 justify-center mb-3">
                  <div className="h-px w-10 bg-[#1a3c2e]/20" />
                  <span className="text-[#1a3c2e]/30">✦</span>
                  <div className="h-px w-10 bg-[#1a3c2e]/20" />
                </div>
                <h2
                  className="text-[#1a3c2e] mb-2"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 700 }}
                >
                  You might also like
                </h2>
                <p className="text-[#1a3c2e]/40 text-sm mb-6">Discover more from our collection</p>
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 px-7 py-3 bg-[#1a3c2e] text-white text-xs tracking-widest uppercase hover:bg-[#2d5a42] transition-colors"
                >
                  Browse Collection
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&display=swap');`}</style>
    </div>
  );
}