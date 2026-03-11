import React, { useEffect, useRef } from 'react';

const features = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    title: "Handpicked Quality",
    desc: "Every piece is carefully curated for fabric, fit, and finish — because you deserve nothing less.",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    title: "Fast Delivery",
    desc: "Orders dispatched within 7 days. We bring your wardrobe right to your doorstep.",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    title: "Inclusive Size Range",
    desc: "From XS to 5XL, fashion that fits every beautiful body.",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: "Secure Payments",
    desc: "Shop confidently with 100% encrypted and secure payment gateways.",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Sustainable Fashion",
    desc: "Ethically sourced, eco-conscious clothing that looks good and does good for the planet.",
  },
];

const WhyUs = () => {
  const refs = useRef([]);

  useEffect(() => {
    const observers = refs.current.map((el) => {
      if (!el) return null;
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
          observer.unobserve(el);
        }
      }, { threshold: 0.2 });
      observer.observe(el);
      return observer;
    });
    return () => observers.forEach(o => o?.disconnect());
  }, []);

  const topRow = features.slice(0, 3);
  const bottomRow = features.slice(3, 5);

  const Card = ({ f, refIndex }) => (
    <div
      ref={el => refs.current[refIndex] = el}
      style={{
        opacity: 0,
        transform: 'translateY(40px)',
        transition: `opacity 0.7s ease ${refIndex * 0.12}s, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${refIndex * 0.12}s`,
      }}
      className="group bg-white/5 hover:bg-white/10 border border-white/10
                 hover:border-yellow-400/40 rounded-2xl p-9
                 transition-all duration-300 cursor-default h-full min-h-[220px]"
    >
      <div className="w-14 h-14 rounded-xl bg-yellow-400/10 group-hover:bg-yellow-400/20
                      flex items-center justify-center text-yellow-400 mb-5
                      transition-colors duration-300">
        {f.icon}
      </div>
      <h3
        className="text-white font-bold text-lg mb-2"
        style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
      >
        {f.title}
      </h3>
      <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');
      `}</style>

      <section className="py-20 bg-[#082B27] relative overflow-hidden">

        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full opacity-5 bg-white" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full opacity-5 bg-white" />

        <div className="container mx-auto px-4 relative z-10">

          {/* Heading */}
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-white/40">
              Our Promise
            </span>
            <h2
              className="text-4xl md:text-5xl font-black text-white mt-2"
              style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
            >
              Why Customers Love{' '}
              <span className="text-yellow-400">Shop With Niya</span>
            </h2>
          </div>

          {/* Top Row — 3 equal cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            {topRow.map((f, i) => (
              <Card key={i} f={f} refIndex={i} />
            ))}
          </div>

          {/* Bottom Row — 2 cards centered */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:w-2/3 mx-auto">
            {bottomRow.map((f, i) => (
              <Card key={i + 3} f={f} refIndex={i + 3} />
            ))}
          </div>

        </div>
      </section>
    </>
  );
};

export default WhyUs;