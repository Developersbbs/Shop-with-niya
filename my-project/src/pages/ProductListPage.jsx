import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useGetProductsQuery } from '../redux/services/products';
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

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const subcategoryParam = searchParams.get('subcategory');
    const ratingParam = searchParams.get('rating');
    const searchParam = searchParams.get('search');
    setFilters(prev => ({
      ...prev,
      category: categoryParam || null,
      subcategory: subcategoryParam || null,
      rating: ratingParam ? parseInt(ratingParam) : null,
    }));
    if (searchParam) setSearchTerm(searchParam);
    setCurrentPage(1);
  }, [searchParams]);

  useEffect(() => {
    if (isError) console.error('Error fetching products:', error);
  }, [apiResponse, isError, error]);

  // ✅ FIX 1: Don't expand variants. Show parent product as ONE card.
  // ✅ FIX 2: Filter out unpublished products immediately after parsing.
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

      // ✅ FIX 2: Hide unpublished products
      // For simple products: check product.published === true
      // For variant products: check if at least one variant is published
      const publishedProducts = products.filter(product => {
        if (!product) return false;

        if (product.product_structure === 'variant') {
          // Show variant product only if at least one variant is published
          return product.product_variants &&
            product.product_variants.some(v => v.published === true);
        }

        // Simple products: must be published
        return product.published === true;
      });

      // ✅ FIX 1: Show parent product as a single card — no variant expansion
      // ProductCard already handles showing first variant image/price internally
      const transformedProducts = publishedProducts.map(product => {
        if (product.product_structure === 'variant' && product.product_variants?.length > 0) {
          // Get first variant image to use as card image if parent has no images
          const firstVariantWithImage = product.product_variants.find(
            v => v.images && v.images.length > 0
          );
          const cardImage = product.image_url?.length > 0
            ? product.image_url
            : (firstVariantWithImage?.images || []);

          // Get price from first published variant
          const firstPublishedVariant = product.product_variants.find(v => v.published);
          const variantPrice = firstPublishedVariant?.selling_price || 0;

          return {
            ...product,
            image_url: cardImage,          // ← use variant image if parent has none
            selling_price: variantPrice,   // ← show starting price on card
            _isVariant: false,
            isVariant: false,
          };
        }

        // Simple product — pass through as-is
        return {
          ...product,
          _isVariant: false,
          isVariant: false,
        };
      });

      console.log('Products after published filter + no variant expansion:', transformedProducts.length);
      return transformedProducts;

    } catch (err) {
      console.error('Error processing API response:', err);
      return [];
    }
  }, [apiResponse, isError]);

  const activeFilters = useMemo(() => {
    const active = [];
    if (filters.category) active.push({ type: 'category', value: filters.category });
    if (filters.subcategory) active.push({ type: 'subcategory', value: filters.subcategory });
    if (filters.rating) active.push({ type: 'rating', value: `${filters.rating} Stars & Up` });
    if (searchTerm) active.push({ type: 'search', value: searchTerm });
    return active;
  }, [filters, searchTerm]);

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
          cat.category?._id === filters.category
        ));

      const matchesSubcategory = !filters.subcategory ||
        (product.categories && product.categories.some(cat =>
          cat.subcategories?.some(sub =>
            sub.name === filters.subcategory ||
            sub._id === filters.subcategory
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

    return {
      products: paginatedProducts,
      totalPages,
      totalItems: filtered.length
    };
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
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <span className="ml-4 text-gray-600">Loading products...</span>
        </div>
      </div>
    );
  }

  if (isError || error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center text-red-500 py-8 bg-red-50 rounded-lg border border-red-200">
          <h3 className="text-lg font-medium mb-2">Error loading products</h3>
          <p className="text-sm text-gray-600">Failed to load products. Please try again later.</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm font-medium">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">All Products</h1>
            <p className="text-sm text-gray-500 mt-1">
              {totalItems || 0} {totalItems === 1 ? 'product' : 'products'} found
              {searchTerm && ` for "${searchTerm}"`}
            </p>
          </div>

          {/* Search bar */}
          <form onSubmit={(e) => e.preventDefault()} className="w-full md:w-1/3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </form>

          {/* Sort */}
          <div className="flex items-center space-x-4">
            <label htmlFor="sort" className="text-sm font-medium text-gray-700 mr-2">Sort by:</label>
            <select
              id="sort"
              value={sortOption}
              onChange={handleSortChange}
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm cursor-pointer"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="newest">Newest Arrivals</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center">
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'} transition-colors duration-200`}
                title="Grid View"
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'} transition-colors duration-200`}
                title="List View"
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile filter button */}
      <div className="lg:hidden mb-6 px-4">
        <button
          type="button"
          className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          onClick={() => setMobileFiltersOpen(true)}
        >
          <Filter className="mr-2 h-5 w-5 text-gray-500" />
          Filters
          {activeFilters.length > 0 && (
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {activeFilters.length}
            </span>
          )}
        </button>
      </div>

      {/* Active filters */}
      {activeFilters.length > 0 && (
        <div className="mb-6 px-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Active filters:</h3>
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((filter, i) => (
              <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {filter.type}: {filter.value}
                <button
                  onClick={(e) => clearFilter(filter.type, e)}
                  className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-blue-200 hover:bg-blue-300"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4">
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Sidebar */}
          <div className="hidden lg:block space-y-6 sticky top-4 self-start">
            <SidebarFilters
              filters={filters}
              onFilterChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))}
            />
          </div>

          {/* Product grid */}
          <div className="lg:col-span-3">
            {products && products.length > 0 ? (
              <>
                <div className={
                  viewMode === 'grid'
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6"
                    : "space-y-4"
                }>
                  {products.map((product) => (
                    <div key={product._id} className={viewMode === 'grid' ? "h-full flex" : ""}>
                      <ProductCard
                        product={product}
                        className={viewMode === 'grid' ? "flex-1 flex flex-col" : ""}
                        viewMode={viewMode}
                      />
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6">
                    <div className="flex flex-1 justify-between sm:hidden">
                      <button
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                        <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, totalItems)}</span>{' '}
                        of <span className="font-medium">{totalItems}</span> results
                      </p>
                      <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="h-5 w-5" />
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
                              className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                currentPage === pageNum
                                  ? 'z-10 bg-blue-600 text-white'
                                  : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </nav>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-gray-300">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
                <p className="mt-1 text-sm text-gray-500">We couldn't find any products matching your filters.</p>
                <div className="mt-6">
                  <Link to="/products" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                    Clear all filters
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductListPage;