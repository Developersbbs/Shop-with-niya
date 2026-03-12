import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaUser, FaSearch, FaBars, FaTimes, FaHeart, FaTag } from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { userLogout, forceLogout } from '../../redux/slices/authSlice';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useGetCategoriesQuery } from '../../redux/services/categories';

/* ── Categories dropdown content ── */
const CategoriesMenu = () => {
  const { data, isLoading } = useGetCategoriesQuery({ limit: 20 });
  const cats = data?.data || [];

  if (isLoading) return (
    <div style={{padding:'12px'}}>
      {[1,2,3].map(i=><div key={i} style={{height:'36px',background:'rgba(8,43,39,.06)',borderRadius:'2px',marginBottom:'8px',animation:'shimmer 1.4s infinite'}} />)}
    </div>
  );
  if (!cats.length) return <div style={{padding:'16px',fontFamily:'"Jost",sans-serif',fontSize:'.85rem',color:'#999',textAlign:'center'}}>No categories</div>;

  return (
    <ul style={{listStyle:'none',padding:'8px',margin:0}}>
      {cats.map(cat=>(
        <li key={cat._id}>
          <Link to={`/products?category=${cat._id}`} style={{
            display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',
            textDecoration:'none',color:'#444',fontFamily:'"Jost",sans-serif',
            fontSize:'.85rem',fontWeight:400,letterSpacing:'.01em',
            transition:'all .2s ease',borderRadius:'2px',
          }}
            onMouseEnter={e=>{e.currentTarget.style.background='rgba(8,43,39,.06)';e.currentTarget.style.color='#082B27';e.currentTarget.style.paddingLeft='18px';}}
            onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='#444';e.currentTarget.style.paddingLeft='12px';}}>
            <span style={{width:'6px',height:'6px',background:'rgba(201,168,76,.5)',borderRadius:'50%',flexShrink:0}} />
            {cat.name}
          </Link>
        </li>
      ))}
    </ul>
  );
};

