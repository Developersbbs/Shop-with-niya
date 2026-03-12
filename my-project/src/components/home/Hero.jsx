import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useGetHeroSlidesQuery } from '../../redux/services/heroSection';

/* ── Inject global styles once ── */
const STYLE_ID = 'niya-v2-styles';
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,700;0,6..96,900;1,6..96,400;1,6..96,700&family=Jost:wght@200;300;400;500;600&family=DM+Mono:wght@300;400&display=swap');
    :root {
      --g: #082B27;
      --gold: #C9A84C;
      --cream: #F5EFE0;
      --ivory: #FAF7F2;
    }
    @keyframes nkb { 0%{transform:scale(1) translate(0,0)} 100%{transform:scale(1.1) translate(-1.5%,-1%)} }
    @keyframes nfu { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
    @keyframes nfr { from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:translateX(0)} }
    @keyframes nlg { from{width:0;opacity:0} to{width:64px;opacity:1} }
    @keyframes nprog { from{transform:scaleX(0)} to{transform:scaleX(1)} }
    @keyframes ngrain {
      0%,100%{transform:translate(0,0)} 10%{transform:translate(-2%,-3%)} 20%{transform:translate(3%,1%)}
      30%{transform:translate(-1%,4%)} 40%{transform:translate(4%,-2%)} 50%{transform:translate(-3%,2%)}
      60%{transform:translate(2%,-4%)} 70%{transform:translate(-4%,3%)} 80%{transform:translate(1%,-2%)}
    }
    .niya-grain {
      position:absolute;inset:-50%;width:200%;height:200%;
      opacity:.04;pointer-events:none;z-index:5;
      background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      animation:ngrain 8s steps(10) infinite;
    }
    .nsa .ni { animation:nkb 9s ease-out forwards; }
    .nsa .nt { animation:nfr .55s cubic-bezier(.22,1,.36,1) .1s both; }
    .nsa .nh { animation:nfu .7s cubic-bezier(.22,1,.36,1) .25s both; }
    .nsa .nl { animation:nlg .45s ease .5s both; }
    .nsa .nd { animation:nfu .65s ease .58s both; }
    .nsa .nc { animation:nfu .65s ease .72s both; }
    .nbp {
      position:relative;overflow:hidden;display:inline-flex;align-items:center;gap:10px;
      padding:14px 32px;font-family:'Jost',sans-serif;font-size:11px;font-weight:600;
      letter-spacing:.2em;text-transform:uppercase;text-decoration:none;
      border-radius:2px;transition:all .35s ease;cursor:pointer;border:none;
    }
    .nbp::before {
      content:'';position:absolute;inset:0;background:rgba(255,255,255,.12);
      transform:translateX(-100%);transition:transform .35s ease;
    }
    .nbp:hover::before{transform:translateX(0);}
    .nbp:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(0,0,0,.35);}
    .nbg {
      display:inline-flex;align-items:center;gap:8px;padding:14px 28px;
      font-family:'Jost',sans-serif;font-size:11px;font-weight:500;
      letter-spacing:.2em;text-transform:uppercase;text-decoration:none;
      background:transparent;border:1px solid rgba(255,255,255,.3);
      border-radius:2px;transition:all .35s ease;cursor:pointer;
    }
    .nbg:hover{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.7);transform:translateY(-2px);}
    .narr {
      width:50px;height:50px;border-radius:50%;
      border:1px solid rgba(255,255,255,.2);background:rgba(0,0,0,.2);
      backdrop-filter:blur(10px);color:#fff;
      display:flex;align-items:center;justify-content:center;
      cursor:pointer;transition:all .3s ease;
    }
    .narr:hover{background:rgba(255,255,255,.15);border-color:rgba(255,255,255,.55);transform:scale(1.08);}
  `;
  document.head.appendChild(s);
}

const HeroSkeleton = () => (
  <div style={{width:'100%',height:'100vh',background:'#082B27',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'16px'}}>
    <div style={{width:'1px',height:'60px',background:'linear-gradient(to bottom,transparent,rgba(201,168,76,.6),transparent)'}} />
    <p style={{fontFamily:'"DM Mono",monospace',color:'rgba(201,168,76,.4)',fontSize:'9px',letterSpacing:'.35em'}}>LOADING</p>
  </div>
);

const HeroSlide = ({ slide, isActive }) => {
  const tc = slide.textColor || '#ffffff';
  const ac = slide.buttonColor || '#C9A84C';
  const btc = slide.buttonTextColor || '#082B27';
  const bs = slide.buttonStyle || 'filled';

  return (
    <div className={`absolute inset-0 ${isActive ? 'nsa' : ''}`}
      style={{opacity:isActive?1:0,transition:'opacity 1.2s cubic-bezier(.4,0,.2,1)',pointerEvents:isActive?'auto':'none'}}>

      {/* Image */}
      <div className="absolute inset-0 overflow-hidden">
        <img src={slide.image} alt={slide.title} className="ni w-full h-full object-cover" style={{transformOrigin:'60% 50%'}} />
      </div>

      {/* Overlays */}
      <div className="absolute inset-0" style={{background:'linear-gradient(105deg, rgba(8,43,39,.92) 0%, rgba(8,43,39,.62) 40%, rgba(0,0,0,.08) 70%, transparent 100%)'}} />
      <div className="absolute inset-0" style={{background:'linear-gradient(to top, rgba(0,0,0,.5) 0%, transparent 50%)'}} />
      <div className="niya-grain" />

      {/* Content */}
      <div className="absolute inset-0 flex items-center" style={{paddingLeft:'clamp(32px,8vw,120px)',paddingRight:'32px'}}>
        <div style={{maxWidth:'560px'}}>

          {slide.subtitle && (
            <div className="nt" style={{display:'inline-flex',alignItems:'center',gap:'10px',marginBottom:'24px'}}>
              <span style={{width:'28px',height:'1px',background:ac,display:'inline-block'}} />
              <span style={{fontFamily:'"DM Mono",monospace',fontSize:'10px',letterSpacing:'.3em',textTransform:'uppercase',color:ac}}>
                {slide.subtitle}
              </span>
            </div>
          )}

          <h1 className="nh" style={{
            fontFamily:'"Bodoni Moda",Georgia,serif',
            fontSize:'clamp(2.2rem,4.2vw,4.6rem)',fontWeight:700,lineHeight:1.08,
            letterSpacing:'-.02em',color:tc,margin:'0 0 20px',
            display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical',overflow:'hidden'
          }}>
            {slide.title}
          </h1>

          <div className="nl" style={{height:'1px',background:`linear-gradient(to right,${ac},transparent)`,marginBottom:'22px'}} />

          {slide.description && (
            <p className="nd" style={{
              fontFamily:'"Jost",sans-serif',fontSize:'clamp(.88rem,1.3vw,1rem)',
              fontWeight:300,letterSpacing:'.02em',lineHeight:1.8,
              color:`${tc}90`,marginBottom:'36px',maxWidth:'440px'
            }}>
              {slide.description}
            </p>
          )}

          <div className="nc" style={{display:'flex',gap:'14px',flexWrap:'wrap'}}>
            {slide.primaryCTA?.text && (
              <Link to={slide.primaryCTA.link||'/products'} className="nbp"
                style={{background:bs==='filled'?ac:'transparent',color:bs==='filled'?btc:tc,border:`1px solid ${bs==='filled'?ac:'rgba(255,255,255,.35)'}`}}>
                {slide.primaryCTA.text}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
            )}
            {slide.secondaryCTA?.text && (
              <Link to={slide.secondaryCTA.link||'/'} className="nbg" style={{color:tc}}>
                {slide.secondaryCTA.text}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Hero = () => {
  const { data, isLoading, isError } = useGetHeroSlidesQuery();
  const slides = data?.data || [];
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [pKey, setPKey] = useState(0);
  const DURATION = 6500;

  const next = useCallback(() => { setCurrent(p=>(p+1)%slides.length); setPKey(k=>k+1); }, [slides.length]);
  const prev = useCallback(() => { setCurrent(p=>(p-1+slides.length)%slides.length); setPKey(k=>k+1); }, [slides.length]);
  const goTo = (i) => { setCurrent(i); setPKey(k=>k+1); };

  useEffect(() => {
    if (slides.length<=1||paused) return;
    const t = setInterval(next, DURATION);
    return () => clearInterval(t);
  }, [slides.length,paused,next]);

  useEffect(() => { setCurrent(0); setPKey(0); }, [slides.length]);

  if (isLoading) return <HeroSkeleton />;

  if (isError||slides.length===0) return (
    <div style={{position:'relative',width:'100%',height:'100vh',background:'linear-gradient(135deg,#082B27 0%,#0d3b35 60%,#051f1c 100%)',display:'flex',alignItems:'center',overflow:'hidden'}}>
      <div className="niya-grain" />
      <div style={{paddingLeft:'clamp(32px,8vw,120px)',maxWidth:'560px',position:'relative',zIndex:10}}>
        <div style={{display:'inline-flex',alignItems:'center',gap:'10px',marginBottom:'24px'}}>
          <span style={{width:'28px',height:'1px',background:'#C9A84C'}} />
          <span style={{fontFamily:'"DM Mono",monospace',fontSize:'10px',letterSpacing:'.3em',color:'#C9A84C'}}>NEW COLLECTION</span>
        </div>
        <h1 style={{fontFamily:'"Bodoni Moda",serif',fontSize:'clamp(2.2rem,4.2vw,4.6rem)',fontWeight:700,lineHeight:1.08,color:'#fff',margin:'0 0 20px'}}>
          Elegance<br/>Redefined
        </h1>
        <div style={{width:'64px',height:'1px',background:'linear-gradient(to right,#C9A84C,transparent)',marginBottom:'22px'}} />
        <p style={{fontFamily:'"Jost",sans-serif',fontSize:'1rem',fontWeight:300,color:'rgba(255,255,255,.6)',marginBottom:'36px',lineHeight:1.8}}>
          Discover Niya — curated ethnic wear for every moment.
        </p>
        <Link to="/products" className="nbp" style={{background:'#C9A84C',color:'#082B27',border:'1px solid #C9A84C'}}>
          Explore Collection
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </Link>
      </div>
    </div>
  );

  return (
    <section id="hero"
      style={{position:'relative',width:'100%',height:'100vh',overflow:'hidden',background:'#082B27'}}
      onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)}>

      {slides.map((s,i) => <HeroSlide key={s._id} slide={s} isActive={i===current} />)}

      {/* Progress */}
      {slides.length>1 && (
        <div style={{position:'absolute',bottom:0,left:0,right:0,zIndex:30,height:'2px',background:'rgba(255,255,255,.08)'}}>
          <div key={pKey} style={{height:'100%',background:'#C9A84C',transformOrigin:'left',animation:`nprog ${DURATION}ms linear forwards`}} />
        </div>
      )}

      {/* Arrows */}
      {slides.length>1 && (
        <>
          <button onClick={prev} className="narr" style={{position:'absolute',left:'24px',top:'50%',transform:'translateY(-50%)',zIndex:20}} aria-label="Prev">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <button onClick={next} className="narr" style={{position:'absolute',right:'24px',top:'50%',transform:'translateY(-50%)',zIndex:20}} aria-label="Next">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </>
      )}

      {/* Dots */}
      {slides.length>1 && (
        <div style={{position:'absolute',bottom:'32px',left:'50%',transform:'translateX(-50%)',zIndex:20,display:'flex',gap:'10px',alignItems:'center'}}>
          {slides.map((_,i) => (
            <button key={i} onClick={()=>goTo(i)} aria-label={`Slide ${i+1}`}
              style={{padding:0,border:'none',background:'none',cursor:'pointer',display:'flex',alignItems:'center'}}>
              <span style={{display:'block',height:'1px',width:i===current?'36px':'12px',background:i===current?'#fff':'rgba(255,255,255,.3)',borderRadius:'1px',transition:'all .4s cubic-bezier(.22,1,.36,1)'}} />
            </button>
          ))}
        </div>
      )}

      {/* Counter */}
      {slides.length>1 && (
        <div style={{position:'absolute',top:'50%',right:'16px',zIndex:20,transform:'translateY(-50%) rotate(90deg)',fontFamily:'"DM Mono",monospace',fontSize:'9px',letterSpacing:'.2em',color:'rgba(255,255,255,.3)',whiteSpace:'nowrap'}}>
          {String(current+1).padStart(2,'0')} — {String(slides.length).padStart(2,'0')}
        </div>
      )}

      {/* Scroll hint */}
      <div style={{position:'absolute',bottom:'28px',left:'clamp(32px,8vw,120px)',zIndex:20,display:'flex',flexDirection:'column',alignItems:'center',gap:'6px',animation:'nfu 1s ease 1.5s both'}}>
        <div style={{width:'1px',height:'40px',background:'linear-gradient(to bottom,rgba(255,255,255,.5),transparent)'}} />
        <span style={{fontFamily:'"DM Mono",monospace',fontSize:'8px',letterSpacing:'.3em',color:'rgba(255,255,255,.3)'}}>SCROLL</span>
      </div>
    </section>
  );
};

export default Hero;