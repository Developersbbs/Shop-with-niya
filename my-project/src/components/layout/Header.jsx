import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaUser, FaSearch, FaBars, FaTimes, FaHeart } from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { userLogout, forceLogout } from '../../redux/slices/authSlice';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useGetCategoriesQuery } from '../../redux/services/categories';

/* ─────────────────────────────────────────
   GLOBAL STYLES — injected once
───────────────────────────────────────── */
const HDR_STYLE_ID = 'niya-hdr-styles';
if (typeof document !== 'undefined' && !document.getElementById(HDR_STYLE_ID)) {
  const s = document.createElement('style');
  s.id = HDR_STYLE_ID;
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Oswald:wght@400;500;600&display=swap');

    /* ── show/hide helpers ── */
    .niya-desktop-only { display: flex !important; }
    .niya-mobile-only  { display: none  !important; }

    @media (max-width: 1024px) {
      .niya-desktop-only { display: none  !important; }
      .niya-mobile-only  { display: flex  !important; }
    }

    /* ── categories dropdown ── */
    @keyframes hdr-shimmer {
      0%   { opacity: .4; }
      50%  { opacity: .8; }
      100% { opacity: .4; }
    }
    .niya-cats-wrap { position: relative; }
    .niya-cats-dd {
      opacity: 0; visibility: hidden;
      transform: translateY(10px);
      transition: all .25s cubic-bezier(.22,1,.36,1);
      pointer-events: none;
    }
    .niya-cats-wrap:hover .niya-cats-dd {
      opacity: 1; visibility: visible;
      transform: translateY(0);
      pointer-events: auto;
    }

    /* ── nav link hover underline ── */
    .niya-navlink {
      position: relative;
      font-family: 'Poppins', sans-serif;
      font-size: 11px;
      font-weight: 500;
      letter-spacing: .16em;
      text-transform: uppercase;
      color: rgba(255,255,255,.8);
      text-decoration: none;
      padding: 8px 14px;
      transition: color .2s ease;
      white-space: nowrap;
    }
    .niya-navlink::after {
      content: '';
      position: absolute;
      bottom: 2px; left: 14px; right: 14px;
      height: 1.5px;
      background: #C9A84C;
      transform: scaleX(0);
      transform-origin: left;
      transition: transform .25s ease;
    }
    .niya-navlink:hover { color: #C9A84C; }
    .niya-navlink:hover::after { transform: scaleX(1); }

    .niya-navbtn {
      font-family: 'Poppins', sans-serif;
      font-size: 11px;
      font-weight: 500;
      letter-spacing: .16em;
      text-transform: uppercase;
      color: rgba(255,255,255,.8);
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 8px 14px;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: color .2s ease;
      white-space: nowrap;
    }
    .niya-navbtn:hover { color: #C9A84C; }

    /* ── icon button ── */
    .niya-icon-btn {
      position: relative;
      width: 36px; height: 36px;
      display: flex; align-items: center; justify-content: center;
      border: 1px solid rgba(255,255,255,.1);
      background: rgba(255,255,255,.04);
      transition: all .2s ease;
      text-decoration: none;
      flex-shrink: 0;
      cursor: pointer;
    }
    .niya-icon-btn:hover {
      border-color: rgba(201,168,76,.4);
      background: rgba(201,168,76,.08);
    }
    .niya-icon-btn.heart:hover {
      border-color: rgba(255,192,203,.4);
      background: rgba(255,192,203,.08);
    }

    /* ── badge ── */
    .niya-badge {
      position: absolute; top: -4px; right: -4px;
      width: 16px; height: 16px; border-radius: 50%;
      font-size: 8px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      font-family: 'Poppins', sans-serif;
    }

    /* ── search bar ── */
    .niya-search {
      display: flex; align-items: center; gap: 8px;
      padding: 7px 13px;
      border: 1px solid rgba(255,255,255,.12);
      background: rgba(255,255,255,.05);
      transition: all .3s ease;
      width: 140px;
    }
    .niya-search.focused {
      border-color: rgba(201,168,76,.5);
      background: rgba(201,168,76,.06);
      width: 180px;
    }
    .niya-search input {
      background: transparent; border: none; outline: none;
      color: #fff; font-family: 'Poppins', sans-serif;
      font-size: 11px; width: 100%;
    }
    .niya-search input::placeholder { color: rgba(255,255,255,.35); }

    /* ── profile dropdown ── */
    .niya-profile-dp {
      position: absolute; right: 0; top: calc(100% + 8px);
      width: 220px; background: #fff;
      border: 1px solid rgba(8,43,39,.08);
      box-shadow: 0 24px 48px rgba(8,43,39,.15);
      z-index: 200;
      transition: all .25s ease;
    }
    .niya-profile-dp a, .niya-profile-dp button {
      font-family: 'Poppins', sans-serif !important;
    }

    /* ── mobile drawer links ── */
    .niya-drawer-link {
      display: flex; align-items: center; gap: 12px;
      padding: 13px 16px;
      font-family: 'Poppins', sans-serif;
      font-size: 13px; font-weight: 400;
      letter-spacing: .05em;
      color: rgba(255,255,255,.65);
      text-decoration: none;
      border-left: 2px solid transparent;
      transition: all .15s ease;
    }
    .niya-drawer-link:hover {
      color: #FAF7F2;
      border-left-color: #C9A84C;
      padding-left: 22px;
    }

    /* ── spin ── */
    @keyframes niya-spin { to { transform: rotate(360deg); } }
  `;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────
   Categories dropdown content
───────────────────────────────────────── */
const CategoriesMenu = () => {
  const { data, isLoading } = useGetCategoriesQuery({ limit: 20 });
  const cats = data?.data || [];

  if (isLoading) return (
    <div style={{ padding: '12px' }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          height: '36px', background: 'rgba(8,43,39,.06)',
          borderRadius: '2px', marginBottom: '8px',
          animation: 'hdr-shimmer 1.4s infinite',
        }} />
      ))}
    </div>
  );

  if (!cats.length) return (
    <div style={{ padding: '16px', fontFamily: '"Poppins",sans-serif', fontSize: '.85rem', color: '#999', textAlign: 'center' }}>
      No categories
    </div>
  );

  return (
    <ul style={{ listStyle: 'none', padding: '8px', margin: 0 }}>
      {cats.map(cat => (
        <li key={cat._id}>
          <Link
            to={`/products?category=${cat._id}`}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', textDecoration: 'none',
              color: '#444', fontFamily: '"Poppins",sans-serif',
              fontSize: '.82rem', fontWeight: 400,
              transition: 'all .2s ease', borderRadius: '2px',
              borderLeft: '2px solid transparent',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(8,43,39,.06)';
              e.currentTarget.style.color = '#082B27';
              e.currentTarget.style.borderLeftColor = '#C9A84C';
              e.currentTarget.style.paddingLeft = '18px';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#444';
              e.currentTarget.style.borderLeftColor = 'transparent';
              e.currentTarget.style.paddingLeft = '12px';
            }}
          >
            <span style={{ width: '5px', height: '5px', background: '#C9A84C', borderRadius: '50%', flexShrink: 0, opacity: .6 }} />
            {cat.name}
          </Link>
        </li>
      ))}
    </ul>
  );
};

/* ─────────────────────────────────────────
   HEADER
───────────────────────────────────────── */
const Header = () => {
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [profileOpen,  setProfileOpen]  = useState(false);
  const [searchQ,      setSearchQ]      = useState('');
  const [searchFocused,setSearchFocused]= useState(false);
  const [scrolled,     setScrolled]     = useState(false);

  const { itemCount: cartCount } = useCart();
  const { itemCount: wishCount } = useWishlist();
  const { isAuthenticated, user, backendUser, backendUserLoading, loading } = useSelector(s => s.auth);
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const location   = useLocation();
  const isHome     = location.pathname === '/';

  /* scroll listener */
  useEffect(() => {
    if (!isHome) return;
    const fn = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, [isHome]);

  /* close mobile on route change */
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  /* close profile dropdown on outside click */
  useEffect(() => {
    if (!profileOpen) return;
    const fn = (e) => {
      const dp  = document.querySelector('.niya-profile-dp');
      const btn = document.getElementById('niya-profile-btn');
      if (dp && !dp.contains(e.target) && btn && !btn.contains(e.target)) setProfileOpen(false);
    };
    const t = setTimeout(() => document.addEventListener('click', fn), 100);
    return () => { clearTimeout(t); document.removeEventListener('click', fn); };
  }, [profileOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQ.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQ)}`);
      setSearchQ(''); setMobileOpen(false);
    }
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

  const userName    = user?.displayName?.split(' ')[0] || user?.name?.split(' ')[0]
    || (user?.email ? user.email.split('@')[0].split('.')[0] : null)
    || (user?.phoneNumber ? user.phoneNumber.slice(-4) : 'Account');
  const userInitials = (user?.displayName || user?.name || userName || 'U')
    .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const headerBg     = isHome ? (scrolled ? 'rgba(8,43,39,.98)' : 'rgba(8,43,39,.3)') : 'rgba(8,43,39,.98)';
  const headerBorder = isHome && !scrolled ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(201,168,76,.1)';
  const headerBlur   = isHome && !scrolled ? 'blur(20px)' : 'none';

  /* nav links */
  const navLinks = [
    { to: '/',            label: 'Home' },
    { to: '/products',    label: 'Shop' },
    ...(isAuthenticated && user
      ? [{ to: '/my-orders', label: 'My Orders' }]
      : [{ to: '/about', label: 'About' }, { to: '/contact', label: 'Contact' }]
    ),
    // { to: '/new-arrivals', label: 'New Arrivals' },
  ];

  return (
    <>
      {/* ════════════════════════════════
          HEADER BAR
      ════════════════════════════════ */}
      <header style={{
        position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 100,
        background: headerBg,
        backdropFilter: headerBlur,
        borderBottom: headerBorder,
        transition: 'all .5s cubic-bezier(.22,1,.36,1)',
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 clamp(16px,3vw,40px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '68px', gap: '12px' }}>

            {/* ── Logo ── */}
            <Link to="/" style={{ flexShrink: 0 }}>
              <img src="niya-logo.webp" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} alt="Niya" />
            </Link>

            {/* ── Desktop Nav ── */}
            <nav className="niya-desktop-only" style={{ alignItems: 'center', gap: '0', flex: 1, justifyContent: 'center' }}>
              {navLinks.map(l => (
                <Link key={l.to} to={l.to} className="niya-navlink">{l.label}</Link>
              ))}

              {/* Categories dropdown */}
              <div className="niya-cats-wrap">
                <button className="niya-navbtn">
                  Categories
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </button>
                <div className="niya-cats-dd" style={{
                  position: 'absolute', top: 'calc(100% + 6px)', left: 0,
                  width: '230px', background: '#fff',
                  boxShadow: '0 20px 48px rgba(8,43,39,.15)',
                  border: '1px solid rgba(8,43,39,.06)', zIndex: 200,
                }}>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}><CategoriesMenu /></div>
                  <div style={{ borderTop: '1px solid rgba(8,43,39,.06)', padding: '8px' }}>
                    <Link to="/products" style={{
                      display: 'block', padding: '10px 12px',
                      fontFamily: '"Poppins",sans-serif', fontSize: '10px',
                      fontWeight: 600, letterSpacing: '.18em', textTransform: 'uppercase',
                      color: '#082B27', textDecoration: 'none', textAlign: 'center', transition: 'color .2s ease',
                    }}
                      onMouseEnter={e => e.currentTarget.style.color = '#C9A84C'}
                      onMouseLeave={e => e.currentTarget.style.color = '#082B27'}>
                      View All Products →
                    </Link>
                  </div>
                </div>
              </div>
            </nav>

            {/* ── Desktop Right Controls ── */}
            <div className="niya-desktop-only" style={{ alignItems: 'center', gap: '8px', flexShrink: 0 }}>

              {/* Search */}
              <form onSubmit={handleSearch}>
                <div className={`niya-search${searchFocused ? ' focused' : ''}`}>
                  <FaSearch style={{ color: 'rgba(255,255,255,.4)', fontSize: '10px', flexShrink: 0 }} />
                  <input
                    type="text" placeholder="Search..."
                    value={searchQ} onChange={e => setSearchQ(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                  />
                </div>
              </form>

              {/* Wishlist */}
              <Link to="/wishlist" className="niya-icon-btn heart">
                <FaHeart style={{ color: 'rgba(255,255,255,.6)', fontSize: '12px' }} />
                {wishCount > 0 && <span className="niya-badge" style={{ background: '#e87da0', color: '#fff' }}>{wishCount}</span>}
              </Link>

              {/* Cart */}
              <Link to="/cart" className="niya-icon-btn">
                <FaShoppingCart style={{ color: 'rgba(255,255,255,.6)', fontSize: '12px' }} />
                {cartCount > 0 && <span className="niya-badge" style={{ background: '#C9A84C', color: '#082B27' }}>{cartCount}</span>}
              </Link>

              {/* Auth */}
              {loading || backendUserLoading ? (
                <div className="niya-icon-btn" style={{ cursor: 'default' }}>
                  <div style={{ width: '14px', height: '14px', border: '1.5px solid rgba(255,255,255,.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'niya-spin .8s linear infinite' }} />
                </div>
              ) : isAuthenticated && user?.uid ? (
                <div style={{ position: 'relative' }}>
                  <button
                    id="niya-profile-btn"
                    onClick={e => { e.stopPropagation(); setProfileOpen(p => !p); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '4px 10px 4px 4px',
                      border: profileOpen ? '1px solid rgba(201,168,76,.4)' : '1px solid rgba(255,255,255,.12)',
                      background: 'rgba(255,255,255,.05)', cursor: 'pointer', transition: 'all .2s ease',
                    }}
                  >
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', border: '1.5px solid rgba(201,168,76,.3)', flexShrink: 0 }}>
                      {backendUser?.image_url
                        ? <img src={backendUser.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : user?.photoURL
                          ? <img src={user.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ width: '100%', height: '100%', background: '#C9A84C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Poppins",sans-serif', fontSize: '10px', fontWeight: 700, color: '#082B27' }}>{userInitials}</div>
                      }
                    </div>
                    <span style={{ fontFamily: '"Poppins",sans-serif', fontSize: '11px', color: 'rgba(255,255,255,.8)', letterSpacing: '.06em', maxWidth: '70px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="2" style={{ transform: profileOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease' }}>
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </button>

                  {/* Profile dropdown */}
                  <div className="niya-profile-dp" style={{
                    opacity: profileOpen ? 1 : 0,
                    transform: profileOpen ? 'translateY(0)' : 'translateY(8px)',
                    pointerEvents: profileOpen ? 'auto' : 'none',
                  }}>
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(8,43,39,.06)' }}>
                      <p style={{ fontFamily: '"Oswald",sans-serif', fontSize: '.95rem', fontWeight: 600, color: '#082B27', margin: 0 }}>{user?.displayName || user?.name || 'User'}</p>
                      <p style={{ fontFamily: '"Poppins",sans-serif', fontSize: '11px', color: '#999', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email || user?.phoneNumber || ''}</p>
                    </div>
                    {[
                      { to: '/profile',   label: 'My Profile' },
                      { to: '/my-orders', label: 'My Orders' },
                      { to: '/wishlist',  label: 'My Wishlist' },
                      { to: '/settings',  label: 'Settings' },
                    ].map(item => (
                      <Link key={item.to} to={item.to} onClick={() => setProfileOpen(false)}
                        style={{ display: 'block', padding: '10px 16px', fontFamily: '"Poppins",sans-serif', fontSize: '.82rem', color: '#555', textDecoration: 'none', transition: 'all .15s ease', borderLeft: '2px solid transparent' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(8,43,39,.04)'; e.currentTarget.style.color = '#082B27'; e.currentTarget.style.borderLeftColor = '#C9A84C'; e.currentTarget.style.paddingLeft = '20px'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#555'; e.currentTarget.style.borderLeftColor = 'transparent'; e.currentTarget.style.paddingLeft = '16px'; }}>
                        {item.label}
                      </Link>
                    ))}
                    <div style={{ borderTop: '1px solid rgba(8,43,39,.06)', padding: '8px' }}>
                      <button onClick={handleLogout} style={{
                        width: '100%', padding: '10px 16px', background: 'transparent', border: 'none',
                        cursor: 'pointer', fontFamily: '"Poppins",sans-serif', fontSize: '.82rem',
                        color: '#c0392b', textAlign: 'left', transition: 'background .15s ease',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(192,57,43,.06)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link to="/login" style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '10px 20px', background: '#C9A84C', color: '#082B27',
                  fontFamily: '"Poppins",sans-serif', fontSize: '10px', fontWeight: 700,
                  letterSpacing: '.18em', textTransform: 'uppercase', textDecoration: 'none',
                  transition: 'all .25s ease',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#d4b25e'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#C9A84C'; e.currentTarget.style.transform = 'none'; }}>
                  <FaUser size={10} />
                  Login
                </Link>
              )}
            </div>

            {/* ── Mobile Right Controls ── */}
            <div className="niya-mobile-only" style={{ alignItems: 'center', gap: '6px' }}>
              <Link to="/wishlist" style={{ position: 'relative', padding: '7px', color: 'rgba(255,255,255,.75)', textDecoration: 'none', display: 'flex' }}>
                <FaHeart size={16} />
                {wishCount > 0 && <span className="niya-badge" style={{ background: '#e87da0', color: '#fff' }}>{wishCount}</span>}
              </Link>
              <Link to="/cart" style={{ position: 'relative', padding: '7px', color: 'rgba(255,255,255,.75)', textDecoration: 'none', display: 'flex' }}>
                <FaShoppingCart size={16} />
                {cartCount > 0 && <span className="niya-badge" style={{ background: '#C9A84C', color: '#082B27' }}>{cartCount}</span>}
              </Link>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                style={{ padding: '7px', color: '#fff', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                {mobileOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* ════════════════════════════════
          MOBILE BACKDROP
      ════════════════════════════════ */}
      <div
        onClick={() => setMobileOpen(false)}
        style={{
          position: 'fixed', inset: 0, zIndex: 140,
          background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(4px)',
          opacity: mobileOpen ? 1 : 0,
          pointerEvents: mobileOpen ? 'auto' : 'none',
          transition: 'opacity .3s ease',
        }}
      />

      {/* ════════════════════════════════
          MOBILE DRAWER
      ════════════════════════════════ */}
      <div style={{
        position: 'fixed', top: 0, right: 0, height: '100%',
        width: 'min(300px, 85vw)', zIndex: 150,
        background: '#082B27',
        boxShadow: mobileOpen ? '-24px 0 60px rgba(0,0,0,.5)' : 'none',
        transform: mobileOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform .35s cubic-bezier(.22,1,.36,1)',
        display: 'flex', flexDirection: 'column',
        borderLeft: '1px solid rgba(201,168,76,.1)',
        overflowY: 'auto',
      }}>

        {/* Drawer header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,.06)', flexShrink: 0 }}>
          <img src="niya-logo.webp" style={{ height: '30px', objectFit: 'contain' }} alt="Niya" />
          <button onClick={() => setMobileOpen(false)} style={{ color: 'rgba(255,255,255,.5)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}>
            <FaTimes size={18} />
          </button>
        </div>

        {/* User info */}
        {isAuthenticated && user?.uid && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,.06)', flexShrink: 0 }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', overflow: 'hidden', border: '1.5px solid rgba(201,168,76,.3)', flexShrink: 0 }}>
              {backendUser?.image_url
                ? <img src={backendUser.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : user?.photoURL
                  ? <img src={user.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', background: '#C9A84C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Poppins",sans-serif', fontSize: '13px', fontWeight: 700, color: '#082B27' }}>{userInitials}</div>
              }
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontFamily: '"Oswald",sans-serif', fontSize: '.95rem', color: '#FAF7F2', margin: 0, fontWeight: 600 }}>{user?.displayName || user?.name || 'User'}</p>
              <p style={{ fontFamily: '"Poppins",sans-serif', fontSize: '10px', color: 'rgba(255,255,255,.35)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email || user?.phoneNumber}</p>
            </div>
          </div>
        )}

        {/* Search */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,.04)', flexShrink: 0 }}>
          <form onSubmit={handleSearch}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 13px', border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.04)' }}>
              <FaSearch style={{ color: 'rgba(255,255,255,.3)', fontSize: '11px', flexShrink: 0 }} />
              <input
                type="text" placeholder="Search products..."
                value={searchQ} onChange={e => setSearchQ(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontFamily: '"Poppins",sans-serif', fontSize: '13px', width: '100%' }}
              />
            </div>
          </form>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '8px 0' }}>
          {navLinks.map(l => (
            <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)} className="niya-drawer-link">
              {l.label}
            </Link>
          ))}

          {/* Categories section in drawer */}
          <div style={{ padding: '13px 16px', borderTop: '1px solid rgba(255,255,255,.04)', marginTop: '4px' }}>
            <p style={{ fontFamily: '"Poppins",sans-serif', fontSize: '9px', fontWeight: 600, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', marginBottom: '8px' }}>Categories</p>
            <MobileCatsMenu onClose={() => setMobileOpen(false)} />
          </div>
        </nav>

        {/* Drawer footer */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,.06)', flexShrink: 0 }}>
          {isAuthenticated && user?.uid ? (
            <button onClick={handleLogout} style={{
              width: '100%', padding: '12px', background: 'transparent',
              border: '1px solid rgba(192,57,43,.3)', color: 'rgba(192,57,43,.85)',
              cursor: 'pointer', fontFamily: '"Poppins",sans-serif',
              fontSize: '11px', letterSpacing: '.15em', textTransform: 'uppercase',
              transition: 'all .2s ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(192,57,43,.08)'; e.currentTarget.style.borderColor = 'rgba(192,57,43,.6)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(192,57,43,.3)'; }}>
              Logout
            </button>
          ) : (
            <Link to="/login" onClick={() => setMobileOpen(false)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '13px', background: '#C9A84C', color: '#082B27',
              fontFamily: '"Poppins",sans-serif', fontSize: '11px', fontWeight: 700,
              letterSpacing: '.18em', textTransform: 'uppercase', textDecoration: 'none',
            }}>
              <FaUser size={11} />
              Login / Register
            </Link>
          )}
        </div>
      </div>
    </>
  );
};

/* ── Mobile categories list (flat, no dropdown) ── */
const MobileCatsMenu = ({ onClose }) => {
  const { data, isLoading } = useGetCategoriesQuery({ limit: 20 });
  const cats = data?.data || [];
  if (isLoading) return <div style={{ fontFamily: '"Poppins",sans-serif', fontSize: '12px', color: 'rgba(255,255,255,.3)' }}>Loading...</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      {cats.slice(0, 8).map(cat => (
        <Link key={cat._id} to={`/products?category=${cat._id}`} onClick={onClose}
          style={{ fontFamily: '"Poppins",sans-serif', fontSize: '12px', color: 'rgba(255,255,255,.5)', textDecoration: 'none', padding: '6px 0', transition: 'color .15s ease', display: 'flex', alignItems: 'center', gap: '8px' }}
          onMouseEnter={e => e.currentTarget.style.color = '#C9A84C'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.5)'}>
          <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#C9A84C', opacity: .5, flexShrink: 0 }} />
          {cat.name}
        </Link>
      ))}
      {cats.length > 8 && (
        <Link to="/products" onClick={onClose} style={{ fontFamily: '"Poppins",sans-serif', fontSize: '10px', color: '#C9A84C', textDecoration: 'none', marginTop: '6px', letterSpacing: '.1em' }}>
          View all →
        </Link>
      )}
    </div>
  );
};

export default Header;