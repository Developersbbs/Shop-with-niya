// import { useState, useEffect, useRef, useCallback } from "react";

// const API_URL = (import.meta?.env?.VITE_API_URL || "http://localhost:5000") + "/api";

// // ── Detect mobile ──────────────────────────────────────────────
// const useIsMobile = () => {
//   const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
//   useEffect(() => {
//     const handler = () => setIsMobile(window.innerWidth < 768);
//     window.addEventListener("resize", handler);
//     return () => window.removeEventListener("resize", handler);
//   }, []);
//   return isMobile;
// };

// // ── Button renderer (mirrors admin buttonStyle) ────────────────
// function CTAButton({ text, link, buttonStyle, buttonColor, buttonTextColor, onClick }) {
//   const base = {
//     display: "inline-block",
//     padding: "13px 34px",
//     fontSize: "11px",
//     fontFamily: "'Cormorant Garamond', serif",
//     fontWeight: 700,
//     letterSpacing: "0.25em",
//     textTransform: "uppercase",
//     textDecoration: "none",
//     cursor: "pointer",
//     transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
//     border: "none",
//     outline: "none",
//   };

//   let style = { ...base };
//   if (buttonStyle === "filled") {
//     style = { ...style, background: buttonColor || "#fff", color: buttonTextColor || "#000", border: `2px solid ${buttonColor || "#fff"}` };
//   } else if (buttonStyle === "outline") {
//     style = { ...style, background: "transparent", color: buttonColor || "#fff", border: `2px solid ${buttonColor || "#fff"}` };
//   } else {
//     style = { ...style, background: "rgba(255,255,255,0.08)", color: buttonColor || "#fff", border: "2px solid transparent", backdropFilter: "blur(8px)" };
//   }

//   return (
//     <a href={link || "#"} style={style} onClick={onClick}
//       onMouseEnter={e => { e.currentTarget.style.opacity = "0.82"; e.currentTarget.style.transform = "translateY(-2px)"; }}
//       onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}>
//       {text}
//     </a>
//   );
// }

// // ── Template layouts ───────────────────────────────────────────
// function SlideContent({ slide, visible, isMobile }) {
//   const textColor = slide.textColor || "#ffffff";

//   const templates = {
//     center: (
//       <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: isMobile ? "0 24px" : "0 80px" }}>
//         {slide.subtitle && (
//           <p style={{ color: textColor, opacity: 0.7, fontSize: isMobile ? "10px" : "12px", letterSpacing: "0.35em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: "20px", transform: visible ? "translateY(0)" : "translateY(24px)", opacity: visible ? 0.7 : 0, transition: "all 0.7s cubic-bezier(0.4,0,0.2,1) 0.1s" }}>
//             {slide.subtitle}
//           </p>
//         )}
//         <h1 style={{ color: textColor, fontSize: isMobile ? "clamp(22px,6vw,36px)" : "clamp(32px,4vw,60px)", fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, lineHeight: 1.1, letterSpacing: "-0.01em", marginBottom: "20px", transform: visible ? "translateY(0)" : "translateY(40px)", opacity: visible ? 1 : 0, transition: "all 0.85s cubic-bezier(0.4,0,0.2,1) 0.2s", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
//           {slide.title}
//         </h1>
//         {slide.description && (
//           <p style={{ color: textColor, opacity: 0.75, fontSize: isMobile ? "13px" : "15px", fontFamily: "'DM Mono', monospace", fontWeight: 400, maxWidth: "560px", lineHeight: 1.75, marginBottom: "36px", transform: visible ? "translateY(0)" : "translateY(30px)", opacity: visible ? 0.75 : 0, transition: "all 0.85s cubic-bezier(0.4,0,0.2,1) 0.35s" }}>
//             {slide.description}
//           </p>
//         )}
//         <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", justifyContent: "center", transform: visible ? "translateY(0)" : "translateY(20px)", opacity: visible ? 1 : 0, transition: "all 0.85s cubic-bezier(0.4,0,0.2,1) 0.5s" }}>
//           {slide.primaryCTA?.text && <CTAButton {...slide.primaryCTA} buttonStyle={slide.buttonStyle} buttonColor={slide.buttonColor} buttonTextColor={slide.buttonTextColor} />}
//           {slide.secondaryCTA?.text && <CTAButton {...slide.secondaryCTA} buttonStyle="outline" buttonColor={textColor} buttonTextColor="transparent" />}
//         </div>
//       </div>
//     ),

