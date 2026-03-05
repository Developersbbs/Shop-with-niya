import React, { useEffect, useRef } from 'react';

const reviews = [
  {
    name: "Priya Sharma",
    location: "Chennai",
    rating: 5,
    text: "The kurta I ordered was even more beautiful in person! The fabric is so soft and the embroidery is stunning. Will definitely be ordering more.",
    avatar: "PS",
    color: "#f59e0b",
  },
  {
    name: "Ananya R",
    location: "Bangalore",
    rating: 5,
    text: "Absolutely love my coord set. Got so many compliments at the wedding. Delivery was super fast too — within 2 days!",
    avatar: "AR",
    color: "#ef4444",
  },
  {
    name: "Meera Nair",
    location: "Kochi",
    rating: 5,
    text: "Finally found a brand that has real sizes with proper fitting. The quality is amazing for the price. My new go-to fashion store!",
    avatar: "MN",
    color: "#082B27",
  },
  {
    name: "Divya Krishnan",
    location: "Hyderabad",
    rating: 5,
    text: "Ordered the festive anarkali and it was perfect for Diwali. Beautiful packaging, quick delivery, and the dress is just gorgeous.",
    avatar: "DK",
    color: "#a78bfa",
  },
];

const Stars = ({ count }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: count }).map((_, i) => (
      <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

const Testimonials = () => {
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
      }, { threshold: 0.15 });
      observer.observe(el);
      return observer;
    });
    return () => observers.forEach(o => o?.disconnect());
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');
      `}</style>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">

          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Real Stories
            </span>
            <h2
              className="text-4xl md:text-5xl font-black text-gray-900 mt-2"
              style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
            >
              What Our{' '}
              <span style={{ color: "#082B27" }}>Customers Say</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {reviews.map((r, i) => (
              <div
                key={i}
                ref={el => refs.current[i] = el}
                style={{
                  opacity: 0,
                  transform: 'translateY(40px)',
                  transition: `opacity 0.7s ease ${i * 0.12}s, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${i * 0.12}s`,
                }}
                className="bg-gray-50 hover:bg-white hover:shadow-xl border border-gray-100
                           rounded-2xl p-6 transition-all duration-300 group"
              >
                {/* Quote mark */}
                <div className="text-5xl font-black leading-none mb-3 opacity-20"
                     style={{ color: r.color, fontFamily: 'Georgia, serif' }}>
                  "
                </div>

                <Stars count={r.rating} />

                <p className="text-gray-600 text-sm leading-relaxed mt-3 mb-5">
                  {r.text}
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center
                               text-white font-black text-sm flex-shrink-0"
                    style={{ background: r.color }}
                  >
                    {r.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{r.name}</p>
                    <p className="text-gray-400 text-xs">{r.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>
    </>
  );
};

export default Testimonials;