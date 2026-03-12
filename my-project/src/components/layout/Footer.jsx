import React from 'react';
import { Link } from 'react-router-dom';

/* ─────────────────────────────────────────
   Inject styles once
───────────────────────────────────────── */
const FOOTER_STYLE_ID = 'niya-footer-styles';
if (typeof document !== 'undefined' && !document.getElementById(FOOTER_STYLE_ID)) {
  const s = document.createElement('style');
  s.id = FOOTER_STYLE_ID;
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@200;300;400;500;600&family=Oswald:wght@300;400;500;600&family=DM+Mono:wght@300;400&display=swap');

    /* ── Ornament pulse ── */
    @keyframes niy-fp-pulse {
      0%,100%{opacity:.25;transform:scale(1)}
      50%{opacity:.7;transform:scale(1.4)}
    }
    .niy-fp1{animation:niy-fp-pulse 3s ease-in-out infinite;}
    .niy-fp2{animation:niy-fp-pulse 3s ease-in-out .8s infinite;}
    .niy-fp3{animation:niy-fp-pulse 3s ease-in-out 1.6s infinite;}

    /* ── Nav links ── */
    .niy-fl {
      font-family: 'Poppins', sans-serif;
      font-size: .875rem; font-weight: 300;
      color: rgba(245,239,224,.45);
      text-decoration: none; display: block;
      transition: color .22s ease, padding-left .22s ease;
      padding-left: 0;
    }
    .niy-fl:hover { color: #C9A84C !important; padding-left: 10px !important; }

    /* ── Small links (bottom bar) ── */
    .niy-fsl {
      font-family: 'DM Mono', monospace;
      font-size: 9.5px; letter-spacing: .15em;
      color: rgba(255,255,255,.22);
      text-decoration: none;
      transition: color .22s ease;
    }
    .niy-fsl:hover { color: #C9A84C; }

    /* ── Social icon buttons ── */
    .niy-fsoc {
      width: 38px; height: 38px;
      display: flex; align-items: center; justify-content: center;
      border: 1px solid rgba(255,255,255,.1);
      border-radius: 50%;
      color: rgba(255,255,255,.4);
      text-decoration: none;
      transition: all .3s ease;
    }
    .niy-fsoc:hover {
      border-color: rgba(201,168,76,.5);
      color: #C9A84C;
      transform: translateY(-3px);
      background: rgba(201,168,76,.06);
    }

    /* ── Contact item link ── */
    .niy-fcontact {
      display: flex; align-items: center; gap: 10px;
      font-family: 'Poppins', sans-serif;
      font-size: .875rem; font-weight: 300;
      color: rgba(245,239,224,.45);
      text-decoration: none;
      transition: color .22s ease;
    }
    .niy-fcontact:hover { color: #C9A84C; }

    .niy-fcontact-icon {
      width: 30px; height: 30px; flex-shrink: 0;
      border: 1px solid rgba(255,255,255,.1);
      border-radius: 2px;
      display: flex; align-items: center; justify-content: center;
      transition: border-color .25s ease, background .25s ease;
    }
    .niy-fcontact:hover .niy-fcontact-icon {
      border-color: rgba(201,168,76,.3);
      background: rgba(201,168,76,.06);
    }

    /* ── Responsive grid ── */
    .niy-footer-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: clamp(24px,4vw,60px);
      padding-bottom: 52px;
    }
    @media (max-width: 960px) {
      .niy-footer-grid {
        grid-template-columns: 1fr 1fr;
        gap: 36px 32px;
      }
    }
    @media (max-width: 520px) {
      .niy-footer-grid {
        grid-template-columns: 1fr;
        gap: 32px;
      }
    }

    /* ── Bottom bar ── */
    .niy-footer-bottom {
      display: flex; flex-wrap: wrap;
      align-items: center; justify-content: space-between;
      gap: 12px;
    }
    .niy-footer-bottom-links {
      display: flex; align-items: center; gap: 20px; flex-wrap: wrap;
    }
    @media (max-width: 600px) {
      .niy-footer-bottom { flex-direction: column; align-items: center; text-align: center; }
      .niy-footer-bottom-links { justify-content: center; }
    }
  `;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────
   Column heading
───────────────────────────────────────── */
const ColHead = ({ children }) => (
  <h3 style={{
    fontFamily: '"Oswald", sans-serif',
    fontSize: '1rem', fontWeight: 500,
    letterSpacing: '.05em', textTransform: 'uppercase',
    color: '#FAF7F2',
    margin: '0 0 20px',
    paddingBottom: '12px',
    borderBottom: '1px solid rgba(201,168,76,.15)',
  }}>
    {children}
  </h3>
);

/* ─────────────────────────────────────────
   FOOTER
───────────────────────────────────────── */
const Footer = () => {
  return (
    <footer style={{
      background: '#051f1c',
      color: '#fff',
      paddingTop: '64px',
      paddingBottom: '32px',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Top gold border */}
      <div style={{ position:'absolute',top:0,left:0,right:0,height:'1px',background:'linear-gradient(to right,transparent,rgba(201,168,76,.25),transparent)' }} />

      {/* Ornament row */}
      <div style={{
        display:'flex',alignItems:'center',gap:'12px',
        maxWidth:'1280px',margin:'0 auto 48px',
        padding:'0 clamp(16px,5vw,64px)',
        opacity:.3,
      }}>
        <div style={{flex:1,height:'1px',background:'linear-gradient(to right,transparent,rgba(255,255,255,.35),transparent)'}} />
        <span className="niy-fp1" style={{color:'#C9A84C',fontSize:'12px'}}>✦</span>
        <span className="niy-fp2" style={{color:'#C9A84C',fontSize:'15px'}}>❧</span>
        <span className="niy-fp3" style={{color:'#C9A84C',fontSize:'12px'}}>✦</span>
        <div style={{flex:1,height:'1px',background:'linear-gradient(to right,transparent,rgba(255,255,255,.35),transparent)'}} />
      </div>

      <div style={{ maxWidth:'1280px',margin:'0 auto',padding:'0 clamp(16px,5vw,64px)' }}>

        <div className="niy-footer-grid">

          {/* ── Brand column ── */}
          <div>
            <img
              src="/niya-logo.webp"
              alt="Niya"
              style={{ height:'44px',objectFit:'contain',marginBottom:'20px',filter:'brightness(1.1)' }}
            />
            <p style={{
              fontFamily:'"Poppins",sans-serif',fontSize:'.875rem',fontWeight:300,
              color:'rgba(245,239,224,.45)',lineHeight:1.85,
              maxWidth:'280px',marginBottom:'28px',marginTop:0,
            }}>
              Beautiful ethnic fashion wear for every woman. From everyday essentials to festive favourites, thoughtfully designed for you.
            </p>

            {/* Social icons */}
            <p style={{
              fontFamily:'"DM Mono",monospace',fontSize:'9px',
              letterSpacing:'.28em',textTransform:'uppercase',
              color:'rgba(255,255,255,.22)',margin:'0 0 12px',
            }}>
              Follow Us
            </p>
            <div style={{ display:'flex',gap:'10px' }}>
              {/* Facebook */}
              <a href="https://www.facebook.com/people/Shop-with-Niya/61587085150404/" target="_blank" rel="noopener noreferrer" className="niy-fsoc" aria-label="Facebook">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </a>
              {/* Instagram */}
              <a href="https://www.instagram.com/shopwith_niya_/" target="_blank" rel="noopener noreferrer" className="niy-fsoc" aria-label="Instagram">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <circle cx="12" cy="12" r="4"/>
                  <circle cx="17.5" cy="6.5" r=".5" fill="currentColor" stroke="none"/>
                </svg>
              </a>
              {/* WhatsApp */}
              <a href="https://wa.me/917094442031" target="_blank" rel="noopener noreferrer" className="niy-fsoc" aria-label="WhatsApp">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* ── Shop column ── */}
          <div>
            <ColHead>Shop</ColHead>
            <ul style={{ listStyle:'none',padding:0,margin:0,display:'flex',flexDirection:'column',gap:'10px' }}>
              {[
                { to:'/products',   label:'All Collections' },
                { to:'/categories', label:'Categories'      },
                { to:'#',           label:'Mom & Daughter'  },
                { to:'#',           label:'Plus Size'       },
              ].map(l => (
                <li key={l.label}>
                  <Link to={l.to} className="niy-fl">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Help column ── */}
          <div>
            <ColHead>Help</ColHead>
            <ul style={{ listStyle:'none',padding:0,margin:0,display:'flex',flexDirection:'column',gap:'10px' }}>
              {[
                { to:'/size-guide', label:'Size Guide'        },
                { to:'#',           label:'Shipping & Returns'},
                { to:'#',           label:'FAQs'              },
                { to:'#',           label:'Contact Us'        },
              ].map(l => (
                <li key={l.label}>
                  <Link to={l.to} className="niy-fl">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Get In Touch column ── */}
          <div>
            <ColHead>Get In Touch</ColHead>
            <div style={{ display:'flex',flexDirection:'column',gap:'12px' }}>

              {/* WhatsApp */}
              <a href="https://wa.me/917094442031" target="_blank" rel="noopener noreferrer" className="niy-fcontact">
                <span className="niy-fcontact-icon">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                  </svg>
                </span>
                +91 70944 42031
              </a>

              {/* Email */}
              <a href="mailto:shopwithniya@gmail.com" className="niy-fcontact">
                <span className="niy-fcontact-icon">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </span>
                shopwithniya@gmail.com
              </a>

              {/* Location */}
              <div className="niy-fcontact" style={{ cursor:'default' }}>
                <span className="niy-fcontact-icon">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                </span>
                Chennai, India
              </div>

            </div>
          </div>

        </div>{/* /grid */}

        {/* Divider */}
        <div style={{ height:'1px',background:'linear-gradient(to right,transparent,rgba(255,255,255,.08),transparent)',marginBottom:'24px' }} />

        {/* Bottom bar */}
        <div className="niy-footer-bottom">
          <span style={{
            fontFamily:'"DM Mono",monospace',fontSize:'9.5px',
            letterSpacing:'.15em',color:'rgba(255,255,255,.2)',
          }}>
            © {new Date().getFullYear()} Shop With Niya. All Rights Reserved.
          </span>

          <div className="niy-footer-bottom-links">
            <Link to="/privacy" className="niy-fsl">Privacy Policy</Link>
            <span style={{ color:'rgba(255,255,255,.1)',fontSize:'10px' }}>|</span>
            <Link to="/terms" className="niy-fsl">Terms</Link>
            <span style={{ color:'rgba(255,255,255,.1)',fontSize:'10px' }}>|</span>
            <a href="https://sbbs.co.in/" target="_blank" rel="noopener noreferrer" className="niy-fsl"
              style={{ color:'rgba(201,168,76,.5)' }}
              onMouseEnter={e => e.currentTarget.style.color='#C9A84C'}
              onMouseLeave={e => e.currentTarget.style.color='rgba(201,168,76,.5)'}
            >
              Developed by SBBS
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;