//     full: (
//       <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: isMobile ? "40px 24px" : "80px 100px" }}>
//         <div style={{ maxWidth: "680px" }}>
//           {slide.subtitle && (
//             <p style={{ color: textColor, fontSize: "11px", letterSpacing: "0.4em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: "16px", transform: visible ? "translateX(0)" : "translateX(-30px)", opacity: visible ? 0.65 : 0, transition: "all 0.7s ease 0.1s" }}>
//               — {slide.subtitle}
//             </p>
//           )}
//           <h1 style={{ color: textColor, fontSize: isMobile ? "clamp(22px,6vw,36px)" : "clamp(32px,4vw,58px)", fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: "24px", transform: visible ? "translateX(0)" : "translateX(-50px)", opacity: visible ? 1 : 0, transition: "all 0.9s cubic-bezier(0.16,1,0.3,1) 0.2s", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
//             {slide.title}
//           </h1>
//           {slide.description && (
//             <p style={{ color: textColor, opacity: 0.7, fontSize: "14px", fontFamily: "'DM Mono', monospace", maxWidth: "440px", lineHeight: 1.8, marginBottom: "36px", transform: visible ? "translateX(0)" : "translateX(-30px)", opacity: visible ? 0.7 : 0, transition: "all 0.85s ease 0.4s" }}>
//               {slide.description}
//             </p>
//           )}
//           <div style={{ display: "flex", gap: "14px", transform: visible ? "translateX(0)" : "translateX(-20px)", opacity: visible ? 1 : 0, transition: "all 0.85s ease 0.55s" }}>
//             {slide.primaryCTA?.text && <CTAButton {...slide.primaryCTA} buttonStyle={slide.buttonStyle} buttonColor={slide.buttonColor} buttonTextColor={slide.buttonTextColor} />}
//             {slide.secondaryCTA?.text && <CTAButton {...slide.secondaryCTA} buttonStyle="outline" buttonColor={textColor} />}
//           </div>
//         </div>
//       </div>
//     ),

//     banner: (
//       <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: isMobile ? "0 20px" : "0 60px" }}>
//         <div style={{ border: `1px solid ${textColor}30`, padding: isMobile ? "32px 24px" : "48px 72px", backdropFilter: "blur(12px)", background: "rgba(0,0,0,0.25)", maxWidth: "700px", transform: visible ? "scale(1)" : "scale(0.94)", opacity: visible ? 1 : 0, transition: "all 0.9s cubic-bezier(0.34,1.56,0.64,1) 0.1s" }}>
//           {slide.subtitle && (
//             <p style={{ color: textColor, opacity: 0.6, fontSize: "10px", letterSpacing: "0.5em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: "18px" }}>
//               {slide.subtitle}
//             </p>
//           )}
//           <h1 style={{ color: textColor, fontSize: isMobile ? "clamp(20px,5vw,32px)" : "clamp(28px,3.5vw,52px)", fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, lineHeight: 1.1, letterSpacing: "-0.01em", marginBottom: "20px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
//             {slide.title}
//           </h1>
//           {slide.description && (
//             <p style={{ color: textColor, opacity: 0.7, fontSize: "13px", fontFamily: "'DM Mono', monospace", lineHeight: 1.7, marginBottom: "28px" }}>
//               {slide.description}
//             </p>
//           )}
//           <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
//             {slide.primaryCTA?.text && <CTAButton {...slide.primaryCTA} buttonStyle={slide.buttonStyle} buttonColor={slide.buttonColor} buttonTextColor={slide.buttonTextColor} />}
//             {slide.secondaryCTA?.text && <CTAButton {...slide.secondaryCTA} buttonStyle="ghost" buttonColor={textColor} />}
//           </div>
//         </div>
//       </div>
//     ),

