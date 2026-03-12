import React, { useState, useRef, useEffect } from 'react';

const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [focused, setFocused] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'all .8s cubic-bezier(.22,1,.36,1)';
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.style.opacity='1'; el.style.transform='translateY(0)'; obs.unobserve(el); }
    }, { threshold:0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) { setSubmitted(true); setEmail(''); }
  };

  return (
    <>
      <style>{`
        @keyframes nl-float {
          0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-12px) rotate(3deg)}
        }
        @keyframes nl-float2 {
          0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-8px) rotate(-2deg)}
        }
        @keyframes nl-scan {
          from{transform:translateY(-100%)} to{transform:translateY(400%)}
        }
      `}</style>

      <section style={{padding:'120px 0',background:'#082B27',position:'relative',overflow:'hidden'}}>

        {/* Animated geometric decorations */}
        <div style={{position:'absolute',top:'10%',left:'5%',width:'200px',height:'200px',border:'1px solid rgba(201,168,76,.06)',borderRadius:'50%',animation:'nl-float 6s ease-in-out infinite'}} />
        <div style={{position:'absolute',bottom:'10%',right:'8%',width:'140px',height:'140px',border:'1px solid rgba(201,168,76,.08)',animation:'nl-float2 5s ease-in-out 1s infinite'}} />
        <div style={{position:'absolute',top:'20%',right:'15%',width:'60px',height:'60px',background:'rgba(201,168,76,.04)',border:'1px solid rgba(201,168,76,.1)',transform:'rotate(45deg)',animation:'nl-float 7s ease-in-out .5s infinite'}} />
        <div style={{position:'absolute',bottom:'20%',left:'12%',width:'80px',height:'1px',background:'linear-gradient(to right,transparent,rgba(201,168,76,.2),transparent)'}} />

        {/* Scan line effect */}
        <div style={{position:'absolute',left:0,right:0,height:'120px',background:'linear-gradient(to bottom,transparent,rgba(201,168,76,.015),transparent)',animation:'nl-scan 8s linear infinite',pointerEvents:'none'}} />

        {/* Grain */}
        <div style={{
          position:'absolute',inset:'-50%',width:'200%',height:'200%',opacity:.03,pointerEvents:'none',
          backgroundImage:'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 512 512\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
        }} />

        <div ref={ref} style={{maxWidth:'680px',margin:'0 auto',padding:'0 clamp(20px,5vw,64px)',textAlign:'center',position:'relative',zIndex:1}}>

          {/* Icon */}
          <div style={{
            width:'60px',height:'60px',margin:'0 auto 28px',
            border:'1px solid rgba(201,168,76,.25)',
            display:'flex',alignItems:'center',justifyContent:'center',
            position:'relative',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5">
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
            {/* Corner accents */}
            {[['0','0','top','left'],['0','0','top','right'],['0','0','bottom','left'],['0','0','bottom','right']].map(([t,r,v,h],i) => (
              <div key={i} style={{
                position:'absolute',[v]:'-1px',[h]:'-1px',
                width:'8px',height:'8px',
                borderTop: v==='top' ? '1px solid #C9A84C' : 'none',
                borderBottom: v==='bottom' ? '1px solid #C9A84C' : 'none',
                borderLeft: h==='left' ? '1px solid #C9A84C' : 'none',
                borderRight: h==='right' ? '1px solid #C9A84C' : 'none',
              }} />
            ))}
          </div>

          {/* Label */}
          <div style={{display:'inline-flex',alignItems:'center',gap:'12px',marginBottom:'16px'}}>
            <span style={{width:'24px',height:'1px',background:'#C9A84C'}} />
            <span style={{fontFamily:'"DM Mono",monospace',fontSize:'10px',letterSpacing:'.3em',textTransform:'uppercase',color:'rgba(201,168,76,.6)'}}>Stay Updated</span>
            <span style={{width:'24px',height:'1px',background:'#C9A84C'}} />
          </div>

          <h2 style={{fontFamily:'"Bodoni Moda",serif',fontSize:'clamp(2rem,4vw,3.2rem)',fontWeight:700,color:'#FAF7F2',margin:'0 0 16px',letterSpacing:'-.02em',lineHeight:1.1}}>
            Get Exclusive <em style={{fontStyle:'italic',color:'#C9A84C'}}>Offers</em>
          </h2>

          <p style={{fontFamily:'"Jost",sans-serif',fontSize:'1rem',fontWeight:300,color:'rgba(245,239,224,.45)',lineHeight:1.8,marginBottom:'44px',maxWidth:'420px',margin:'0 auto 44px'}}>
            Early access to new collections, exclusive deals, and style inspiration — straight to your inbox.
          </p>

          {submitted ? (
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'16px',padding:'28px 0'}}>
              <div style={{width:'44px',height:'44px',border:'1px solid rgba(201,168,76,.3)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2">
                  <path d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <div style={{textAlign:'left'}}>
                <p style={{fontFamily:'"Bodoni Moda",serif',color:'#FAF7F2',fontWeight:600,margin:0,fontSize:'1.1rem'}}>You're in!</p>
                <p style={{fontFamily:'"Jost",sans-serif',color:'rgba(245,239,224,.45)',fontSize:'.85rem',margin:'2px 0 0'}}>Welcome to the Niya family.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:'12px',maxWidth:'480px',margin:'0 auto'}}>
              <div style={{
                display:'flex',alignItems:'center',
                border: focused ? '1px solid rgba(201,168,76,.6)' : '1px solid rgba(255,255,255,.12)',
                background: focused ? 'rgba(201,168,76,.06)' : 'rgba(255,255,255,.04)',
                transition:'all .3s ease',
                borderRadius:'2px',overflow:'hidden',
              }}>
                <input
                  type="email" required
                  placeholder="Your email address"
                  value={email}
                  onChange={e=>setEmail(e.target.value)}
                  onFocus={()=>setFocused(true)}
                  onBlur={()=>setFocused(false)}
                  style={{
                    flex:1,padding:'16px 20px',background:'transparent',
                    fontFamily:'"Jost",sans-serif',fontSize:'.9rem',fontWeight:300,
                    color:'#FAF7F2',outline:'none',border:'none',
                  }}
                />
                <button type="submit" style={{
                  padding:'16px 28px',
                  background:'#C9A84C',color:'#082B27',border:'none',cursor:'pointer',
                  fontFamily:'"Jost",sans-serif',fontSize:'11px',fontWeight:600,letterSpacing:'.18em',textTransform:'uppercase',
                  flexShrink:0,transition:'background .3s ease',
                }}
                  onMouseEnter={e=>e.currentTarget.style.background='#d4b25e'}
                  onMouseLeave={e=>e.currentTarget.style.background='#C9A84C'}>
                  Subscribe
                </button>
              </div>
              <p style={{fontFamily:'"DM Mono",monospace',fontSize:'9px',letterSpacing:'.18em',color:'rgba(255,255,255,.2)',textTransform:'uppercase'}}>
                No spam. Unsubscribe anytime.
              </p>
            </form>
          )}
        </div>
      </section>
    </>
  );
};

export default Newsletter;