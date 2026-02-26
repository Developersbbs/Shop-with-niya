import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRightIcon,
  SparklesIcon,
  TagIcon,
  ShoppingBagIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { useGetCategoriesQuery } from '../../redux/services/categories';

/* ── Inject keyframes once ── */
const STYLE_ID = 'categories-anim-styles';
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');

    @keyframes fadeSlideUp {
      from { opacity: 0; transform: translateY(48px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0)   scale(1);    }
    }
    @keyframes shimmer {
      0%   { background-position: -200% center; }
      100% { background-position:  200% center; }
    }
    @keyframes float {
      0%, 100% { transform: translateY(0px);  }
      50%       { transform: translateY(-6px); }
    }
    .cat-card-enter {
      opacity: 0;
      transform: translateY(48px) scale(0.97);
    }
    .cat-card-enter.visible {
      animation: fadeSlideUp 0.65s cubic-bezier(0.22,1,0.36,1) forwards;
    }
    .cat-shimmer-skeleton {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
    }
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `;
  document.head.appendChild(s);
}

/* ── Hook: triggers .visible when element scrolls into view ── */
const useInViewAnimation = (delay = 0) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => el.classList.add('visible'), delay);
          observer.unobserve(el);
        }
      },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);
  return ref;
};

/* ── Section heading ── */
const SectionHeading = () => {
  const ref = useInViewAnimation(0);
  return (
    <div ref={ref} className="cat-card-enter text-center mb-14">
      <span
        className="inline-block text-xs font-bold uppercase tracking-[0.3em] mb-3"
        style={{ color: '#082B27', opacity: 0.45 }}
      >
        Browse by Style
      </span>
      <h2
        className="text-4xl md:text-5xl font-black text-gray-900"
        style={{ fontFamily: '"Playfair Display", Georgia, serif', letterSpacing: '-0.02em' }}
      >
        Shop by <span style={{ color: '#082B27' }}>Category</span>
      </h2>
      <p className="text-gray-500 mt-3 text-sm max-w-md mx-auto leading-relaxed">
        Explore our curated collections, handpicked for every style and occasion.
      </p>
      <div className="flex justify-center mt-5">
        <div className="h-[3px] w-12 rounded-full" style={{ background: '#082B27' }} />
      </div>
    </div>
  );
};

/* ── Single category card ── */
const CategoryCard = ({ category, index, isHovered, onHover, onLeave }) => {
  const ref = useInViewAnimation(index * 80);
  const defaultImage = '/images/products/placeholder-product.svg';

  return (
    <Link
      to={`/products/category/${category.slug || category._id}`}
      className="group relative cat-card-enter"
      ref={ref}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div
        className="relative bg-white rounded-2xl overflow-hidden border border-gray-100 pb-4"
        style={{
          boxShadow: isHovered
            ? '0 20px 60px rgba(8,43,39,0.18), 0 4px 16px rgba(8,43,39,0.08)'
            : '0 4px 16px rgba(0,0,0,0.06)',
          transform: isHovered ? 'translateY(-10px) scale(1.02)' : 'translateY(0) scale(1)',
          transition: 'transform 0.4s cubic-bezier(0.22,1,0.36,1), box-shadow 0.4s ease',
        }}
      >
        {/* Image */}
        <div className="relative w-full h-[360px] md:h-[420px] overflow-hidden">
          {category.image_url ? (
            <img
              src={category.image_url}
              alt={category.name}
              className="w-full h-full object-cover"
              style={{
                transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                transition: 'transform 0.6s cubic-bezier(0.22,1,0.36,1)',
              }}
              onError={(e) => { e.target.onerror = null; e.target.src = defaultImage; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100">
              <TagIcon className="h-10 w-10 text-gray-300" />
            </div>
          )}

          {/* Gradient overlay */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent"
            style={{
              opacity: isHovered ? 1 : 0,
              transition: 'opacity 0.4s ease',
            }}
          />

          {/* Shop Now pill */}
          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2"
            style={{
              opacity: isHovered ? 1 : 0,
              transform: isHovered ? 'translateY(0)' : 'translateY(12px)',
              transition: 'opacity 0.35s ease 0.05s, transform 0.35s cubic-bezier(0.22,1,0.36,1) 0.05s',
              pointerEvents: 'none',
            }}
          >
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-[#082B27] font-bold text-xs shadow-xl whitespace-nowrap">
              <ShoppingBagIcon className="w-3.5 h-3.5" />
              Shop Now
            </span>
          </div>

          {/* Sparkle badge */}
          <div
            className="absolute top-3 left-3"
            style={{
              opacity: isHovered ? 1 : 0,
              transform: isHovered ? 'scale(1) rotate(0deg)' : 'scale(0.5) rotate(-20deg)',
              transition: 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
              animation: isHovered ? 'float 2.5s ease-in-out infinite' : 'none',
            }}
          >
            <div className="rounded-full p-1.5" style={{ background: '#082B27' }}>
              <SparklesIcon className="h-3 w-3 text-white" />
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="text-center px-3 pt-4">
          <h3
            className="font-semibold text-sm md:text-base mb-1 line-clamp-2"
            style={{
              color: isHovered ? '#082B27' : '#111827',
              transition: 'color 0.2s ease',
              fontFamily: '"Playfair Display", Georgia, serif',
            }}
          >
            {category.name}
          </h3>

          {category.product_count && (
            <p className="text-xs text-gray-400 mb-2">
              {category.product_count} {category.product_count === 1 ? 'product' : 'products'}
            </p>
          )}

          <div
            className="inline-flex items-center text-xs font-semibold"
            style={{
              color: '#082B27',
              transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
              transition: 'transform 0.3s ease',
            }}
          >
            <span>Explore</span>
            <ChevronRightIcon className="h-3 w-3 ml-1" />
          </div>
        </div>
      </div>
    </Link>
  );
};

/* ── Loading skeletons ── */
const SkeletonGrid = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="rounded-2xl overflow-hidden">
        <div className="cat-shimmer-skeleton h-[360px] w-full rounded-2xl mb-4" />
        <div className="cat-shimmer-skeleton h-4 w-2/3 mx-auto rounded mb-2" />
        <div className="cat-shimmer-skeleton h-3 w-1/3 mx-auto rounded" />
      </div>
    ))}
  </div>
);

/* ── Main component ── */
const Categories = () => {
  const { data: categoriesData, isLoading, error, isError } = useGetCategoriesQuery();
  const categories = categoriesData?.data || [];
  const [hoveredCategory, setHoveredCategory] = useState(null);

  if (isLoading) {
    return (
      <section className="py-20 container mx-auto px-4">
        <SectionHeading />
        <SkeletonGrid />
      </section>
    );
  }

  if (isError) {
    return (
      <section className="py-20 container mx-auto px-4 text-center">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md mx-auto">
          <TagIcon className="h-8 w-8 text-red-400 mx-auto mb-3" />
          <h3 className="font-semibold text-red-900 mb-2">Unable to load categories</h3>
          <p className="text-red-600 text-sm mb-4">
            {error?.data?.error || error?.error || 'Something went wrong'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return (
      <section className="py-20 container mx-auto px-4 text-center">
        <ShoppingBagIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No categories available yet.</p>
      </section>
    );
  }

  return (
    <section className="py-20" style={{ background: 'linear-gradient(to bottom, #fff, #f7faf9, #fff)' }}>
      <div className="container mx-auto px-4">
        <SectionHeading />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {categories.map((category, index) => (
            <CategoryCard
              key={category._id}
              category={category}
              index={index}
              isHovered={hoveredCategory === category._id}
              onHover={() => setHoveredCategory(category._id)}
              onLeave={() => setHoveredCategory(null)}
            />
          ))}
        </div>

        {categories.length >= 6 && (
          <div className="text-center mt-14">
            <Link
              to="/categories"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold text-sm text-white transition-all duration-300 hover:scale-105 active:scale-95"
              style={{
                background: '#082B27',
                boxShadow: '0 6px 22px rgba(8,43,39,0.35)',
              }}
            >
              <TagIcon className="h-4 w-4" />
              View All Categories
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default Categories;