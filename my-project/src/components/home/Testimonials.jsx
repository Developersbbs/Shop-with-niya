import React, { useEffect, useRef, useState } from 'react';

const API_URL = (import.meta?.env?.VITE_API_URL || 'http://localhost:5000') + '/api';

const FALLBACK = [
  { name:'Priya Sharma', location:'Chennai', rating:5, text:'The kurta I ordered was even more beautiful in person! The fabric is so soft and the embroidery is stunning. Will definitely be ordering more.', initials:'PS', hue:'#C9A84C' },
  { name:'Ananya R', location:'Bangalore', rating:5, text:'Absolutely love my coord set. Got so many compliments at the wedding. Delivery was super fast too — within 2 days!', initials:'AR', hue:'#7c8b6e' },
  { name:'Meera Nair', location:'Kochi', rating:5, text:'Finally found a brand with real sizes and proper fitting. The quality is amazing for the price. My new go-to fashion store!', initials:'MN', hue:'#082B27' },
  { name:'Divya Krishnan', location:'Hyderabad', rating:5, text:'Ordered the festive anarkali and it was perfect for Diwali. Beautiful packaging, quick delivery, and the dress is just gorgeous.', initials:'DK', hue:'#8b6e82' },
];

const Stars = ({ count }) => (
  <div style={{display:'flex',gap:'3px'}}>
    {Array.from({length:count}).map((_,i) => (
      <svg key={i} width="14" height="14" viewBox="0 0 20 20" fill="#C9A84C">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
      </svg>
    ))}
  </div>
);