//     split: (
//       <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "stretch" }}>
//         <div style={{ width: isMobile ? "100%" : "50%", display: "flex", flexDirection: "column", justifyContent: "center", padding: isMobile ? "40px 24px" : "80px 72px", background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}>
//           {slide.subtitle && (
//             <p style={{ color: textColor, opacity: 0.6, fontSize: "10px", letterSpacing: "0.45em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: "18px", transform: visible ? "translateY(0)" : "translateY(20px)", opacity: visible ? 0.6 : 0, transition: "all 0.7s ease 0.1s" }}>
//               {slide.subtitle}
//             </p>
//           )}
//           <h1 style={{ color: textColor, fontSize: isMobile ? "clamp(22px,6vw,36px)" : "clamp(30px,3.5vw,54px)", fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: "20px", transform: visible ? "translateY(0)" : "translateY(36px)", opacity: visible ? 1 : 0, transition: "all 0.9s cubic-bezier(0.4,0,0.2,1) 0.2s", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
//             {slide.title}
//           </h1>
//           {slide.description && (
//             <p style={{ color: textColor, opacity: 0.7, fontSize: "13px", fontFamily: "'DM Mono', monospace", lineHeight: 1.8, marginBottom: "32px", maxWidth: "380px", transform: visible ? "translateY(0)" : "translateY(24px)", opacity: visible ? 0.7 : 0, transition: "all 0.85s ease 0.35s" }}>
//               {slide.description}
//             </p>
//           )}
//           <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", transform: visible ? "translateY(0)" : "translateY(16px)", opacity: visible ? 1 : 0, transition: "all 0.85s ease 0.5s" }}>
//             {slide.primaryCTA?.text && <CTAButton {...slide.primaryCTA} buttonStyle={slide.buttonStyle} buttonColor={slide.buttonColor} buttonTextColor={slide.buttonTextColor} />}
//             {slide.secondaryCTA?.text && <CTAButton {...slide.secondaryCTA} buttonStyle="outline" buttonColor={textColor} />}
//           </div>
//         </div>
//       </div>
//     ),
//   };

//   return templates[slide.templateType || "center"] || templates.center;
// }

// // ── Main HeroSlider ────────────────────────────────────────────
// export default function HeroSlider() {
//   const [slides, setSlides] = useState([]);
//   const [current, setCurrent] = useState(0);
//   const [visible, setVisible] = useState(true);
//   const [loading, setLoading] = useState(true);
//   const [dragging, setDragging] = useState(false);
//   const [dragStart, setDragStart] = useState(0);
//   const timerRef = useRef(null);
//   const isMobile = useIsMobile();

//   // ── Fetch ───────────────────────────────────────────────────
//   useEffect(() => {
//     const device = isMobile ? "mobile" : "desktop";
//     fetch(`${API_URL}/hero-section?device=${device}`)
//       .then(r => r.json())
//       .then(d => { if (d.success) setSlides(d.data); })
//       .catch(console.error)
//       .finally(() => setLoading(false));
//   }, [isMobile]);

//   // ── Track view ─────────────────────────────────────────────
//   useEffect(() => {
//     if (slides[current]?._id) {
//       fetch(`${API_URL}/hero-section/${slides[current]._id}/view`, { method: "POST" }).catch(() => {});
//     }
//   }, [current, slides]);

//   // ── Auto-play ──────────────────────────────────────────────
//   const startTimer = useCallback(() => {
//     clearInterval(timerRef.current);
//     if (slides.length > 1) {
//       timerRef.current = setInterval(() => goTo("next"), 5500);
//     }
//   }, [slides.length]);

//   useEffect(() => { startTimer(); return () => clearInterval(timerRef.current); }, [startTimer]);

//   const goTo = useCallback((dir) => {
//     setVisible(false);
//     setTimeout(() => {
//       setCurrent(prev => {
//         if (dir === "next") return (prev + 1) % slides.length;
//         if (dir === "prev") return (prev - 1 + slides.length) % slides.length;
//         return dir; // number index
//       });
//       setVisible(true);
//     }, 420);
//     startTimer();
//   }, [slides.length, startTimer]);

//   // ── Drag / swipe ───────────────────────────────────────────
//   const onDragStart = (e) => { setDragging(true); setDragStart(e.touches ? e.touches[0].clientX : e.clientX); };
//   const onDragEnd = (e) => {
//     if (!dragging) return;
//     const end = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
//     const delta = dragStart - end;
//     if (Math.abs(delta) > 50) goTo(delta > 0 ? "next" : "prev");
//     setDragging(false);
//   };

//   // ── Track click ────────────────────────────────────────────
//   const trackClick = (id) => {
//     fetch(`${API_URL}/hero-section/${id}/click`, { method: "POST" }).catch(() => {});
//   };

//   if (loading) {
//     return (
//       <div style={{ width: "100%", height: isMobile ? "100svh" : "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
//         <div style={{ width: 36, height: 36, border: "1px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.9s linear infinite" }} />
//         <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
//       </div>
//     );
//   }

//   if (!slides.length) return null;

//   const slide = slides[current];
//   const imageUrl = (() => {
//     const src = (isMobile && slide.imageMobile) ? slide.imageMobile : slide.image;
//     if (!src) return "";
//     if (src.startsWith("http")) return src;
//     return `${API_URL.replace("/api", "")}${src}`;
//   })();

//   return (
//     <>
//       {/* Google Fonts */}
//       <link rel="preconnect" href="https://fonts.googleapis.com" />
//       <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Mono:wght@300;400;500&display=swap" rel="stylesheet" />

