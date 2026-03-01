import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col items-center justify-center px-6 py-20 relative overflow-hidden">

      {/* Decorative background circles */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#1a3c2e]/5 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-[#1a3c2e]/5 translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      {/* Top ornament */}
      <div className="flex items-center gap-3 mb-10">
        <div className="h-px w-16 bg-[#1a3c2e]/30" />
        <span className="text-[#1a3c2e]/50 text-lg">✦</span>
        <div className="h-px w-16 bg-[#1a3c2e]/30" />
      </div>

      {/* 404 */}
      <div className="relative mb-4 text-center">
        <span
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-bold text-[#1a3c2e]/5 select-none pointer-events-none whitespace-nowrap"
          style={{ fontSize: 'clamp(130px, 24vw, 280px)', lineHeight: 1 }}
        >
          404
        </span>
        <div className="relative z-10 py-8">
          <p className="text-xs tracking-[0.3em] uppercase text-[#1a3c2e]/50 mb-3 font-medium">
            Error 404
          </p>
          <h1
            className="text-[#1a3c2e] mb-2"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(34px, 5vw, 58px)', fontWeight: 700, lineHeight: 1.2 }}
          >
            Page Not Found
          </h1>
          <p
            className="text-[#1a3c2e]/60 italic"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(16px, 2.5vw, 22px)' }}
          >
            This page seems to have wandered away...
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-10">
        <div className="h-px w-24 bg-[#1a3c2e]/20" />
        <span className="text-[#1a3c2e]/30 text-xl">❧</span>
        <div className="h-px w-24 bg-[#1a3c2e]/20" />
      </div>

      {/* Message */}
      <p className="text-center text-[#4a5568] text-base leading-relaxed max-w-md mb-10">
        The page you're looking for doesn't exist or may have been moved.
        Let us help you find your way back to beautiful fashion.
      </p>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mb-14">
        <Link
          to="/"
          className="px-8 py-3 bg-[#1a3c2e] text-white text-xs tracking-widest uppercase font-medium hover:bg-[#2d5a42] transition-colors duration-300 text-center"
        >
          ← Back to Home
        </Link>
        <Link
          to="/shop"
          className="px-8 py-3 border border-[#1a3c2e] text-[#1a3c2e] text-xs tracking-widest uppercase font-medium hover:bg-[#1a3c2e] hover:text-white transition-all duration-300 text-center"
        >
          Browse Shop
        </Link>
        <Link
          to="/contact"
          className="px-8 py-3 border border-[#1a3c2e]/40 text-[#1a3c2e]/70 text-xs tracking-widest uppercase font-medium hover:border-[#1a3c2e] hover:text-[#1a3c2e] transition-all duration-300 text-center"
        >
          Get Help
        </Link>
      </div>

      {/* Quick links */}
      <div className="text-center">
        <p className="text-xs tracking-widest uppercase text-[#1a3c2e]/40 mb-4">Quick Links</p>
        <div className="flex flex-wrap justify-center gap-6">
          {[
            { label: 'New Arrivals', to: '/new-arrivals' },
            { label: 'Categories', to: '/categories' },
            { label: 'My Orders', to: '/my-orders' },
            { label: 'Wishlist', to: '/wishlist' },
          ].map(({ label, to }) => (
            <Link
              key={label}
              to={to}
              className="text-sm text-[#1a3c2e]/60 hover:text-[#1a3c2e] transition-colors underline underline-offset-4 decoration-[#1a3c2e]/20 hover:decoration-[#1a3c2e]"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom ornament */}
      <div className="flex items-center gap-3 mt-14">
        <div className="h-px w-16 bg-[#1a3c2e]/20" />
        <span className="text-[#1a3c2e]/30 text-sm">✦</span>
        <div className="h-px w-16 bg-[#1a3c2e]/20" />
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&display=swap');`}</style>
    </div>
  );
};

export default NotFoundPage;