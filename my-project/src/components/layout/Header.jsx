import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaUser, FaSearch, FaBars, FaTimes, FaHeart, FaTag } from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { userLogout, forceLogout } from '../../redux/slices/authSlice';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useGetCategoriesQuery } from '../../redux/services/categories';
import { useLocation } from "react-router-dom";

const CategoriesMenu = () => {
  const { data: categoriesData, isLoading } = useGetCategoriesQuery({ limit: 20 });
  const categories = categoriesData?.data || [];

  if (isLoading) {
    return (
      <div className="space-y-2 p-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-8 bg-white/10 rounded animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (categories.length === 0) {
    return <div className="p-4 text-sm text-white/50 text-center">No categories found</div>;
  }

  return (
    <ul className="space-y-1">
      {categories.map((category) => (
        <li key={category._id}>
          <Link
            to={`/products?category=${category._id}`}
            className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors group"
          >
            <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3 group-hover:bg-white text-gray-500 group-hover:text-blue-600 transition-colors">
              {category.image_url && !category.image_url.includes('placeholder') ? (
                <img src={category.image_url} alt="" className="w-full h-full object-cover rounded-full" />
              ) : (
                <FaTag size={12} />
              )}
            </span>
            <span className="font-medium truncate">{category.name}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
};

/* ── Animated nav link ── */
const NavLink = ({ to, children, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="relative px-4 py-2 rounded-lg text-white font-medium text-sm
               group transition-all duration-200 overflow-hidden"
  >
    {/* sliding underline */}
    <span className="absolute bottom-1 left-4 right-4 h-[2px] bg-yellow-400
                     scale-x-0 group-hover:scale-x-100
                     transition-transform duration-300 origin-left rounded-full" />
    {/* subtle glow on hover */}
    <span className="absolute inset-0 rounded-lg bg-white/0 group-hover:bg-white/5
                     transition-colors duration-200" />
    <span className="relative">{children}</span>
  </Link>
);

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const { itemCount: cartItemCount } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const { isAuthenticated, user, backendUser, backendUserLoading, loading } = useSelector((state) => state.auth);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    setIsProfileDropdownOpen(false);
    try {
      window.dispatchEvent(new CustomEvent('auth:logout'));
      dispatch(forceLogout());
      if (typeof window !== 'undefined') {
        ['sbbs_auth','sbbs_user','sbbs_token','firebase_auth_token','firebase_user','auth_token','user_data','authToken']
          .forEach(k => { localStorage.removeItem(k); sessionStorage.removeItem(k); });
      }
      dispatch(userLogout());
      navigate('/login');
    } catch {
      dispatch(forceLogout());
      if (typeof window !== 'undefined') { localStorage.clear(); sessionStorage.clear(); }
      navigate('/login');
    }
  };

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setIsProfileDropdownOpen(prev => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!isProfileDropdownOpen) return;
      const dropdown = document.querySelector('.profile-dropdown');
      const button = document.getElementById('profile-button');
      if (dropdown && !dropdown.contains(e.target) && button && !button.contains(e.target)) {
        setIsProfileDropdownOpen(false);
      }
    };
    const t = setTimeout(() => document.addEventListener('click', handleClickOutside), 100);
    return () => { clearTimeout(t); document.removeEventListener('click', handleClickOutside); };
  }, [isProfileDropdownOpen]);

  // close mobile menu on route change
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => { setIsMobileMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!isHomePage) return;
    const handleScroll = () => setIsScrolled(window.scrollY > 80);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHomePage]);

  const userName = user?.displayName?.split(' ')[0]
    || user?.name?.split(' ')[0]
    || (user?.email ? user.email.split('@')[0].split('.')[0] : null)
    || (user?.phoneNumber ? user.phoneNumber.slice(-4) : 'Account');

  const userInitials = user?.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    : userName?.substring(0, 2).toUpperCase();

  return (
    <>
      <header
        className={`
          fixed top-0 left-0 w-full z-50
          transition-all duration-500 ease-in-out
          ${isHomePage
            ? isScrolled ? "bg-[#082B27] shadow-lg py-2" : "bg-transparent py-4"
            : "bg-[#082B27] shadow-lg py-2"
          }
        `}
      >
        <div className="container mx-auto px-4 py-2" >
          <div className="flex items-center justify-between h-14">

            {/* Logo */}
            <Link to="/" className="flex-shrink-0">
              <img src='niya-logo.webp' className='w-36 h-auto object-contain' />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              <NavLink to="/">Home</NavLink>

              {/* Categories Dropdown */}
              <div className="relative group">
                <button className="relative flex items-center gap-1 px-4 py-2 rounded-lg text-white font-medium text-sm
                                   group transition-all duration-200 overflow-hidden cursor-pointer">
                  <span className="absolute bottom-1 left-4 right-4 h-[2px] bg-yellow-400
                                   scale-x-0 group-hover:scale-x-100
                                   transition-transform duration-300 origin-left rounded-full" />
                  <span className="absolute inset-0 rounded-lg bg-white/0 group-hover:bg-white/5 transition-colors duration-200" />
                  <span className="relative">Categories</span>
                  <svg className="relative w-3.5 h-3.5 transform group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100
                                opacity-0 invisible group-hover:opacity-100 group-hover:visible
                                transition-all duration-200 translate-y-2 group-hover:translate-y-0 z-50">
                  <div className="p-2">
                    <div className="max-h-80 overflow-y-auto"><CategoriesMenu /></div>
                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <Link to="/products" className="block px-4 py-2 text-sm text-center font-medium text-gray-600 hover:text-blue-600 rounded-lg transition-colors">
                        View All Products →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <NavLink to="/products">Shop</NavLink>
              {isAuthenticated && user
                ? <NavLink to="/my-orders">My Orders</NavLink>
                : <>
                    <NavLink to="/about">About</NavLink>
                    <NavLink to="/contact">Contact</NavLink>
                  </>
              }
              <NavLink to="/new-arrivals">New Arrivals</NavLink>
            </nav>

            {/* Desktop Right */}
            <div className="hidden md:flex items-center gap-4">
              {/* Search */}
              <form onSubmit={handleSearch}>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-all duration-300 ${
                  searchFocused
                    ? 'bg-white/15 backdrop-blur-md border-gray-400 shadow-[0_0_0_3px_rgba(250,204,21,0.15)] w-52'
                    : 'bg-transparent border-white/25 hover:border-white/50 hover:bg-white/5 w-40'
                }`}>
                  <FaSearch className="w-3.5 h-3.5 flex-shrink-0 text-white/60" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="bg-transparent text-sm outline-none w-full text-white placeholder-white/40"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                  />
                  {searchQuery && (
                    <button type="submit" className="flex-shrink-0 w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
                      <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5-5 5M6 12h12" />
                      </svg>
                    </button>
                  )}
                </div>
              </form>

              {/* Wishlist */}
              <Link to="/wishlist" title="Wishlist"
                className="relative group flex items-center justify-center w-10 h-10 rounded-full
                           bg-white/5 hover:bg-pink-500/20 border border-white/20 hover:border-pink-400
                           transition-all duration-200">
                <FaHeart className="h-4 w-4 text-white/70 group-hover:text-pink-400 group-hover:scale-110 transition-all duration-200" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-pink-500 text-white text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center shadow-md">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link to="/cart" title="Cart"
                className="relative group flex items-center justify-center w-10 h-10 rounded-full
                           bg-white/5 hover:bg-blue-400/20 border border-white/20 hover:border-blue-400
                           transition-all duration-200">
                <FaShoppingCart className="h-4 w-4 text-white/70 group-hover:text-blue-400 group-hover:scale-110 transition-all duration-200" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-blue-400 text-[#082B27] text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center shadow-md">
                    {cartItemCount}
                  </span>
                )}
              </Link>

              {/* Auth */}
              {loading || backendUserLoading ? (
                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                </div>
              ) : isAuthenticated && user?.uid ? (
                <div className="relative">
                  <button id="profile-button" onClick={toggleDropdown}
                    className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full
                               bg-white/5 hover:bg-white/15 border border-white/20 hover:border-yellow-400
                               transition-all duration-200 group">
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-yellow-600/50 group-hover:border-yellow-400 transition-colors flex-shrink-0">
                      {backendUser?.image_url ? (
                        <img src={backendUser.image_url} alt="" className="w-full h-full object-cover" onError={e => e.target.style.display='none'} />
                      ) : user?.photoURL ? (
                        <img src={user.photoURL} alt="" className="w-full h-full object-cover" onError={e => e.target.style.display='none'} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-yellow-200 text-[#082B27] font-bold text-xs">
                          {userInitials}
                        </div>
                      )}
                    </div>
                    <span className="hidden lg:inline text-sm text-white/90 font-medium max-w-[72px] truncate">{userName}</span>
                    <svg className={`w-3 h-3 text-white/50 transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <div className={`profile-dropdown absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-2xl border border-gray-100 py-1.5 z-50 transition-all duration-200 ${
                    isProfileDropdownOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
                  }`}>
                    <div className="px-4 py-2.5 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user?.displayName || user?.name || 'User'}</p>
                      <p className="text-xs text-gray-400 truncate">{user?.email || user?.phoneNumber || ''}</p>
                    </div>
                    {[
                      { to: '/profile', label: 'My Profile', d: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
                      { to: '/my-orders', label: 'My Orders', d: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
                      { to: '/wishlist', label: 'My Wishlist', d: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
                      { to: '/settings', label: 'Settings', d: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
                    ].map(item => (
                      <Link key={item.to} to={item.to} onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.d} />
                        </svg>
                        {item.label}
                      </Link>
                    ))}
                    <div className="border-t border-gray-100 my-1"></div>
                    <button onClick={handleLogout}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors">
                      <svg className="w-4 h-4 mr-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <Link to="/login"
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-400 hover:bg-yellow-300
                             text-[#082B27] font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg">
                  <FaUser size={13} />
                  <span className="hidden lg:inline">Login</span>
                </Link>
              )}
            </div>

            {/* Mobile: right side icons + burger */}
            <div className="md:hidden flex items-center gap-2">
              {/* Wishlist icon */}
              <Link to="/wishlist" className="relative p-2">
                <FaHeart className="h-5 w-5 text-white/80" />
                {wishlistCount > 0 && (
                  <span className="absolute top-0 right-0 bg-pink-500 text-white text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>
              {/* Cart icon */}
              <Link to="/cart" className="relative p-2">
                <FaShoppingCart className="h-5 w-5 text-white/80" />
                {cartItemCount > 0 && (
                  <span className="absolute top-0 right-0 bg-yellow-400 text-[#082B27] text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </Link>
              {/* Burger */}
              <button
                className="p-2 text-white"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* ── Mobile Drawer (slide from right) ── */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 h-full w-72 z-50 bg-[#082B27] shadow-2xl
                    transition-transform duration-300 ease-in-out md:hidden flex flex-col
                    ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <img src='niya-logo.webp' className='w-28 h-auto object-contain' />
          <button onClick={() => setIsMobileMenuOpen(false)} className="p-1.5 text-white/60 hover:text-white transition-colors">
            <FaTimes size={20} />
          </button>
        </div>

        {/* User info (if logged in) */}
        {isAuthenticated && user?.uid && (
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-yellow-400/60 flex-shrink-0">
              {backendUser?.image_url ? (
                <img src={backendUser.image_url} alt="" className="w-full h-full object-cover" />
              ) : user?.photoURL ? (
                <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-yellow-200 text-[#082B27] font-bold text-sm">
                  {userInitials}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user?.displayName || user?.name || 'User'}</p>
              <p className="text-white/40 text-xs truncate">{user?.email || user?.phoneNumber || ''}</p>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="px-5 py-3 mt-1">
          <form onSubmit={handleSearch}>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-full border border-white/20 bg-white/5">
              <FaSearch className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search products..."
                className="bg-transparent text-sm outline-none w-full text-white placeholder-white/35"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button type="submit" className="w-5 h-5 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-[#082B27]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5-5 5M6 12h12" />
                  </svg>
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {[
            { to: '/', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
            { to: '/products', label: 'Shop', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
            { to: '/new-arrivals', label: 'New Arrivals', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
          ].map(item => (
            <Link key={item.to} to={item.to} onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/75 hover:text-white hover:bg-white/10 transition-all duration-150 text-sm font-medium">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              {item.label}
            </Link>
          ))}

          {isAuthenticated && user ? (
            <>
              <Link to="/my-orders" onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/75 hover:text-white hover:bg-white/10 transition-all duration-150 text-sm font-medium">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                My Orders
              </Link>
              <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/75 hover:text-white hover:bg-white/10 transition-all duration-150 text-sm font-medium">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                My Profile
              </Link>
            </>
          ) : (
            <>
              <Link to="/about" onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/75 hover:text-white hover:bg-white/10 transition-all duration-150 text-sm font-medium">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                About
              </Link>
              <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/75 hover:text-white hover:bg-white/10 transition-all duration-150 text-sm font-medium">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact
              </Link>
            </>
          )}

          {/* Wishlist & Cart in drawer */}
          <div className="border-t border-white/10 pt-2 my-2 space-y-0.5">
            <Link to="/wishlist" onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/75 hover:text-pink-400 hover:bg-pink-500/10 transition-all duration-150 text-sm font-medium">
              <FaHeart className="w-4 h-4 flex-shrink-0" />
              Wishlist
              {wishlistCount > 0 && (
                <span className="ml-auto bg-pink-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">{wishlistCount}</span>
              )}
            </Link>
            <Link to="/cart" onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/75 hover:text-blue-400 hover:bg-blue-400/10 transition-all duration-150 text-sm font-medium">
              <FaShoppingCart className="w-4 h-4 flex-shrink-0" />
              Cart
              {cartItemCount > 0 && (
                <span className="ml-auto bg-blue-400 text-[#082B27] text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">{cartItemCount}</span>
              )}
            </Link>
          </div>
        </nav>

        {/* Drawer footer */}
        <div className="px-5 py-4 border-t border-white/10">
          {isAuthenticated && user?.uid ? (
            <button onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-full border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          ) : (
            <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-full bg-yellow-400 hover:bg-yellow-300 text-[#082B27] font-semibold text-sm transition-colors">
              <FaUser size={13} />
              Login / Register
            </Link>
          )}
        </div>
      </div>
    </>
  );
};

export default Header;