const NavLink = ({ to, children, onClick }) => (
  <Link to={to} onClick={onClick} style={{
    position:'relative',padding:'8px 16px',
    fontFamily:'"Jost",sans-serif',fontSize:'12px',fontWeight:500,letterSpacing:'.18em',textTransform:'uppercase',
    color:'rgba(255,255,255,.85)',textDecoration:'none',transition:'color .2s ease',
    display:'inline-flex',alignItems:'center',
  }}
    onMouseEnter={e=>{e.currentTarget.style.color='#C9A84C';}}
    onMouseLeave={e=>{e.currentTarget.style.color='rgba(255,255,255,.85)';}}>
    {children}
  </Link>
);

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { itemCount: cartCount } = useCart();
  const { itemCount: wishCount } = useWishlist();
  const { isAuthenticated, user, backendUser, backendUserLoading, loading } = useSelector(s=>s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    if (!isHome) return;
    const fn = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, [isHome]);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!profileOpen) return;
    const fn = (e) => {
      const dp = document.querySelector('.niya-profile-dp');
      const btn = document.getElementById('niya-profile-btn');
      if (dp && !dp.contains(e.target) && btn && !btn.contains(e.target)) setProfileOpen(false);
    };
    const t = setTimeout(() => document.addEventListener('click', fn), 100);
    return () => { clearTimeout(t); document.removeEventListener('click', fn); };
  }, [profileOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQ.trim()) { navigate(`/products?search=${encodeURIComponent(searchQ)}`); setSearchQ(''); setMobileOpen(false); }
  };

  const handleLogout = async () => {
    setProfileOpen(false);
    try {
      window.dispatchEvent(new CustomEvent('auth:logout'));
      dispatch(forceLogout());
      ['sbbs_auth','sbbs_user','sbbs_token','firebase_auth_token','firebase_user','auth_token','user_data','authToken']
        .forEach(k => { localStorage.removeItem(k); sessionStorage.removeItem(k); });
      dispatch(userLogout());
      navigate('/login');
    } catch {
      dispatch(forceLogout());
      localStorage.clear(); sessionStorage.clear();
      navigate('/login');
    }
  };

  const userName = user?.displayName?.split(' ')[0] || user?.name?.split(' ')[0]
    || (user?.email ? user.email.split('@')[0].split('.')[0] : null)
    || (user?.phoneNumber ? user.phoneNumber.slice(-4) : 'Account');
  const userInitials = (user?.displayName || user?.name || userName || 'U')
    .split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);

  /* Header background style */
  const headerBg = isHome
    ? scrolled ? 'rgba(8,43,39,0.98)' : 'rgba(8,43,39,0.35)'
    : 'rgba(8,43,39,0.98)';
  const headerBorder = isHome && !scrolled ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(201,168,76,.1)';
  const headerBlur = isHome && !scrolled ? 'blur(20px)' : 'none';

  return (
    <>
      <style>{`
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        .niya-cats-dd { opacity:0;visibility:hidden;transform:translateY(8px);transition:all .25s cubic-bezier(.22,1,.36,1); }
        .niya-cats-wrap:hover .niya-cats-dd { opacity:1;visibility:visible;transform:translateY(0); }
      `}</style>

      <header style={{
        position:'fixed',top:0,left:0,width:'100%',zIndex:50,
        background:headerBg, backdropFilter:headerBlur,
        borderBottom:headerBorder,
        transition:'all .5s cubic-bezier(.22,1,.36,1)',
      }}>
        <div style={{maxWidth:'1400px',margin:'0 auto',padding:'0 clamp(16px,3vw,40px)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',height:'70px',gap:'16px'}}>

            {/* Logo */}
            <Link to="/" style={{flexShrink:0}}>
              <img src="niya-logo.webp" style={{height:'38px',width:'auto',objectFit:'contain'}} alt="Niya" />
            </Link>

            {/* Desktop Nav */}
            <nav style={{display:'flex',alignItems:'center',gap:'0'}}>
              <NavLink to="/">Home</NavLink>

              {/* Categories dropdown */}
              <div className="niya-cats-wrap" style={{position:'relative'}}>
                <button style={{
                  display:'inline-flex',alignItems:'center',gap:'5px',padding:'8px 16px',
                  fontFamily:'"Jost",sans-serif',fontSize:'12px',fontWeight:500,letterSpacing:'.18em',textTransform:'uppercase',
                  color:'rgba(255,255,255,.85)',background:'transparent',border:'none',cursor:'pointer',
                  transition:'color .2s ease',
                }}
                  onMouseEnter={e=>e.currentTarget.style.color='#C9A84C'}
                  onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,.85)'}>
                  Categories
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                </button>
                <div className="niya-cats-dd" style={{
                  position:'absolute',top:'calc(100% + 8px)',left:0,
                  width:'240px',background:'#fff',
                  boxShadow:'0 24px 48px rgba(8,43,39,.15)',
                  border:'1px solid rgba(8,43,39,.06)',zIndex:100,
                }}>
                  <div style={{maxHeight:'320px',overflowY:'auto'}}><CategoriesMenu /></div>
                  <div style={{borderTop:'1px solid rgba(8,43,39,.06)',padding:'8px'}}>
                    <Link to="/products" style={{
                      display:'block',padding:'10px 12px',
                      fontFamily:'"Jost",sans-serif',fontSize:'11px',fontWeight:600,letterSpacing:'.18em',
                      textTransform:'uppercase',color:'#082B27',textDecoration:'none',textAlign:'center',
                      transition:'color .2s ease',
                    }}
                      onMouseEnter={e=>e.currentTarget.style.color='#C9A84C'}
                      onMouseLeave={e=>e.currentTarget.style.color='#082B27'}>
                      View All Products →
                    </Link>
                  </div>
                </div>
              </div>

              <NavLink to="/products">Shop</NavLink>
              {isAuthenticated && user ? (
                <NavLink to="/my-orders">My Orders</NavLink>
              ) : (
                <>
                  <NavLink to="/about">About</NavLink>
                  <NavLink to="/contact">Contact</NavLink>
                </>
              )}
              <NavLink to="/new-arrivals">New Arrivals</NavLink>
            </nav>

            {/* Desktop right */}
            <div style={{display:'flex',alignItems:'center',gap:'8px',flexShrink:0}}>

              {/* Search */}
              <form onSubmit={handleSearch}>
                <div style={{
                  display:'flex',alignItems:'center',gap:'8px',
                  padding:'8px 14px',
                  border: searchFocused ? '1px solid rgba(201,168,76,.5)' : '1px solid rgba(255,255,255,.12)',
                  background: searchFocused ? 'rgba(201,168,76,.08)' : 'rgba(255,255,255,.05)',
                  borderRadius:'2px',width: searchFocused ? '180px' : '140px',
                  transition:'all .3s ease',
                }}>
                  <FaSearch style={{color:'rgba(255,255,255,.4)',fontSize:'11px',flexShrink:0}} />
                  <input type="text" placeholder="Search..."
                    value={searchQ} onChange={e=>setSearchQ(e.target.value)}
                    onFocus={()=>setSearchFocused(true)} onBlur={()=>setSearchFocused(false)}
                    style={{background:'transparent',border:'none',outline:'none',color:'#fff',
                      fontFamily:'"Jost",sans-serif',fontSize:'12px',width:'100%',
                    }} />
                </div>
              </form>

              {/* Wishlist */}
              <Link to="/wishlist" style={{position:'relative',width:'38px',height:'38px',display:'flex',alignItems:'center',justifyContent:'center',border:'1px solid rgba(255,255,255,.1)',background:'rgba(255,255,255,.04)',transition:'all .2s ease',textDecoration:'none'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(255,192,203,.4)';e.currentTarget.style.background='rgba(255,192,203,.08)';}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,.1)';e.currentTarget.style.background='rgba(255,255,255,.04)';}}>
                <FaHeart style={{color:'rgba(255,255,255,.6)',fontSize:'13px'}} />
                {wishCount > 0 && <span style={{position:'absolute',top:'-4px',right:'-4px',background:'#e87da0',color:'#fff',fontSize:'8px',fontWeight:700,width:'16px',height:'16px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center'}}>{wishCount}</span>}
              </Link>

              {/* Cart */}
              <Link to="/cart" style={{position:'relative',width:'38px',height:'38px',display:'flex',alignItems:'center',justifyContent:'center',border:'1px solid rgba(255,255,255,.1)',background:'rgba(255,255,255,.04)',transition:'all .2s ease',textDecoration:'none'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(201,168,76,.4)';e.currentTarget.style.background='rgba(201,168,76,.08)';}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,.1)';e.currentTarget.style.background='rgba(255,255,255,.04)';}}>
                <FaShoppingCart style={{color:'rgba(255,255,255,.6)',fontSize:'13px'}} />
                {cartCount > 0 && <span style={{position:'absolute',top:'-4px',right:'-4px',background:'#C9A84C',color:'#082B27',fontSize:'8px',fontWeight:700,width:'16px',height:'16px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center'}}>{cartCount}</span>}
              </Link>

              {/* Auth */}
              {loading || backendUserLoading ? (
                <div style={{width:'38px',height:'38px',border:'1px solid rgba(255,255,255,.1)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <div style={{width:'14px',height:'14px',border:'1px solid rgba(255,255,255,.2)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .8s linear infinite'}} />
                </div>
              ) : isAuthenticated && user?.uid ? (
                <div style={{position:'relative'}}>
                  <button id="niya-profile-btn" onClick={e=>{e.stopPropagation();setProfileOpen(p=>!p);}}
                    style={{display:'flex',alignItems:'center',gap:'8px',padding:'4px 10px 4px 4px',
                      border: profileOpen ? '1px solid rgba(201,168,76,.4)' : '1px solid rgba(255,255,255,.12)',
                      background:'rgba(255,255,255,.05)',cursor:'pointer',transition:'all .2s ease',
                    }}>
                    <div style={{width:'28px',height:'28px',borderRadius:'50%',overflow:'hidden',border:'1px solid rgba(201,168,76,.3)',flexShrink:0}}>
                      {backendUser?.image_url ? <img src={backendUser.image_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} /> :
                       user?.photoURL ? <img src={user.photoURL} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} /> :
                       <div style={{width:'100%',height:'100%',background:'#C9A84C',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'"Bodoni Moda",serif',fontSize:'11px',fontWeight:700,color:'#082B27'}}>{userInitials}</div>}
                    </div>
                    <span style={{fontFamily:'"Jost",sans-serif',fontSize:'12px',color:'rgba(255,255,255,.8)',letterSpacing:'.08em',maxWidth:'70px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{userName}</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="2" style={{transform:profileOpen?'rotate(180deg)':'none',transition:'transform .2s ease'}}><path d="M6 9l6 6 6-6"/></svg>
                  </button>

                  <div className="niya-profile-dp" style={{
                    position:'absolute',right:0,top:'calc(100% + 8px)',width:'220px',
                    background:'#fff',border:'1px solid rgba(8,43,39,.08)',
                    boxShadow:'0 24px 48px rgba(8,43,39,.15)',zIndex:100,
                    opacity:profileOpen?1:0,transform:profileOpen?'translateY(0)':'translateY(8px)',
                    pointerEvents:profileOpen?'auto':'none',transition:'all .25s ease',
                  }}>
                    <div style={{padding:'14px 16px',borderBottom:'1px solid rgba(8,43,39,.06)'}}>
                      <p style={{fontFamily:'"Bodoni Moda",serif',fontSize:'.9rem',fontWeight:700,color:'#082B27',margin:0}}>{user?.displayName||user?.name||'User'}</p>
                      <p style={{fontFamily:'"Jost",sans-serif',fontSize:'11px',color:'#999',margin:'2px 0 0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.email||user?.phoneNumber||''}</p>
                    </div>
                    {[{to:'/profile',label:'My Profile'},{to:'/my-orders',label:'My Orders'},{to:'/wishlist',label:'My Wishlist'},{to:'/settings',label:'Settings'}].map(item=>(
                      <Link key={item.to} to={item.to} onClick={()=>setProfileOpen(false)}
                        style={{display:'block',padding:'10px 16px',fontFamily:'"Jost",sans-serif',fontSize:'.85rem',color:'#555',textDecoration:'none',transition:'all .15s ease',borderLeft:'2px solid transparent'}}
                        onMouseEnter={e=>{e.currentTarget.style.background='rgba(8,43,39,.04)';e.currentTarget.style.color='#082B27';e.currentTarget.style.borderLeftColor='#C9A84C';e.currentTarget.style.paddingLeft='20px';}}
                        onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='#555';e.currentTarget.style.borderLeftColor='transparent';e.currentTarget.style.paddingLeft='16px';}}>
                        {item.label}
                      </Link>
                    ))}
                    <div style={{borderTop:'1px solid rgba(8,43,39,.06)',padding:'8px'}}>
                      <button onClick={handleLogout} style={{
                        width:'100%',padding:'10px 16px',background:'transparent',border:'none',cursor:'pointer',
                        fontFamily:'"Jost",sans-serif',fontSize:'.85rem',color:'#c0392b',textAlign:'left',
                        transition:'background .15s ease',
                      }}
                        onMouseEnter={e=>e.currentTarget.style.background='rgba(192,57,43,.06)'}
                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link to="/login" style={{
                  display:'inline-flex',alignItems:'center',gap:'6px',padding:'10px 20px',
                  background:'#C9A84C',color:'#082B27',fontFamily:'"Jost",sans-serif',
                  fontSize:'11px',fontWeight:700,letterSpacing:'.18em',textTransform:'uppercase',
                  textDecoration:'none',transition:'all .25s ease',
                }}
                  onMouseEnter={e=>{e.currentTarget.style.background='#d4b25e';e.currentTarget.style.transform='translateY(-1px)';}}
                  onMouseLeave={e=>{e.currentTarget.style.background='#C9A84C';e.currentTarget.style.transform='none';}}>
                  <FaUser size={10} />
                  Login
                </Link>
              )}
            </div>

            {/* Mobile right */}
            <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
              <Link to="/wishlist" style={{position:'relative',padding:'6px',color:'rgba(255,255,255,.7)',textDecoration:'none'}}>
                <FaHeart size={16} />
                {wishCount>0 && <span style={{position:'absolute',top:'-2px',right:'-2px',background:'#e87da0',color:'#fff',fontSize:'7px',fontWeight:700,width:'14px',height:'14px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center'}}>{wishCount}</span>}
              </Link>
              <Link to="/cart" style={{position:'relative',padding:'6px',color:'rgba(255,255,255,.7)',textDecoration:'none'}}>
                <FaShoppingCart size={16} />
                {cartCount>0 && <span style={{position:'absolute',top:'-2px',right:'-2px',background:'#C9A84C',color:'#082B27',fontSize:'7px',fontWeight:700,width:'14px',height:'14px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center'}}>{cartCount}</span>}
              </Link>
              <button onClick={()=>setMobileOpen(!mobileOpen)} style={{padding:'6px',color:'#fff',background:'transparent',border:'none',cursor:'pointer'}}>
                {mobileOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* ── Mobile Backdrop ── */}
      <div onClick={()=>setMobileOpen(false)} style={{
        position:'fixed',inset:0,zIndex:40,background:'rgba(0,0,0,.6)',backdropFilter:'blur(4px)',
        opacity:mobileOpen?1:0,pointerEvents:mobileOpen?'auto':'none',transition:'opacity .3s ease',
      }} />

      {/* ── Mobile Drawer ── */}
      <div style={{
        position:'fixed',top:0,right:0,height:'100%',width:'300px',zIndex:50,
        background:'#082B27',
        boxShadow: mobileOpen ? '-24px 0 60px rgba(0,0,0,.4)' : 'none',
        transform: mobileOpen ? 'translateX(0)' : 'translateX(100%)',
        transition:'transform .35s cubic-bezier(.22,1,.36,1)',
        display:'flex',flexDirection:'column',
        borderLeft:'1px solid rgba(201,168,76,.1)',
      }}>
        {/* Drawer header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 24px',borderBottom:'1px solid rgba(255,255,255,.06)'}}>
          <img src="niya-logo.webp" style={{height:'30px',objectFit:'contain'}} alt="Niya" />
          <button onClick={()=>setMobileOpen(false)} style={{color:'rgba(255,255,255,.5)',background:'transparent',border:'none',cursor:'pointer',padding:'4px'}}>
            <FaTimes size={18} />
          </button>
        </div>

        {/* User */}
        {isAuthenticated && user?.uid && (
          <div style={{display:'flex',alignItems:'center',gap:'12px',padding:'16px 24px',borderBottom:'1px solid rgba(255,255,255,.06)'}}>
            <div style={{width:'40px',height:'40px',borderRadius:'50%',overflow:'hidden',border:'1px solid rgba(201,168,76,.3)',flexShrink:0}}>
              {backendUser?.image_url ? <img src={backendUser.image_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} /> :
               user?.photoURL ? <img src={user.photoURL} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} /> :
               <div style={{width:'100%',height:'100%',background:'#C9A84C',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'"Bodoni Moda",serif',fontSize:'13px',fontWeight:700,color:'#082B27'}}>{userInitials}</div>}
            </div>
            <div>
              <p style={{fontFamily:'"Bodoni Moda",serif',fontSize:'.9rem',color:'#FAF7F2',margin:0,fontWeight:700}}>{user?.displayName||user?.name||'User'}</p>
              <p style={{fontFamily:'"Jost",sans-serif',fontSize:'11px',color:'rgba(255,255,255,.35)',margin:'2px 0 0',overflow:'hidden',textOverflow:'ellipsis',maxWidth:'180px',whiteSpace:'nowrap'}}>{user?.email||user?.phoneNumber}</p>
            </div>
          </div>
        )}

        {/* Search */}
        <div style={{padding:'16px 24px'}}>
          <form onSubmit={handleSearch}>
            <div style={{display:'flex',alignItems:'center',gap:'8px',padding:'10px 14px',border:'1px solid rgba(255,255,255,.1)',background:'rgba(255,255,255,.04)'}}>
              <FaSearch style={{color:'rgba(255,255,255,.3)',fontSize:'11px'}} />
              <input type="text" placeholder="Search products..." value={searchQ} onChange={e=>setSearchQ(e.target.value)}
                style={{background:'transparent',border:'none',outline:'none',color:'#fff',fontFamily:'"Jost",sans-serif',fontSize:'13px',width:'100%'}} />
            </div>
          </form>
        </div>

        {/* Nav */}
        <nav style={{flex:1,overflowY:'auto',padding:'8px 16px'}}>
          {[
            {to:'/',label:'Home'},{to:'/products',label:'Shop'},{to:'/new-arrivals',label:'New Arrivals'},
            ...(isAuthenticated&&user ? [{to:'/my-orders',label:'My Orders'},{to:'/profile',label:'My Profile'}] : [{to:'/about',label:'About'},{to:'/contact',label:'Contact'}])
          ].map(item=>(
            <Link key={item.to} to={item.to} onClick={()=>setMobileOpen(false)} style={{
              display:'flex',alignItems:'center',gap:'12px',padding:'12px 14px',
              fontFamily:'"Jost",sans-serif',fontSize:'13px',fontWeight:400,letterSpacing:'.08em',
              color:'rgba(255,255,255,.65)',textDecoration:'none',
              borderLeft:'2px solid transparent',transition:'all .15s ease',
            }}
              onMouseEnter={e=>{e.currentTarget.style.color='#FAF7F2';e.currentTarget.style.borderLeftColor='#C9A84C';e.currentTarget.style.paddingLeft='20px';}}
              onMouseLeave={e=>{e.currentTarget.style.color='rgba(255,255,255,.65)';e.currentTarget.style.borderLeftColor='transparent';e.currentTarget.style.paddingLeft='14px';}}>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Drawer footer */}
        <div style={{padding:'16px 24px',borderTop:'1px solid rgba(255,255,255,.06)'}}>
          {isAuthenticated&&user?.uid ? (
            <button onClick={handleLogout} style={{
              width:'100%',padding:'12px',background:'transparent',
              border:'1px solid rgba(192,57,43,.3)',color:'rgba(192,57,43,.8)',cursor:'pointer',
              fontFamily:'"Jost",sans-serif',fontSize:'12px',letterSpacing:'.15em',textTransform:'uppercase',
              transition:'all .2s ease',
            }}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(192,57,43,.08)';e.currentTarget.style.borderColor='rgba(192,57,43,.6)';}}
              onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.borderColor='rgba(192,57,43,.3)';}}>
              Logout
            </button>
          ) : (
            <Link to="/login" onClick={()=>setMobileOpen(false)} style={{
              display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',padding:'12px',
              background:'#C9A84C',color:'#082B27',fontFamily:'"Jost",sans-serif',
              fontSize:'12px',fontWeight:700,letterSpacing:'.18em',textTransform:'uppercase',textDecoration:'none',
            }}>
              <FaUser size={11} />
              Login / Register
            </Link>
          )}
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );
};

export default Header;