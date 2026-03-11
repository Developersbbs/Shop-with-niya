import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useGetHeroSlidesQuery } from '../../redux/services/heroSection';

/* ── Inject keyframes once ── */
const STYLE_ID = 'hero-luxury-styles';
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Cormorant+Garamond:wght@300;400;600&display=swap');

    @keyframes kenBurns {
      0%   { transform: scale(1) translateX(0px); }
      100% { transform: scale(1.12) translateX(-20px); }
    }
    @keyframes fadeRight {
      from { opacity: 0; transform: translateX(40px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes progressBar {
      from { width: 0%; }
      to   { width: 100%; }
    }
    @keyframes shimmerLine {
      0%   { width: 0; opacity: 0; }
      100% { width: 48px; opacity: 1; }
    }
    .hero-slide-active .hero-image {
      animation: kenBurns 8s ease-out forwards;
    }
    .hero-slide-active .hero-badge {
      animation: fadeRight 0.6s cubic-bezier(0.22,1,0.36,1) 0.15s both;
    }
    .hero-slide-active .hero-title {
      animation: fadeRight 0.7s cubic-bezier(0.22,1,0.36,1) 0.3s both;
    }
    .hero-slide-active .hero-line {
      animation: shimmerLine 0.5s cubic-bezier(0.22,1,0.36,1) 0.5s both;
    }
    .hero-slide-active .hero-desc {
      animation: fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) 0.55s both;
    }
    .hero-slide-active .hero-cta {
      animation: fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) 0.72s both;
    }
    .hero-progress {
      animation: progressBar linear forwards;
    }
    .hero-btn-primary:hover {
      filter: brightness(1.1);
      transform: translateY(-1px);
    }
    .hero-btn-secondary:hover {
      background: rgba(255,255,255,0.12) !important;
      transform: translateY(-1px);
    }
  `;
  document.head.appendChild(s);
}

/* ── Button style helpers ── */
const getPrimaryBtnStyle = (slide) => {
  const style = slide.buttonStyle || 'filled';
  const color = slide.buttonColor || '#ffffff';
  const textColor = slide.buttonTextColor || '#0a0a0a';
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: '8px',
    padding: '13px 28px',
    fontFamily: '"Cormorant Garamond", serif',
    fontSize: '13px', fontWeight: 700,
    letterSpacing: '0.15em', textTransform: 'uppercase',
    textDecoration: 'none', cursor: 'pointer', border: 'none',
    borderRadius: '100px',
    transition: 'all 0.3s ease',
  };
  if (style === 'filled')  return { ...base, background: color, color: textColor, border: `2px solid ${color}` };
  if (style === 'outline') return { ...base, background: 'transparent', color: color, border: `2px solid ${color}` };
  return { ...base, background: 'rgba(255,255,255,0.12)', color: color, border: '2px solid transparent', backdropFilter: 'blur(8px)' };
};

const getSecondaryBtnStyle = (slide) => {
  const color = slide.buttonColor || '#ffffff';
  return {
    display: 'inline-flex', alignItems: 'center', gap: '8px',
    padding: '13px 28px',
    fontFamily: '"Cormorant Garamond", serif',
    fontSize: '13px', fontWeight: 700,
    letterSpacing: '0.15em', textTransform: 'uppercase',
    textDecoration: 'none', cursor: 'pointer',
    borderRadius: '100px',
    background: 'transparent',
    color: color,
    border: `2px solid ${color}`,
    transition: 'all 0.3s ease',
  };
};

/* ── Skeleton ── */
const HeroSkeleton = () => (
  <div className="w-full h-screen bg-gray-100 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-14 h-14 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
      <p style={{ fontFamily: '"Cormorant Garamond", serif', color: '#999', letterSpacing: '0.25em', fontSize: '11px' }}>
        LOADING
      </p>
    </div>
  </div>
);

/* ── Title: max 2 lines ── */
const SlideTitle = ({ title, textColor }) => {
  return (
    <h1
      className="hero-title"
      style={{
        fontFamily: '"Playfair Display", Georgia, serif',
        fontSize: 'clamp(2rem, 3.5vw, 4rem)',
        fontWeight: 900,
        lineHeight: 1.15,
        letterSpacing: '-0.01em',
        margin: 0,
        color: textColor || '#ffffff',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        maxWidth: '100%',
      }}
    >
      {title}
    </h1>
  );
};

/* ── Single Slide ── */
const HeroSlide = ({ slide, isActive }) => {
  const textColor   = slide.textColor || '#ffffff';
  const accentColor = slide.buttonColor || '#f5c518';
  const descColor   = `${textColor}bb`;

  return (
    <div
      className={`absolute inset-0 ${isActive ? 'hero-slide-active' : ''}`}
      style={{
        opacity: isActive ? 1 : 0,
        transition: 'opacity 1.1s cubic-bezier(0.4,0,0.2,1)',
        pointerEvents: isActive ? 'auto' : 'none',
      }}
    >
      {/* Background image — Ken Burns */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={slide.image}
          alt={slide.title}
          className="hero-image w-full h-full object-cover object-center"
          style={{ transformOrigin: 'center center' }}
        />
      </div>

      {/* Right-side gradient so text stays readable */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to left, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.08) 75%, transparent 100%)',
        }}
      />
      {/* Bottom vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 40%)',
        }}
      />

      {/* Content — right-aligned */}
      <div className="absolute inset-0 flex items-center justify-end px-8 md:px-16 lg:px-24">
        <div style={{ maxWidth: '480px', width: '100%', textAlign: 'left' }}>

          {/* Pill badge */}
          {slide.subtitle && (
            <div
              className="hero-badge"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '7px 16px',
                borderRadius: '100px',
                background: accentColor,
                color: slide.buttonTextColor || '#0a0a0a',
                fontSize: '10px', fontWeight: 700,
                letterSpacing: '0.2em', textTransform: 'uppercase',
                marginBottom: '20px',
                fontFamily: '"Cormorant Garamond", serif',
              }}
            >
              <span style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: slide.buttonTextColor || '#0a0a0a',
                display: 'inline-block', flexShrink: 0,
              }} />
              {slide.subtitle}
            </div>
          )}

          {/* ✅ FIXED: Single line title — no word splitting */}
          <SlideTitle title={slide.title} textColor={textColor} />

          {/* Decorative line */}
          <div
            className="hero-line"
            style={{ height: '2px', background: accentColor, margin: '18px 0', borderRadius: '2px' }}
          />

          {/* Description */}
          {slide.description && (
            <p
              className="hero-desc"
              style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: 'clamp(0.95rem, 1.6vw, 1.15rem)',
                fontWeight: 300,
                letterSpacing: '0.02em',
                color: descColor,
                lineHeight: 1.6,
                marginBottom: '32px',
              }}
            >
              {slide.description}
            </p>
          )}

          {/* CTA Buttons */}
          <div className="hero-cta" style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            {slide.primaryCTA?.text && (
              <Link
                to={slide.primaryCTA.link || '/products'}
                className="hero-btn-primary"
                style={getPrimaryBtnStyle(slide)}
              >
                {slide.primaryCTA.text}
                <span style={{
                  width: '22px', height: '22px', borderRadius: '50%',
                  background: 'rgba(0,0,0,0.15)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px',
                }}>
                  →
                </span>
              </Link>
            )}
            {slide.secondaryCTA?.text && (
              <Link
                to={slide.secondaryCTA.link || '/'}
                className="hero-btn-secondary"
                style={getSecondaryBtnStyle(slide)}
              >
                {slide.secondaryCTA.text}
                <span style={{ fontSize: '14px' }}>→</span>
              </Link>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

/* ── Main Hero ── */
const Hero = () => {
  const { data, isLoading, isError } = useGetHeroSlidesQuery();
  const slides = data?.data || [];
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progressKey, setProgressKey] = useState(0);
  const DURATION = 6000;

  const next = useCallback(() => {
    setCurrent((p) => (p + 1) % slides.length);
    setProgressKey((k) => k + 1);
  }, [slides.length]);

  const prev = useCallback(() => {
    setCurrent((p) => (p - 1 + slides.length) % slides.length);
    setProgressKey((k) => k + 1);
  }, [slides.length]);

  const goTo = (i) => { setCurrent(i); setProgressKey((k) => k + 1); };

  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    const timer = setInterval(next, DURATION);
    return () => clearInterval(timer);
  }, [slides.length, paused, next]);

  useEffect(() => { setCurrent(0); setProgressKey(0); }, [slides.length]);

  if (isLoading) return <HeroSkeleton />;

  if (isError || slides.length === 0) {
    return (
      <div className="relative w-full h-screen flex items-center justify-end overflow-hidden px-16"
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
        <div style={{ maxWidth: '460px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '7px 16px', borderRadius: '100px', background: '#f5c518', color: '#0a0a0a', fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '20px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0a0a0a', display: 'inline-block' }} />
            New Collection
          </div>
          <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 900, lineHeight: 1.1, margin: '0 0 16px', color: '#fff', whiteSpace: 'nowrap' }}>
            Welcome to Niya
          </h1>
          <div style={{ width: '48px', height: '2px', background: '#f5c518', marginBottom: '20px', borderRadius: '2px' }} />
          <p style={{ fontFamily: '"Cormorant Garamond", serif', color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', fontWeight: 300, marginBottom: '32px' }}>
            Discover our curated collections
          </p>
          <Link to="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 28px', borderRadius: '100px', background: '#f5c518', color: '#0a0a0a', fontFamily: '"Cormorant Garamond", serif', fontSize: '13px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none' }}>
            Shop Now <span>→</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      id="hero"
      className="relative w-full overflow-hidden bg-gray-900"
      style={{ height: '100vh' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((slide, index) => (
        <HeroSlide key={slide._id} slide={slide} isActive={index === current} />
      ))}

      {/* Progress bar */}
      {slides.length > 1 && !paused && (
        <div className="absolute top-0 left-0 right-0 z-20 h-[2px] bg-white/10">
          <div
            key={progressKey}
            className="hero-progress h-full"
            style={{ animationDuration: `${DURATION}ms`, background: 'rgba(255,255,255,0.7)' }}
          />
        </div>
      )}

      {/* Right arrow */}
      {slides.length > 1 && (
        <button
          onClick={next}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center transition-all duration-300 hover:scale-110"
          style={{
            width: '44px', height: '44px',
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.4)',
            background: 'rgba(0,0,0,0.25)',
            backdropFilter: 'blur(8px)',
            color: '#fff', fontSize: '18px',
          }}
        >
          ›
        </button>
      )}

      {/* Dot indicators */}
      {slides.length > 1 && (
        <div
          className="absolute z-20 flex items-center gap-2"
          style={{ bottom: '32px', left: '50%', transform: 'translateX(-50%)' }}
        >
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              style={{
                height: '3px',
                width: i === current ? '28px' : '8px',
                background: i === current ? '#fff' : 'rgba(255,255,255,0.35)',
                border: 'none', padding: 0, cursor: 'pointer',
                borderRadius: '2px',
                transition: 'all 0.35s cubic-bezier(0.22,1,0.36,1)',
              }}
            />
          ))}
        </div>
      )}

      {/* Slide counter */}
      {slides.length > 1 && (
        <div
          className="absolute bottom-8 right-8 z-20"
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '12px', letterSpacing: '0.2em',
          }}
        >
          {String(current + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
        </div>
      )}
    </div>
  );
};

export default Hero;