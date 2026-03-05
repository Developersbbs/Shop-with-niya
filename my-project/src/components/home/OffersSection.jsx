import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

const banners = [
  {
    img: "/images/banner1.JPG",
    tag: "New Arrivals",
    title: "Everyday\nKurtis",
    subtitle: "Effortless style for every day",
    desc: "From morning meetings to evening strolls — our kurtis and coord sets are made for women who do it all. Soft fabrics, beautiful prints, perfect fits.",
    buttonText: "Shop Now",
    buttonLink: "/products",
    accent: "#082B27",
    accentLight: "#f0fdf4",
    imgLeft: true,
  },
  {
    img: "/images/banner2.JPG",
    tag: "Office Wear",
    title: "Dress to\nImpress",
    subtitle: "Professional looks, ethnic soul",
    desc: "Structured coord sets and elegant kurtis that take you from desk to dinner — without missing a beat. Look polished, feel powerful.",
    buttonText: "Explore Collection",
    buttonLink: "/products",
    accent: "#7c1d1d",
    accentLight: "#fff5f5",
    imgLeft: false,
  },
  {
    img: "/images/banner3.webp",
    tag: "Ethnic & Traditional",
    title: "Rooted in\nElegance",
    subtitle: "Timeless ethnic wear, reimagined",
    desc: "Celebrate your culture in style. Our maxi dresses and ethnic kurtis blend tradition with modern silhouettes — perfect for every occasion worth dressing up for.",
    buttonText: "Discover More",
    buttonLink: "/products",
    accent: "#713f12",
    accentLight: "#fffbeb",
    imgLeft: true,
  },
];

const curatedLooks = [
  { img: "/images/look1.jpg", label: "Everyday Wear", link: "/products?tag=everyday" },
  { img: "/images/look2.webp", label: "Festive Looks", link: "/products?tag=festive" },
  { img: "/images/look3.jpg", label: "Work Wear", link: "/products?tag=work" },
  { img: "/images/look5.jpg", label: "Casual Chic", link: "/products?tag=casual" },
  { img: "/images/look4.avif", label: "Party Wear", link: "/products?tag=party" },
];

/* ── Scroll reveal hook ── */
const useScrollReveal = (options = {}) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        el.style.opacity = '1';
        el.style.transform = 'translate(0, 0)';
        observer.unobserve(el);
      }
    }, { threshold: 0.2, ...options });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
};

