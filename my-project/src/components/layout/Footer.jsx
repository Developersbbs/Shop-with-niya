import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <>
      <style>{`
        .footer-link {
          color: #9ca3af;
          font-size: 0.875rem;
          text-decoration: none;
          transition: color 0.2s, padding-left 0.2s;
          display: inline-block;
        }
        .footer-link:hover { color: #fff; padding-left: 6px; }

        .social-btn {
          width: 38px; height: 38px;
          border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,0.15);
          display: flex; align-items: center; justify-content: center;
          color: #9ca3af;
          text-decoration: none;
          transition: all 0.25s cubic-bezier(.4,0,.2,1);
          background: rgba(255,255,255,0.04);
        }
        .social-btn:hover { color: #fff; border-color: rgba(255,255,255,0.5); background: rgba(255,255,255,0.1); transform: translateY(-3px) scale(1.1); }
        .social-btn.instagram:hover { background: linear-gradient(135deg,#f97316,#ec4899,#8b5cf6); border-color: transparent; }
        .social-btn.facebook:hover { background: #1877f2; border-color: transparent; }
        .social-btn.whatsapp:hover { background: #25d366; border-color: transparent; }

        .footer-col-title {
          color: #fff;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          margin-bottom: 18px;
          position: relative;
          padding-bottom: 10px;
        }
        .footer-col-title::after {
          content: '';
          position: absolute;
          left: 0; bottom: 0;
          width: 24px; height: 1.5px;
          background: #eab308;
          border-radius: 2px;
        }
      `}</style>

      <footer style={{ backgroundColor: '#0a2424' }} className="text-white pt-14 pb-6">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-10">

            {/* Brand */}
            <div className="md:col-span-4 space-y-4">
              <img
                src="niya-logo.webp" alt="Niya"
                className="h-14 w-auto object-contain"
                onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='block'; }}
              />
              <div className="text-2xl font-bold tracking-wide" style={{ display: 'none' }}>
                NIYA
                <span className="block text-xs font-normal text-gray-400 tracking-widest mt-0.5">by Yukitha Fashion Studio</span>
              </div>

              <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                Beautiful ethnic fashion wear for every woman. From everyday essentials to festive favourites, thoughtfully designed for you.
              </p>

              <div>
                <p className="text-xs text-gray-600 uppercase tracking-widest mb-3">Follow us</p>
                <div className="flex gap-3">
                  <a href="https://facebook.com/YOUR_PAGE" target="_blank" rel="noopener noreferrer" className="social-btn facebook" title="Facebook">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                    </svg>
                  </a>
                  <a href="https://instagram.com/YOUR_HANDLE" target="_blank" rel="noopener noreferrer" className="social-btn instagram" title="Instagram">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                      <circle cx="12" cy="12" r="4"/>
                      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
                    </svg>
                  </a>
                  <a href="https://wa.me/917094442031" target="_blank" rel="noopener noreferrer" className="social-btn whatsapp" title="WhatsApp">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Shop */}
            <div className="md:col-span-2 md:col-start-6">
              <h3 className="footer-col-title">Shop</h3>
              <ul className="space-y-3">
                {[
                  { to: '/collections', label: 'All Collections' },
                  { to: '/categories', label: 'Categories' },
                  { to: '/mom-and-daughter', label: 'Mom & Daughter' },
                  { to: '/plus-size', label: 'Plus Size' },
                ].map(l => (
                  <li key={l.to}><Link to={l.to} className="footer-link">{l.label}</Link></li>
                ))}
              </ul>
            </div>

            {/* Help */}
            <div className="md:col-span-2">
              <h3 className="footer-col-title">Help</h3>
              <ul className="space-y-3">
                {[
                  { to: '/size-guide', label: 'Size Guide' },
                  { to: '/shipping', label: 'Shipping & Returns' },
                  { to: '/faqs', label: 'FAQs' },
                  { to: '/contact', label: 'Contact Us' },
                ].map(l => (
                  <li key={l.to}><Link to={l.to} className="footer-link">{l.label}</Link></li>
                ))}
              </ul>
            </div>

            {/* Get In Touch */}
            <div className="md:col-span-2">
              <h3 className="footer-col-title">Get In Touch</h3>
              <ul className="space-y-4">
                <li>
                  <a href="https://wa.me/917094442031" target="_blank" rel="noopener noreferrer"
                    className="flex items-start gap-2 text-gray-400 hover:text-white text-sm transition-colors group">
                    <svg className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                    </svg>
                    +91 70944 42031
                  </a>
                </li>
                <li className="flex items-start gap-2 text-gray-400 text-sm">
                  <svg className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  Chennai, India
                </li>
                <li>
                  <a href="mailto:niya@example.com"
                    className="flex items-start gap-2 text-gray-400 hover:text-white text-sm transition-colors group">
                    <svg className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    niya@example.com
                  </a>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom bar */}
          <div className="border-t pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-gray-500 text-xs" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <span>© {new Date().getFullYear()} Shop With Niya. All Rights Reserved.</span>
            <div className="flex items-center gap-4">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
              <span>Developed by <a href="#" className="hover:text-white transition-colors">SBBS</a></span>
            </div>
          </div>

        </div>
      </footer>
    </>
  );
};

export default Footer;