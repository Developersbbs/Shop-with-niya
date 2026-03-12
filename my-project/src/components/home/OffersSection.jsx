import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

const API_URL = (import.meta?.env?.VITE_API_URL || 'http://localhost:5000') + '/api';

/* ── Scroll reveal hook ── */
const useReveal = (delay = 0, dir = 'up') => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const initTransform = dir==='left' ? 'translateX(-60px)' : dir==='right' ? 'translateX(60px)' : 'translateY(40px)';
    el.style.opacity = '0';
    el.style.transform = initTransform;
    el.style.transition = `opacity .9s cubic-bezier(.22,1,.36,1) ${delay}ms, transform .9s cubic-bezier(.22,1,.36,1) ${delay}ms`;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        el.style.opacity = '1';
        el.style.transform = 'translate(0,0)';
        obs.unobserve(el);
      }
    }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay, dir]);
  return ref;
};

const SectionLabel = ({ children, light }) => (
  <div style={{display:'inline-flex',alignItems:'center',gap:'12px',marginBottom:'14px'}}>
    <span style={{width:'28px',height:'1px',background:'#C9A84C',display:'inline-block'}} />
    <span style={{fontFamily:'"DM Mono",monospace',fontSize:'10px',letterSpacing:'.3em',textTransform:'uppercase',color: light ? 'rgba(201,168,76,.7)' : '#C9A84C'}}>{children}</span>
    <span style={{width:'28px',height:'1px',background:'#C9A84C',display:'inline-block'}} />
  </div>
);

/* ── Fallback static banners (shown when API has no data) ── */
const STATIC_BANNERS = [
  {
    img:'/images/banner1.JPG', tag:'New Arrivals',
    title:'Everyday\nKurtis', subtitle:'Effortless style for every day',
    desc:'From morning meetings to evening strolls — our kurtis and coord sets are made for women who do it all.',
    buttonText:'Shop Now', buttonLink:'/products', imgLeft:true,
  },
  {
    img:'/images/banner2.JPG', tag:'Office Wear',
    title:'Dress to\nImpress', subtitle:'Professional looks, ethnic soul',
    desc:'Structured coord sets and elegant kurtis that take you from desk to dinner — without missing a beat.',
    buttonText:'Explore Collection', buttonLink:'/products', imgLeft:false,
  },
  {
    img:'/images/banner3.webp', tag:'Ethnic & Traditional',
    title:'Rooted in\nElegance', subtitle:'Timeless ethnic wear, reimagined',
    desc:'Celebrate your culture in style. Our maxi dresses and ethnic kurtis blend tradition with modern silhouettes.',
    buttonText:'Discover More', buttonLink:'/products', imgLeft:true,
  },
];

const LOOKS = [
  { img:'/images/look1.jpg', label:'Everyday Wear', link:'/products?tag=everyday' },
  { img:'/images/look2.webp', label:'Festive Looks', link:'/products?tag=festive' },
  { img:'/images/look3.jpg', label:'Work Wear', link:'/products?tag=work' },
  { img:'/images/look5.jpg', label:'Casual Chic', link:'/products?tag=casual' },
  { img:'/images/look4.avif', label:'Party Wear', link:'/products?tag=party' },
];

