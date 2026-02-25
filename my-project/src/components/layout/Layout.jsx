import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const Layout = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className={`flex-grow ${!isHomePage ? 'container mx-auto px-4 py-6' : ''}`}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
