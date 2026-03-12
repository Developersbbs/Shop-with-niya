import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <>
      <style>{`
        @keyframes fp-pulse {
          0%,100%{opacity:.3;transform:scale(1)} 50%{opacity:.8;transform:scale(1.3)}
        }
        .fp1{animation:fp-pulse 3s ease-in-out infinite;}
        .fp2{animation:fp-pulse 3s ease-in-out .8s infinite;}
        .fp3{animation:fp-pulse 3s ease-in-out 1.6s infinite;}
        .fl:hover { color:#C9A84C !important; padding-left:12px !important; }
        .fl { transition:all .2s ease; }
        .fsl:hover { color:#C9A84C !important; }
        .fsl { transition:color .2s ease; }
        .fsoc:hover { border-color:rgba(201,168,76,.5) !important; transform:translateY(-3px); }
        .fsoc { transition:all .3s ease; }
      `}</style>

      <footer style={{background:'#051f1c',color:'#fff',paddingTop:'72px',paddingBottom:'32px',position:'relative',overflow:'hidden'}}>

        {/* Subtle top border */}
        <div style={{position:'absolute',top:0,left:0,right:0,height:'1px',background:'linear-gradient(to right,transparent,rgba(201,168,76,.2),transparent)'}} />

        {/* Decorative top ornament */}
        <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'56px',opacity:.25,maxWidth:'1280px',margin:'0 auto 56px',padding:'0 clamp(20px,5vw,64px)'}}>
          <div style={{flex:1,height:'1px',background:'linear-gradient(to right,transparent,rgba(255,255,255,.4),transparent)'}} />
          <span className="fp1" style={{color:'#C9A84C',fontSize:'12px'}}>✦</span>
          <span className="fp2" style={{color:'#C9A84C',fontSize:'14px'}}>❧</span>
          <span className="fp3" style={{color:'#C9A84C',fontSize:'12px'}}>✦</span>
          <div style={{flex:1,height:'1px',background:'linear-gradient(to right,transparent,rgba(255,255,255,.4),transparent)'}} />
        </div>

        <div style={{maxWidth:'1280px',margin:'0 auto',padding:'0 clamp(20px,5vw,64px)'}}>
          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:'clamp(24px,4vw,60px)',paddingBottom:'56px'}}>

            {/* Brand */}
            <div>
              <img src="niya-logo.webp" alt="Niya" style={{height:'40px',objectFit:'contain',marginBottom:'20px',filter:'brightness(1.1)'}} />
              <p style={{fontFamily:'"Jost",sans-serif',fontSize:'.88rem',fontWeight:300,color:'rgba(245,239,224,.45)',lineHeight:1.85,maxWidth:'280px',marginBottom:'28px'}}>
                Beautiful ethnic fashion wear for every woman. From everyday essentials to festive favourites, thoughtfully designed for you.
              </p>
              <p style={{fontFamily:'"DM Mono",monospace',fontSize:'9px',letterSpacing:'.25em',textTransform:'uppercase',color:'rgba(255,255,255,.25)',marginBottom:'14px'}}>
                Follow Us
              </p>
              <div style={{display:'flex',gap:'10px'}}>
                {[
                  { href:'https://www.facebook.com/people/Shop-with-Niya/61587085150404/',
                    svg:<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/> },
                  { href:'https://www.instagram.com/shopwith_niya_/',
                    svg:<><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".5" fill="currentColor" stroke="none"/></> },
                  { href:'https://wa.me/917094442031',
                    svg:<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/> },
                ].map((s,i)=>(
                  <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" className="fsoc" style={{
                    width:'36px',height:'36px',display:'flex',alignItems:'center',justifyContent:'center',
                    border:'1px solid rgba(255,255,255,.1)',color:'rgba(255,255,255,.4)',textDecoration:'none',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill={i===2?'currentColor':'none'} stroke="currentColor" strokeWidth="1.5">{s.svg}</svg>
                  </a>
                ))}
              </div>
            </div>

            {/* Shop */}
            <div>
              <h3 style={{fontFamily:'"DM Mono",monospace',fontSize:'10px',fontWeight:400,letterSpacing:'.3em',textTransform:'uppercase',color:'rgba(201,168,76,.7)',marginBottom:'24px',paddingBottom:'12px',borderBottom:'1px solid rgba(201,168,76,.1)'}}>
                Shop
              </h3>
              <ul style={{listStyle:'none',padding:0,margin:0,display:'flex',flexDirection:'column',gap:'10px'}}>
                {[{to:'/products',label:'All Collections'},{to:'/categories',label:'Categories'},{to:'#',label:'Mom & Daughter'},{to:'#',label:'Plus Size'}].map(l=>(
                  <li key={l.to}>
                    <Link to={l.to} className="fl" style={{fontFamily:'"Jost",sans-serif',fontSize:'.88rem',fontWeight:300,color:'rgba(245,239,224,.4)',textDecoration:'none',display:'block',paddingLeft:'0'}}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Help */}
            <div>
              <h3 style={{fontFamily:'"DM Mono",monospace',fontSize:'10px',fontWeight:400,letterSpacing:'.3em',textTransform:'uppercase',color:'rgba(201,168,76,.7)',marginBottom:'24px',paddingBottom:'12px',borderBottom:'1px solid rgba(201,168,76,.1)'}}>
                Help
              </h3>
              <ul style={{listStyle:'none',padding:0,margin:0,display:'flex',flexDirection:'column',gap:'10px'}}>
                {[{to:'/size-guide',label:'Size Guide'},{to:'#',label:'Shipping & Returns'},{to:'#',label:'FAQs'},{to:'#',label:'Contact Us'}].map(l=>(
                  <li key={l.to}>
                    <Link to={l.to} className="fl" style={{fontFamily:'"Jost",sans-serif',fontSize:'.88rem',fontWeight:300,color:'rgba(245,239,224,.4)',textDecoration:'none',display:'block',paddingLeft:'0'}}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 style={{fontFamily:'"DM Mono",monospace',fontSize:'10px',fontWeight:400,letterSpacing:'.3em',textTransform:'uppercase',color:'rgba(201,168,76,.7)',marginBottom:'24px',paddingBottom:'12px',borderBottom:'1px solid rgba(201,168,76,.1)'}}>
                Contact
              </h3>
              <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                {[
                  { href:'https://wa.me/917094442031', text:'+91 70944 42031', icon:<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967c-.273-.099-.471-.148-.67.15c-.197.297-.767.966-.94 1.164c-.173.199-.347.223-.644.075c-.297-.15-1.255-.463-2.39-1.475c-.883-.788-1.48-1.761-1.653-2.059c-.173-.297-.018-.458.13-.606c.134-.133.298-.347.446-.52c.149-.174.198-.298.298-.497c.099-.198.05-.371-.025-.52c-.075-.149-.669-1.612-.916-2.207c-.242-.579-.487-.5-.669-.51c-.173-.008-.371-.01-.57-.01c-.198 0-.52.074-.792.372c-.272.297-1.04 1.016-1.04 2.479c0 1.462 1.065 2.875 1.213 3.074c.149.198 2.096 3.2 5.077 4.487c.709.306 1.262.489 1.694.625c.712.227 1.36.195 1.871.118c.571-.085 1.758-.719 2.006-1.413c.248-.694.248-1.289.173-1.413z"/>, fill:true },
                  { href:'mailto:niya@example.com', text:'niya@example.com', icon:<><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>, fill:false },
                ].map((item,i)=>(
                  <a key={i} href={item.href} target="_blank" rel="noopener noreferrer" className="fsl" style={{
                    display:'flex',alignItems:'center',gap:'10px',fontFamily:'"Jost",sans-serif',
                    fontSize:'.85rem',fontWeight:300,color:'rgba(245,239,224,.4)',textDecoration:'none',
                  }}>
                    <span style={{width:'28px',height:'28px',border:'1px solid rgba(255,255,255,.08)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill={item.fill?'currentColor':'none'} stroke="currentColor" strokeWidth="1.5">{item.icon}</svg>
                    </span>
                    {item.text}
                  </a>
                ))}
                <div style={{display:'flex',alignItems:'center',gap:'10px',fontFamily:'"Jost",sans-serif',fontSize:'.85rem',fontWeight:300,color:'rgba(245,239,224,.4)'}}>
                  <span style={{width:'28px',height:'28px',border:'1px solid rgba(255,255,255,.08)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  </span>
                  Chennai, India
                </div>
              </div>
            </div>

          </div>

          {/* Bottom divider */}
          <div style={{height:'1px',background:'linear-gradient(to right,transparent,rgba(255,255,255,.08),transparent)',marginBottom:'28px'}} />

          {/* Bottom bar */}
          <div style={{display:'flex',flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',gap:'12px'}}>
            <span style={{fontFamily:'"DM Mono",monospace',fontSize:'10px',letterSpacing:'.15em',color:'rgba(255,255,255,.2)'}}>
              © {new Date().getFullYear()} Shop With Niya. All Rights Reserved.
            </span>
            <div style={{display:'flex',alignItems:'center',gap:'20px'}}>
              {[{to:'/privacy',label:'Privacy Policy'},{to:'/terms',label:'Terms'}].map((l,i)=>(
                <Link key={i} to={l.to} className="fsl" style={{fontFamily:'"DM Mono",monospace',fontSize:'10px',letterSpacing:'.15em',color:'rgba(255,255,255,.2)',textDecoration:'none'}}>
                  {l.label}
                </Link>
              ))}
              <a href="https://sbbs.co.in/" target="_blank" rel="noopener noreferrer" className="fsl" style={{fontFamily:'"DM Mono",monospace',fontSize:'10px',letterSpacing:'.15em',color:'rgba(255,255,255,.2)',textDecoration:'none'}}>
                Developed by SBBS
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;