/* ── Single split banner ── */
const BannerCard = ({ banner }) => {
  const imgRef = useScrollReveal();
  const textRef = useScrollReveal();

  const imgStyle = {
    opacity: 0,
    transform: banner.imgLeft ? 'translateX(-70px)' : 'translateX(70px)',
    transition: 'opacity 0.9s ease, transform 0.9s cubic-bezier(0.22,1,0.36,1)',
  };
  const textStyle = {
    opacity: 0,
    transform: banner.imgLeft ? 'translateX(70px)' : 'translateX(-70px)',
    transition: 'opacity 0.9s ease 0.18s, transform 0.9s cubic-bezier(0.22,1,0.36,1) 0.18s',
  };

  return (
    <div
      className={`flex flex-col ${banner.imgLeft ? 'md:flex-row' : 'md:flex-row-reverse'}
                  items-stretch overflow-hidden rounded-3xl shadow-lg`}
      style={{ background: banner.accentLight }}
    >
      {/* Image */}
      <div ref={imgRef} style={imgStyle}
           className="w-full md:w-1/2 h-96 md:h-[600px] overflow-hidden flex-shrink-0">
        <img
          src={banner.img}
          alt={banner.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
        />
      </div>

      {/* Text */}
      <div ref={textRef} style={textStyle}
           className="w-full md:w-1/2 flex flex-col justify-center px-8 md:px-16 py-12 md:py-0">

        <span
          className="inline-block w-fit px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.18em] mb-5"
          style={{ background: banner.accent, color: '#fff' }}
        >
          {banner.tag}
        </span>

        <h2
          className="font-black leading-[1.05] mb-4 whitespace-pre-line"
          style={{
            fontSize: 'clamp(2.8rem, 5vw, 4.5rem)',
            color: banner.accent,
            fontFamily: '"Playfair Display", Georgia, serif',
            letterSpacing: '-0.02em',
          }}
        >
          {banner.title}
        </h2>

        <p
          className="font-semibold mb-3"
          style={{ color: banner.accent, opacity: 0.75, fontSize: '1.05rem' }}
        >
          {banner.subtitle}
        </p>

        <div className="w-10 h-[3px] rounded-full mb-5"
             style={{ background: banner.accent }} />

        <p className="text-gray-500 leading-relaxed mb-9 max-w-xs text-sm">
          {banner.desc}
        </p>

        <Link
          to={banner.buttonLink}
          className="inline-flex items-center gap-2.5 w-fit px-7 py-3.5 rounded-full
                     font-semibold text-sm text-white
                     transition-all duration-300 hover:scale-105 active:scale-95"
          style={{
            background: banner.accent,
            boxShadow: `0 6px 22px ${banner.accent}45`,
            fontFamily: '"Inter", sans-serif',
          }}
        >
          {banner.buttonText}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M13 7l5 5-5 5M6 12h12" />
          </svg>
        </Link>
      </div>
    </div>
  );
};

/* ── Curated Looks card ── */
const LookCard = ({ look, index }) => {
  const ref = useScrollReveal();
  return (
    <div
      ref={ref}
      style={{
        opacity: 0,
        transform: 'translateY(50px)',
        transition: `opacity 0.7s ease ${index * 0.1}s, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${index * 0.1}s`,
      }}
    >
      <Link to={look.link} className="group block relative overflow-hidden rounded-2xl">
        {/* Image */}
        <div className="overflow-hidden" style={{ aspectRatio: '3/4' }}>
          <img
            src={look.img}
            alt={look.label}
            className="w-full h-full object-cover object-top
                       group-hover:scale-105 transition-transform duration-700"
          />
        </div>

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25
                        transition-all duration-300 rounded-2xl" />

        {/* Shop All button */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2
                        translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100
                        transition-all duration-300">
          <span
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full
                       bg-white text-[#082B27] font-bold text-xs shadow-xl whitespace-nowrap"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Shop All
          </span>
        </div>
      </Link>

      {/* Label */}
      <p
        className="text-center mt-3 font-semibold text-gray-700 text-sm"
        style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
      >
        {look.label}
      </p>
    </div>
  );
};

/* ── Main export ── */
const OffersSection = () => {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');

        .looks-swiper .swiper-button-next,
        .looks-swiper .swiper-button-prev {
          width: 38px; height: 38px;
          background: white;
          border-radius: 50%;
          border: 1px solid #e5e7eb;
          box-shadow: 0 2px 12px rgba(0,0,0,0.10);
          color: #082B27;
          transition: all 0.2s ease;
        }
        .looks-swiper .swiper-button-next:hover,
        .looks-swiper .swiper-button-prev:hover {
          background: #082B27;
          color: white;
          border-color: #082B27;
        }
        .looks-swiper .swiper-button-next::after,
        .looks-swiper .swiper-button-prev::after {
          font-size: 12px; font-weight: 800;
        }
      `}</style>

      {/* ── Split Banners ── */}
      <section className="container mx-auto px-4 py-12 space-y-8">
        <div className="text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Collections</span>
          <h2
            className="text-4xl md:text-5xl font-black text-gray-900 mt-2"
            style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
          >
            Explore Our <span style={{ color: "#082B27" }}>Latest Drops</span>
          </h2>
        </div>

        {banners.map((banner, i) => (
          <BannerCard key={i} banner={banner} />
        ))}
      </section>

      {/* ── Curated Looks ── */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">

          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Styled For You
            </span>
            <h2
              className="text-4xl md:text-5xl font-black text-gray-900 mt-2"
              style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
            >
              Curated <span style={{ color: "#082B27" }}>Looks</span>
            </h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto text-sm leading-relaxed">
              Handpicked outfits for every occasion — because every woman deserves to feel her best.
            </p>
          </div>

          <div className="relative">
            <Swiper
              modules={[Autoplay, Navigation]}
              navigation
              autoplay={{ delay: 3000, disableOnInteraction: false }}
              loop
              spaceBetween={20}
              slidesPerView={2}
              breakpoints={{
                640:  { slidesPerView: 2 },
                768:  { slidesPerView: 3 },
                1024: { slidesPerView: 4 },
                1280: { slidesPerView: 5 },
              }}
              className="looks-swiper"
            >
              {curatedLooks.map((look, i) => (
                <SwiperSlide key={i}>
                  <LookCard look={look} index={i} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          <div className="text-center mt-10">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full
                         font-semibold text-sm text-white transition-all duration-300
                         hover:scale-105 active:scale-95"
              style={{
                background: '#082B27',
                boxShadow: '0 6px 22px rgba(8,43,39,0.35)',
                fontFamily: '"Inter", sans-serif',
              }}
            >
              View All Looks
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                      d="M13 7l5 5-5 5M6 12h12" />
              </svg>
            </Link>
          </div>

        </div>
      </section>
    </>
  );
};

export default OffersSection;