import React, { useEffect, useRef, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL;

/* ─────────────────────────────────────────
   Inject styles once
───────────────────────────────────────── */
const TEST_STYLE_ID = 'niya-test-styles';
if (typeof document !== 'undefined' && !document.getElementById(TEST_STYLE_ID)) {
  const s = document.createElement('style');
  s.id = TEST_STYLE_ID;
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;1,300&family=Oswald:wght@300;400;500;600;700&family=DM+Mono:wght@300;400&display=swap');

    /* ── Tilt card base ── */
    .niy-test-card {
      position: relative;
      background: #FAF7F2;
      border: 1px solid rgba(8,43,39,.07);
      border-radius: 2px;
      padding: clamp(24px,3vw,36px);
      cursor: default;
      overflow: hidden;
      transform-style: preserve-3d;
      will-change: transform;
      transition: box-shadow .4s ease, border-color .4s ease, background .4s ease;
    }
    .niy-test-card:hover {
      background: #fff;
      border-color: rgba(201,168,76,.28);
      box-shadow: 0 20px 48px rgba(8,43,39,.1), 0 0 0 1px rgba(201,168,76,.06);
    }

    /* Shine sweep */
    .niy-test-card::before {
      content: '';
      position: absolute; inset: 0;
      background: linear-gradient(135deg, transparent 30%, rgba(201,168,76,.05) 50%, transparent 70%);
      opacity: 0; pointer-events: none; z-index: 0;
      transition: opacity .4s ease;
    }
    .niy-test-card:hover::before { opacity: 1; }

    /* Corner bracket */
    .niy-test-card::after {
      content: '';
      position: absolute; top: 0; right: 0;
      width: 24px; height: 24px;
      border-top: 1.5px solid rgba(201,168,76,0);
      border-right: 1.5px solid rgba(201,168,76,0);
      pointer-events: none;
      transition: border-color .35s ease, width .35s ease, height .35s ease;
    }
    .niy-test-card:hover::after {
      border-top-color: rgba(201,168,76,.45);
      border-right-color: rgba(201,168,76,.45);
      width: 34px; height: 34px;
    }

    /* Quote mark decoration */
    .niy-test-quote {
      position: absolute; top: -12px; right: 18px;
      font-family: 'Oswald', sans-serif;
      font-size: 7rem; font-weight: 700; line-height: 1;
      color: rgba(8,43,39,.045);
      pointer-events: none; user-select: none;
      transition: color .4s ease;
    }
    .niy-test-card:hover .niy-test-quote { color: rgba(201,168,76,.09); }

    /* Gold divider reveal */
    .niy-test-divider {
      width: 0; height: 1px;
      background: linear-gradient(to right, #C9A84C, transparent);
      margin: 14px 0 16px;
      transition: width .5s cubic-bezier(.22,1,.36,1) .08s;
    }
    .niy-test-card:hover .niy-test-divider { width: 36px; }

    /* Avatar ring */
    .niy-test-avatar {
      transition: transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s ease;
    }
    .niy-test-card:hover .niy-test-avatar {
      transform: scale(1.07);
      box-shadow: 0 4px 16px rgba(201,168,76,.25);
    }

    /* Shimmer skeleton */
    @keyframes niy-test-shimmer {
      0%   { background-position: -200% center; }
      100% { background-position:  200% center; }
    }
    .niy-test-skeleton {
      border-radius: 2px; height: 220px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: niy-test-shimmer 1.4s infinite;
    }

    /* Stats bar */
    .niy-test-stat {
      text-align: center;
      padding: clamp(16px,2vw,24px) clamp(20px,3vw,40px);
      border-right: 1px solid rgba(8,43,39,.07);
      transition: background .25s ease;
    }
    .niy-test-stat:last-child { border-right: none; }
    .niy-test-stat:hover { background: rgba(201,168,76,.04); }

    /* Grid */
    .niy-test-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
    }
    @media (max-width: 1024px) {
      .niy-test-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 520px) {
      .niy-test-grid { grid-template-columns: 1fr; gap: 14px; }
    }

    .niy-test-stats-row {
      display: flex; flex-wrap: wrap;
    }
    @media (max-width: 600px) {
      .niy-test-stats-row { flex-direction: column; }
      .niy-test-stat { border-right: none; border-bottom: 1px solid rgba(8,43,39,.07); }
      .niy-test-stat:last-child { border-bottom: none; }
    }
  `;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────
   Fallback data
───────────────────────────────────────── */
const FALLBACK = [
  { name: 'Priya Sharma',   location: 'Chennai',   rating: 5, text: 'The kurta I ordered was even more beautiful in person! The fabric is so soft and the embroidery is stunning. Will definitely be ordering more.', initials: 'PS', hue: '#C9A84C' },
  { name: 'Ananya R',       location: 'Bangalore', rating: 5, text: 'Absolutely love my coord set. Got so many compliments at the wedding. Delivery was super fast too — within 2 days!',                          initials: 'AR', hue: '#7c8b6e' },
  { name: 'Meera Nair',     location: 'Kochi',     rating: 5, text: 'Finally found a brand with real sizes and proper fitting. The quality is amazing for the price. My new go-to fashion store!',                  initials: 'MN', hue: '#082B27' },
  { name: 'Divya Krishnan', location: 'Hyderabad', rating: 5, text: 'Ordered the festive anarkali and it was perfect for Diwali. Beautiful packaging, quick delivery, and the dress is just gorgeous.',            initials: 'DK', hue: '#8b6e82' },
];

const STATS = [
  { num: '10,000+', label: 'Happy Customers' },
  { num: '4.9 ★',  label: 'Average Rating'  },
  { num: '500+',    label: 'Unique Styles'   },
  { num: '2-Day',   label: 'Delivery'        },
];

/* ─────────────────────────────────────────
   Scroll reveal hook
───────────────────────────────────────── */
function useReveal(delay = 0, dir = 'up') {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const initT = dir === 'left' ? 'translateX(-36px)' : 'translateY(32px)';
    el.style.opacity = '0';
    el.style.transform = initT;
    el.style.transition = `opacity .8s cubic-bezier(.22,1,.36,1) ${delay}ms, transform .8s cubic-bezier(.22,1,.36,1) ${delay}ms`;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        el.style.opacity = '1';
        el.style.transform = 'translate(0,0)';
        obs.unobserve(el);
      }
    }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay, dir]);
  return ref;
}

/* ─────────────────────────────────────────
   Stars
───────────────────────────────────────── */
const Stars = ({ count }) => (
  <div style={{ display: 'flex', gap: '3px' }}>
    {Array.from({ length: count }).map((_, i) => (
      <svg key={i} width="13" height="13" viewBox="0 0 20 20" fill="#C9A84C">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
      </svg>
    ))}
  </div>
);

/* ─────────────────────────────────────────
   Tilt card wrapper
───────────────────────────────────────── */
const TiltCard = ({ children }) => {
  const cardRef  = useRef(null);
  const frameRef = useRef(null);

  const onMove = (e) => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      const el = cardRef.current;
      if (!el) return;
      const r  = el.getBoundingClientRect();
      const rx = ((e.clientY - r.top  - r.height / 2) / (r.height / 2)) * -6;
      const ry = ((e.clientX - r.left - r.width  / 2) / (r.width  / 2)) *  6;
      el.style.transform = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.02,1.02,1.02)`;
    });
  };

  const onLeave = () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    if (cardRef.current) cardRef.current.style.transform = 'perspective(700px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
  };

  return (
    <div
      ref={cardRef}
      className="niy-test-card"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ transition: 'transform .15s ease, box-shadow .4s ease, border-color .4s ease, background .4s ease' }}
    >
      {children}
    </div>
  );
};

