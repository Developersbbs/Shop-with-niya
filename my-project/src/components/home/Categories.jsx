import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetCategoriesQuery } from '../../redux/services/categories';

/* ── Scroll reveal hook ── */
const useReveal = (delay = 0) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setTimeout(() => {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0) scale(1)';
        }, delay);
        obs.unobserve(el);
      }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);
  return ref;
};

const SectionLabel = ({ children }) => (
  <div style={{display:'inline-flex',alignItems:'center',gap:'12px',marginBottom:'14px'}}>
    <span style={{width:'32px',height:'1px',background:'#C9A84C',display:'inline-block'}} />
    <span style={{fontFamily:'"DM Mono",monospace',fontSize:'10px',letterSpacing:'.3em',textTransform:'uppercase',color:'#C9A84C'}}>{children}</span>
    <span style={{width:'32px',height:'1px',background:'#C9A84C',display:'inline-block'}} />
  </div>
);

const CategoryCard = ({ category, index }) => {
  const ref = useReveal(index * 90);
  const [hovered, setHovered] = useState(false);
  const defaultImg = '/images/products/placeholder-product.svg';

  return (
    <Link
      to={`/products/category/${category.slug || category._id}`}
      ref={ref}
      style={{
        opacity:0, transform:'translateY(40px) scale(.97)',
        transition:'opacity .65s cubic-bezier(.22,1,.36,1), transform .65s cubic-bezier(.22,1,.36,1)',
        display:'block', textDecoration:'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        position:'relative', overflow:'hidden',
        borderRadius:'2px',
        boxShadow: hovered ? '0 32px 64px rgba(8,43,39,.22)' : '0 4px 20px rgba(0,0,0,.08)',
        transform: hovered ? 'translateY(-8px)' : 'translateY(0)',
        transition:'all .5s cubic-bezier(.22,1,.36,1)',
      }}>

        {/* Image */}
        <div style={{position:'relative',height:'420px',overflow:'hidden'}}>
          {category.image_url ? (
            <img src={category.image_url} alt={category.name}
              style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center top',
                transform: hovered ? 'scale(1.08)' : 'scale(1)',
                transition:'transform .7s cubic-bezier(.22,1,.36,1)'
              }}
              onError={e=>{e.target.src=defaultImg}} />
          ) : (
            <div style={{width:'100%',height:'100%',background:'linear-gradient(135deg,#082B27,#0d3b35)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <span style={{fontFamily:'"Bodoni Moda",serif',fontSize:'3rem',color:'rgba(201,168,76,.3)',fontWeight:700}}>{category.name?.[0]}</span>
            </div>
          )}

          {/* Gradient overlay */}
          <div style={{
            position:'absolute',inset:0,
            background:'linear-gradient(to top, rgba(8,43,39,.85) 0%, rgba(8,43,39,.2) 50%, transparent 100%)',
            opacity: hovered ? 1 : 0.6,
            transition:'opacity .4s ease',
          }} />

          {/* Count badge */}
          {category.product_count > 0 && (
            <div style={{
              position:'absolute',top:'16px',right:'16px',
              background:'rgba(8,43,39,.7)',backdropFilter:'blur(8px)',
              border:'1px solid rgba(201,168,76,.3)',
              padding:'5px 12px',borderRadius:'2px',
              fontFamily:'"DM Mono",monospace',fontSize:'9px',letterSpacing:'.2em',
              color:'rgba(201,168,76,.9)',
              transform: hovered ? 'translateY(0)' : 'translateY(-4px)',
              opacity: hovered ? 1 : 0,
              transition:'all .35s ease .1s',
            }}>
              {category.product_count} pieces
            </div>
          )}

          {/* Bottom text */}
          <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'24px 20px'}}>
            <p style={{
              fontFamily:'"Bodoni Moda",serif',fontSize:'1.3rem',fontWeight:700,
              color:'#fff',margin:'0 0 6px',letterSpacing:'-.01em',lineHeight:1.2,
            }}>
              {category.name}
            </p>
            <div style={{
              display:'flex',alignItems:'center',gap:'8px',
              transform: hovered ? 'translateX(0)' : 'translateX(-8px)',
              opacity: hovered ? 1 : 0,
              transition:'all .35s ease .08s',
            }}>
              <span style={{width:'20px',height:'1px',background:'#C9A84C'}} />
              <span style={{fontFamily:'"Jost",sans-serif',fontSize:'11px',fontWeight:500,letterSpacing:'.15em',textTransform:'uppercase',color:'#C9A84C'}}>
                Explore
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