const TestimonialCard = ({ review, index }) => {
  const ref = useRef(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(36px)';
    el.style.transition = `opacity .7s ease ${index*120}ms, transform .7s cubic-bezier(.22,1,.36,1) ${index*120}ms`;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
        obs.unobserve(el);
      }
    }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [index]);

  return (
    <div ref={ref}
      style={{
        background: hovered ? '#fff' : '#FAF7F2',
        border: hovered ? '1px solid rgba(201,168,76,.3)' : '1px solid rgba(8,43,39,.08)',
        borderRadius:'2px', padding:'32px',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        boxShadow: hovered ? '0 24px 48px rgba(8,43,39,.1)' : '0 2px 12px rgba(0,0,0,.04)',
        transition:'all .4s cubic-bezier(.22,1,.36,1)',
        cursor:'default', position:'relative', overflow:'hidden',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Decorative quote */}
      <div style={{
        position:'absolute',top:'-8px',right:'20px',
        fontFamily:'"Bodoni Moda",serif',fontSize:'8rem',fontWeight:900,
        color: hovered ? 'rgba(201,168,76,.1)' : 'rgba(8,43,39,.05)',
        lineHeight:1, pointerEvents:'none', userSelect:'none',
        transition:'color .4s ease',
      }}>
        "
      </div>

      <div style={{position:'relative',zIndex:1}}>
        <Stars count={review.rating} />

        <p style={{
          fontFamily:'"Jost",sans-serif',fontSize:'.9rem',fontWeight:300,
          color:'#555',lineHeight:1.85,margin:'16px 0 24px',
        }}>
          {review.text || review.review || review.content}
        </p>

        <div style={{display:'flex',alignItems:'center',gap:'14px'}}>
          {review.image ? (
            <img src={review.image} alt={review.name}
              style={{width:'42px',height:'42px',borderRadius:'50%',objectFit:'cover',border:'2px solid rgba(201,168,76,.3)'}} />
          ) : (
            <div style={{
              width:'42px',height:'42px',borderRadius:'50%',flexShrink:0,
              background: review.hue || '#082B27',
              display:'flex',alignItems:'center',justifyContent:'center',
              fontFamily:'"Bodoni Moda",serif',fontSize:'14px',fontWeight:700,color:'#fff',
              border:'2px solid rgba(255,255,255,.5)',
            }}>
              {review.initials || (review.name?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2))}
            </div>
          )}
          <div>
            <p style={{fontFamily:'"Bodoni Moda",serif',fontSize:'.95rem',fontWeight:700,color:'#082B27',margin:0,letterSpacing:'-.01em'}}>{review.name}</p>
            <p style={{fontFamily:'"DM Mono",monospace',fontSize:'9px',letterSpacing:'.2em',color:'#999',margin:'2px 0 0',textTransform:'uppercase'}}>{review.location || review.city}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Testimonials = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const headerRef = useRef(null);

  useEffect(() => {
    fetch(`${API_URL}/testimonials?limit=4&status=active`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data?.length > 0) setReviews(d.data);
        else setReviews(FALLBACK);
      })
      .catch(() => setReviews(FALLBACK))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(28px)';
    el.style.transition = 'all .7s cubic-bezier(.22,1,.36,1)';
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.style.opacity='1'; el.style.transform='translateY(0)'; obs.unobserve(el); }
    }, { threshold:0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section style={{padding:'100px 0',background:'#fff',position:'relative',overflow:'hidden'}}>
      {/* Decorative bg text */}
      <div style={{
        position:'absolute',bottom:'-20px',right:'-20px',
        fontFamily:'"Bodoni Moda",serif',fontSize:'clamp(80px,18vw,220px)',fontWeight:900,
        color:'rgba(8,43,39,.025)',whiteSpace:'nowrap',lineHeight:1,
        pointerEvents:'none',userSelect:'none',letterSpacing:'-.05em',
      }}>
        LOVED
      </div>

      <div style={{maxWidth:'1280px',margin:'0 auto',padding:'0 clamp(20px,5vw,64px)',position:'relative',zIndex:1}}>

        <div ref={headerRef} style={{textAlign:'center',marginBottom:'64px'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:'12px',marginBottom:'14px'}}>
            <span style={{width:'28px',height:'1px',background:'#C9A84C'}} />
            <span style={{fontFamily:'"DM Mono",monospace',fontSize:'10px',letterSpacing:'.3em',textTransform:'uppercase',color:'#C9A84C'}}>Real Stories</span>
            <span style={{width:'28px',height:'1px',background:'#C9A84C'}} />
          </div>
          <h2 style={{fontFamily:'"Bodoni Moda",serif',fontSize:'clamp(2rem,4vw,3.2rem)',fontWeight:700,color:'#082B27',margin:0,letterSpacing:'-.02em',lineHeight:1.1}}>
            What Our <em style={{fontStyle:'italic',color:'#C9A84C'}}>Customers Say</em>
          </h2>
        </div>

        {loading ? (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:'24px'}}>
            {[1,2,3,4].map(i=>(
              <div key={i} style={{background:'#f5f5f5',borderRadius:'2px',height:'220px',animation:'shimmer 1.4s infinite',backgroundImage:'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)',backgroundSize:'200% 100%'}} />
            ))}
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:'24px'}}>
            {reviews.map((r,i) => <TestimonialCard key={i} review={r} index={i} />)}
          </div>
        )}

        {/* Trust badges */}
        <div style={{
          display:'flex',flexWrap:'wrap',justifyContent:'center',gap:'clamp(24px,4vw,60px)',
          marginTop:'64px',padding:'40px',
          background:'#FAF7F2',borderRadius:'2px',
          border:'1px solid rgba(8,43,39,.06)',
        }}>
          {[
            { num:'10,000+', label:'Happy Customers' },
            { num:'4.9★', label:'Average Rating' },
            { num:'500+', label:'Unique Styles' },
            { num:'2-Day', label:'Delivery' },
          ].map((item,i) => (
            <div key={i} style={{textAlign:'center'}}>
              <p style={{fontFamily:'"Bodoni Moda",serif',fontSize:'clamp(1.6rem,3vw,2.4rem)',fontWeight:700,color:'#082B27',margin:'0 0 4px',letterSpacing:'-.02em'}}>
                {item.num}
              </p>
              <p style={{fontFamily:'"DM Mono",monospace',fontSize:'9px',letterSpacing:'.25em',textTransform:'uppercase',color:'#999',margin:0}}>
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;