/* ─────────────────────────────────────────
   Single review card
───────────────────────────────────────── */
const TestimonialCard = ({ review, index }) => {
  const ref = useReveal(index * 100);

  const initials = review.initials
    || review.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div ref={ref}>
      <TiltCard>
        {/* Quote decoration */}
        <span className="niy-test-quote">"</span>

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Tag + stars row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <Stars count={review.rating || 5} />
            <span style={{
              fontFamily: '"DM Mono", monospace', fontSize: '8.5px',
              letterSpacing: '.2em', color: 'rgba(201,168,76,.5)',
              textTransform: 'uppercase',
            }}>
              Verified
            </span>
          </div>

          {/* Divider */}
          <div className="niy-test-divider" />

          {/* Review text */}
          <p style={{
            fontFamily: '"Poppins", sans-serif',
            fontSize: '.83rem', fontWeight: 300,
            color: '#555', lineHeight: 1.9,
            margin: '0 0 22px',
          }}>
            {review.text || review.review || review.content}
          </p>

          {/* Author */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {review.image ? (
              <img
                src={review.image}
                alt={review.name}
                className="niy-test-avatar"
                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid rgba(201,168,76,.3)' }}
              />
            ) : (
              <div
                className="niy-test-avatar"
                style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: review.hue || '#082B27', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: '"Oswald", sans-serif', fontSize: '13px',
                  fontWeight: 500, color: '#fff',
                  border: '1.5px solid rgba(255,255,255,.4)',
                }}
              >
                {initials}
              </div>
            )}
            <div>
              <p style={{
                fontFamily: '"Oswald", sans-serif',
                fontSize: '.95rem', fontWeight: 500,
                color: '#082B27', margin: 0, letterSpacing: '.01em',
              }}>
                {review.name}
              </p>
              <p style={{
                fontFamily: '"DM Mono", monospace',
                fontSize: '8.5px', letterSpacing: '.2em',
                color: '#aaa', margin: '2px 0 0', textTransform: 'uppercase',
              }}>
                {review.location || review.city}
              </p>
            </div>
          </div>
        </div>
      </TiltCard>
    </div>
  );
};