const SkeletonCard = () => (
  <div style={{borderRadius:'2px',overflow:'hidden'}}>
    <div style={{height:'420px',background:'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)',backgroundSize:'200% 100%',animation:'shimmer 1.4s infinite'}} />
  </div>
);

const Categories = () => {
  const { data, isLoading, isError } = useGetCategoriesQuery();
  const categories = data?.data || [];
  const headerRef = useReveal(0);

  return (
    <>
      <style>{`
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
      `}</style>

      <section style={{padding:'100px 0',background:'var(--ivory,#FAF7F2)',position:'relative',overflow:'hidden'}}>

        {/* Decorative bg text */}
        <div style={{
          position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',
          fontFamily:'"Bodoni Moda",serif',fontSize:'clamp(80px,15vw,180px)',fontWeight:900,
          color:'rgba(8,43,39,.03)',whiteSpace:'nowrap',pointerEvents:'none',userSelect:'none',letterSpacing:'-.05em',
        }}>
          CATEGORIES
        </div>

        <div style={{maxWidth:'1280px',margin:'0 auto',padding:'0 clamp(20px,5vw,64px)'}}>

          {/* Header */}
          <div ref={headerRef} style={{
            textAlign:'center',marginBottom:'64px',
            opacity:0,transform:'translateY(30px)',
            transition:'all .7s cubic-bezier(.22,1,.36,1)',
          }}>
            <SectionLabel>Browse by Style</SectionLabel>
            <h2 style={{fontFamily:'"Bodoni Moda",serif',fontSize:'clamp(2rem,4vw,3.2rem)',fontWeight:700,color:'#082B27',margin:'0',letterSpacing:'-.02em',lineHeight:1.1}}>
              Shop by <em style={{fontStyle:'italic',color:'#C9A84C'}}>Category</em>
            </h2>
            <p style={{fontFamily:'"Jost",sans-serif',fontSize:'1rem',fontWeight:300,color:'#666',marginTop:'14px',maxWidth:'440px',margin:'14px auto 0',lineHeight:1.7}}>
              Curated collections for every occasion — handpicked for the modern Indian woman.
            </p>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:'24px'}}>
              {[1,2,3,4].map(i=><SkeletonCard key={i} />)}
            </div>
          ) : isError || categories.length===0 ? (
            <div style={{textAlign:'center',padding:'60px 0',color:'#888',fontFamily:'"Jost",sans-serif'}}>
              No categories available.
            </div>
          ) : (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:'24px'}}>
              {categories.map((cat,i) => <CategoryCard key={cat._id} category={cat} index={i} />)}
            </div>
          )}

          {/* CTA */}
          {categories.length >= 6 && (
            <div style={{textAlign:'center',marginTop:'56px'}}>
              <Link to="/categories" style={{
                display:'inline-flex',alignItems:'center',gap:'10px',
                padding:'14px 36px',borderRadius:'2px',
                fontFamily:'"Jost",sans-serif',fontSize:'11px',fontWeight:600,
                letterSpacing:'.2em',textTransform:'uppercase',textDecoration:'none',
                background:'#082B27',color:'#fff',
                transition:'all .3s ease',
              }}
                onMouseEnter={e=>{e.currentTarget.style.background='#0d3b35';e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 12px 32px rgba(8,43,39,.35)';}}
                onMouseLeave={e=>{e.currentTarget.style.background='#082B27';e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none';}}>
                View All Categories
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default Categories;