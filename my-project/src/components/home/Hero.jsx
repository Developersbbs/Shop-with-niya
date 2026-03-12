import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useGetHeroSlidesQuery } from '../../redux/services/heroSection';

/* ─────────────────────────────────────────
   GLOBAL STYLES  (injected once)
───────────────────────────────────────── */
const STYLE_ID = 'niya-v5-styles';
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@200;300;400;500;600;700;800&family=Oswald:wght@400;500;600;700&family=DM+Mono:wght@300;400&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root { --gold: #C9A84C; --deep: #082B27; }
    body, html { font-family: 'Poppins', sans-serif; }
    h1,h2,h3,h4,h5,h6 { font-family: 'Oswald', sans-serif; }

    /* ── Grain overlay ── */
    @keyframes nv5-grain {
      0%,100%{transform:translate(0,0)}     10%{transform:translate(-2%,-3%)}
      20%{transform:translate(3%,1%)}       30%{transform:translate(-1%,4%)}
      40%{transform:translate(4%,-2%)}      50%{transform:translate(-3%,2%)}
      60%{transform:translate(2%,-4%)}      70%{transform:translate(-4%,3%)}
      80%{transform:translate(1%,-2%)}
    }
    .nv5-grain {
      position:absolute; inset:-50%; width:200%; height:200%;
      opacity:.04; pointer-events:none; z-index:4;
      background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      animation: nv5-grain 8s steps(10) infinite;
    }

    .nv5-bg-img {
      position: absolute; inset: 0;
      width: 100%; height: 100%;
      object-fit: cover;
      object-position: center top;
    }

    /* ── ZOOM TRANSITION: new slide zooms in, old zooms out ── */
    @keyframes nv5-zoom-in {
      from { opacity: 0; transform: scale(1.08); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes nv5-zoom-out {
      from { opacity: 1; transform: scale(1); }
      to   { opacity: 0; transform: scale(0.94); }
    }
    .nv5-slide-entering {
      animation: nv5-zoom-in 0.9s cubic-bezier(.4,0,.2,1) forwards;
      z-index: 12 !important;
    }
    .nv5-slide-leaving {
      animation: nv5-zoom-out 0.9s cubic-bezier(.4,0,.2,1) forwards;
      z-index: 11 !important;
    }
    .nv5-slide-visible  { z-index: 10; opacity: 1; transform: scale(1); }
    .nv5-slide-hidden   { z-index: 8;  opacity: 0; pointer-events: none; }

    /* ── Text stagger reveals ── */
    @keyframes nv5-fu { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
    @keyframes nv5-fr { from{opacity:0;transform:translateX(20px)}  to{opacity:1;transform:translateX(0)} }
    @keyframes nv5-lg { from{width:0;opacity:0} to{width:52px;opacity:1} }

    .nv5-text-active .nv5-tag  { animation: nv5-fr .55s cubic-bezier(.22,1,.36,1) .05s  both; }
    .nv5-text-active .nv5-word { animation: nv5-fu .7s  cubic-bezier(.22,1,.36,1) var(--d,0s) both; }
    .nv5-text-active .nv5-line { animation: nv5-lg .5s  ease .52s both; }
    .nv5-text-active .nv5-desc { animation: nv5-fu .6s  ease .6s  both; }
    .nv5-text-active .nv5-cta  { animation: nv5-fu .6s  ease .74s both; }

    /* ── Progress bar ── */
    @keyframes nv5-prog { from{transform:scaleX(0)} to{transform:scaleX(1)} }

    /* ── Thumbnail cards ── */
    .nv5-card {
      border-radius: 14px; overflow: hidden; cursor: pointer;
      box-shadow: 4px 8px 24px rgba(0,0,0,.55);
      transition: transform .4s cubic-bezier(.22,1,.36,1), box-shadow .4s ease, border-color .3s;
      border: 1.5px solid rgba(255,255,255,.07);
      flex-shrink: 0; position: relative;
    }
    .nv5-card:hover {
      transform: translateY(-10px) scale(1.02) !important;
      box-shadow: 6px 20px 40px rgba(0,0,0,.75);
      border-color: rgba(201,168,76,.5);
    }
    .nv5-card img { width:100%; height:100%; object-fit:cover; display:block; transition: transform .5s ease; }
    .nv5-card:hover img { transform: scale(1.07); }
    .nv5-card-label {
      position:absolute; bottom:0; left:0; right:0;
      padding: 40px 12px 12px;
      background: linear-gradient(to top, rgba(0,0,0,.85) 0%, transparent 100%);
    }
    .nv5-card-sub {
      font-family:'DM Mono',monospace; font-size:8px;
      letter-spacing:.24em; text-transform:uppercase;
      color:rgba(255,255,255,.45); margin-bottom:4px;
    }
    .nv5-card-title { font-family:'Oswald',sans-serif; font-size:14px; font-weight:600; color:#fff; line-height:1.2; }
    .nv5-card-active-bar {
      position:absolute; bottom:0; left:0; right:0;
      height:2.5px; background:#C9A84C;
      border-radius:0 0 14px 14px;
    }

    /* ── Number ticker ── */
    @keyframes nv5-tick-up   { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
    @keyframes nv5-tick-down { from{transform:translateY(-100%);opacity:0} to{transform:translateY(0);opacity:1} }
    .nv5-num { display:inline-block; overflow:hidden; height:1.1em; vertical-align:bottom; }
    .nv5-num-inner.up   { animation: nv5-tick-up   .4s cubic-bezier(.22,1,.36,1) both; }
    .nv5-num-inner.down { animation: nv5-tick-down .4s cubic-bezier(.22,1,.36,1) both; }

    /* ── Arrow ── */
    .nv5-arrow {
      width:46px; height:46px; border-radius:50%;
      border:1.5px solid rgba(255,255,255,.25);
      background:rgba(255,255,255,.06); backdrop-filter:blur(12px);
      display:flex; align-items:center; justify-content:center;
      cursor:pointer; transition:all .3s ease; color:#fff; flex-shrink:0;
    }
    .nv5-arrow:hover {
      background:rgba(255,255,255,.16); border-color:rgba(255,255,255,.7); transform:scale(1.1);
    }

    /* ── CTA buttons ── */
    .nv5-btn-p {
      position:relative; overflow:hidden;
      display:inline-flex; align-items:center; gap:10px;
      padding:13px 30px;
      font-family:'Poppins',sans-serif; font-size:11px; font-weight:600;
      letter-spacing:.18em; text-transform:uppercase;
      text-decoration:none; border-radius:3px;
      transition:all .35s ease; cursor:pointer; border:none;
    }
    .nv5-btn-p::before {
      content:''; position:absolute; inset:0;
      background:rgba(255,255,255,.14); transform:translateX(-100%);
      transition:transform .35s ease;
    }
    .nv5-btn-p:hover::before { transform:translateX(0); }
    .nv5-btn-p:hover { transform:translateY(-2px); box-shadow:0 10px 28px rgba(0,0,0,.4); }
    .nv5-btn-g {
      display:inline-flex; align-items:center; gap:8px;
      padding:13px 26px;
      font-family:'Poppins',sans-serif; font-size:11px; font-weight:500;
      letter-spacing:.18em; text-transform:uppercase; text-decoration:none;
      background:transparent; border:1px solid rgba(255,255,255,.3); border-radius:3px;
      transition:all .35s ease; cursor:pointer;
    }
    .nv5-btn-g:hover { background:rgba(255,255,255,.09); border-color:rgba(255,255,255,.7); transform:translateY(-2px); }

    /* ── Dot nav ── */
    .nv5-dot {
      width:6px; height:6px; border-radius:99px;
      background:rgba(255,255,255,.25); cursor:pointer;
      transition:all .35s cubic-bezier(.22,1,.36,1); border:none; padding:0;
    }
    .nv5-dot.active { width:24px; background:#C9A84C; }
    .nv5-dot:hover:not(.active) { background:rgba(255,255,255,.5); }

    /* ── Mobile ── */
    @media (max-width:900px) {
      .nv5-cards { display:none !important; }
    }
    @media (max-width:600px) {
      .nv5-desc-text { display:none !important; }
      .nv5-arrow { width:38px !important; height:38px !important; }
      .nv5-progress-bar { width:clamp(60px,18vw,120px) !important; }
    }
  `;
  document.head.appendChild(s);
}

/* ── Skeleton / Fallback ── */
const HeroSkeleton = () => (
  <div style={{width:'100%',height:'100vh',background:'#082B27',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16}}>
    <div style={{width:1,height:60,background:'linear-gradient(to bottom,transparent,rgba(201,168,76,.6),transparent)'}}/>
    <p style={{fontFamily:'"DM Mono",monospace',color:'rgba(201,168,76,.4)',fontSize:'9px',letterSpacing:'.35em'}}>LOADING</p>
  </div>
);

const HeroFallback = () => (
  <div style={{position:'relative',width:'100%',height:'100vh',background:'linear-gradient(135deg,#082B27,#0d3b35 60%,#051f1c)',display:'flex',alignItems:'center',overflow:'hidden'}}>
    <div className="nv5-grain"/>
    <div style={{paddingLeft:'clamp(32px,8vw,120px)',maxWidth:560,position:'relative',zIndex:10}}>
      <div style={{display:'inline-flex',alignItems:'center',gap:10,marginBottom:22}}>
        <span style={{width:22,height:1,background:'#C9A84C',display:'inline-block'}}/>
        <span style={{fontFamily:'"DM Mono",monospace',fontSize:'10px',letterSpacing:'.3em',color:'#C9A84C'}}>NEW COLLECTION</span>
      </div>
      <h1 style={{fontFamily:'"Oswald",sans-serif',fontSize:'clamp(2.4rem,4.5vw,5rem)',fontWeight:700,lineHeight:1.06,color:'#fff',margin:'0 0 16px'}}>
        Elegance<br/>Redefined
      </h1>
      <div style={{width:52,height:1,background:'linear-gradient(to right,#C9A84C,transparent)',marginBottom:22}}/>
      <p style={{fontFamily:'"Poppins",sans-serif',fontSize:'1rem',fontWeight:300,color:'rgba(255,255,255,.6)',marginBottom:36,lineHeight:1.85}}>
        Discover Niya — curated ethnic wear for every moment.
      </p>
      <Link to="/products" className="nv5-btn-p" style={{background:'#C9A84C',color:'#082B27',border:'1px solid #C9A84C'}}>
        Explore Collection
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </Link>
    </div>
  </div>
);

/* ── Animated number ticker ── */
function NumTicker({ value, dir }) {
  return (
    <span className="nv5-num">
      <span key={`${value}-${dir}`} className={`nv5-num-inner ${dir}`} style={{display:'block'}}>
        {String(value).padStart(2,'0')}
      </span>
    </span>
  );
}

/* ── Single slide layer ── */
function SlideLayer({ slide, state, isActive }) {
  const tc  = slide.textColor       || '#ffffff';
  const ac  = slide.buttonColor     || '#C9A84C';
  const btc = slide.buttonTextColor || '#082B27';
  const bs  = slide.buttonStyle     || 'filled';
  const words = (slide.title || '').split(' ');

  return (
    <div
      className={`nv5-slide-${state}`}
      style={{position:'absolute',inset:0,overflow:'hidden'}}
    >
      {/* ── BACKGROUND IMAGE: full cover, centered ── */}
      <div className='relative w-full h-[90vh] overflow-hidden'>
     {/* ── BACKGROUND IMAGE ── */}
<img
  src={slide.image}
  alt={slide.title}
  className="absolute inset-0 w-full h-full object-cover object-center scale-105 transition-transform duration-[7000ms]"
  style={{
    zIndex: 1,
    filter: "brightness(0.85) contrast(1.05)",
  }}
/>
      </div>

      {/* ── OVERLAYS (z-index 2-4) ── */}
      {/* Strong left-to-right gradient so left text area is always dark */}
      <div style={{
        position:'absolute',inset:0,zIndex:2,
        background:'linear-gradient(100deg, rgba(4,20,18,.96) 0%, rgba(4,20,18,.88) 28%, rgba(4,20,18,.55) 48%, rgba(4,20,18,.15) 65%, transparent 82%)',
      }}/>
      {/* Bottom vignette */}
      <div style={{
        position:'absolute',inset:0,zIndex:3,
        background:'linear-gradient(to top, rgba(4,18,16,.85) 0%, rgba(4,18,16,.3) 28%, transparent 55%)',
      }}/>
      {/* Top vignette (navbar blend) */}
      <div style={{
        position:'absolute',inset:0,zIndex:3,
        background:'linear-gradient(to bottom, rgba(4,18,16,.5) 0%, transparent 20%)',
      }}/>
      <div className="nv5-grain" style={{zIndex:4}}/>

      {/* ── TEXT CONTENT (z-index 10 — always on top of everything) ── */}
      <div
        className={isActive ? 'nv5-text-active' : ''}
        style={{
          position:'absolute', inset:0, zIndex:10,
          display:'flex', alignItems:'center',
          paddingLeft:'clamp(28px,7vw,110px)',
          paddingRight:'clamp(28px,4vw,60px)',
          paddingBottom:'clamp(200px,25vh,290px)',
          paddingTop:'clamp(80px,12vh,110px)',
        }}
      >
        <div style={{maxWidth:'clamp(280px,40vw,520px)',width:'100%'}}>

          {/* Subtitle tag */}
          {slide.subtitle && (
            <div className="nv5-tag" style={{display:'inline-flex',alignItems:'center',gap:10,marginBottom:18}}>
              <span style={{width:22,height:1,background:ac,display:'inline-block',flexShrink:0}}/>
              <span style={{
                fontFamily:'"DM Mono",monospace',fontSize:'9.5px',
                letterSpacing:'.3em',textTransform:'uppercase',color:ac,
              }}>
                {slide.subtitle}
              </span>
            </div>
          )}

          {/* Title — per-word stagger, NO overflow hidden on words (was clipping text) */}
          <h1 style={{
            fontFamily:'"Oswald",sans-serif',
            fontSize:'clamp(2.4rem,5vw,5rem)',
            fontWeight:700, lineHeight:1.06,
            letterSpacing:'-.01em', color:tc,
            margin:'0', overflow:'visible',
          }}>
            {words.map((word, wi) => (
              <span
                key={wi}
                className="nv5-word"
                style={{'--d':`${0.18 + wi * 0.09}s`, display:'inline-block'}}
              >
                {word}{wi < words.length - 1 ? '\u00A0' : ''}
              </span>
            ))}
          </h1>

          {/* Gold rule */}
          <div className="nv5-line" style={{
            height:1,
            background:`linear-gradient(to right,${ac},transparent)`,
            margin:'16px 0 18px',
          }}/>

          {/* Description */}
          {slide.description && (
            <p className="nv5-desc nv5-desc-text" style={{
              fontFamily:'"Poppins",sans-serif',
              fontSize:'clamp(.8rem,1vw,.93rem)',
              fontWeight:300, letterSpacing:'.01em', lineHeight:1.85,
              color:'rgba(255,255,255,.72)',
              marginBottom:28, maxWidth:400,
            }}>
              {slide.description}
            </p>
          )}

          {/* CTAs */}
          <div className="nv5-cta" style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'center'}}>
            {slide.primaryCTA?.text && (
              <Link
                to={slide.primaryCTA.link || '/products'}
                className="nv5-btn-p"
                style={{
                  background: bs==='filled' ? ac : 'transparent',
                  color:       bs==='filled' ? btc : tc,
                  border:`1px solid ${bs==='filled' ? ac : 'rgba(255,255,255,.35)'}`,
                }}
              >
                {slide.primaryCTA.text}
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            )}
            {slide.secondaryCTA?.text && (
              <Link to={slide.secondaryCTA.link || '/'} className="nv5-btn-g" style={{color:tc}}>
                {slide.secondaryCTA.text}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN HERO
═══════════════════════════════════════════ */
const Hero = () => {
  const { data, isLoading, isError } = useGetHeroSlidesQuery();
  const slides  = data?.data || [];
  const total   = slides.length;

  const [current,   setCurrent]   = useState(0);
  const [prevIdx,   setPrevIdx]   = useState(null);
  const [animDir,   setAnimDir]   = useState('up');
  const [pKey,      setPKey]      = useState(0);
  const [paused,    setPaused]    = useState(false);

  const DURATION = 6000;  // ms between auto-advances
  const ANIM_DUR = 950;   // ms clip animation duration

  /* Refs — always hold fresh values, no stale closure issues */
  const pausedRef   = useRef(false);
  const animingRef  = useRef(false);  // true while clip transition plays
  const currentRef  = useRef(0);
  const totalRef    = useRef(total);
  const timerRef    = useRef(null);

  useEffect(() => { pausedRef.current  = paused; }, [paused]);
  useEffect(() => { currentRef.current = current; }, [current]);
  useEffect(() => { totalRef.current   = total;  }, [total]);

  /* Core transition — always safe to call */
  const changeTo = useCallback((nextIdx, dir = 'up') => {
    if (animingRef.current) return;           // already animating, skip
    const n = totalRef.current;
    if (!n || nextIdx === currentRef.current) return;
    const safeIdx = ((nextIdx % n) + n) % n;

    animingRef.current = true;
    setPrevIdx(currentRef.current);
    setAnimDir(dir);
    setCurrent(safeIdx);
    setPKey(k => k + 1);

    setTimeout(() => {
      setPrevIdx(null);
      animingRef.current = false;
    }, ANIM_DUR + 60);
  }, []);

  /* Auto-advance: recursive setTimeout so each tick starts AFTER previous completes */
  const scheduleNext = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (!pausedRef.current && totalRef.current > 1) {
        changeTo((currentRef.current + 1) % totalRef.current, 'up');
      }
      scheduleNext(); // schedule the NEXT tick regardless (paused just skips the change)
    }, DURATION);
  }, [changeTo]);

  const cancelTimer = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }, []);

  /* Start auto-play when slides load, clean up on unmount */
  useEffect(() => {
    if (total > 1) scheduleNext();
    return cancelTimer;
  }, [total, scheduleNext, cancelTimer]);

  /* Reset when slide count changes */
  useEffect(() => { setCurrent(0); setPrevIdx(null); setPKey(0); }, [total]);

  const handleNext = useCallback(() => {
    changeTo((currentRef.current + 1) % totalRef.current, 'up');
    cancelTimer(); scheduleNext();
  }, [changeTo, cancelTimer, scheduleNext]);

  const handlePrev = useCallback(() => {
    changeTo((currentRef.current - 1 + totalRef.current) % totalRef.current, 'down');
    cancelTimer(); scheduleNext();
  }, [changeTo, cancelTimer, scheduleNext]);

  const handleDot = useCallback((i) => {
    if (i === currentRef.current) return;
    changeTo(i, i > currentRef.current ? 'up' : 'down');
    cancelTimer(); scheduleNext();
  }, [changeTo, cancelTimer, scheduleNext]);

  if (isLoading) return <HeroSkeleton />;
  if (isError || total === 0) return <HeroFallback />;

  const thumbSlides = Array.from({ length: Math.min(3, total - 1) }, (_, i) => (current + 1 + i) % total);

  return (
    <section
      id="hero"
      style={{position:'relative',width:'100%',height:'100vh',overflow:'hidden',background:'#082B27'}}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* ── All slide layers ── */}
      {slides.map((slide, i) => {
        let state;
        if      (i === current && prevIdx === null) state = 'visible';
        else if (i === current)                     state = 'entering';
        else if (i === prevIdx)                     state = 'leaving';
        else                                        state = 'hidden';
        return (
          <SlideLayer
            key={slide._id || i}
            slide={slide}
            state={state}
            isActive={i === current}
          />
        );
      })}

      {/* ── Bottom gradient ── */}
      <div style={{
        position:'absolute',bottom:0,left:0,right:0,height:'380px',
        background:'linear-gradient(to top,rgba(4,18,16,.92) 0%,rgba(4,18,16,.45) 55%,transparent 100%)',
        zIndex:15,pointerEvents:'none',
      }}/>

      {/* ══ BOTTOM ROW ══ */}
      {total > 1 && (
        <div style={{
          position:'absolute',bottom:0,left:0,right:0,height:'310px',
          display:'flex',alignItems:'flex-end',zIndex:30,
        }}>
          {/* LEFT: controls */}
          <div style={{
            display:'flex',alignItems:'center',gap:'clamp(10px,1.5vw,18px)',
            paddingLeft:'clamp(20px,7vw,100px)',
            paddingBottom:'clamp(28px,4vh,46px)',
            flexShrink:0,
          }}>
            <button onClick={handlePrev} className="nv5-arrow" aria-label="Previous">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/>
              </svg>
            </button>
            <button onClick={handleNext} className="nv5-arrow" aria-label="Next">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
              </svg>
            </button>

            {/* Progress track */}
            <div className="nv5-progress-bar" style={{
              width:'clamp(80px,11vw,190px)',height:'2.5px',
              borderRadius:'99px',background:'rgba(255,255,255,.15)',flexShrink:0,
            }}>
              <div style={{
                height:'100%',borderRadius:'99px',background:'#C9A84C',
                width:`${((current+1)/total)*100}%`,
                transition:'width .55s cubic-bezier(.4,0,.2,1)',
              }}/>
            </div>

            {/* Dot nav */}
            <div style={{display:'flex',gap:7,alignItems:'center'}}>
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => handleDot(i)}
                  className={`nv5-dot ${i === current ? 'active' : ''}`}
                  aria-label={`Go to slide ${i+1}`}
                />
              ))}
            </div>

            {/* Animated counter */}
            <div style={{display:'flex',alignItems:'baseline',gap:3,flexShrink:0,lineHeight:1}}>
              <span style={{fontFamily:'"Oswald",sans-serif',fontSize:'clamp(22px,2.5vw,34px)',fontWeight:700,color:'#fff'}}>
                <NumTicker value={current + 1} dir={animDir}/>
              </span>
              <span style={{fontFamily:'"DM Mono",monospace',fontSize:'10px',color:'rgba(255,255,255,.3)',letterSpacing:'.1em'}}>
                /{String(total).padStart(2,'0')}
              </span>
            </div>
          </div>

          <div style={{flex:1}}/>

          {/* RIGHT: thumbnail cards */}
          <div
            className="nv5-cards"
            style={{
              display:'flex',alignItems:'flex-end',
              gap:'clamp(10px,1.2vw,16px)',
              paddingRight:'clamp(16px,3vw,44px)',
              paddingBottom:'clamp(14px,2.5vh,22px)',
              overflow:'hidden',
              maxWidth:'calc(100vw - clamp(300px,40vw,520px))',
              flexShrink:0,
            }}
          >
            {thumbSlides.map((si, idx) => (
              <div
                key={si}
                className="nv5-card"
                onClick={() => handleDot(si)}
                style={{
                  width:'clamp(120px,12vw,180px)',
                  height:'clamp(170px,17vw,245px)',
                  borderColor: idx===0 ? 'rgba(201,168,76,.55)' : 'rgba(255,255,255,.07)',
                  transform:`translateY(${idx * 10}px)`,
                }}
              >
                <img src={slides[si].image} alt={slides[si].title}/>
                <div className="nv5-card-label">
                  <div className="nv5-card-sub">{slides[si].subtitle || ''}</div>
                  <div className="nv5-card-title">{slides[si].title}</div>
                </div>
                {idx === 0 && <div className="nv5-card-active-bar"/>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Animated progress bar ── */}
      {total > 1 && (
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:'2.5px',background:'rgba(255,255,255,.07)',zIndex:50}}>
          <div
            key={pKey}
            style={{
              height:'100%',background:'#C9A84C',
              transformOrigin:'left',
              animation:`nv5-prog ${DURATION}ms linear forwards`,
            }}
          />
        </div>
      )}

      {/* ── Vertical slide counter (right edge) ── */}
      {total > 1 && (
        <div style={{
          position:'absolute',top:'50%',right:18,zIndex:20,
          transform:'translateY(-50%) rotate(90deg)',
          fontFamily:'"DM Mono",monospace',fontSize:'9px',
          letterSpacing:'.22em',color:'rgba(255,255,255,.2)',
          whiteSpace:'nowrap',pointerEvents:'none',
        }}>
          {String(current+1).padStart(2,'0')} — {String(total).padStart(2,'0')}
        </div>
      )}
    </section>
  );
};

export default Hero;