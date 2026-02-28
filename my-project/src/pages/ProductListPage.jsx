import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useGetProductsQuery } from '../redux/services/products';
import { useGetCategoriesQuery } from '../redux/services/categories';
import ProductCard from '../components/product/ProductCard';
import SidebarFilters from '../components/home/SidebarFilters';
import { Filter, X, Search, ChevronLeft, ChevronRight, Grid3X3, List } from 'lucide-react';

const ITEMS_PER_PAGE = 12;

const ProductListPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('featured');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('grid');
  const [filters, setFilters] = useState({
    category: null,
    subcategory: null,
    priceRange: { min: 0, max: 10000 },
    rating: null,
    inStock: false,
  });

  const { data: apiResponse, isLoading, error, isError } = useGetProductsQuery({
    limit: 1000,
    sort: sortOption === 'featured' ? '-createdAt' :
      sortOption === 'price-low' ? 'price' :
        sortOption === 'price-high' ? '-price' : '-createdAt'
  });

  const { data: categoriesData } = useGetCategoriesQuery();
  const categories = categoriesData?.data || [];

  const getCategoryName = (id) => {
    return categories.find(c => c._id === id)?.name || null;
  };

  const getSubcategoryName = (id) => {
    for (const cat of categories) {
      const sub = cat.subcategories?.find(s => s._id === id);
      if (sub) return sub.name;
    }
    return null;
  };

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const subcategoryParam = searchParams.get('subcategory');
    const ratingParam = searchParams.get('rating');
    const searchParam = searchParams.get('search');

    setFilters(prev => ({
      ...prev,
      category: categoryParam || null,
      subcategory: subcategoryParam || null,
      // preserve existing rating if no rating param in URL
      ...(ratingParam !== null ? { rating: parseInt(ratingParam) } : { rating: prev.rating }),
    }));

    if (searchParam) setSearchTerm(searchParam);
    setCurrentPage(1);
  }, [searchParams]);

  useEffect(() => {
    if (isError) console.error('Error fetching products:', error);
  }, [apiResponse, isError, error]);

  const allProducts = useMemo(() => {
    try {
      if (isError || !apiResponse) return [];

      let products = [];

      if (Array.isArray(apiResponse)) {
        products = apiResponse.filter(p => p && typeof p === 'object');
      } else if (apiResponse && typeof apiResponse === 'object') {
        if (apiResponse.success && apiResponse.data) {
          if (Array.isArray(apiResponse.data)) {
            products = apiResponse.data.filter(p => p && typeof p === 'object');
          } else if (Array.isArray(apiResponse.data.products)) {
            products = apiResponse.data.products.filter(p => p && typeof p === 'object');
          } else if (apiResponse.data.data && Array.isArray(apiResponse.data.data)) {
            products = apiResponse.data.data.filter(p => p && typeof p === 'object');
          }
        } else if (Array.isArray(apiResponse.products)) {
          products = apiResponse.products.filter(p => p && typeof p === 'object');
        } else if (apiResponse.data) {
          if (Array.isArray(apiResponse.data)) {
            products = apiResponse.data.filter(p => p && typeof p === 'object');
          } else if (Array.isArray(apiResponse.data.products)) {
            products = apiResponse.data.products.filter(p => p && typeof p === 'object');
          }
        }
      }

      const publishedProducts = products.filter(product => {
        if (!product) return false;
        if (product.product_structure === 'variant') {
          return product.product_variants &&
            product.product_variants.some(v => v.published === true);
        }
        return product.published === true;
      });

      const transformedProducts = publishedProducts.map(product => {
        if (product.product_structure === 'variant' && product.product_variants?.length > 0) {
          const firstVariantWithImage = product.product_variants.find(
            v => v.images && v.images.length > 0
          );
          const cardImage = product.image_url?.length > 0
            ? product.image_url
            : (firstVariantWithImage?.images || []);
          const firstPublishedVariant = product.product_variants.find(v => v.published);
          const variantPrice = firstPublishedVariant?.selling_price || 0;
          return {
            ...product,
            image_url: cardImage,
            selling_price: variantPrice,
            _isVariant: false,
            isVariant: false,
          };
        }
        return { ...product, _isVariant: false, isVariant: false };
      });

      return transformedProducts;
    } catch (err) {
      console.error('Error processing API response:', err);
      return [];
    }
  }, [apiResponse, isError]);

  const activeFilters = useMemo(() => {
    const active = [];
    if (filters.category) {
      const name = getCategoryName(filters.category) ||
        categories.find(c => c.slug === filters.category)?.name ||
        filters.category;
      active.push({ type: 'category', value: name });
    }
    if (filters.subcategory) {
      const name = getSubcategoryName(filters.subcategory) ||
        categories.flatMap(c => c.subcategories || []).find(s => s.slug === filters.subcategory)?.name ||
        filters.subcategory;
      active.push({ type: 'subcategory', value: name });
    }
    if (filters.rating) active.push({ type: 'rating', value: `${filters.rating} Stars & Up` });
    if (searchTerm) active.push({ type: 'search', value: searchTerm });
    return active;
  }, [filters, searchTerm, categories]);

  const { products, totalPages, totalItems } = useMemo(() => {
    if (!allProducts || allProducts.length === 0) {
      return { products: [], totalPages: 0, totalItems: 0 };
    }

    let filtered = allProducts.filter(product => {
      if (!product || typeof product !== 'object') return false;
      if (!product.name) return false;

      const matchesSearch = searchTerm === '' ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = !filters.category ||
        (product.categories && product.categories.some(cat =>
          cat.category?.name === filters.category ||
          cat.category?._id === filters.category ||
          cat.category?.slug === filters.category ||
          cat.category?.name?.toLowerCase().replace(/\s+/g, '-') === filters.category
        ));

      const matchesSubcategory = !filters.subcategory ||
        (product.categories && product.categories.some(cat =>
          cat.subcategories?.some(sub =>
            sub.name === filters.subcategory ||
            sub._id === filters.subcategory ||
            sub.slug === filters.subcategory ||
            sub.name?.toLowerCase().replace(/\s+/g, '-') === filters.subcategory
          )
        ));

      const price = Number(product.selling_price || product.salePrice || product.price || 0);
      const matchesPrice = price >= Number(filters.priceRange.min) && price <= Number(filters.priceRange.max);

      const rating = Number(product.averageRating || 0);
      const matchesRating = !filters.rating || rating >= filters.rating;

      const matchesInStock = !filters.inStock ||
        (product.baseStock > 0) ||
        (product.product_variants && product.product_variants.some(v => v.stock > 0));

      return matchesSearch && matchesCategory && matchesSubcategory &&
        matchesPrice && matchesRating && matchesInStock;
    });

    filtered = [...filtered].sort((a, b) => {
      switch (sortOption) {
        case 'price-low':
          return Number(a.selling_price || 0) - Number(b.selling_price || 0);
        case 'price-high':
          return Number(b.selling_price || 0) - Number(a.selling_price || 0);
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'featured':
        default:
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedProducts = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    return { products: paginatedProducts, totalPages, totalItems: filtered.length };
  }, [allProducts, searchTerm, filters, sortOption, currentPage]);

  const clearFilter = (type, e) => {
    e.preventDefault();
    const newSearchParams = new URLSearchParams(searchParams);

    if (type === 'category') {
      setFilters(prev => ({ ...prev, category: null, subcategory: null }));
      newSearchParams.delete('category');
      newSearchParams.delete('subcategory');
    } else if (type === 'subcategory') {
      setFilters(prev => ({ ...prev, subcategory: null }));
      newSearchParams.delete('subcategory');
    } else if (type === 'rating') {
      setFilters(prev => ({ ...prev, rating: null }));
      newSearchParams.delete('rating');
    } else if (type === 'search') {
      setSearchTerm('');
      newSearchParams.delete('search');
    }

    setCurrentPage(1);
    navigate({ search: newSearchParams.toString() });
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f7f5f2' }}>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-400 mt-4 tracking-wide">Loading products…</p>
        </div>
      </div>
    );
  }

  if (isError || error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f7f5f2' }}>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center max-w-sm">
          <p className="text-sm font-semibold text-gray-800 mb-2">Failed to load products</p>
          <p className="text-xs text-gray-400 mb-6">Please try again later.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2 bg-gray-900 text-white text-xs font-semibold rounded-xl hover:bg-gray-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#f7f5f2' }}>

      {/* ── Header ── */}
      {/* ── Header ── */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-8 py-5">
          <div className="flex flex-wrap items-center gap-4">

            {/* Title */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-semibold text-gray-900 tracking-tight">All Products</h1>
              <p className="text-xs text-gray-400 mt-0.5">
                {totalItems || 0} {totalItems === 1 ? 'product' : 'products'}
                {searchTerm && <span className="text-gray-500"> · "{searchTerm}"</span>}
              </p>
            </div>

            {/* Search */}
            <form onSubmit={e => e.preventDefault()} className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
              <input
                type="text"
                placeholder="Search products…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs bg-gray-50 border border-transparent rounded-full focus:outline-none focus:border-gray-200 focus:bg-white text-gray-700 placeholder-gray-300 transition-all"
              />
            </form>

            {/* Sort + View */}
            <div className="flex items-center gap-2">
              <select
                value={sortOption}
                onChange={handleSortChange}
                className="text-xs bg-gray-50 border border-transparent hover:border-gray-200 rounded-full px-4 py-2 focus:outline-none text-gray-600 cursor-pointer transition-all appearance-none pr-8"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="newest">Newest</option>
              </select>

              <div className="flex bg-gray-100 rounded-full p-1 gap-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-full transition-all ${viewMode === 'grid' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Grid3X3 size={13} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-full transition-all ${viewMode === 'list' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <List size={13} />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Mobile filter bar ── */}
      <div className="lg:hidden max-w-screen-xl mx-auto px-4 pt-4">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">

          {/* Filter trigger */}
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium border transition-all flex-shrink-0
        ${activeFilters.length > 0
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
          >
            <Filter size={12} />
            Filters
            {activeFilters.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-white/25 text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilters.length}
              </span>
            )}
          </button>

          {/* Divider */}
          {activeFilters.length > 0 && (
            <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
          )}

          {/* Active chips — horizontally scrollable */}
          {activeFilters.map((filter, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-full flex-shrink-0 shadow-sm"
            >
              {filter.value}
              <button
                onClick={e => clearFilter(filter.type, e)}
                className="w-3.5 h-3.5 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={8} />
              </button>
            </span>
          ))}

          {/* Clear all */}
          {activeFilters.length > 1 && (
            <button
              onClick={e => { e.preventDefault(); setFilters({ category: null, subcategory: null, priceRange: { min: 0, max: 10000 }, rating: null, inStock: false }); setSearchTerm(''); navigate({ search: '' }); }}
              className="text-xs text-gray-400 hover:text-gray-600 flex-shrink-0 underline underline-offset-2"
            >
              Clear all
            </button>
          )}
        </div>
      </div>


      {/* ── Body ── */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-8 py-6">
        <div className="flex gap-8">

          {/* Sidebar — desktop only, SidebarFilters handles mobile drawer internally */}
          <aside className="hidden lg:block w-80 flex-shrink-0 sticky top-6 self-start">
            <SidebarFilters
              filters={filters}
              onFilterChange={newFilters => setFilters(prev => ({ ...prev, ...newFilters }))}
              isMobileOpen={mobileFiltersOpen}
              onMobileClose={() => setMobileFiltersOpen(false)}
            />
          </aside>

          {/* Mobile: SidebarFilters rendered outside aside so drawer portal works */}
          <div className="lg:hidden">
            <SidebarFilters
              filters={filters}
              onFilterChange={newFilters => setFilters(prev => ({ ...prev, ...newFilters }))}
              isMobileOpen={mobileFiltersOpen}
              onMobileClose={() => setMobileFiltersOpen(false)}
            />
          </div>

          {/* Products */}
          <main className="flex-1 min-w-0">
            {products && products.length > 0 ? (
              <>
                <div className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5'
                    : 'space-y-4'
                }>
                  {products.map(product => (
                    <div key={product._id} className={viewMode === 'grid' ? 'flex' : ''}>
                      <ProductCard
                        product={product}
                        className={viewMode === 'grid' ? 'flex-1 flex flex-col' : ''}
                        viewMode={viewMode}
                      />
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 pt-6 border-t border-gray-200 flex flex-wrap items-center justify-between gap-4">
                    <p className="text-xs text-gray-500">
                      Showing <span className="font-semibold text-gray-800">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span>–
                      <span className="font-semibold text-gray-800">{Math.min(currentPage * ITEMS_PER_PAGE, totalItems)}</span> of{' '}
                      <span className="font-semibold text-gray-800">{totalItems}</span>
                    </p>
                    <div className="flex bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border-r border-gray-100"
                      >
                        <ChevronLeft size={15} />
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) pageNum = i + 1;
                        else if (currentPage <= 3) pageNum = i + 1;
                        else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                        else pageNum = currentPage - 2 + i;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-4 py-2.5 text-xs font-semibold border-r border-gray-100 transition-colors
                              ${currentPage === pageNum
                                ? 'bg-gray-900 text-white'
                                : 'text-gray-600 hover:bg-gray-50'}`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-2.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-16 text-center">
                <svg className="w-12 h-12 text-gray-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-sm font-semibold text-gray-800 mb-1">No products found</h3>
                <p className="text-xs text-gray-400 mb-6">We couldn't find anything matching your filters.</p>
                <Link
                  to="/products"
                  className="inline-block px-5 py-2 bg-gray-900 text-white text-xs font-semibold rounded-xl hover:bg-gray-700 transition-colors"
                >
                  Clear all filters
                </Link>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProductListPage;