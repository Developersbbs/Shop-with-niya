import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetCategoriesQuery } from '../../redux/services/categories';

/* ─────────────────────────────────────────
   Inject styles once
───────────────────────────────────────── */
const CAT_STYLE_ID = 'niya-cat-styles';
if (typeof document !== 'undefined' && !document.getElementById(CAT_STYLE_ID)) {
  const s = document.createElement('style');
  s.id = CAT_STYLE_ID;
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@200;300;400;500;600;700&family=Oswald:wght@300;400;500;600;700&family=DM+Mono:wght@300;400&display=swap');

    /* ── Shimmer skeleton ── */
    @keyframes niy-cat-shimmer {
      0%   { background-position: -200% center; }
      100% { background-position:  200% center; }
    }
    .niy-cat-skeleton {
      border-radius: 2px; height: 400px;
      background: linear-gradient(90deg, #ede9e2 25%, #e4e0d8 50%, #ede9e2 75%);
      background-size: 200% 100%;
      animation: niy-cat-shimmer 1.4s infinite;
    }

    /* ── Tilt card wrapper ── */
    .niy-cat-tilt {
      transform-style: preserve-3d;
      will-change: transform;
      border-radius: 2px;
      display: block;
      text-decoration: none;
    }

    /* ── Card inner ── */
    .niy-cat-card {
      position: relative; overflow: hidden; border-radius: 2px;
      border: 1px solid rgba(8,43,39,0);
      box-shadow: 0 4px 20px rgba(0,0,0,.07);
      transition: box-shadow .4s ease, border-color .4s ease;
    }
    .niy-cat-tilt:hover .niy-cat-card {
      box-shadow: 0 28px 56px rgba(8,43,39,.18), 0 0 0 1px rgba(201,168,76,.08);
      border-color: rgba(201,168,76,.2);
    }

    /* Image zoom */
    .niy-cat-img { transition: transform .8s cubic-bezier(.22,1,.36,1); }
    .niy-cat-tilt:hover .niy-cat-img { transform: scale(1.08) !important; }

    /* Overlay darken */
    .niy-cat-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(to top, rgba(8,43,39,.88) 0%, rgba(8,43,39,.25) 50%, transparent 100%);
      opacity: 0.55; transition: opacity .4s ease;
    }
    .niy-cat-tilt:hover .niy-cat-overlay { opacity: 1; }

    /* Shine sweep */
    .niy-cat-shine {
      position: absolute; inset: 0; pointer-events: none; z-index: 2;
      background: linear-gradient(135deg, transparent 30%, rgba(201,168,76,.06) 50%, transparent 70%);
      opacity: 0; transition: opacity .4s ease;
    }
    .niy-cat-tilt:hover .niy-cat-shine { opacity: 1; }

    /* Gold corner bracket — top right */
    .niy-cat-corner {
      position: absolute; top: 12px; right: 12px; z-index: 3;
      width: 0; height: 0;
      border-top: 1.5px solid rgba(201,168,76,0);
      border-right: 1.5px solid rgba(201,168,76,0);
      transition: width .35s ease, height .35s ease, border-color .35s ease;
      pointer-events: none;
    }
    .niy-cat-tilt:hover .niy-cat-corner {
      width: 20px; height: 20px;
      border-top-color: rgba(201,168,76,.65);
      border-right-color: rgba(201,168,76,.65);
    }

    /* Count badge — slides down on hover */
    .niy-cat-badge {
      position: absolute; top: 14px; right: 14px; z-index: 4;
      background: rgba(8,43,39,.72); backdrop-filter: blur(8px);
      border: 1px solid rgba(201,168,76,.3);
      padding: 5px 12px; border-radius: 2px;
      font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: .2em;
      color: rgba(201,168,76,.9);
      transform: translateY(-6px); opacity: 0;
      transition: all .35s ease .08s;
    }
    .niy-cat-tilt:hover .niy-cat-badge { transform: translateY(0); opacity: 1; }

    /* Bottom content */
    .niy-cat-name {
      font-family: 'Oswald', sans-serif;
      font-size: 1.3rem; font-weight: 500;
      color: #fff; margin: 0 0 8px; letter-spacing: .01em; line-height: 1.15;
    }
    .niy-cat-explore {
      display: flex; align-items: center; gap: 8px;
      transform: translateX(-10px); opacity: 0;
      transition: all .38s cubic-bezier(.22,1,.36,1) .06s;
    }
    .niy-cat-tilt:hover .niy-cat-explore { transform: translateX(0); opacity: 1; }
    .niy-cat-explore span {
      font-family: 'Poppins', sans-serif;
      font-size: 10.5px; font-weight: 600;
      letter-spacing: .18em; text-transform: uppercase; color: #C9A84C;
    }

    /* Gold divider line on explore */
    .niy-cat-exline {
      width: 0; height: 1px; background: #C9A84C;
      transition: width .35s cubic-bezier(.22,1,.36,1) .12s;
    }
    .niy-cat-tilt:hover .niy-cat-exline { width: 20px; }

    /* CTA button */
    .niy-cat-cta {
      display: inline-flex; align-items: center; gap: 10px;
      padding: 14px 36px; border-radius: 2px; text-decoration: none;
      font-family: 'Poppins', sans-serif; font-size: 11px;
      font-weight: 600; letter-spacing: .18em; text-transform: uppercase;
      background: #082B27; color: #fff;
      border: 1px solid #082B27;
      transition: all .3s ease;
    }
    .niy-cat-cta:hover {
      background: transparent; color: #082B27;
      border-color: #082B27;
      transform: translateY(-2px);
      box-shadow: 0 12px 32px rgba(8,43,39,.2);
    }

    /* Responsive grid */
    .niy-cat-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
    }
    @media (max-width: 1024px) {
      .niy-cat-grid { grid-template-columns: repeat(3, 1fr); }
    }
    @media (max-width: 768px) {
      .niy-cat-grid { grid-template-columns: repeat(2, 1fr); gap: 14px; }
    }
    @media (max-width: 420px) {
      .niy-cat-grid { grid-template-columns: 1fr; gap: 14px; }
    }
  `;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────
   Scroll reveal hook
───────────────────────────────────────── */
function useReveal(delay = 0) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(36px)';
    el.style.transition = `opacity .8s cubic-bezier(.22,1,.36,1) ${delay}ms, transform .8s cubic-bezier(.22,1,.36,1) ${delay}ms`;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
        obs.unobserve(el);
      }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);
  return ref;
}

/* ─────────────────────────────────────────
   Category card with tilt
───────────────────────────────────────── */
const CategoryCard = ({ category, index }) => {
  const wrapRef  = useReveal(index * 80);
  const tiltRef  = useRef(null);
  const frameRef = useRef(null);
  const defaultImg = '/images/products/placeholder-product.svg';

  const onMove = (e) => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      const el = tiltRef.current;
      if (!el) return;
      const r  = el.getBoundingClientRect();
      const rx = ((e.clientY - r.top  - r.height / 2) / (r.height / 2)) * -7;
      const ry = ((e.clientX - r.left - r.width  / 2) / (r.width  / 2)) *  7;
      el.style.transform = `perspective(650px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.03,1.03,1.03)`;
    });
  };

  const onLeave = () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    if (tiltRef.current) tiltRef.current.style.transform = 'perspective(650px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
  };

  return (
    <div ref={wrapRef}>
      <Link
        to={`/products/category/${category.slug || category._id}`}
        ref={tiltRef}
        className="niy-cat-tilt"
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{ transition: 'transform .15s ease' }}
      >
        <div className="niy-cat-card">
          {/* Image */}
          <div style={{ position: 'relative', height: '400px', overflow: 'hidden' }}>
            {category.image_url ? (
              <img
                src={category.image_url}
                alt={category.name}
                className="niy-cat-img"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
                onError={e => { e.target.src = defaultImg; }}
              />
            ) : (
              <div style={{
                width: '100%', height: '100%',
                background: 'linear-gradient(135deg,#082B27,#0d3b35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{
                  fontFamily: '"Oswald",sans-serif',
                  fontSize: '3.5rem', color: 'rgba(201,168,76,.3)', fontWeight: 600,
                }}>
                  {category.name?.[0]}
                </span>
              </div>
            )}

            {/* Layers */}
            <div className="niy-cat-overlay" />
            <div className="niy-cat-shine" />
            <div className="niy-cat-corner" />

            {/* Count badge */}
            {category.product_count > 0 && (
              <div className="niy-cat-badge">{category.product_count} pieces</div>
            )}

            {/* Bottom text */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '22px 20px', zIndex: 3 }}>
              <p className="niy-cat-name">{category.name}</p>
              <div className="niy-cat-explore">
                <div className="niy-cat-exline" />
                <span>Explore</span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

/* ─────────────────────────────────────────
   MAIN SECTION
───────────────────────────────────────── */
const Categories = () => {
  const { data, isLoading, isError } = useGetCategoriesQuery();
  const categories = data?.data || [];
  const headerRef  = useReveal(0);

  return (
    <section style={{
      padding: 'clamp(60px,9vw,100px) 0',
      background: '#FAF7F2',
      position: 'relative', overflow: 'hidden',
    }}>

      {/* Ghost watermark */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        fontFamily: '"Oswald",sans-serif',
        fontSize: 'clamp(80px,14vw,190px)',
        fontWeight: 700, color: 'rgba(8,43,39,.03)',
        whiteSpace: 'nowrap', pointerEvents: 'none', userSelect: 'none',
        letterSpacing: '.08em', lineHeight: 1,
      }}>
        CATEGORIES
      </div>

      {/* Top accent line */}
      <div style={{ position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',width:'60px',height:'2px',background:'#C9A84C' }} />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 clamp(16px,5vw,64px)', position: 'relative', zIndex: 1 }}>

        {/* ── Heading ── */}
        <div ref={headerRef} style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div style={{ display:'inline-flex',alignItems:'center',gap:'10px',marginBottom:'14px' }}>
            <span style={{ width:'22px',height:'1px',background:'#C9A84C',display:'inline-block' }} />
            <span style={{
              fontFamily:'"DM Mono",monospace',fontSize:'9.5px',
              letterSpacing:'.35em',textTransform:'uppercase',color:'#C9A84C',
            }}>
              Browse by Style
            </span>
            <span style={{ width:'22px',height:'1px',background:'#C9A84C',display:'inline-block' }} />
          </div>
          <h2 style={{
            fontFamily: '"Oswald",sans-serif',
            fontSize: 'clamp(1.9rem,3.8vw,3.2rem)',
            fontWeight: 600, lineHeight: 1.08,
            letterSpacing: '-.01em', color: '#082B27',
            margin: '0 0 12px',
          }}>
            Shop by{' '}
            <em style={{ fontStyle:'italic',color:'#C9A84C',fontWeight:300 }}>Category</em>
          </h2>
          <p style={{
            fontFamily: '"Poppins",sans-serif', fontSize: '.88rem',
            fontWeight: 300, color: 'rgba(8,43,39,.45)',
            lineHeight: 1.85, maxWidth: '400px', margin: '0 auto',
          }}>
            Curated collections for every occasion — handpicked for the modern Indian woman.
          </p>
        </div>

        {/* ── Grid ── */}
        {isLoading ? (
          <div className="niy-cat-grid">
            {[1, 2, 3, 4].map(i => <div key={i} className="niy-cat-skeleton" />)}
          </div>
        ) : isError || categories.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 0',
            fontFamily: '"Poppins",sans-serif', fontSize: '.9rem',
            color: 'rgba(8,43,39,.4)', fontWeight: 300,
          }}>
            No categories available.
          </div>
        ) : (
          <div className="niy-cat-grid">
            {categories.map((cat, i) => (
              <CategoryCard key={cat._id} category={cat} index={i} />
            ))}
          </div>
        )}

        {/* ── CTA ── */}
        {categories.length >= 6 && (
          <div style={{ textAlign: 'center', marginTop: '52px' }}>
            <Link to="/categories" className="niy-cat-cta">
              View All Categories
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>
        )}

      </div>
    </section>
  );
};

export default Categories;