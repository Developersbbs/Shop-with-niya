import React from 'react';

const STYLE_ID = 'niya-loading-v3';
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500&display=swap');

    @keyframes niya-orbit {
      0%   { transform: rotate(0deg)   translateX(var(--r)) rotate(0deg); }
      100% { transform: rotate(360deg) translateX(var(--r)) rotate(-360deg); }
    }
    @keyframes niya-orbit-rev {
      0%   { transform: rotate(0deg)   translateX(var(--r)) rotate(0deg); }
      100% { transform: rotate(-360deg) translateX(var(--r)) rotate(360deg); }
    }
    @keyframes niya-breathe {
      0%,100% { transform: scale(1);   opacity: 0.9; }
      50%      { transform: scale(1.08); opacity: 1;   }
    }
    @keyframes niya-glow {
      0%,100% { box-shadow: 0 0 12px 2px rgba(8,43,39,0.18), 0 0 32px 6px rgba(8,43,39,0.08); }
      50%      { box-shadow: 0 0 28px 8px rgba(8,43,39,0.32), 0 0 60px 16px rgba(8,43,39,0.12); }
    }
    @keyframes niya-shimmer-line {
      0%   { left: -100%; }
      100% { left: 200%; }
    }
    @keyframes niya-text-fade {
      0%,100% { opacity: 0.5; letter-spacing: 0.25em; }
      50%      { opacity: 1;   letter-spacing: 0.35em; }
    }
    @keyframes niya-bar-fill {
      0%   { width: 0%; }
      60%  { width: 75%; }
      100% { width: 100%; }
    }
    @keyframes niya-drop {
      0%   { transform: translateY(-24px) scale(0.6); opacity: 0; }
      60%  { transform: translateY(4px)   scale(1.05); opacity: 1; }
      100% { transform: translateY(0)     scale(1);    opacity: 1; }
    }
    @keyframes niya-float-slow {
      0%,100% { transform: translateY(0px)   rotate(-4deg); }
      50%      { transform: translateY(-10px) rotate(4deg);  }
    }
    @keyframes niya-particle {
      0%   { transform: translate(0,0)     scale(1);   opacity: 0.7; }
      100% { transform: translate(var(--px),var(--py)) scale(0);   opacity: 0; }
    }
    @keyframes niya-ring-pulse {
      0%,100% { transform: scale(1);   opacity: 0.15; }
      50%      { transform: scale(1.18); opacity: 0.04; }
    }
    @keyframes niya-curtain {
      0%   { transform: scaleX(1); }
      100% { transform: scaleX(0); }
    }
    @keyframes niya-fade-elegant {
      0%   { opacity: 0; transform: translateY(20px); filter: blur(8px); }
      100% { opacity: 1; transform: translateY(0);    filter: blur(0);   }
    }
    @keyframes niya-spin-slow {
      to { transform: rotate(360deg); }
    }
    @keyframes niya-dash {
      0%   { stroke-dashoffset: 283; }
      50%  { stroke-dashoffset: 70;  }
      100% { stroke-dashoffset: 283; }
    }
    @keyframes niya-dot-seq {
      0%,80%,100% { transform: scale(0); opacity: 0; }
      40%          { transform: scale(1); opacity: 1; }
    }
    @keyframes niya-ripple {
      0%   { transform: scale(0.5); opacity: 0.6; }
      100% { transform: scale(2.2); opacity: 0;   }
    }

    .niya-breathe   { animation: niya-breathe   3s ease-in-out infinite; }
    .niya-glow-anim { animation: niya-glow      3s ease-in-out infinite; }
    .niya-text-anim { animation: niya-text-fade 2.8s ease-in-out infinite; }
    .niya-float     { animation: niya-float-slow 4s ease-in-out infinite; }
    .niya-elegant-in{ animation: niya-fade-elegant 0.9s cubic-bezier(0.22,1,0.36,1) both; }
    .niya-spin-slow { animation: niya-spin-slow 8s linear infinite; }
    .niya-dash-anim { animation: niya-dash 2s ease-in-out infinite; }

    .niya-shimmer-gold {
      background: linear-gradient(90deg, #c9a84c 0%, #f5e6a3 40%, #c9a84c 60%, #a07830 100%);
      background-size: 200% 100%;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: niya-shimmer-line 2.5s linear infinite;
    }
    .niya-progress-bar {
      height: 2px; border-radius: 99px; overflow: hidden;
      background: rgba(8,43,39,0.1);
      position: relative;
    }
    .niya-progress-bar::after {
      content: '';
      position: absolute; top: 0; height: 100%;
      background: linear-gradient(90deg, transparent, #082B27, #1a6b5e, #082B27, transparent);
      animation: niya-shimmer-line 1.8s ease-in-out infinite;
      width: 60%;
    }
  `;
  document.head.appendChild(s);
}

const B  = '#082B27';
const B2 = '#1a6b5e';
const G  = '#22c55e';

/* ─── SVG Arc Spinner ─── */
const ArcSpinner = ({ size = 64 }) => {
  const r = (size / 2) - 6;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      {/* Pulsing rings behind */}
      {[1.4, 1.7].map((scale, i) => (
        <div key={i} style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: `1px solid ${B}`,
          animation: `niya-ring-pulse ${2 + i * 0.6}s ease-in-out ${i * 0.4}s infinite`,
        }} />
      ))}
      {/* SVG arcs */}
      <svg width={size} height={size} style={{ position: 'absolute', inset: 0 }}>
        {/* Track */}
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={`${B}18`} strokeWidth={3} />
        {/* Animated arc */}
        <circle
          cx={size/2} cy={size/2} r={r}
          fill="none" stroke={B} strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * 0.75}
          className="niya-dash-anim"
          style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }}
        />
        {/* Inner arc — gold accent */}
        <circle
          cx={size/2} cy={size/2} r={r - 8}
          fill="none" stroke="#c9a84c" strokeWidth={1.5}
          strokeLinecap="round"
          strokeDasharray={circ * 0.6}
          strokeDashoffset={circ * 0.4}
          style={{
            transformOrigin: 'center',
            animation: 'niya-spin-slow 4s linear infinite reverse',
          }}
        />
      </svg>
      {/* Center jewel */}
      <div className="niya-breathe" style={{
        position: 'absolute', inset: '38%', borderRadius: '50%',
        background: `radial-gradient(circle at 35% 35%, ${B2}, ${B})`,
        boxShadow: `0 0 10px 2px rgba(8,43,39,0.3)`,
      }} />
    </div>
  );
};

/* ─── Orbit Spinner ─── */
const OrbitSpinner = ({ size = 64 }) => {
  const orbs = [
    { r: size * 0.36, delay: '0s',    dur: '2s',   sz: size * 0.09, color: B  },
    { r: size * 0.24, delay: '0.3s',  dur: '1.4s', sz: size * 0.06, color: B2 },
    { r: size * 0.44, delay: '0.6s',  dur: '3s',   sz: size * 0.05, color: '#c9a84c' },
  ];
  return (
    <div style={{ width: size, height: size, position: 'relative' }}>
      {/* Center */}
      <div className="niya-breathe niya-glow-anim" style={{
        position: 'absolute', inset: '40%', borderRadius: '50%',
        background: `radial-gradient(circle at 30% 30%, ${B2}, ${B})`,
      }} />
      {/* Orbiting dots */}
      {orbs.map((o, i) => (
        <div key={i} style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: `${i % 2 === 0 ? 'niya-orbit' : 'niya-orbit-rev'} ${o.dur} linear ${o.delay} infinite`,
          '--r': `${o.r}px`,
        }}>
          <div style={{ width: o.sz, height: o.sz, borderRadius: '50%', background: o.color, boxShadow: `0 0 6px 2px ${o.color}66` }} />
        </div>
      ))}
      {/* Decorative circles */}
      {[size * 0.65, size * 0.85].map((d, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: d, height: d,
          marginTop: -d/2, marginLeft: -d/2,
          borderRadius: '50%',
          border: `1px dashed ${B}${i === 0 ? '22' : '12'}`,
        }} />
      ))}
    </div>
  );
};

/* ─── Dot Sequence ─── */
const DotSequence = ({ size = 48 }) => {
  const d = size * 0.18;
  return (
    <div style={{ display: 'flex', gap: d * 0.8, alignItems: 'center' }}>
      {[0,1,2,3,4].map(i => (
        <div key={i} style={{
          width: i === 2 ? d * 1.4 : d,
          height: i === 2 ? d * 1.4 : d,
          borderRadius: '50%',
          background: i === 2
            ? `radial-gradient(circle at 35% 35%, ${B2}, ${B})`
            : i % 2 === 0 ? B : '#c9a84c',
          animation: `niya-dot-seq 1.6s ease-in-out ${i * 0.18}s infinite`,
          boxShadow: i === 2 ? `0 0 8px ${B}66` : 'none',
        }} />
      ))}
    </div>
  );
};

/* ─── Ripple ─── */
const RippleSpinner = ({ size = 64 }) => (
  <div style={{ width: size, height: size, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    {[0, 0.5, 1].map(delay => (
      <div key={delay} style={{
        position: 'absolute',
        width: size * 0.5, height: size * 0.5,
        borderRadius: '50%',
        border: `2px solid ${B}`,
        animation: `niya-ripple 2s ease-out ${delay}s infinite`,
      }} />
    ))}
    <div style={{
      width: size * 0.25, height: size * 0.25, borderRadius: '50%',
      background: `radial-gradient(circle at 30% 30%, ${B2}, ${B})`,
      boxShadow: `0 0 12px ${B}66`,
    }} />
  </div>
);

/* ─── Spinner map ─── */
const SPINNERS = { ring: ArcSpinner, orbit: OrbitSpinner, dots: DotSequence, pulse: RippleSpinner, wave: OrbitSpinner, bounce: DotSequence, shimmer: ArcSpinner, default: ArcSpinner };
const SIZE_MAP = { small: 32, medium: 48, large: 64, xl: 80, sm: 32, md: 48, lg: 64 };

/* ════════════════════════════════════════
   LoadingSpinner
════════════════════════════════════════ */
const LoadingSpinner = ({ size = 'medium', variant = 'ring', text = '', className = '' }) => {
  const px   = SIZE_MAP[size] || 48;
  const Spin = SPINNERS[variant] || ArcSpinner;
  return (
    <div className={`niya-elegant-in ${className}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 20, fontFamily: "'DM Sans', sans-serif" }}>
      <Spin size={px} />
      {text && (
        <p className="niya-text-anim" style={{ margin: 0, fontSize: 13, fontWeight: 400, color: B, letterSpacing: '0.25em', textTransform: 'uppercase' }}>{text}</p>
      )}
    </div>
  );
};

