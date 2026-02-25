import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaUser, FaSearch, FaBars, FaTimes, FaHeart, FaChevronDown, FaTag } from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { userLogout, forceLogout } from '../../redux/slices/authSlice';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useGetCategoriesQuery } from '../../redux/services/categories';

const CategoriesMenu = () => {
  // Fetch up to 20 categories for the menu
  const { data: categoriesData, isLoading } = useGetCategoriesQuery({ limit: 20 });
  const categories = categoriesData?.data || [];

  if (isLoading) {
    return (
      <div className="space-y-2 p-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-8 bg-gray-100 rounded animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (categories.length === 0) {
    return <div className="p-4 text-sm text-gray-500 text-center">No categories found</div>;
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

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Use new Context-based cart and wishlist
  const { itemCount: cartItemCount } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const { isAuthenticated, user, backendUser, backendUserLoading, loading } = useSelector((state) => state.auth);

  // Debug authentication state
  useEffect(() => {
    console.log('Header: Auth state changed', {
      isAuthenticated,
      user: user?.uid,
      loading,
      backendUserLoading,
      backendUser: backendUser?.name,
      backendUserImage: backendUser?.image_url,
      firebasePhotoURL: user?.photoURL
    });
  }, [isAuthenticated, user, loading, backendUserLoading, backendUser]);

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
      console.log('Header: Logout initiated');

      // Signal that this is a real logout
      window.dispatchEvent(new CustomEvent('auth:logout'));

      // Force logout immediately to update UI
      dispatch(forceLogout());

      // Clear localStorage immediately
      if (typeof window !== 'undefined') {
        const authKeys = [
          'sbbs_auth',
          'sbbs_user',
          'sbbs_token',
          'firebase_auth_token',
          'firebase_user',
          'auth_token',
          'user_data',
          'authToken'
        ];

        authKeys.forEach(key => {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        });
      }

      // Dispatch async logout action (for Firebase cleanup)
      dispatch(userLogout());

      // Redirect to login immediately
      navigate('/login');

    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails, force logout and redirect
      dispatch(forceLogout());
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      navigate('/login');
    }
  };

  // Toggle dropdown when clicking the profile button
  const toggleDropdown = (e) => {
    e.stopPropagation();
    setIsProfileDropdownOpen(prev => !prev);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isProfileDropdownOpen) {
        const dropdown = document.querySelector('.profile-dropdown');
        const button = document.getElementById('profile-button');

        if (dropdown && !dropdown.contains(e.target) && button && !button.contains(e.target)) {
          setIsProfileDropdownOpen(false);
        }
      }
    };

    // Use a slight delay to prevent immediate closing
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

  return (
    <header className="bg-[#082B27] backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-gray-100">
      <div className="container mx-auto px-4 py-4 text-lg">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            
             <img src='niya-logo.webp' className='w-40 h-auto object-contain'/>
           
 
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link to="/" className="px-4 py-2 rounded-lg text-white hover:underline hover:decoration-yellow-400 hover:underline-offset-4 transition-all duration-200 font-medium">
              Home
            </Link>

            {/* Categories Dropdown */}
            <div className="relative group">
              <button className="flex items-center px-4 py-2 rounded-lg text-white hover:underline hover:decoration-yellow-400 hover:underline-offset-4 transition-all duration-200 font-medium cursor-pointer">
                Categories
                <svg className="w-4 h-4 ml-1 transform group-hover:rotate-180 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform group-hover:translate-y-0 translate-y-2 z-50">
                <div className="p-2">
                  <div className="max-h-96 overflow-y-auto custom-scrollbar">
                    <CategoriesMenu />
                  </div>
                  <div className="border-t border-gray-100 mt-2 pt-2">
                    <Link to="/products" className="block px-4 py-2 text-sm text-center font-medium  rounded-lg transition-colors">
                      View All Products
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <Link to="/products" className="px-4 py-2 rounded-lg text-white hover:underline hover:decoration-yellow-400 hover:underline-offset-4 transition-all duration-200 font-medium">
              Shop
            </Link>
            {isAuthenticated && user ? (
              <>
                <Link to="/my-orders" className="px-4 py-2 rounded-lg text-white hover:underline hover:decoration-yellow-400 hover:underline-offset-4 transition-all duration-200 font-medium">
                  My Orders
                </Link>
              </>
            ) : (
              <>
                <Link to="/about" className="px-4 py-2 rounded-lg text-white hover:underline hover:decoration-yellow-400 hover:underline-offset-4 transition-all duration-200 font-medium">
                  About
                </Link>
                <Link to="/contact" className="px-4 py-2 rounded-lg text-white hover:underline hover:decoration-yellow-400 hover:underline-offset-4 transition-all duration-200 font-medium">
                  Contact
                </Link>
              </>
            )}
          </nav>

          {/* Search, Cart, and Auth */}
          <div className="hidden md:flex items-center space-x-4">
            <form onSubmit={handleSearch} className="relative">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="pl-10 pr-12 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 w-100 bg-gray-50 hover:bg-white transition-all duration-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <FaSearch className="w-4 h-4" />
                </div>
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M6 12h12" />
                  </svg>
                </button>
              </div>
            </form>

            <div className="flex items-center space-x-4">
              <Link to="/wishlist" className="relative p-3 rounded-xl bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-600 transition-all duration-200 group" title="Wishlist">
                <FaHeart className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg animate-pulse">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              <Link to="/cart" className="relative p-3 rounded-xl bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-all duration-200 group" title="Cart">
                <FaShoppingCart className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg animate-pulse">
                    {cartItemCount}
                  </span>
                )}
              </Link>
            </div>

            {loading || backendUserLoading ? (
              <div className="flex items-center space-x-1 text-gray-700">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-400"></div>
                <span className="hidden lg:inline text-sm">Loading...</span>
              </div>
            ) : isAuthenticated && user && user.uid ? (
              <div className="relative">
                <button
                  id="profile-button"
                  className="flex items-center space-x-1 text-gray-700 hover:text-primary"
                  onClick={toggleDropdown}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                    {(() => {
                      console.log('Header: Rendering profile photo', {
                        backendUserImage: backendUser?.image_url,
                        firebasePhotoURL: user?.photoURL,
                        displayName: user?.displayName
                      });

                      if (backendUser?.image_url) {
                        console.log('Header: Using backend user image:', backendUser.image_url);
                        return (
                          <img
                            src={backendUser.image_url}
                            alt={backendUser.name || user.displayName || 'User'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                              const nextSibling = e.target.nextElementSibling;
                              if (nextSibling && nextSibling.style) {
                                nextSibling.style.display = 'flex';
                              }
                            }}
                          />
                        );
                      } else if (user?.photoURL) {
                        console.log('Header: Using Firebase photo URL:', user.photoURL);
                        return (
                          <img
                            src={user.photoURL}
                            alt={user.displayName || 'User'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                              const nextSibling = e.target.nextElementSibling;
                              if (nextSibling && nextSibling.style) {
                                nextSibling.style.display = 'flex';
                              }
                            }}
                          />
                        );
                      } else if (user?.displayName) {
                        console.log('Header: Using display name initials');
                        return (
                          <div
                            className="w-full h-full flex items-center justify-center text-white font-medium"
                            style={{
                              backgroundColor: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`
                            }}
                          >
                            {user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                          </div>
                        );
                      } else {
                        console.log('Header: Using fallback icon');
                        return (
                          <div className="w-full h-full flex items-center justify-center bg-gray-300">
                            <FaUser size={14} className="text-white" />
                          </div>
                        );
                      }
                    })()}
                  </div>
                  <span className="hidden lg:inline">
                    {user?.displayName?.split(' ')[0] ||
                      user?.name?.split(' ')[0] ||
                      (user?.email ? user.email.split('@')[0].split('.')[0] :
                        (user?.phoneNumber ? `+${user.phoneNumber.slice(-10)}` : 'Account'))}
                  </span>
                </button>

                {/* Dropdown Menu */}
                <div
                  className={`profile-dropdown absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 transition-all duration-200 ${isProfileDropdownOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
                    }`}
                >
                  <div className="px-4 py-2 border-b">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.displayName || user?.name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.email || user?.phoneNumber || 'No contact info'}
                    </p>
                  </div>
                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                    onClick={() => setIsProfileDropdownOpen(false)}
                  >
                    <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    My Profile
                  </Link>
                  <Link
                    to="/my-orders"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                    onClick={() => setIsProfileDropdownOpen(false)}
                  >
                    <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    My Orders
                  </Link>
                  <Link
                    to="/wishlist"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                    onClick={() => setIsProfileDropdownOpen(false)}
                  >
                    <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    My Wishlist
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                    onClick={() => setIsProfileDropdownOpen(false)}
                  >
                    <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </Link>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                  >
                    <svg className="w-4 h-4 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center space-x-1 text-white hover:text-primary"
              >
                <FaUser size={18} />
                <span className="hidden lg:inline">Login</span>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-gray-700"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200 ">
            <form onSubmit={handleSearch} className="my-4 relative">
              <input
                type="text"
                placeholder="Search products..."
                className="w-full px-4 py-2 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-primary"
              >
                <FaSearch />
              </button>
            </form>

            <nav className="flex flex-col space-y-2">
              <Link
                to="/"
                className="px-3 py-2 hover:bg-gray-100 rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/products"
                className="px-3 py-2 hover:bg-gray-100 rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Shop
              </Link>
              {isAuthenticated && user ? (
                <>
                  <Link
                    to="/my-orders"
                    className="px-3 py-2 hover:bg-gray-100 rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    My Orders
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/about"
                    className="px-3 py-2 hover:bg-gray-100 rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    About
                  </Link>
                  <Link
                    to="/contact"
                    className="px-3 py-2 hover:bg-gray-100 rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Contact
                  </Link>
                </>
              )}
              {loading || backendUserLoading ? (
                <div className="flex items-center px-3 py-2 text-gray-700">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-400 mr-2"></div>
                  <span className="text-sm">Loading...</span>
                </div>
              ) : isAuthenticated && user && user.uid ? (
                <>
                  <Link
                    to="/profile"
                    className="px-3 py-2 hover:bg-gray-100 rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    to="/orders"
                    className="px-3 py-2 hover:bg-gray-100 rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    My Orders
                  </Link>
                  <Link
                    to="/wishlist"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    <FaHeart className="mr-3 h-5 w-5 text-gray-400" />
                    Wishlist
                    {wishlistCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {wishlistCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    to="/cart"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    <FaShoppingCart className="mr-3 h-5 w-5 text-gray-400" />
                    Cart
                    {cartItemCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {cartItemCount}
                      </span>
                    )}
                  </Link>
                  <button
                    onClick={async () => {
                      setIsMobileMenuOpen(false);
                      await handleLogout();
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="px-3 py-2 hover:bg-gray-100 rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login / Register
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
