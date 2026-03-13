import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

const API_URL = import.meta.env.VITE_API_URL;

/* ─────────────────────────────────────────
   Inject styles once
───────────────────────────────────────── */
const OFFERS_STYLE_ID = 'niya-offers-styles';
if (typeof document !== 'undefined' && !document.getElementById(OFFERS_STYLE_ID)) {
  const s = document.createElement('style');
  s.id = OFFERS_STYLE_ID;
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400&family=Oswald:wght@300;400;500;600;700&family=DM+Mono:wght@300;400&display=swap');

    /* ── Grain animation ── */
    @keyframes niy-offers-grain {
      0%,100%{transform:translate(0,0)} 10%{transform:translate(-2%,-2%)}
      20%{transform:translate(2%,1%)} 30%{transform:translate(-1%,3%)}
      40%{transform:translate(3%,-1%)} 50%{transform:translate(-2%,2%)}
      60%{transform:translate(1%,-3%)} 70%{transform:translate(-3%,2%)}
      80%{transform:translate(1%,-1%)}
    }
    .niy-grain-layer {
      position:absolute; inset:-50%; width:200%; height:200%;
      opacity:.03; pointer-events:none;
      background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      animation: niy-offers-grain 8s steps(10) infinite;
    }

    /* ── Banner hover image scale ── */
    .niy-banner-img { transition: transform .9s cubic-bezier(.22,1,.36,1); }
    .niy-banner-wrap:hover .niy-banner-img { transform: scale(1.05) !important; }

    /* ── CTA button hover ── */
    .niy-cta-gold {
      display: inline-flex; align-items: center; gap: 10px;
      padding: 14px 32px; border-radius: 2px;
      font-family: 'Poppins', sans-serif; font-size: 11px;
      font-weight: 600; letter-spacing: .18em; text-transform: uppercase;
      text-decoration: none; background: #C9A84C; color: #082B27;
      transition: all .3s ease; border: 1px solid #C9A84C;
    }
    .niy-cta-gold:hover {
      background: transparent; color: #C9A84C;
      transform: translateY(-2px);
      box-shadow: 0 10px 28px rgba(201,168,76,.2);
    }
    .niy-cta-outline {
      display: inline-flex; align-items: center; gap: 10px;
      padding: 13px 30px; border-radius: 2px;
      font-family: 'Poppins', sans-serif; font-size: 11px;
      font-weight: 600; letter-spacing: .18em; text-transform: uppercase;
      text-decoration: none; background: transparent;
      color: #C9A84C; border: 1px solid rgba(201,168,76,.4);
      transition: all .3s ease;
    }
    .niy-cta-outline:hover {
      background: #C9A84C; color: #082B27; border-color: #C9A84C;
      transform: translateY(-2px);
    }

    /* ── Tilt look card wrapper ── */
    .niy-look-tilt {
      transform-style: preserve-3d;
      will-change: transform;
      border-radius: 2px;
      display: block;
    }

    /* ── Look card inner ── */
    .niy-look-card {
      position: relative; overflow: hidden; border-radius: 2px; cursor: pointer;
      border: 1px solid rgba(255,255,255,.0);
      transition: border-color .4s ease, box-shadow .4s ease;
    }
    .niy-look-tilt:hover .niy-look-card {
      border-color: rgba(201,168,76,.25);
      box-shadow: 0 24px 50px rgba(0,0,0,.5), 0 0 0 1px rgba(201,168,76,.06);
    }

    /* Image zoom */
    .niy-look-card img { transition: transform .8s cubic-bezier(.22,1,.36,1); display: block; }
    .niy-look-tilt:hover .niy-look-card img { transform: scale(1.08) !important; }

    /* Dark overlay */
    .niy-look-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(to top, rgba(8,43,39,.88) 0%, rgba(8,43,39,.2) 50%, transparent 100%);
      opacity: 0.5; transition: opacity .4s ease;
    }
    .niy-look-tilt:hover .niy-look-overlay { opacity: 1; }

    /* Shine sweep on tilt */
    .niy-look-shine {
      position: absolute; inset: 0; pointer-events: none; z-index: 2;
      background: linear-gradient(135deg, transparent 30%, rgba(201,168,76,.07) 50%, transparent 70%);
      opacity: 0; transition: opacity .4s ease;
      border-radius: 2px;
    }
    .niy-look-tilt:hover .niy-look-shine { opacity: 1; }

    /* Gold corner bracket — bottom right */
    .niy-look-corner {
      position: absolute; bottom: 10px; right: 10px; z-index: 3;
      width: 0; height: 0;
      border-bottom: 1.5px solid rgba(201,168,76,0);
      border-right: 1.5px solid rgba(201,168,76,0);
      transition: width .35s ease, height .35s ease, border-color .35s ease;
      pointer-events: none;
    }
    .niy-look-tilt:hover .niy-look-corner {
      width: 20px; height: 20px;
      border-bottom-color: rgba(201,168,76,.6);
      border-right-color: rgba(201,168,76,.6);
    }

    /* Shop pill slides up */
    .niy-look-pill {
      position: absolute; bottom: 18px; left: 50%;
      transform: translateX(-50%) translateY(12px);
      opacity: 0; transition: all .38s cubic-bezier(.22,1,.36,1);
      white-space: nowrap; z-index: 4;
      padding: 8px 20px; background: rgba(201,168,76,.95); color: #082B27;
      font-family: 'Poppins', sans-serif; font-size: 10px; font-weight: 600;
      letter-spacing: .2em; text-transform: uppercase; border-radius: 2px;
      display: flex; align-items: center; gap: 6px;
      box-shadow: 0 6px 20px rgba(0,0,0,.3);
    }
    .niy-look-tilt:hover .niy-look-pill {
      opacity: 1; transform: translateX(-50%) translateY(0);
    }

    /* Label below card */
    .niy-look-label {
      font-family: 'Poppins', sans-serif; font-size: .82rem; font-weight: 500;
      color: rgba(245,239,224,.65); text-align: center;
      margin-top: 12px; letter-spacing: .04em;
      transition: color .25s ease;
    }
    .niy-look-tilt:hover .niy-look-label { color: #C9A84C; }

    /* ── Swiper arrows ── */
    .niy-looks-swiper .swiper-button-next,
    .niy-looks-swiper .swiper-button-prev {
      width: 40px; height: 40px;
      background: #082B27; border-radius: 2px;
      border: 1px solid rgba(201,168,76,.3); color: #C9A84C;
      transition: all .25s ease;
      --swiper-navigation-size: 13px;
    }
    .niy-looks-swiper .swiper-button-next:hover,
    .niy-looks-swiper .swiper-button-prev:hover {
      background: #C9A84C; color: #082B27; border-color: #C9A84C;
    }

    /* ── Number index ── */
    .niy-banner-index {
      position: absolute; top: -20px; right: clamp(20px,4vw,48px);
      font-family: 'Oswald', sans-serif;
      font-size: clamp(80px,10vw,140px); font-weight: 700;
      color: rgba(8,43,39,.06); line-height: 1;
      pointer-events: none; user-select: none;
      transition: color .4s ease;
    }
    .niy-banner-wrap:hover .niy-banner-index { color: rgba(201,168,76,.08); }

    /* ── Responsive banner grid ── */
    @media (max-width: 768px) {
      .niy-banner-grid { grid-template-columns: 1fr !important; }
      .niy-banner-grid > div { grid-column: 1 !important; grid-row: auto !important; }
      .niy-banner-img-wrap { min-height: 300px !important; }
      .niy-banner-text { padding: 36px 24px !important; }
    }
    @media (max-width: 480px) {
      .niy-banner-img-wrap { min-height: 260px !important; }
    }
  `;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────
   Scroll reveal hook
───────────────────────────────────────── */
const useReveal = (delay = 0, dir = 'up') => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const initT = dir === 'left' ? 'translateX(-48px)' : dir === 'right' ? 'translateX(48px)' : 'translateY(36px)';
    el.style.opacity = '0';
    el.style.transform = initT;
    el.style.transition = `opacity .85s cubic-bezier(.22,1,.36,1) ${delay}ms, transform .85s cubic-bezier(.22,1,.36,1) ${delay}ms`;
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
};

/* ─────────────────────────────────────────
   Static fallback data
───────────────────────────────────────── */
const STATIC_BANNERS = [
  {
    img: '/images/banner1.JPG', tag: 'New Arrivals',
    title: 'Everyday\nKurtis', subtitle: 'Effortless style for every day',
    desc: 'From morning meetings to evening strolls — our kurtis and coord sets are made for women who do it all.',
    buttonText: 'Shop Now', buttonLink: '/products', imgLeft: true,
  },
  {
    img: '/images/banner2.JPG', tag: 'Office Wear',
    title: 'Dress to\nImpress', subtitle: 'Professional looks, ethnic soul',
    desc: 'Structured coord sets and elegant kurtis that take you from desk to dinner — without missing a beat.',
    buttonText: 'Explore Collection', buttonLink: '/products', imgLeft: false,
  },
  {
    img: '/images/banner3.webp', tag: 'Ethnic & Traditional',
    title: 'Rooted in\nElegance', subtitle: 'Timeless ethnic wear, reimagined',
    desc: 'Celebrate your culture in style. Our maxi dresses and ethnic kurtis blend tradition with modern silhouettes.',
    buttonText: 'Discover More', buttonLink: '/products', imgLeft: true,
  },
];

const LOOKS = [
  { img: '/images/look1.jpg',  label: 'Everyday Wear', link: '/products?tag=everyday' },
  { img: '/images/look2.webp', label: 'Festive Looks',  link: '/products?tag=festive' },
  { img: '/images/look3.jpg',  label: 'Work Wear',       link: '/products?tag=work' },
  { img: '/images/look5.jpg',  label: 'Casual Chic',     link: '/products?tag=casual' },
  { img: '/images/look4.avif', label: 'Party Wear',      link: '/products?tag=party' },
];

/* ─────────────────────────────────────────
   Section heading component
───────────────────────────────────────── */
const SectionHeading = ({ eyebrow, title, accent, subtitle, light, center = true }) => (
  <div style={{ textAlign: center ? 'center' : 'left', marginBottom: '60px' }}>
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
      <span style={{ width: '22px', height: '1px', background: '#C9A84C', display: 'inline-block' }} />
      <span style={{
        fontFamily: '"DM Mono", monospace', fontSize: '9.5px',
        letterSpacing: '.35em', textTransform: 'uppercase',
        color: light ? 'rgba(201,168,76,.7)' : '#C9A84C',
      }}>
        {eyebrow}
      </span>
      <span style={{ width: '22px', height: '1px', background: '#C9A84C', display: 'inline-block' }} />
    </div>
    <h2 style={{
      fontFamily: '"Oswald", sans-serif',
      fontSize: 'clamp(2rem,4vw,3.4rem)',
      fontWeight: 600, lineHeight: 1.08,
      letterSpacing: '-.01em',
      color: light ? '#FAF7F2' : '#082B27',
      margin: 0,
    }}>
      {title}{' '}
      {accent && <em style={{ fontStyle: 'italic', color: '#C9A84C', fontWeight: 300 }}>{accent}</em>}
    </h2>
    {subtitle && (
      <p style={{
        fontFamily: '"Poppins", sans-serif', fontSize: '.9rem',
        fontWeight: 300, color: light ? 'rgba(245,239,224,.45)' : 'rgba(8,43,39,.5)',
        marginTop: '12px', lineHeight: 1.8, maxWidth: '420px',
        margin: '12px auto 0',
      }}>
        {subtitle}
      </p>
    )}
  </div>
);

/* ─────────────────────────────────────────
   Banner card — split layout
───────────────────────────────────────── */
const BannerCard = ({ banner, index }) => {
  const imgRef  = useReveal(0,   banner.imgLeft ? 'left' : 'right');
  const textRef = useReveal(140, banner.imgLeft ? 'right' : 'left');

  const numStr = String(index + 1).padStart(2, '0');

  return (
    <div
      className="niy-banner-wrap"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        minHeight: '520px',
        borderRadius: '2px',
        overflow: 'hidden',
        background: '#082B27',
        boxShadow: '0 4px 32px rgba(8,43,39,.12)',
        position: 'relative',
      }}
    >
      {/* Large background index number */}
      <span className="niy-banner-index">{numStr}</span>

      {/* ── Image side ── */}
      <div
        ref={imgRef}
        className="niy-banner-img-wrap"
        style={{
          gridColumn: banner.imgLeft ? '1' : '2',
          gridRow: '1',
          position: 'relative', overflow: 'hidden',
          minHeight: '480px',
        }}
      >
        <img
          src={banner.img}
          alt={banner.title}
          className="niy-banner-img"
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center top',
          }}
        />
        {/* Edge fade toward text */}
        <div style={{
          position: 'absolute', inset: 0,
          background: banner.imgLeft
            ? 'linear-gradient(to right, transparent 55%, rgba(8,43,39,.7) 100%)'
            : 'linear-gradient(to left, transparent 55%, rgba(8,43,39,.7) 100%)',
        }} />
        {/* Tag chip on image */}
        <div style={{
          position: 'absolute', top: '20px',
          ...(banner.imgLeft ? { left: '20px' } : { right: '20px' }),
          padding: '6px 14px',
          background: 'rgba(8,43,39,.75)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(201,168,76,.3)',
          fontFamily: '"DM Mono", monospace', fontSize: '8.5px',
          letterSpacing: '.28em', textTransform: 'uppercase', color: '#C9A84C',
        }}>
          {banner.tag || banner.label}
        </div>
      </div>

      {/* ── Text side ── */}
      <div
        ref={textRef}
        className="niy-banner-text"
        style={{
          gridColumn: banner.imgLeft ? '2' : '1',
          gridRow: '1',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: 'clamp(36px,5vw,72px) clamp(28px,5vw,64px)',
          background: '#082B27',
          position: 'relative',
        }}
      >
        {/* Decorative corner line */}
        <div style={{
          position: 'absolute',
          ...(banner.imgLeft ? { top: '28px', right: '28px' } : { top: '28px', left: '28px' }),
          width: '32px', height: '32px',
          borderTop: '1.5px solid rgba(201,168,76,.25)',
          ...(banner.imgLeft ? { borderRight: '1.5px solid rgba(201,168,76,.25)' } : { borderLeft: '1.5px solid rgba(201,168,76,.25)' }),
        }} />

        {/* Small index label */}
        <span style={{
          fontFamily: '"DM Mono", monospace', fontSize: '10px',
          color: 'rgba(201,168,76,.4)', letterSpacing: '.2em',
          marginBottom: '20px',
        }}>
          {numStr} / {String(STATIC_BANNERS.length).padStart(2, '0')}
        </span>

        <h2 style={{
          fontFamily: '"Oswald", sans-serif',
          fontSize: 'clamp(2rem,3.2vw,3.6rem)',
          fontWeight: 600, lineHeight: 1.05,
          letterSpacing: '-.01em', color: '#FAF7F2',
          margin: '0 0 14px', whiteSpace: 'pre-line',
        }}>
          {banner.title}
        </h2>

        {banner.subtitle && (
          <p style={{
            fontFamily: '"Poppins", sans-serif', fontSize: '.88rem',
            fontWeight: 300, color: 'rgba(245,239,224,.5)',
            marginBottom: '16px', letterSpacing: '.015em',
          }}>
            {banner.subtitle}
          </p>
        )}

        <div style={{
          width: '40px', height: '1px',
          background: 'linear-gradient(to right,#C9A84C,transparent)',
          marginBottom: '20px',
        }} />

        <p style={{
          fontFamily: '"Poppins", sans-serif', fontSize: '.85rem',
          fontWeight: 300, color: 'rgba(245,239,224,.5)',
          lineHeight: 1.9, marginBottom: '36px', maxWidth: '360px',
        }}>
          {banner.desc || banner.description}
        </p>

        <Link to={banner.buttonLink || banner.link || '/products'} className="niy-cta-gold" style={{ alignSelf: 'flex-start' }}>
          {banner.buttonText || 'Shop Now'}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </Link>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   Look card
───────────────────────────────────────── */
const LookCard = ({ look, index }) => {
  const ref = useReveal(index * 70, 'up');

  return (
    <div ref={ref}>
      <Link to={look.link} style={{ display: 'block', textDecoration: 'none' }}>
        <div className="niy-look-card" style={{ aspectRatio: '3/4' }}>
          <img
            src={look.img}
            alt={look.label}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
          />
          <div className="niy-look-overlay" />
          <div className="niy-look-pill">
            Shop All
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </div>
        </div>
        <p style={{
          fontFamily: '"Poppins", sans-serif',
          fontSize: '.82rem', fontWeight: 500,
          color: '#FAF7F2', textAlign: 'center',
          marginTop: '12px', letterSpacing: '.04em',
          transition: 'color .2s ease',
        }}>
          {look.label}
        </p>
      </Link>
    </div>
  );
};

/* ─────────────────────────────────────────
   MAIN SECTION
───────────────────────────────────────── */
const OffersSection = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  const headerRef      = useReveal(0,   'up');
  const looksHeaderRef = useReveal(0,   'up');

  useEffect(() => {
    fetch(`${API_URL}/offers`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data?.length > 0) setBanners(d.data);
        else setBanners(STATIC_BANNERS);
      })
      .catch(() => setBanners(STATIC_BANNERS))
      .finally(() => setLoading(false));
  }, []);

  const displayBanners = banners.length > 0 ? banners : STATIC_BANNERS;

  return (
    <>
      {/* ════════════════════════════════
          COLLECTIONS — light bg section
      ════════════════════════════════ */}
      <section style={{ padding: 'clamp(60px,10vw,120px) 0', background: '#FAF7F2', position: 'relative' }}>

        {/* Subtle top border accent */}
        <div style={{
          position: 'absolute', top: 0, left: '50%',
          transform: 'translateX(-50%)',
          width: '60px', height: '2px', background: '#C9A84C',
        }} />

        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 clamp(16px,5vw,64px)' }}>

          <div ref={headerRef}>
            <SectionHeading
              eyebrow="Collections"
              title="Our Latest"
              accent="Drops"
              light={false}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {displayBanners.map((b, i) => (
              <BannerCard
                key={i}
                banner={{ ...b, imgLeft: i % 2 === 0 }}
                index={i}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════
          CURATED LOOKS — dark bg section (WhyUs style)
      ════════════════════════════════ */}
      <section style={{ padding: 'clamp(60px,9vw,100px) 0', background: '#082B27', position: 'relative', overflow: 'hidden' }}>

        {/* Grain — same as WhyUs */}
        <div className="niy-grain-layer" />

        {/* Top / bottom gold lines — same as WhyUs */}
        <div style={{ position:'absolute',top:0,left:0,right:0,height:'1px',background:'linear-gradient(to right,transparent,rgba(201,168,76,.2),transparent)' }} />
        <div style={{ position:'absolute',bottom:0,left:0,right:0,height:'1px',background:'linear-gradient(to right,transparent,rgba(201,168,76,.2),transparent)' }} />

        {/* Ghost watermark — same pattern as WhyUs */}
        <div style={{
          position:'absolute',top:'50%',left:'50%',
          transform:'translate(-50%,-50%)',
          fontFamily:'"Oswald",sans-serif',
          fontSize:'clamp(80px,14vw,200px)',
          fontWeight:700,color:'rgba(255,255,255,.018)',
          letterSpacing:'.1em',textTransform:'uppercase',
          whiteSpace:'nowrap',pointerEvents:'none',userSelect:'none',
          lineHeight:1,
        }}>
          Our Looks
        </div>

        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 clamp(16px,5vw,64px)', position: 'relative', zIndex: 1 }}>

          <div ref={looksHeaderRef}>
            <SectionHeading
              eyebrow="Styled For You"
              title="Curated"
              accent="Looks"
              subtitle="Handpicked outfits for every occasion — because every woman deserves to feel her best."
              light
            />
          </div>

          <Swiper
            modules={[Autoplay, Navigation]}
            navigation
            autoplay={{ delay: 3200, disableOnInteraction: false }}
            loop
            spaceBetween={16}
            slidesPerView={2}
            breakpoints={{
              480:  { slidesPerView: 2, spaceBetween: 14 },
              640:  { slidesPerView: 3, spaceBetween: 16 },
              768:  { slidesPerView: 3, spaceBetween: 18 },
              1024: { slidesPerView: 4, spaceBetween: 20 },
              1280: { slidesPerView: 5, spaceBetween: 20 },
            }}
            className="niy-looks-swiper"
          >
            {LOOKS.map((l, i) => (
              <SwiperSlide key={i}>
                <LookCard look={l} index={i} />
              </SwiperSlide>
            ))}
          </Swiper>

          {/* View all — same outline style as WhyUs CTA */}
          <div style={{ textAlign: 'center', marginTop: '52px' }}>
            <Link to="/products" className="niy-cta-outline">
              View All Looks
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>

        </div>
      </section>
    </>
  );
};

export default OffersSection;