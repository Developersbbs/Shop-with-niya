import React, { useState, useEffect, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectFade } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

interface HeroSlide {
  _id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  imageMobile?: string;
  primaryCTA?: { text: string; link: string };
  secondaryCTA?: { text: string; link: string };
  gradient?: string;
  textColor?: string;
  buttonStyle?: "filled" | "outline" | "ghost";
  buttonColor?: string;
  buttonTextColor?: string;
  templateType?: string;
  order: number;
  isActive: boolean;
}

const SLIDE_DELAY = 5000;

export default function HeroSlider() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const progressRef = useRef<HTMLDivElement>(null);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const API_URL = baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;

  const resolveUrl = (path?: string) => {
    if (!path) return "";
    return path.startsWith("http") ? path : `${API_URL.replace("/api", "")}${path}`;
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const res = await fetch(`${API_URL}/hero-section`);
        const data = await res.json();
        if (data.success) {
          const active = (data.data as HeroSlide[])
            .filter((s) => s.isActive)
            .sort((a, b) => a.order - b.order);
          setSlides(active);
        }
      } catch (err) {
        console.error("Failed to load hero slides:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSlides();
  }, [API_URL]);

  useEffect(() => {
    if (!progressRef.current) return;
    progressRef.current.style.animation = "none";
    void progressRef.current.offsetHeight;
    progressRef.current.style.animation = `progressFill ${SLIDE_DELAY}ms linear forwards`;
  }, [activeIndex]);

  if (loading) {
    return (
      <div className="relative w-full h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (slides.length === 0) return null;

  const current = slides[activeIndex] || slides[0];
  const accent = current.buttonColor || "#f59e0b";

  return (
    <>
      <style>{`
        .kb-img {
          transform: scale(1.06);
          transition: transform ${SLIDE_DELAY}ms ease-out;
        }
        .swiper-slide-active .kb-img {
          transform: scale(1);
        }
        .slide-overlay {
          background: linear-gradient(
            105deg,
            rgba(5, 20, 15, 0.55) 0%,
            rgba(5, 20, 15, 0.30) 50%,
            rgba(5, 20, 15, 0.65) 100%
          );
        }
        .slide-vignette {
          background: linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 40%);
        }
        @keyframes progressFill {
          from { width: 0%; }
          to   { width: 100%; }
        }
        .hero-swiper .swiper-pagination { bottom: 24px; }
        .hero-swiper .swiper-pagination-bullet {
          width: 6px; height: 6px;
          background: rgba(255,255,255,0.35);
          opacity: 1; transition: all 0.3s ease;
        }
        .hero-swiper .swiper-pagination-bullet-active {
          width: 24px; border-radius: 3px; background: white;
        }
        .btn-shine { position: relative; overflow: hidden; }
        .btn-shine::after {
          content: '';
          position: absolute;
          top: 0; left: -100%; width: 60%; height: 100%;
          background: linear-gradient(120deg, transparent, rgba(255,255,255,0.25), transparent);
          transition: left 0.5s ease;
        }
        .btn-shine:hover::after { left: 150%; }
        @keyframes floatDot {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-6px); }
        }
        .float-dot { animation: floatDot 2.5s ease-in-out infinite; }
        .slide-indicator { transition: height 0.3s ease, background 0.3s ease; }
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
            setAnimKey((k) => k + 1);
          }}
          className="h-full hero-swiper"
        >
          {slides.map((slide, i) => (
            <SwiperSlide key={slide._id || i} className="relative overflow-hidden">

              <img
                src={slide.imageMobile && isMobile ? resolveUrl(slide.imageMobile) : resolveUrl(slide.image)}
                alt={slide.title}
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
          <div className="flex flex-col items-start" style={{ maxWidth: "520px", marginRight: "9vw" }}>

            {/* Tag */}
            <div
              className="animate-fade-up mb-6 pointer-events-auto"
              style={{ animationDelay: "0.1s", animationFillMode: "both" }}
            >
              <span
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                           text-[11px] font-bold uppercase tracking-[0.15em]"
                style={{
                  color: accent,
                  background: `${accent}25`,
                  border: `1px solid ${accent}60`,
                }}
              >
                <span className="float-dot w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
                {current.subtitle || current.title}
              </span>
            </div>

            {/* Heading */}
            <div className="overflow-hidden">
              <h1
                className="animate-slide-in-left font-black text-white leading-[0.95] tracking-tight"
                style={{
                  fontSize: "clamp(3.5rem, 8vw, 6rem)",
                  animationDelay: "0.2s",
                  animationFillMode: "both",
                  color: current.textColor || "#ffffff",
                  textShadow: "0 2px 20px rgba(0,0,0,0.5)",
                }}
              >
                {current.title}
              </h1>
            </div>

            {/* Divider */}
            <div
              className="animate-zoom-in h-0.5 w-14 mb-5 mt-4 rounded-full"
              style={{
                background: `linear-gradient(to right, ${accent}, transparent)`,
                animationDelay: "0.45s",
                animationFillMode: "both",
              }}
            />

            {/* Description */}
            {current.description && (
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
            )}

            {/* Buttons */}
            <div
              className="animate-fade-up flex flex-wrap items-center gap-4 pointer-events-auto"
              style={{ animationDelay: "0.7s", animationFillMode: "both" }}
            >
              {current.primaryCTA && (
                <a
                  href={current.primaryCTA.link}
                  className="btn-shine group inline-flex items-center gap-2.5
                             px-6 py-3 rounded-full font-semibold text-sm
                             transition-all duration-300 hover:scale-105 active:scale-95"
                  style={{
                    background: current.buttonStyle === "outline" ? "transparent"
                      : current.buttonStyle === "ghost" ? "rgba(0,0,0,0.08)"
                      : accent,
                    color: current.buttonStyle === "filled"
                      ? current.buttonTextColor || "#000"
                      : accent,
                    border: `2px solid ${accent}`,
                    boxShadow: current.buttonStyle === "filled" ? `0 6px 24px ${accent}55` : "none",
                  }}
                >
                  {current.primaryCTA.text}
                  <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center
                                   group-hover:bg-white/30 transition-colors">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                            d="M13 7l5 5-5 5M6 12h12" />
                    </svg>
                  </span>
                </a>
              )}

              {current.secondaryCTA && (
                <a
                  href={current.secondaryCTA.link}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full
                             text-sm font-medium text-white hover:text-white
                             border border-white/25 hover:border-white/50
                             backdrop-blur-sm bg-white/8 hover:bg-white/15
                             transition-all duration-300"
                >
                  {current.secondaryCTA.text}
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
              )}
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
                background: i === activeIndex ? accent : "rgba(255,255,255,0.25)",
              }}
            />
          ))}
        </div>

        {/* ── Progress bar ── */}
        <div className="absolute bottom-0 left-0 right-0 z-20 h-[2px] bg-white/10">
          <div
            ref={progressRef}
            className="h-full rounded-full"
            style={{ background: accent }}
          />
        </div>
      </div>
    </>
  );
}