/* ─────────────────────────────────────────
   MAIN TESTIMONIALS SECTION
───────────────────────────────────────── */
const Testimonials = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const headerRef  = useReveal(0);
  const statsRef   = useReveal(100);

  useEffect(() => {
    fetch(`${API_URL}/testimonials?limit=4&status=active`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data?.length > 0) setReviews(d.data);
        else setReviews(FALLBACK);
      })
      .catch(() => setReviews(FALLBACK))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section style={{
      padding: 'clamp(60px,10vw,120px) 0',
      background: '#fff',
      position: 'relative', overflow: 'hidden',
    }}>

      {/* Ghost watermark */}
      <div style={{
        position: 'absolute', bottom: '-10px', right: '-10px',
        fontFamily: '"Oswald", sans-serif',
        fontSize: 'clamp(80px,16vw,200px)',
        fontWeight: 700, color: 'rgba(8,43,39,.024)',
        whiteSpace: 'nowrap', lineHeight: 1,
        pointerEvents: 'none', userSelect: 'none', letterSpacing: '-.03em',
      }}>
        LOVED
      </div>

      {/* Top accent line */}
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '60px', height: '2px', background: '#C9A84C' }} />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 clamp(16px,5vw,64px)', position: 'relative', zIndex: 1 }}>

        {/* ── Heading ── */}
        <div ref={headerRef} style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <span style={{ width: '22px', height: '1px', background: '#C9A84C', display: 'inline-block' }} />
            <span style={{
              fontFamily: '"DM Mono", monospace', fontSize: '9.5px',
              letterSpacing: '.35em', textTransform: 'uppercase', color: '#C9A84C',
            }}>
              Real Stories
            </span>
            <span style={{ width: '22px', height: '1px', background: '#C9A84C', display: 'inline-block' }} />
          </div>
          <h2 style={{
            fontFamily: '"Oswald", sans-serif',
            fontSize: 'clamp(1.9rem,3.8vw,3.2rem)',
            fontWeight: 600, lineHeight: 1.08,
            letterSpacing: '-.01em', color: '#082B27', margin: '0 0 12px',
          }}>
            What Our{' '}
            <em style={{ fontStyle: 'italic', color: '#C9A84C', fontWeight: 300 }}>Customers Say</em>
          </h2>
          <p style={{
            fontFamily: '"Poppins", sans-serif', fontSize: '.88rem',
            fontWeight: 300, color: 'rgba(8,43,39,.45)',
            lineHeight: 1.85, maxWidth: '380px', margin: '0 auto',
          }}>
            Thousands of happy customers across India trust Niya for their everyday style.
          </p>
        </div>

        {/* ── Cards grid ── */}
        {loading ? (
          <div className="niy-test-grid">
            {[1, 2, 3, 4].map(i => <div key={i} className="niy-test-skeleton" />)}
          </div>
        ) : (
          <div className="niy-test-grid">
            {reviews.map((r, i) => (
              <TestimonialCard key={i} review={r} index={i} />
            ))}
          </div>
        )}

        {/* ── Stats bar ── */}
        <div
          ref={statsRef}
          style={{
            marginTop: '56px',
            background: '#FAF7F2',
            border: '1px solid rgba(8,43,39,.06)',
            borderRadius: '2px',
            position: 'relative', overflow: 'hidden',
          }}
        >
          {/* Gold top border */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right,transparent,#C9A84C,transparent)' }} />

          <div className="niy-test-stats-row">
            {STATS.map((item, i) => (
              <div key={i} className="niy-test-stat" style={{ flex: '1 1 0' }}>
                <p style={{
                  fontFamily: '"Oswald", sans-serif',
                  fontSize: 'clamp(1.5rem,2.8vw,2.2rem)',
                  fontWeight: 600, color: '#082B27',
                  margin: '0 0 4px', letterSpacing: '-.01em',
                }}>
                  {item.num}
                </p>
                <p style={{
                  fontFamily: '"DM Mono", monospace',
                  fontSize: '8.5px', letterSpacing: '.25em',
                  textTransform: 'uppercase', color: '#aaa', margin: 0,
                }}>
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default Testimonials;