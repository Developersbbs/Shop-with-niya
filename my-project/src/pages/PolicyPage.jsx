import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';

const sections = {
  privacy: [
    {
      title: 'Information We Collect',
      content: [
        'We collect personal information such as your name, email address, phone number, and shipping address when you place an order or create an account.',
        'We also collect non-personal information such as browser type, device information, and browsing behaviour on our website to improve your experience.',
        'Payment information is processed securely through third-party payment gateways. We do not store your card or UPI details on our servers.',
      ],
    },
    {
      title: 'How We Use Your Information',
      content: [
        'To process and fulfil your orders, including sending order confirmations and shipping updates to your registered email.',
        'To improve our website, personalise your shopping experience, and send you updates about new collections and offers (only if you have opted in).',
        'We do not sell, trade, or share your personal information with third parties except as required to fulfil your order (e.g. courier partners).',
      ],
    },
    {
      title: 'Cookies',
      content: [
        'Our website uses cookies to enhance your browsing experience, remember your preferences, and analyse site traffic.',
        'You can choose to disable cookies through your browser settings, however this may affect some features of the website.',
      ],
    },
    {
      title: 'Data Security',
      content: [
        'We take reasonable measures to protect your personal information from unauthorised access, loss, or misuse.',
        'However, no method of transmission over the internet is 100% secure. We encourage you to keep your account credentials confidential.',
      ],
    },
    {
      title: 'Your Rights',
      content: [
        'You have the right to access, update, or delete your personal information at any time by contacting us at niya@example.com.',
        'You may also unsubscribe from our marketing emails at any time using the unsubscribe link in any email we send.',
      ],
    },
    {
      title: 'Changes to This Policy',
      content: [
        'We reserve the right to update this Privacy Policy at any time. Changes will be posted on this page with an updated date.',
        'By continuing to use our website after changes are made, you agree to the revised policy.',
      ],
    },
  ],
  terms: [
    {
      title: 'Shipping Policy',
      content: [
        'The production time for each product will be mentioned in the product description. Orders will be shipped based on the timeline mentioned.',
        'Once dispatched, domestic orders within India are delivered in 2–3 working days. International orders may take 6–12 days depending on the destination country.',
        'We use India Speed Post and DTDC to ship your orders. A tracking number will be shared to your registered email once your order is dispatched.',
        'We are not liable for delays caused by courier companies, but we will assist you in tracking your shipment through our partnering courier.',
      ],
    },
    {
      title: 'Cancellation Policy',
      content: [
        'Orders cannot be cancelled once placed. Once an order is confirmed, it is immediately moved into processing.',
        'Orders that are already dispatched cannot be cancelled under any circumstances.',
        'Customised, made-to-order, or sale items are strictly non-cancellable and non-refundable.',
      ],
    },
    {
      title: 'Refund Policy',
      content: [
        'We do not provide refunds to the original mode of payment under any circumstances.',
        'No cash refunds, bank refunds, or UPI refunds are offered.',
      ],
    },
    {
      title: 'Store Credit (If Applicable)',
      content: [
        'In rare cases where a cancellation is approved, the amount will be issued only as store credit.',
        'Store credit will be valid for 6 months and can be used for any future purchase on our website.',
        'Store credit is non-transferable and non-refundable.',
      ],
    },
    {
      title: 'Product Descriptions',
      content: [
        'We make every effort to display our products as accurately as possible. However, colours may vary slightly due to screen settings and lighting conditions during photography.',
        'All measurements and size guides are approximate. Please refer to the size chart before placing your order.',
      ],
    },
    {
      title: 'Intellectual Property',
      content: [
        'All content on this website including images, text, logos, and designs are the property of Shop With Niya and may not be reproduced without permission.',
      ],
    },
    {
      title: 'Governing Law',
      content: [
        'These terms and conditions are governed by the laws of India. Any disputes arising shall be subject to the jurisdiction of courts in Chennai, Tamil Nadu.',
      ],
    },
  ],
};

export default function PolicyPage() {
  const location = useLocation();
  const isPrivacy = location.pathname === '/privacy';
  const [activeTab, setActiveTab] = useState(isPrivacy ? 'privacy' : 'terms');

  useEffect(() => {
    setActiveTab(location.pathname === '/privacy' ? 'privacy' : 'terms');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  const currentSections = sections[activeTab];

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Jost:wght@300;400;500&display=swap');
      `}</style>

      {/* Header */}
{/* Header */}
<div style={{ background: '#1a3c2e' }} className="py-8 px-4">
  <div className="max-w-4xl mx-auto flex flex-col gap-1 justify-center items-center">
    <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 32 }} className="text-white font-semibold">
      {activeTab === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions'}
    </h1>
    <p style={{ fontFamily: "'Jost', sans-serif" }} className="text-white/30 text-xs">
      Last updated: March 2025
    </p>
  </div>
</div>

      {/* Tab switcher */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 flex">
          <Link
            to="/privacy"
            style={{ fontFamily: "'Jost', sans-serif" }}
            className={`flex-1 sm:flex-none px-8 py-4 text-sm font-medium tracking-widest uppercase text-center transition-all border-b-2 ${
              activeTab === 'privacy'
                ? 'border-[#1a3c2e] text-[#1a3c2e]'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Privacy Policy
          </Link>
          <Link
            to="/terms"
            style={{ fontFamily: "'Jost', sans-serif" }}
            className={`flex-1 sm:flex-none px-8 py-4 text-sm font-medium tracking-widest uppercase text-center transition-all border-b-2 ${
              activeTab === 'terms'
                ? 'border-[#1a3c2e] text-[#1a3c2e]'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Terms & Conditions
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">

        {/* Intro */}
        <div className="mb-12">
          <p style={{ fontFamily: "'Jost', sans-serif" }} className="text-gray-500 text-sm leading-relaxed max-w-2xl">
            {activeTab === 'privacy'
              ? 'At Shop With Niya, we are committed to protecting your privacy. This policy explains how we collect, use, and safeguard your personal information when you visit or make a purchase from our website.'
              : 'By accessing or shopping on Shop With Niya, you agree to the following terms and conditions. Please read them carefully before placing an order.'}
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {currentSections.map((section, index) => (
            <div key={index} className="border-b border-gray-100 pb-10 last:border-0">
              <div className="flex items-start gap-4 mb-5">
                <span
                  style={{ fontFamily: "'Cormorant Garamond', serif", background: '#1a3c2e' }}
                  className="text-white text-xs w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                >
                  {index + 1}
                </span>
                <h2
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  className="text-xl sm:text-2xl font-semibold text-[#1a1a1a] leading-snug"
                >
                  {section.title}
                </h2>
              </div>
              <div className="ml-11 space-y-3">
                {section.content.map((para, i) => (
                  <p
                    key={i}
                    style={{ fontFamily: "'Jost', sans-serif" }}
                    className="text-gray-500 text-sm leading-relaxed flex gap-3"
                  >
                    <span className="text-[#1a3c2e] mt-1.5 shrink-0">—</span>
                    {para}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-16 p-8 bg-white border border-gray-100 text-center">
          <p style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-2xl font-semibold text-[#1a3c2e] mb-2">
            Have Questions?
          </p>
          <p style={{ fontFamily: "'Jost', sans-serif" }} className="text-gray-400 text-sm mb-5">
            We're happy to help. Reach out to us anytime.
          </p>
          
           <a href="mailto:niya@example.com"
            style={{ fontFamily: "'Jost', sans-serif" }}
            className="inline-block px-8 py-3 bg-[#1a3c2e] text-white text-xs tracking-widest uppercase hover:bg-[#2d5a42] transition-colors"
          >
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
}