//       <section
//         style={{ position: "relative", width: "100%", height: isMobile ? "100svh" : "100vh", overflow: "hidden", userSelect: "none", cursor: dragging ? "grabbing" : "grab" }}
//         onMouseDown={onDragStart} onMouseUp={onDragEnd} onMouseLeave={() => setDragging(false)}
//         onTouchStart={onDragStart} onTouchEnd={onDragEnd}
//       >
//         {/* ── Background image ── */}
//         {slides.map((s, i) => {
//           const src = (() => {
//             const img = (isMobile && s.imageMobile) ? s.imageMobile : s.image;
//             if (!img) return "";
//             return img.startsWith("http") ? img : `${API_URL.replace("/api", "")}${img}`;
//           })();
//           return (
//             <div key={s._id} style={{ position: "absolute", inset: 0, transition: "opacity 0.7s cubic-bezier(0.4,0,0.2,1)", opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0 }}>
//               <img src={src} alt={s.title} style={{ width: "100%", height: "100%", objectFit: "cover", transform: i === current && visible ? "scale(1.04)" : "scale(1)", transition: "transform 6s cubic-bezier(0.4,0,0.2,1)" }} />
//               <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(to right, ${s.gradient || "from-black/90 via-black/40 to-transparent"})`.replace(/from-|via-|to-/g, "").replace(/\//g, ", 0.").replace(/black/g, "#000").replace(/transparent/g, "transparent") }} />
//               {/* Safe fallback gradient overlay */}
//               <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.18) 55%, rgba(0,0,0,0.05) 100%)" }} />
//             </div>
//           );
//         })}

//         {/* ── Slide content ── */}
//         <div style={{ position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none" }}>
//           <div style={{ opacity: visible ? 1 : 0, transition: "opacity 0.42s ease", height: "100%", pointerEvents: "auto" }}>
//             <SlideContent slide={slide} visible={visible} isMobile={isMobile} />
//           </div>
//         </div>

//         {/* ── Slide counter (top right) ── */}
//         {slides.length > 1 && (
//           <div style={{ position: "absolute", top: isMobile ? 20 : 36, right: isMobile ? 20 : 48, zIndex: 20, display: "flex", alignItems: "center", gap: "8px" }}>
//             <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "rgba(255,255,255,0.5)", letterSpacing: "0.2em" }}>
//               {String(current + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
//             </span>
//           </div>
//         )}

//         {/* ── Arrow navigation ── */}
//         {slides.length > 1 && !isMobile && (
//           <>
//             <button onClick={() => goTo("prev")} aria-label="Previous" style={{ position: "absolute", left: 32, top: "50%", transform: "translateY(-50%)", zIndex: 20, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)", color: "#fff", width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(10px)", transition: "all 0.25s ease" }}
//               onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.2)"; }}
//               onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}>
//               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 18l-6-6 6-6"/></svg>
//             </button>
//             <button onClick={() => goTo("next")} aria-label="Next" style={{ position: "absolute", right: 32, top: "50%", transform: "translateY(-50%)", zIndex: 20, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)", color: "#fff", width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(10px)", transition: "all 0.25s ease" }}
//               onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.2)"; }}
//               onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}>
//               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 18l6-6-6-6"/></svg>
//             </button>
//           </>
//         )}

//         {/* ── Dot navigation ── */}
//         {slides.length > 1 && (
//           <div style={{ position: "absolute", bottom: isMobile ? 32 : 44, left: "50%", transform: "translateX(-50%)", zIndex: 20, display: "flex", gap: "10px", alignItems: "center" }}>
//             {slides.map((_, i) => (
//               <button key={i} onClick={() => goTo(i)} aria-label={`Slide ${i + 1}`} style={{ padding: 0, border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center" }}>
//                 <span style={{
//                   display: "block",
//                   width: i === current ? (isMobile ? 24 : 32) : 6,
//                   height: 2,
//                   background: i === current ? "#fff" : "rgba(255,255,255,0.35)",
//                   transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)",
//                   borderRadius: 2,
//                 }} />
//               </button>
//             ))}
//           </div>
//         )}

//         {/* ── Progress bar ── */}
//         {slides.length > 1 && (
//           <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 20, height: "2px", background: "rgba(255,255,255,0.1)" }}>
//             <div key={current} style={{ height: "100%", background: "rgba(255,255,255,0.6)", animation: "progress 5.5s linear forwards" }} />
//           </div>
//         )}

//         <style>{`
//           @keyframes progress { from { width: 0% } to { width: 100% } }
//           * { box-sizing: border-box; margin: 0; padding: 0; }
//         `}</style>
//       </section>
//     </>
//   );
// }