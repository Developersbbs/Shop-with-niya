import React from 'react';
import { Link } from 'react-router-dom';

const banners = [
  {
    tag: "New Arrivals",
    title: "Fresh Styles\nThis Season",
    desc: "Discover the newest additions to our collection",
    cta: "Shop Now",
    link: "/products?sort=newest",
    bg: "#082B27",
    textColor: "white",
    accentColor: "#f59e0b",
    // decorative pattern position
    pattern: "right",
  },
  {
    tag: "Limited Offer",
    title: "Up to 40%\nOff Selected",
    desc: "Handpicked styles at unbeatable prices",
    cta: "View Offers",
    link: "/offers",
    bg: "#fdf6ee",
    textColor: "#082B27",
    accentColor: "#082B27",
    pattern: "left",
  },
];

const PatternDots = ({ color }) => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(12)].map((_, i) => (
      <div
        key={i}
        className="absolute rounded-full animate-float"
        style={{
          width: `${6 + (i % 3) * 4}px`,
          height: `${6 + (i % 3) * 4}px`,
          background: color,
          opacity: 0.08 + (i % 4) * 0.04,
          top: `${10 + (i * 17) % 80}%`,
          left: `${5 + (i * 23) % 90}%`,
          animationDelay: `${i * 0.3}s`,
          animationDuration: `${3 + (i % 3)}s`,
        }}
      />
    ))}
  </div>
);

const OffersSection = () => {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">

        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#082B27]/40 mb-4">
            Exclusive Deals
          </p>
          <h2 className="text-3xl md:text-4xl font-black text-[#082B27]">
            Made for You
          </h2>
          <div className="w-10 h-0.5 bg-[#082B27] mx-auto mt-5 rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {banners.map((b, i) => (
            <div
              key={i}
              className="relative rounded-3xl overflow-hidden min-h-[280px] flex items-center
                         animate-fade-up group cursor-pointer"
              style={{
                background: b.bg,
                animationDelay: `${i * 0.15}s`,
                animationFillMode: 'both',
              }}
            >
              {/* Floating dots */}
              <PatternDots color={b.textColor} />

              {/* Big decorative circle */}
              <div
                className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full opacity-5"
                style={{ background: b.textColor }}
              />
              <div
                className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full opacity-5"
                style={{ background: b.textColor }}
              />

              {/* Content */}
              <div className="relative z-10 p-10">
                {/* Tag */}
                <span
                  className="inline-block px-3 py-1 rounded-full text-[10px] font-bold
                             uppercase tracking-widest mb-5"
                  style={{
                    background: `${b.accentColor}18`,
                    color: b.accentColor,
                    border: `1px solid ${b.accentColor}30`,
                  }}
                >
                  {b.tag}
                </span>

                {/* Title */}
                <h3
                  className="text-3xl md:text-4xl font-black leading-tight mb-3 whitespace-pre-line"
                  style={{ color: b.textColor }}
                >
                  {b.title}
                </h3>

                {/* Desc */}
                <p
                  className="text-sm mb-7 leading-relaxed max-w-xs"
                  style={{ color: `${b.textColor}80` }}
                >
                  {b.desc}
                </p>

                {/* CTA */}
                <Link
                  to={b.link}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full
                             text-sm font-semibold transition-all duration-300
                             hover:scale-105 active:scale-95 group/btn"
                  style={{
                    background: b.accentColor,
                    color: b.bg,
                  }}
                >
                  {b.cta}
                  <svg
                    className="w-3.5 h-3.5 transition-transform duration-200 group-hover/btn:translate-x-1"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                          d="M13 7l5 5-5 5M6 12h12" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Wide bottom banner */}
        <div
          className="relative mt-6 rounded-3xl overflow-hidden min-h-[160px] flex items-center
                     animate-fade-up"
          style={{ animationDelay: '0.3s', animationFillMode: 'both', background: '#fdf0e0' }}
        >
          <PatternDots color="#082B27" />
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-[#082B27]/5" />

          <div className="relative z-10 flex flex-col md:flex-row items-center
                          justify-between w-full px-10 py-8 gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#082B27]/40 mb-1">
                Free Shipping
              </p>
              <h3 className="text-2xl md:text-3xl font-black text-[#082B27]">
                On Orders Above ₹999
              </h3>
              <p className="text-sm text-[#082B27]/50 mt-1">
                Pan India delivery — no hidden charges
              </p>
            </div>
            <Link
              to="/products"
              className="flex-shrink-0 inline-flex items-center gap-2 px-7 py-3 rounded-full
                         bg-[#082B27] text-white text-sm font-semibold
                         hover:bg-[#0d3d38] transition-all duration-300 hover:scale-105"
            >
              Start Shopping
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                      d="M13 7l5 5-5 5M6 12h12" />
              </svg>
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
};

export default OffersSection;