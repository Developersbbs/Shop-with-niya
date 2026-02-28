import React, { useState, useEffect, useMemo } from 'react';
import { useGetCategoriesQuery } from '../../redux/services/categories';
import { useSearchParams, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import PriceRangeSlider from '../common/PriceRangeSlider';

const SidebarFilters = ({ filters = {}, onFilterChange, isMobileOpen, onMobileClose }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { data: categoriesData } = useGetCategoriesQuery();
  const categories = categoriesData?.data || [];

  const [expandedCategories, setExpandedCategories] = useState({});
  const [categorySearchTerm, setCategorySearchTerm] = useState('');

  const categoryFilter = searchParams.get('category') || '';
  const subcategoryFilter = searchParams.get('subcategory') || '';

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleFilterSelect = (type, value, slug) => {
    const params = new URLSearchParams(location.search);

    if (type === 'category') {
      if (value === categoryFilter || slug === categoryFilter) {
        params.delete('category');
        params.delete('subcategory');
      } else {
        params.set('category', slug || value);
        params.delete('subcategory');
      }
    } else if (type === 'subcategory') {
      if (value === subcategoryFilter || slug === subcategoryFilter) {
        params.delete('subcategory');
      } else {
        params.set('subcategory', slug || value);
        if (!categoryFilter && value) {
          const parentCategory = categories.find(cat =>
            cat.subcategories?.some(sub => sub._id === value)
          );
          if (parentCategory) {
            params.set('category', parentCategory.slug || parentCategory._id);
          }
        }
      }
    }

    params.delete('page');
    setSearchParams(params);
    if (onMobileClose) onMobileClose();
  };

  const handlePriceRangeChange = (newRange) => {
    if (onFilterChange) {
      onFilterChange({ priceRange: { min: newRange[0], max: newRange[1] } });
    }
  };

  const handleRatingFilter = (rating) => {
    if (onFilterChange) {
      onFilterChange({ rating: filters.rating === rating ? null : rating });
    }
  };

  const clearFilters = () => {
    setSearchParams({});
    if (onFilterChange) {
      onFilterChange({ priceRange: { min: 0, max: 10000 }, rating: null });
    }
    if (onMobileClose) onMobileClose();
  };

  const filteredCategories = useMemo(() => {
    if (!categorySearchTerm.trim()) return categories;
    const searchLower = categorySearchTerm.toLowerCase();
    return categories.filter(category =>
      category.name.toLowerCase().includes(searchLower) ||
      category.subcategories?.some(sub => sub.name.toLowerCase().includes(searchLower))
    );
  }, [categories, categorySearchTerm]);

  useEffect(() => {
    if (subcategoryFilter && categories.length > 0) {
      const parentCategory = categories.find(cat =>
        cat.subcategories?.some(sub => sub._id === subcategoryFilter || sub.slug === subcategoryFilter)
      );
      if (parentCategory) {
        setExpandedCategories(prev => ({ ...prev, [parentCategory._id]: true }));
      }
    }
  }, [subcategoryFilter, categories]);

 const hasActiveFilters = categoryFilter || subcategoryFilter || filters.rating ||
  (filters.priceRange?.min > 0 || filters.priceRange?.max < 10000);

  const panelContent = (
    <div className="w-full">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50">
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            <h3 className="text-xs font-bold tracking-[0.15em] uppercase text-gray-700">Filters</h3>
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-400 hover:text-rose-400 transition-colors"
              >
                <X size={11} />
                Clear all
              </button>
            )}
            {onMobileClose && (
              <button
                onClick={onMobileClose}
                className="lg:hidden p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        <div className="divide-y divide-gray-50">

          {/* ── Categories ── */}
          <div className="px-5 py-5">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-3">Categories</p>

            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
              <input
                type="text"
                placeholder="Search…"
                className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 text-gray-600 placeholder-gray-300 transition"
                value={categorySearchTerm}
                onChange={e => setCategorySearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-0.5 max-h-60 overflow-y-auto pr-0.5">
              {filteredCategories.map(category => {
                const isActive =
                  categoryFilter === category._id ||
                  categoryFilter === category.slug;
                return (
                  <div key={category._id}>
                    <div
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all group
                        ${isActive ? 'bg-gray-900 text-white' : 'hover:bg-gray-50 text-gray-700'}`}
                      onClick={() => handleFilterSelect('category', category._id, category.slug)}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors
                          ${isActive ? 'bg-white' : 'bg-gray-200 group-hover:bg-gray-400'}`}
                        />
                        <span className="text-xs font-medium truncate">{category.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {isActive && (
                          <svg className="w-3 h-3 text-white/80" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        {category.subcategories?.length > 0 && (
                          <button
                            onClick={e => { e.stopPropagation(); toggleCategory(category._id); }}
                            className={`transition-colors ${isActive ? 'text-white/70 hover:text-white' : 'text-gray-300 hover:text-gray-500'}`}
                          >
                            {expandedCategories[category._id] ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </button>
                        )}
                      </div>
                    </div>

                    {category.subcategories?.length > 0 && expandedCategories[category._id] && (
                      <div className="ml-3 mt-0.5 mb-1 space-y-0.5">
                        {category.subcategories
                          .filter(sub =>
                            !categorySearchTerm.trim() ||
                            sub.name.toLowerCase().includes(categorySearchTerm.toLowerCase())
                          )
                          .map(subcategory => {
                            const isSubActive =
                              subcategoryFilter === subcategory._id ||
                              subcategoryFilter === subcategory.slug;
                            return (
                              <div
                                key={subcategory._id}
                                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition-all group text-xs
                                  ${isSubActive
                                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                                    : 'hover:bg-gray-50 text-gray-500 font-medium'}`}
                                onClick={e => { e.stopPropagation(); handleFilterSelect('subcategory', subcategory._id, subcategory.slug); }}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors
                                  ${isSubActive ? 'bg-indigo-500' : 'bg-gray-200 group-hover:bg-gray-300'}`}
                                />
                                <span className="truncate">{subcategory.name}</span>
                                {isSubActive && (
                                  <svg className="w-3 h-3 ml-auto text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredCategories.length === 0 && categorySearchTerm.trim() && (
                <div className="py-6 text-center">
                  <p className="text-xs text-gray-400">No results for "{categorySearchTerm}"</p>
                  <button
                    onClick={() => setCategorySearchTerm('')}
                    className="text-[11px] text-gray-400 hover:text-gray-600 underline mt-1"
                  >
                    Clear search
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Price Range ── */}
          <div className="px-5 py-5">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-4">Price Range</p>
            <PriceRangeSlider
              min={0}
              max={10000}
              step={100}
              value={[filters.priceRange?.min || 0, filters.priceRange?.max || 10000]}
              onChange={handlePriceRangeChange}
            />
          </div>

          {/* ── Rating ── */}
          <div className="px-5 py-5">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-3">Customer Rating</p>
            <div className="space-y-1">
              {[4, 3, 2, 1].map(rating => {
                const isActive = filters.rating === rating;
                return (
                  <div
                    key={rating}
                    onClick={() => handleRatingFilter(rating)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all group
                      ${isActive ? 'bg-amber-50 ring-1 ring-amber-200' : 'hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className={`w-3.5 h-3.5 transition-colors ${i < rating ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className={`text-xs font-medium transition-colors ${isActive ? 'text-amber-700' : 'text-gray-500 group-hover:text-gray-700'}`}>
                      {rating}★ & above
                    </span>
                    {isActive && (
                      <svg className="w-3 h-3 ml-auto text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: renders normally, mobile: renders nothing (drawer handles it) */}
      <div className="hidden lg:block w-full">
        {panelContent}
      </div>

      {/* Mobile drawer */}
      {isMobileOpen && (
        <>
          <style>{`
            @keyframes slideInLeft {
              from { transform: translateX(-100%); }
              to { transform: translateX(0); }
            }
          `}</style>
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/40" onClick={onMobileClose} />
            <div
              className="relative z-10 w-[85vw] max-w-sm h-full bg-gray-50 shadow-2xl flex flex-col"
              style={{ animation: 'slideInLeft 0.25s ease-out forwards' }}
            >
              <div className="flex-1 overflow-y-auto p-3">
                {panelContent}
              </div>
              <div className="p-4 border-t border-gray-100 bg-white shrink-0">
                <button
                  onClick={onMobileClose}
                  className="w-full py-3 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-all"
                >
                  Show Results
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default SidebarFilters;