import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <>
      <style>{`
        @keyframes pulse-gold {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.2); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 200%; }
        }
        .pulse-gold { animation: pulse-gold 2.5s ease-in-out infinite; }
        .pulse-gold-delay1 { animation: pulse-gold 2.5s ease-in-out infinite 0.8s; }
        .pulse-gold-delay2 { animation: pulse-gold 2.5s ease-in-out infinite 1.6s; }
        .fade-col-1 { animation: fadeInUp 0.6s ease 0.1s both; }
        .fade-col-2 { animation: fadeInUp 0.6s ease 0.2s both; }
        .fade-col-3 { animation: fadeInUp 0.6s ease 0.3s both; }
        .fade-col-4 { animation: fadeInUp 0.6s ease 0.4s both; }
        .footer-col-title::after {
          content: '';
          position: absolute;
          left: 0; bottom: 0;
          width: 24px; height: 1.5px;
          background: #eab308;
          border-radius: 2px;
          transition: width 0.3s ease;
        }
        .footer-col-title:hover::after { width: 42px; }
        .footer-link-arrow::before {
          content: '›';
          color: #eab308;
          opacity: 0;
          transform: translateX(-6px);
          transition: opacity 0.2s, transform 0.2s;
          margin-right: 0px;
          display: inline-block;
        }
        .footer-link-arrow:hover::before { opacity: 1; transform: translateX(0); margin-right: 4px; }
        .bottom-link::after {
          content: '';
          position: absolute;
          left: 0; bottom: -2px;
          width: 0; height: 1px;
          background: #eab308;
          transition: width 0.25s ease;
        }
        .bottom-link:hover::after { width: 100%; }
      `}</style>

      <footer className="bg-[#0a2424] text-white pt-14 pb-6">
        <div className="container mx-auto px-6">

          {/* ── Top ornament ── */}
          <div className="flex items-center gap-3 mb-10 opacity-30">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            <span className="text-[#eab308] text-sm pulse-gold">✦</span>
            <span className="text-[#eab308] text-base pulse-gold-delay1">❧</span>
            <span className="text-[#eab308] text-sm pulse-gold-delay2">✦</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-10">

            {/* ── Brand ── */}
            <div className="md:col-span-4 space-y-4 fade-col-1">
              <img
                src="niya-logo.webp" alt="Niya"
                className="h-14 w-auto object-contain"
                onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='block'; }}
              />
              <div className="text-2xl font-bold tracking-wide hidden">
                NIYA
                <span className="block text-xs font-normal text-gray-400 tracking-widest mt-0.5">by Yukitha Fashion Studio</span>
              </div>

              <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                Beautiful ethnic fashion wear for every woman. From everyday essentials to festive favourites, thoughtfully designed for you.
              </p>

              <div>
                <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em] mb-3 relative overflow-hidden inline-block">
                  Follow us
                </p>
                <div className="flex gap-3">
                  {/* Facebook */}
                  <a href="https://facebook.com/YOUR_PAGE" target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full border border-white/15 bg-white/4 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/50 hover:bg-[#1877f2] hover:-translate-y-1 hover:scale-110 transition-all duration-250">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                    </svg>
                  </a>
                  {/* Instagram */}
                  <a href="https://instagram.com/YOUR_HANDLE" target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full border border-white/15 bg-white/4 flex items-center justify-center text-gray-400 hover:text-white hover:border-transparent hover:bg-gradient-to-br hover:from-orange-400 hover:via-pink-500 hover:to-purple-500 hover:-translate-y-1 hover:scale-110 transition-all duration-250">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                      <circle cx="12" cy="12" r="4"/>
                      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
                    </svg>
                  </a>
                  {/* WhatsApp */}
                  <a href="https://wa.me/917094442031" target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full border border-white/15 bg-white/4 flex items-center justify-center text-gray-400 hover:text-white hover:border-transparent hover:bg-[#25d366] hover:-translate-y-1 hover:scale-110 transition-all duration-250">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* ── Shop ── */}
            <div className="md:col-span-2 md:col-start-6 fade-col-2">
              <h3 className="footer-col-title text-white text-[0.72rem] font-bold tracking-[0.14em] uppercase mb-[18px] relative pb-[10px]">Shop</h3>
              <ul className="space-y-3">
                {[
                  { to: '/collections', label: 'All Collections' },
                  { to: '/categories', label: 'Categories' },
                  { to: '/mom-and-daughter', label: 'Mom & Daughter' },
                  { to: '/plus-size', label: 'Plus Size' },
                ].map(l => (
                  <li key={l.to}>
                    <Link to={l.to} className="footer-link-arrow text-gray-400 hover:text-white text-sm transition-colors duration-200 inline-flex items-center">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* ── Help ── */}
            <div className="md:col-span-2 fade-col-3">
              <h3 className="footer-col-title text-white text-[0.72rem] font-bold tracking-[0.14em] uppercase mb-[18px] relative pb-[10px]">Help</h3>
              <ul className="space-y-3">
                {[
                  { to: '/size-guide', label: 'Size Guide' },
                  { to: '/shipping', label: 'Shipping & Returns' },
                  { to: '/faqs', label: 'FAQs' },
                  { to: '/contact', label: 'Contact Us' },
                ].map(l => (
                  <li key={l.to}>
                    <Link to={l.to} className="footer-link-arrow text-gray-400 hover:text-white text-sm transition-colors duration-200 inline-flex items-center">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* ── Get In Touch ── */}
            <div className="md:col-span-2 fade-col-4">
              <h3 className="footer-col-title text-white text-[0.72rem] font-bold tracking-[0.14em] uppercase mb-[18px] relative pb-[10px]">Get In Touch</h3>
              <ul className="space-y-3">
                <li>
                  <a href="https://wa.me/917094442031" target="_blank" rel="noopener noreferrer"
                    className="group flex items-center gap-2.5 text-gray-400 hover:text-white text-sm transition-all duration-200 hover:translate-x-1">
                    <span className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-white/10 group-hover:border-white/25 transition-all duration-200">
                      <svg className="w-3.5 h-3.5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                      </svg>
                    </span>
                    +91 70944 42031
                  </a>
                </li>
                <li className="flex items-center gap-2.5 text-gray-400 text-sm">
                  <span className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  </span>
                  Chennai, India
                </li>
                <li>
                  <a href="mailto:niya@example.com"
                    className="group flex items-center gap-2.5 text-gray-400 hover:text-white text-sm transition-all duration-200 hover:translate-x-1">
                    <span className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-white/10 group-hover:border-white/25 transition-all duration-200">
                      <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                    </span>
                    niya@example.com
                  </a>
                </li>
              </ul>
            </div>

          </div>

          {/* ── Bottom ornament ── */}
          <div className="flex items-center gap-3 mb-6 opacity-20">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            <span className="text-[#eab308] text-xs pulse-gold">✦</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          </div>

          {/* ── Bottom bar ── */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-gray-500 text-xs tracking-wide">
            <span>© {new Date().getFullYear()} Shop With Niya. All Rights Reserved.</span>
            <div className="flex items-center gap-4">
              <Link to="/privacy" className="bottom-link relative hover:text-white transition-colors">Privacy Policy</Link>
              <span className="text-gray-700">·</span>
              <Link to="/terms" className="bottom-link relative hover:text-white transition-colors">Terms</Link>
              <span className="text-gray-700">·</span>
              <span>Developed by <a href="#" className="bottom-link relative hover:text-white transition-colors">SBBS</a></span>
            </div>
          </div>

        </div>
      </footer>
    </>
  );
};

export default Footer;