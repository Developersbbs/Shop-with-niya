import React, { useEffect, useRef } from 'react';

const FEATURES = [
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M5 12h14M12 5l7 7-7 7"/>
        <circle cx="12" cy="12" r="10" opacity=".15" fill="currentColor" stroke="none"/>
      </svg>
    ),
    title: 'Free Delivery',
    desc: 'On all orders above ₹599. Pan-India, 2–5 day delivery.',
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    title: 'Authentic Quality',
    desc: 'Every piece handpicked, quality-checked before dispatch.',
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    title: 'Easy Returns',
    desc: '7-day hassle-free return policy. No questions asked.',
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 8v4l3 3"/>
      </svg>
    ),
    title: '24/7 Support',
    desc: 'WhatsApp & email support. Always here for you.',
  },
];

const WhyUs = () => {
  const refs = useRef([]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    refs.current.forEach(el => { if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  return (
    <section style={{ background: '#082B27', padding: '72px 0', position: 'relative', overflow: 'hidden' }}>
      {/* Thin top/bottom lines */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(to right,transparent,rgba(201,168,76,.2),transparent)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(to right,transparent,rgba(201,168,76,.2),transparent)' }} />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 clamp(20px,5vw,64px)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '0' }}>
          {FEATURES.map((f, i) => (
            <div
              key={i}
              ref={el => refs.current[i] = el}
              style={{
                opacity: 0,
                transform: 'translateY(24px)',
                transition: `opacity .7s ease ${i * 100}ms, transform .7s cubic-bezier(.22,1,.36,1) ${i * 100}ms`,
                display: 'flex', alignItems: 'flex-start', gap: '20px',
                padding: 'clamp(24px,3vw,40px) clamp(20px,3vw,36px)',
                borderRight: i < FEATURES.length - 1 ? '1px solid rgba(255,255,255,.06)' : 'none',
              }}
            >
              <div style={{ color: '#C9A84C', flexShrink: 0, marginTop: '2px' }}>
                {f.icon}
              </div>
              <div>
                <p style={{ fontFamily: '"Bodoni Moda",serif', fontSize: '1rem', fontWeight: 700, color: '#FAF7F2', margin: '0 0 6px', letterSpacing: '-.01em' }}>
                  {f.title}
                </p>
                <p style={{ fontFamily: '"Jost",sans-serif', fontSize: '.85rem', fontWeight: 300, color: 'rgba(245,239,224,.45)', lineHeight: 1.7, margin: 0 }}>
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyUs;