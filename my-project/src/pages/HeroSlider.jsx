import React, { useState, useEffect, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectFade } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

const slides = [
  {
    img: "/images/slider2.png",
    tag: "Summer Collection",
    heading: "Explore",
    subheading: "Now",
    description: "Discover our latest summer collection",
    buttonText: "Shop Now",
    buttonLink: "/shop",
    accent: "#f59e0b",
  },
  {
    img: "/images/slider5.png",
    tag: "Trending",
    heading: "New",
    subheading: "Arrivals",
    description: "Check out what's trending this season",
    buttonText: "Explore More",
    buttonLink: "/collections/new",
    accent: "#d4a853",
  },
  {
    img: "/images/slider3.png",
    tag: "Limited Time",
    heading: "Limited",
    subheading: "Offer",
    description: "Grab your favorites before they run out",
    buttonText: "Shop Deals",
    buttonLink: "/offers",
    accent: "#ef4444",
  },
];

const SLIDE_DELAY = 5000;

export default function HeroSlider() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const progressRef = useRef(null);

  useEffect(() => {
    if (!progressRef.current) return;
    progressRef.current.style.animation = "none";
    void progressRef.current.offsetHeight;
    progressRef.current.style.animation = `progressFill ${SLIDE_DELAY}ms linear forwards`;
  }, [activeIndex]);

  const current = slides[activeIndex];

  return (
    <>
      <style>{`
        /* Ken Burns */
        .kb-img {
          transform: scale(1.06);
          transition: transform ${SLIDE_DELAY}ms ease-out;
        }
        .swiper-slide-active .kb-img {
          transform: scale(1);
        }

        /* Overlay — lighter so image breathes */
        .slide-overlay {
          background: linear-gradient(
            105deg,
            rgba(5, 20, 15, 0.55) 0%,
            rgba(5, 20, 15, 0.30) 50%,
            rgba(5, 20, 15, 0.65) 100%
          );
        }

        /* Bottom vignette */
        .slide-vignette {
          background: linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 40%);
        }

        /* Progress bar */
        @keyframes progressFill {
          from { width: 0%; }
          to   { width: 100%; }
        }

        /* Pagination bullets */
        .hero-swiper .swiper-pagination {
          bottom: 24px;
        }
        .hero-swiper .swiper-pagination-bullet {
          width: 6px;
          height: 6px;
          background: rgba(255,255,255,0.35);
          opacity: 1;
          transition: all 0.3s ease;
        }
        .hero-swiper .swiper-pagination-bullet-active {
          width: 24px;
          border-radius: 3px;
          background: white;
        }

        /* Button shine */
        .btn-shine { position: relative; overflow: hidden; }
        .btn-shine::after {
          content: '';
          position: absolute;
          top: 0; left: -100%; width: 60%; height: 100%;
          background: linear-gradient(120deg, transparent, rgba(255,255,255,0.25), transparent);
          transition: left 0.5s ease;
        }
        .btn-shine:hover::after { left: 150%; }

        /* Floating dot */
        @keyframes floatDot {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-6px); }
        }
        .float-dot { animation: floatDot 2.5s ease-in-out infinite; }

        /* Vertical slide indicators */
        .slide-indicator {
          transition: height 0.3s ease, background 0.3s ease;
        }
      `}</style>

      <div className="relative w-full h-screen overflow-hidden">
        <Swiper
          modules={[Autoplay, Pagination, EffectFade]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          slidesPerView={1}
          loop
          autoplay={{ delay: SLIDE_DELAY, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          onSlideChange={(s) => {
            setActiveIndex(s.realIndex);
            setAnimKey(k => k + 1);
          }}
          className="h-full hero-swiper"
        >
          {slides.map((slide, i) => (
            <SwiperSlide key={i} className="relative overflow-hidden">
              <img
                src={slide.img}
                alt={slide.heading}
                className="kb-img absolute inset-0 w-full h-full object-cover object-top"
              />
              <div className="slide-overlay absolute inset-0" />
              <div className="slide-vignette absolute inset-0" />
            </SwiperSlide>
          ))}
        </Swiper>

        {/* ── Animated text overlay ── */}
        <div
          key={animKey}
          className="absolute inset-0 z-10 pointer-events-none
                     flex flex-col justify-center items-end
                     px-10 md:px-16 lg:px-24 pb-16 md:pb-0"
        >
          <div className="flex flex-col items-start" style={{ maxWidth: "520px" }}>

            {/* Tag */}
            <div
              className="animate-fade-up mb-6 pointer-events-auto"
              style={{ animationDelay: "0.1s", animationFillMode: "both" }}
            >
              <span
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                           text-[11px] font-bold uppercase tracking-[0.15em]"
                style={{
                  color: current.accent,
                  background: `${current.accent}25`,
                  border: `1px solid ${current.accent}60`,
                }}
              >
                <span className="float-dot w-1.5 h-1.5 rounded-full"
                      style={{ background: current.accent }} />
                {current.tag}
              </span>
            </div>

            {/* Heading word 1 */}
            <div className="overflow-hidden">
              <h1
                className="animate-slide-in-left font-black text-white leading-[0.95] tracking-tight"
                style={{
                  fontSize: "clamp(3.5rem, 8vw, 6rem)",
                  animationDelay: "0.2s",
                  animationFillMode: "both",
                  textShadow: "0 2px 20px rgba(0,0,0,0.5)",
                }}
              >
                {current.heading}
              </h1>
            </div>

            {/* Heading word 2 — accent colored */}
            <div className="overflow-hidden mb-6">
              <h1
                className="animate-slide-in-right font-black leading-[0.95] tracking-tight"
                style={{
                  fontSize: "clamp(3.5rem, 8vw, 6rem)",
                  color: current.accent,
                  animationDelay: "0.35s",
                  animationFillMode: "both",
                  textShadow: `0 2px 24px ${current.accent}70`,
                  filter: "brightness(1.25)",
                }}
              >
                {current.subheading}
              </h1>
            </div>

            {/* Divider line */}
            <div
              className="animate-zoom-in h-0.5 w-14 mb-5 rounded-full"
              style={{
                background: `linear-gradient(to right, ${current.accent}, transparent)`,
                animationDelay: "0.45s",
                animationFillMode: "both",
              }}
            />

            {/* Description */}
            <p
              className="animate-fade-up text-white/90 mb-8 leading-relaxed"
              style={{
                fontSize: "clamp(0.9rem, 1.5vw, 1.05rem)",
                animationDelay: "0.55s",
                animationFillMode: "both",
                textShadow: "0 1px 10px rgba(0,0,0,0.6)",
              }}
            >
              {current.description}
            </p>

            {/* Buttons */}
            <div
              className="animate-fade-up flex flex-wrap items-center gap-4 pointer-events-auto"
              style={{ animationDelay: "0.7s", animationFillMode: "both" }}
            >
              {/* Primary */}
              
              <a  href={current.buttonLink}
                className="btn-shine group inline-flex items-center gap-2.5
                           px-6 py-3 rounded-full font-semibold text-sm text-white
                           transition-all duration-300 hover:scale-105 active:scale-95"
                style={{
                  background: current.accent,
                  boxShadow: `0 6px 24px ${current.accent}55`,
                }}
              >
                {current.buttonText}
                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center
                                 group-hover:bg-white/30 transition-colors">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                          d="M13 7l5 5-5 5M6 12h12" />
                  </svg>
                </span>
              </a>

              {/* Ghost secondary */}
              
              <a  href="/products"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full
                           text-sm font-medium text-white hover:text-white
                           border border-white/25 hover:border-white/50
                           backdrop-blur-sm bg-white/8 hover:bg-white/15
                           transition-all duration-300"
              >
                Browse all
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>

          </div>
        </div>

        {/* ── Vertical slide indicators — desktop only ── */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 z-20
                        hidden lg:flex flex-col gap-2 items-center">
          {slides.map((_, i) => (
            <div
              key={i}
              className="slide-indicator rounded-full"
              style={{
                width: "3px",
                height: i === activeIndex ? "32px" : "8px",
                background: i === activeIndex
                  ? current.accent
                  : "rgba(255,255,255,0.25)",
              }}
            />
          ))}
        </div>

        {/* ── Progress bar — very bottom ── */}
        <div className="absolute bottom-0 left-0 right-0 z-20 h-[2px] bg-white/10">
          <div
            ref={progressRef}
            className="h-full rounded-full"
            style={{ background: current.accent }}
          />
        </div>
      </div>
    </>
  );
}