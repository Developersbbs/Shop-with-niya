import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer style={{ backgroundColor: '#0d2e2e' }} className="text-white pt-14 pb-6 mt-2">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-10">

          {/* Brand Column */}
          <div className="space-y-4">
            <div className="text-2xl font-bold tracking-wide text-white">
              NIYA
              <span className="block text-xs font-normal text-gray-400 tracking-widest">by Yukitha Fashion Studio</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Beautiful ethnic fashion wear for every woman. From everyday essentials to festive favourites, thoughtfully designed for you.
            </p>

            {/* Social Icons */}
            <div className="flex gap-3 pt-2">
              {/* Facebook */}
              
              <a  href="https://facebook.com/YOUR_PAGE"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-gray-600 flex items-center justify-center text-gray-400 hover:text-white hover:border-white transition-colors duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </a>

              {/* Instagram */}
              
              <a  href="https://instagram.com/YOUR_HANDLE"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-gray-600 flex items-center justify-center text-gray-400 hover:text-white hover:border-white transition-colors duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <circle cx="12" cy="12" r="4"/>
                  <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
                </svg>
              </a>

              {/* WhatsApp */}
              
               <a href="https://wa.me/917094442031"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-gray-600 flex items-center justify-center text-gray-400 hover:text-white hover:border-white transition-colors duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Shop Column */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-widest mb-5">Shop</h3>
            <ul className="space-y-3">
              <li><Link to="/collections" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">All Collections</Link></li>
              <li><Link to="/categories" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">Categories</Link></li>
              <li><Link to="/mom-and-daughter" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">Mom & Daughter</Link></li>
              <li><Link to="/plus-size" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">Plus Size</Link></li>
            </ul>
          </div>

          {/* Help Column */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-widest mb-5">Help</h3>
            <ul className="space-y-3">
              <li><Link to="/size-guide" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">Size Guide</Link></li>
              <li><Link to="/shipping" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">Shipping & Returns</Link></li>
              <li><Link to="/faqs" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">FAQs</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">Contact Us</Link></li>
            </ul>
          </div>

          {/* Get In Touch Column */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-widest mb-5">Get In Touch</h3>
            <ul className="space-y-3">
              <li>
                <a href="https://wa.me/917094442031" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors duration-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                  </svg>
                  +91 70944 42031
                </a>
              </li>
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                Chennai.
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 pt-6 text-center text-gray-500 text-xs">
          © {new Date().getFullYear()} Shop With Niya. All Rights Reserved. || Developed by{' '}
          <a href="#" className="hover:text-white transition-colors duration-200">SBBS</a>.
        </div>
      </div>
    </footer>
  );
};

export default Footer;