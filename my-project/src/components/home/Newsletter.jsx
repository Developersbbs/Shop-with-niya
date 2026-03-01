import React, { useState } from 'react';

const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
      setEmail('');
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');
        @keyframes gentleFloat {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-8px); }
        }
        .nl-float { animation: gentleFloat 4s ease-in-out infinite; }
        .nl-float-delay { animation: gentleFloat 4s ease-in-out 1.5s infinite; }
      `}</style>

      <section className="py-20 bg-[#082B27] relative overflow-hidden">

        {/* Decorative floating circles */}
        <div className="nl-float absolute top-8 left-10 w-20 h-20 rounded-full border border-white/10" />
        <div className="nl-float-delay absolute bottom-8 right-16 w-32 h-32 rounded-full border border-white/10" />
        <div className="nl-float absolute top-1/2 right-8 w-10 h-10 rounded-full bg-yellow-400/10" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl mx-auto text-center">

            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-yellow-400/10 border border-yellow-400/20
                            flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>

            <span className="text-xs font-bold uppercase tracking-widest text-white/40">
              Stay Updated
            </span>

            <h2
              className="text-4xl md:text-5xl font-black text-white mt-2 mb-3"
              style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
            >
              Get Exclusive{' '}
              <span className="text-yellow-400">Offers</span>
            </h2>

            <p className="text-white/50 text-sm mb-8 leading-relaxed">
              Subscribe to get early access to new collections, exclusive deals,
              and style tips — straight to your inbox.
            </p>

            {submitted ? (
              <div className="flex items-center justify-center gap-3 py-4">
                <div className="w-10 h-10 rounded-full bg-yellow-400/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-white font-semibold">You're in! Welcome to the Niya family 🎉</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}
                    className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  required
                  placeholder="Enter your email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="flex-1 px-5 py-3.5 rounded-full bg-white/10 border border-white/20
                             text-white placeholder-white/35 text-sm outline-none
                             focus:border-yellow-400 focus:bg-white/15 transition-all duration-200"
                />
                <button
                  type="submit"
                  className="px-7 py-3.5 rounded-full bg-yellow-400 hover:bg-yellow-300
                             text-[#082B27] font-black text-sm transition-all duration-300
                             hover:scale-105 active:scale-95 whitespace-nowrap"
                >
                  Subscribe
                </button>
              </form>
            )}



          </div>
        </div>
      </section>
    </>
  );
};

export default Newsletter;