/* ── Single split banner card ── */
const BannerCard = ({ banner, index }) => {
  const imgRef = useReveal(0, banner.imgLeft ? 'left' : 'right');
  const textRef = useReveal(120, banner.imgLeft ? 'right' : 'left');
  const [hovered, setHovered] = useState(false);

  return (
    <div style={{
      display:'grid',
      gridTemplateColumns: banner.imgLeft ? '1fr 1fr' : '1fr 1fr',
      gridTemplateRows:'auto',
      minHeight:'560px',
      borderRadius:'2px',
      overflow:'hidden',
      background:'#082B27',
      boxShadow:'0 8px 40px rgba(8,43,39,.15)',
    }}
      className="banner-card-grid"
    >
      {/* Image side */}
      <div ref={imgRef} style={{
        gridColumn: banner.imgLeft ? '1' : '2',
        gridRow:'1',
        position:'relative',overflow:'hidden',
        minHeight:'480px',
      }}>
        <img src={banner.img} alt={banner.title}
          style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center top',
            transform: hovered ? 'scale(1.05)' : 'scale(1)',
            transition:'transform .8s cubic-bezier(.22,1,.36,1)'
          }} />
        <div style={{position:'absolute',inset:0,background: banner.imgLeft
          ? 'linear-gradient(to right, transparent 60%, rgba(8,43,39,.5) 100%)'
          : 'linear-gradient(to left, transparent 60%, rgba(8,43,39,.5) 100%)'
        }} />
      </div>

      {/* Text side */}
      <div ref={textRef}
        style={{
          gridColumn: banner.imgLeft ? '2' : '1',
          gridRow:'1',
          display:'flex',flexDirection:'column',justifyContent:'center',
          padding:'clamp(40px,5vw,80px) clamp(32px,5vw,72px)',
          background:'#082B27',
        }}
        onMouseEnter={()=>setHovered(true)}
        onMouseLeave={()=>setHovered(false)}
      >
        <span style={{
          display:'inline-block',alignSelf:'flex-start',
          padding:'6px 16px',borderRadius:'2px',marginBottom:'28px',
          fontFamily:'"DM Mono",monospace',fontSize:'9px',fontWeight:400,letterSpacing:'.3em',textTransform:'uppercase',
          background:'rgba(201,168,76,.12)',color:'#C9A84C',border:'1px solid rgba(201,168,76,.25)',
        }}>
          {banner.tag || banner.label}
        </span>

        <h2 style={{
          fontFamily:'"Bodoni Moda",serif',
          fontSize:'clamp(2.2rem,3.5vw,3.8rem)',fontWeight:700,lineHeight:1.08,
          letterSpacing:'-.02em',color:'#FAF7F2',margin:'0 0 16px',whiteSpace:'pre-line',
        }}>
          {banner.title}
        </h2>

        {banner.subtitle && (
          <p style={{fontFamily:'"Jost",sans-serif',fontSize:'1rem',fontWeight:300,color:'rgba(245,239,224,.6)',marginBottom:'16px',letterSpacing:'.02em'}}>
            {banner.subtitle}
          </p>
        )}

        <div style={{width:'48px',height:'1px',background:'linear-gradient(to right,#C9A84C,transparent)',marginBottom:'20px'}} />

        <p style={{fontFamily:'"Jost",sans-serif',fontSize:'.9rem',fontWeight:300,color:'rgba(245,239,224,.55)',lineHeight:1.85,marginBottom:'36px',maxWidth:'380px'}}>
          {banner.desc || banner.description}
        </p>

        <Link to={banner.buttonLink || banner.link || '/products'} style={{
          display:'inline-flex',alignItems:'center',gap:'10px',alignSelf:'flex-start',
          padding:'14px 32px',borderRadius:'2px',
          fontFamily:'"Jost",sans-serif',fontSize:'11px',fontWeight:600,letterSpacing:'.2em',textTransform:'uppercase',
          textDecoration:'none',background:'#C9A84C',color:'#082B27',
          transition:'all .3s ease',
        }}
          onMouseEnter={e=>{e.currentTarget.style.background='#d4b25e';e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 10px 28px rgba(201,168,76,.35)';}}
          onMouseLeave={e=>{e.currentTarget.style.background='#C9A84C';e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none';}}>
          {banner.buttonText || 'Shop Now'}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </Link>
      </div>
    </div>
  );
};

/* ── Look card ── */
const LookCard = ({ look, index }) => {
  const ref = useReveal(index * 80, 'up');
  const [hovered, setHovered] = useState(false);

  return (
    <div ref={ref}>
      <Link to={look.link} style={{display:'block',textDecoration:'none',position:'relative'}}
        onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}>
        <div style={{position:'relative',aspectRatio:'3/4',overflow:'hidden',borderRadius:'2px'}}>
          <img src={look.img} alt={look.label} style={{
            width:'100%',height:'100%',objectFit:'cover',objectPosition:'center top',
            transform: hovered ? 'scale(1.06)' : 'scale(1)',
            transition:'transform .7s cubic-bezier(.22,1,.36,1)',
          }} />
          <div style={{
            position:'absolute',inset:0,
            background:'linear-gradient(to top,rgba(8,43,39,.75) 0%,transparent 55%)',
            opacity: hovered ? 1 : 0.5,
            transition:'opacity .4s ease',
          }} />
          <div style={{
            position:'absolute',bottom:'16px',left:0,right:0,
            display:'flex',justifyContent:'center',
            transform: hovered ? 'translateY(0)' : 'translateY(8px)',
            opacity: hovered ? 1 : 0,
            transition:'all .35s ease',
          }}>
            <span style={{
              display:'inline-flex',alignItems:'center',gap:'6px',
              padding:'8px 20px',borderRadius:'2px',
              background:'rgba(201,168,76,.9)',color:'#082B27',
              fontFamily:'"Jost",sans-serif',fontSize:'11px',fontWeight:600,letterSpacing:'.18em',textTransform:'uppercase',
            }}>
              Shop All
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </span>
          </div>
        </div>
        <p style={{
          fontFamily:'"Bodoni Moda",serif',fontSize:'.95rem',fontWeight:600,
          color:'#082B27',textAlign:'center',marginTop:'12px',letterSpacing:'-.01em',
          transition:'color .2s ease',
          ...(hovered ? {color:'#C9A84C'} : {}),
        }}>
          {look.label}
        </p>
      </Link>
    </div>
  );
};

const OffersSection = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const headerRef = useReveal(0, 'up');
  const looksHeaderRef = useReveal(0, 'up');

  useEffect(() => {
    fetch(`${API_URL}/offers`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data?.length > 0) setBanners(d.data);
        else setBanners(STATIC_BANNERS);
      })
      .catch(() => setBanners(STATIC_BANNERS))
      .finally(() => setLoading(false));
  }, []);

  const displayBanners = banners.length > 0 ? banners : STATIC_BANNERS;

  return (
    <>
      <style>{`
        @media (max-width:768px) {
          .banner-card-grid { grid-template-columns:1fr !important; }
          .banner-card-grid > div { grid-column:1 !important; grid-row:auto !important; }
        }
        .looks-swiper .swiper-button-next,
        .looks-swiper .swiper-button-prev {
          width:40px;height:40px;background:#082B27;border-radius:2px;
          border:1px solid rgba(201,168,76,.3);color:#C9A84C;transition:all .25s ease;
          --swiper-navigation-size:14px;
        }
        .looks-swiper .swiper-button-next:hover,
        .looks-swiper .swiper-button-prev:hover {
          background:#C9A84C;color:#082B27;border-color:#C9A84C;
        }
      `}</style>

      {/* ── Banners Section ── */}
      <section style={{padding:'100px 0',background:'#FAF7F2',position:'relative'}}>
        <div style={{maxWidth:'1280px',margin:'0 auto',padding:'0 clamp(20px,5vw,64px)'}}>

          <div ref={headerRef} style={{textAlign:'center',marginBottom:'64px'}}>
            <SectionLabel>Collections</SectionLabel>
            <h2 style={{fontFamily:'"Bodoni Moda",serif',fontSize:'clamp(2rem,4vw,3.2rem)',fontWeight:700,color:'#082B27',margin:0,letterSpacing:'-.02em',lineHeight:1.1}}>
              Our Latest <em style={{fontStyle:'italic',color:'#C9A84C'}}>Drops</em>
            </h2>
          </div>

          <div style={{display:'flex',flexDirection:'column',gap:'32px'}}>
            {displayBanners.map((b,i) => (
              <BannerCard key={i} banner={{...b, imgLeft:i%2===0}} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Curated Looks ── */}
      <section style={{padding:'100px 0',background:'#082B27',position:'relative',overflow:'hidden'}}>
        {/* Grain overlay */}
        <div style={{
          position:'absolute',inset:'-50%',width:'200%',height:'200%',
          opacity:.03,pointerEvents:'none',
          backgroundImage:'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 512 512\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
          animation:'ngrain 8s steps(10) infinite',
        }} />

        <div style={{maxWidth:'1280px',margin:'0 auto',padding:'0 clamp(20px,5vw,64px)',position:'relative',zIndex:1}}>

          <div ref={looksHeaderRef} style={{textAlign:'center',marginBottom:'56px'}}>
            <SectionLabel light>Styled For You</SectionLabel>
            <h2 style={{fontFamily:'"Bodoni Moda",serif',fontSize:'clamp(2rem,4vw,3.2rem)',fontWeight:700,color:'#FAF7F2',margin:0,letterSpacing:'-.02em',lineHeight:1.1}}>
              Curated <em style={{fontStyle:'italic',color:'#C9A84C'}}>Looks</em>
            </h2>
            <p style={{fontFamily:'"Jost",sans-serif',fontSize:'1rem',fontWeight:300,color:'rgba(245,239,224,.5)',marginTop:'14px',maxWidth:'440px',margin:'14px auto 0',lineHeight:1.7}}>
              Handpicked outfits for every occasion — because every woman deserves to feel her best.
            </p>
          </div>

          <Swiper
            modules={[Autoplay, Navigation]}
            navigation
            autoplay={{ delay:3200, disableOnInteraction:false }}
            loop spaceBetween={20} slidesPerView={2}
            breakpoints={{640:{slidesPerView:2},768:{slidesPerView:3},1024:{slidesPerView:4},1280:{slidesPerView:5}}}
            className="looks-swiper"
          >
            {LOOKS.map((l,i) => (
              <SwiperSlide key={i}><LookCard look={l} index={i} /></SwiperSlide>
            ))}
          </Swiper>

          <div style={{textAlign:'center',marginTop:'52px'}}>
            <Link to="/products" style={{
              display:'inline-flex',alignItems:'center',gap:'10px',
              padding:'14px 36px',borderRadius:'2px',textDecoration:'none',
              fontFamily:'"Jost",sans-serif',fontSize:'11px',fontWeight:600,letterSpacing:'.2em',textTransform:'uppercase',
              background:'transparent',color:'#C9A84C',border:'1px solid rgba(201,168,76,.4)',
              transition:'all .3s ease',
            }}
              onMouseEnter={e=>{e.currentTarget.style.background='#C9A84C';e.currentTarget.style.color='#082B27';e.currentTarget.style.borderColor='#C9A84C';}}
              onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='#C9A84C';e.currentTarget.style.borderColor='rgba(201,168,76,.4)';}}>
              View All Looks
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default OffersSection;