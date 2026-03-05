import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCartIcon, HeartIcon } from '@heroicons/react/24/outline';
import LoginPromptModal from './LoginPromptModal';

const UnauthenticatedEmptyState = ({ 
  type = 'cart',
  className = '' 
}) => {
  const [showLoginModal, setShowLoginModal] = useState(false);

  const isCart = type === 'cart';
  const Icon = isCart ? ShoppingCartIcon : HeartIcon;

  const content = {
    cart: {
      title: 'Your cart awaits!',
      subtitle: 'Sign in to save items and checkout securely',
      benefits: [
        'Save items across devices',
        'Faster checkout process',
        'Order history and tracking',
        'Exclusive member discounts'
      ]
    },
    wishlist: {
      title: 'Save items you love!',
      subtitle: 'Sign in to create your personal wishlist',
      benefits: [
        'Save unlimited items',
        'Get price drop alerts',
        'Share with friends',
        'Quick add to cart'
      ]
    }
  };

  const currentContent = content[type];

  return (
    <>
      {/* Full-width background section */}
      <div
        className={`w-full relative overflow-hidden py-20 flex items-center justify-center ${className}`}
        style={{ background: 'linear-gradient(135deg, #f0faf4 0%, #e8f5ed 50%, #f5faf7 100%)' }}
      >
        {/* Decorative blobs */}
        <div
          className="absolute bottom-[-60px] left-[-60px] w-52 h-52 rounded-full opacity-20 pointer-events-none"
          style={{ background: '#1a3a2a' }}
        />
        <div
          className="absolute top-[-40px] right-[-40px] w-40 h-40 rounded-full opacity-10 pointer-events-none"
          style={{ background: '#1a3a2a' }}
        />
        <svg
          className="absolute top-10 left-10 opacity-20 pointer-events-none"
          width="40" height="40" viewBox="0 0 40 40" fill="none"
        >
          <path d="M5 35C5 35 10 10 35 5C35 5 30 30 5 35Z" fill="#1a3a2a" />
        </svg>
        <svg
          className="absolute bottom-10 right-14 opacity-15 pointer-events-none"
          width="28" height="28" viewBox="0 0 40 40" fill="none"
        >
          <path d="M5 35C5 35 10 10 35 5C35 5 30 30 5 35Z" fill="#1a3a2a" />
        </svg>

        {/* Card */}
        <div className="relative z-10 w-full max-w-sm mx-auto bg-white rounded-2xl shadow-lg px-8 py-10">

          {/* Icon bubble */}
          <div className="flex justify-center mb-5">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center"
              style={{ background: '#1a3a2a' }}
            >
              <Icon className="w-7 h-7 text-white" />
            </div>
          </div>

          {/* Title */}
          <h2
            className="text-2xl font-bold text-center mb-1"
            style={{ fontFamily: "'Georgia', serif", color: '#1a1a1a' }}
          >
            {currentContent.title}
          </h2>

          {/* Subtitle */}
          <p className="text-center text-sm text-gray-500 mb-7">
            {currentContent.subtitle}
          </p>

          {/* Benefits */}
          <div className="rounded-xl p-4 mb-7" style={{ background: '#f0faf4' }}>
            <ul className="space-y-2">
              {currentContent.benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: '#1a3a2a' }}
                  />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          {/* Sign In button */}
          <button
            onClick={() => setShowLoginModal(true)}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90 active:scale-95 mb-4"
            style={{ background: '#1a3a2a' }}
          >
            Sign In to Continue
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 border-t border-gray-200" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          {/* Continue Shopping */}
          <Link
            to="/products"
            className="w-full py-3 rounded-xl text-sm font-semibold text-center block transition-colors border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            Continue Shopping
          </Link>

          {/* Register link */}
          <p className="text-center text-xs text-gray-500 mt-6">
            New to Niya?{' '}
            <Link
              to="/register"
              className="font-semibold hover:underline"
              style={{ color: '#1a3a2a' }}
            >
              Create a free account →
            </Link>
          </p>
        </div>
      </div>

      <LoginPromptModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title={`Sign in to access your ${type}`}
        message={`Please sign in to save items to your ${type} and access them from any device.`}
        feature={type}
        showBenefits={true}
      />
    </>
  );
};

export default UnauthenticatedEmptyState;