/* ════════════════════════════════════════
   LoadingScreen  ← main full-page loader
════════════════════════════════════════ */
const LoadingScreen = ({ variant = 'ring', message = 'Loading…', fullScreen = true, className = '', showProgress = false }) => {
  const Spin = SPINNERS[variant] || ArcSpinner;

  return (
    <div className={`niya-elegant-in ${className}`} style={{
      minHeight: fullScreen ? '100vh' : 320,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(160deg, #0b2e29 0%, #082B27 50%, #051e1a 100%)',
      position: 'relative', overflow: 'hidden',
      fontFamily: "'DM Sans', sans-serif",
    }}>

      {/* ── Large decorative spinning outer ring ── */}
      <div className="niya-spin-slow" style={{
        position: 'absolute',
        width: '60vmin', height: '60vmin',
        borderRadius: '50%',
        border: '1px solid rgba(255,255,255,0.04)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        width: '80vmin', height: '80vmin',
        borderRadius: '50%',
        border: '1px dashed rgba(201,168,76,0.08)',
        animation: 'niya-spin-slow 16s linear infinite reverse',
        pointerEvents: 'none',
      }} />

      {/* ── Corner ornaments ── */}
      {[
        { top: 24, left: 24 },
        { top: 24, right: 24 },
        { bottom: 24, left: 24 },
        { bottom: 24, right: 24 },
      ].map((pos, i) => (
        <div key={i} style={{ position: 'absolute', ...pos, width: 40, height: 40, opacity: 0.2, pointerEvents: 'none' }}>
          <svg viewBox="0 0 40 40" fill="none">
            <path d="M2 20 L2 2 L20 2" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M38 20 L38 38 L20 38" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
      ))}

      {/* ── Floating particles ── */}
      {[...Array(12)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: 2 + (i % 3),
          height: 2 + (i % 3),
          borderRadius: '50%',
          background: i % 3 === 0 ? '#c9a84c' : 'rgba(255,255,255,0.3)',
          top:  `${10 + (i * 31) % 80}%`,
          left: `${5  + (i * 17) % 90}%`,
          '--px': `${(i % 2 === 0 ? 1 : -1) * (20 + i * 5)}px`,
          '--py': `${-30 - i * 4}px`,
          animation: `niya-particle ${3 + (i % 3)}s ease-out ${i * 0.4}s infinite`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* ── Center content ── */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 36 }}>

        {/* Brand wordmark */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          {/* Gold horizontal rule */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 28, height: 1, background: 'linear-gradient(to right, transparent, #c9a84c)' }} />
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#c9a84c', opacity: 0.7 }} />
            <div style={{ width: 28, height: 1, background: 'linear-gradient(to left, transparent, #c9a84c)' }} />
          </div>
          <span style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 38, fontWeight: 700,
            color: 'white',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            lineHeight: 1,
          }}>NIYA</span>
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 10, fontWeight: 300,
            color: '#c9a84c',
            letterSpacing: '0.5em',
            textTransform: 'uppercase',
          }}>by Yakkha Fashion Studio</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
            <div style={{ width: 28, height: 1, background: 'linear-gradient(to right, transparent, #c9a84c)' }} />
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#c9a84c', opacity: 0.7 }} />
            <div style={{ width: 28, height: 1, background: 'linear-gradient(to left, transparent, #c9a84c)' }} />
          </div>
        </div>

        {/* Spinner */}
        <Spin size={72} />

        {/* Message */}
        {message && (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <p className="niya-text-anim" style={{
              margin: 0, fontSize: 11,
              color: 'rgba(255,255,255,0.55)',
              letterSpacing: '0.4em',
              textTransform: 'uppercase',
              fontWeight: 300,
            }}>{message}</p>

            {/* Elegant dot loader */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  width: i === 1 ? 6 : 4,
                  height: i === 1 ? 6 : 4,
                  borderRadius: '50%',
                  background: i === 1 ? '#c9a84c' : 'rgba(255,255,255,0.3)',
                  animation: `niya-dot-seq 1.6s ease-in-out ${i * 0.22}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        {/* Progress bar */}
        {showProgress && (
          <div style={{ width: 160 }}>
            <div className="niya-progress-bar" style={{ width: '100%' }} />
          </div>
        )}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════
   LoadingButton
════════════════════════════════════════ */
const LoadingButton = ({ loading, children, variant = 'ring', size = 'medium', className = '', ...props }) => (
  <button disabled={loading} className={className} style={{ cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'all 0.25s', fontFamily: "'DM Sans', sans-serif" }} {...props}>
    {loading ? (
      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <ArcSpinner size={18} />
        <span style={{ fontSize: 13, fontWeight: 400, letterSpacing: '0.1em' }}>Please wait…</span>
      </span>
    ) : children}
  </button>
);

/* ════════════════════════════════════════
   LoadingCard  (skeleton)
════════════════════════════════════════ */
const LoadingCard = ({ variant = 'shimmer', className = '' }) => (
  <div className={className} style={{ background: 'white', borderRadius: 16, padding: 20, boxShadow: '0 2px 16px rgba(8,43,39,0.06)', overflow: 'hidden', position: 'relative' }}>
    {/* Shimmer sweep */}
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%)',
      animation: 'niya-shimmer-line 1.8s ease-in-out infinite',
      pointerEvents: 'none', zIndex: 1,
    }} />
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: '#e8f4f1', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ height: 13, borderRadius: 8, background: '#e8f4f1', width: '65%' }} />
        <div style={{ height: 11, borderRadius: 8, background: '#f0f7f5', width: '45%' }} />
        <div style={{ height: 11, borderRadius: 8, background: '#f0f7f5', width: '80%' }} />
      </div>
    </div>
  </div>
);

export { LoadingSpinner, LoadingScreen, LoadingButton, LoadingCard };
export default LoadingScreen;