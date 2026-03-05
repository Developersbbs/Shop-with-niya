import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { FaGoogle, FaPhone, FaEnvelope } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { 
  registerUser, 
  loginUser, 
  signInWithGoogle,
  clearError,
  setUser 
} from '../../redux/slices/authSlice';
import { sendOTP, verifyOTP, checkPhoneNumber, cleanupRecaptcha } from '../../services/authService';

/* ── Inject styles ── */
const STYLE_ID = 'auth-form-styles';
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');

    @keyframes authFadeIn {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes leafFloat {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      33%       { transform: translateY(-12px) rotate(3deg); }
      66%       { transform: translateY(-6px) rotate(-2deg); }
    }
    @keyframes shimmerMove {
      0%   { transform: translateX(-100%) rotate(45deg); }
      100% { transform: translateX(300%) rotate(45deg); }
    }
    .auth-card {
      animation: authFadeIn 0.7s cubic-bezier(0.22,1,0.36,1) both;
      font-family: 'DM Sans', sans-serif;
    }
    .auth-input {
      width: 100%;
      padding: 12px 16px 12px 44px;
      border-radius: 12px;
      border: 1.5px solid #d1e8e4;
      background: #f7faf9;
      font-size: 14px;
      font-family: 'DM Sans', sans-serif;
      color: #1a1a1a;
      transition: all 0.2s ease;
      outline: none;
    }
    .auth-input:focus {
      border-color: #082B27;
      background: #fff;
      box-shadow: 0 0 0 4px rgba(8,43,39,0.08);
    }
    .auth-input:hover:not(:focus) {
      border-color: #a8cec8;
    }
    .auth-input.error {
      border-color: #f87171;
      background: #fff5f5;
    }
    .auth-input.error:focus {
      box-shadow: 0 0 0 4px rgba(248,113,113,0.12);
    }
    .auth-input:disabled {
      background: #f0f0f0;
      color: #999;
      cursor: not-allowed;
    }
    .auth-btn-primary {
      position: relative;
      overflow: hidden;
      width: 100%;
      padding: 14px;
      border-radius: 14px;
      background: #082B27;
      color: white;
      font-weight: 600;
      font-size: 15px;
      font-family: 'DM Sans', sans-serif;
      border: none;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .auth-btn-primary::after {
      content: '';
      position: absolute;
      top: 0; left: 0;
      width: 40%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
      transform: translateX(-100%) rotate(45deg);
    }
    .auth-btn-primary:hover::after {
      animation: shimmerMove 0.6s ease forwards;
    }
    .auth-btn-primary:hover {
      background: #0d3d38;
      transform: translateY(-1px);
      box-shadow: 0 8px 24px rgba(8,43,39,0.3);
    }
    .auth-btn-primary:active { transform: scale(0.98); }
    .auth-btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
    .auth-tab {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px 16px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 500;
      font-family: 'DM Sans', sans-serif;
      border: none;
      cursor: pointer;
      transition: all 0.25s ease;
      background: transparent;
      color: #7a9e99;
    }
    .auth-tab.active {
      background: #082B27;
      color: white;
      box-shadow: 0 4px 14px rgba(8,43,39,0.25);
    }
    .auth-tab:not(.active):hover {
      background: rgba(8,43,39,0.06);
      color: #082B27;
    }
    .leaf-deco {
      animation: leafFloat 5s ease-in-out infinite;
    }
  `;
  document.head.appendChild(s);
}

/* ── Reusable input field ── */
const InputField = ({ icon, label, required, error, children, ...props }) => (
  <div>
    {label && (
      <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#082B27', opacity: 0.7 }}>
        {label} {required && <span style={{ color: '#e05555' }}>*</span>}
      </label>
    )}
    <div className="relative">
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none" style={{ color: '#082B27', opacity: 0.4 }}>
          {icon}
        </div>
      )}
      <input className={`auth-input ${error ? 'error' : ''}`} {...props} />
      {error && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <ExclamationCircleIcon className="h-4 w-4" style={{ color: '#f87171' }} />
        </div>
      )}
      {children}
    </div>
    {error && (
      <p className="mt-1.5 text-xs flex items-center gap-1" style={{ color: '#e05555' }}>
        <ExclamationCircleIcon className="h-3.5 w-3.5 flex-shrink-0" />
        {error}
      </p>
    )}
  </div>
);

/* ── Eye toggle icon ── */
const EyeIcon = ({ open }) => open ? (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
  </svg>
) : (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

/* ── Main component ── */
const AuthenticationForm = ({ isLogin = false }) => {
  const [authMethod, setAuthMethod] = useState('email');
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '',
    password: '', confirmPassword: '', phone: '', otp: ''
  });
  const [errors, setErrors] = useState({});
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(clearError());
    if (authMethod !== 'phone') {
      cleanupRecaptcha();
      setOtpSent(false);
      setConfirmationResult(null);
      setCountdown(0);
    }
  }, [dispatch, authMethod]);

  useEffect(() => () => cleanupRecaptcha(), []);

  useEffect(() => {
    let timer;
    if (countdown > 0) timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const validateForm = () => {
    const newErrors = {};
    if (authMethod === 'email') {
      if (!formData.email) newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Enter a valid email';
      if (!formData.password) newErrors.password = 'Password is required';
      else if (formData.password.length < 6) newErrors.password = 'Minimum 6 characters';
      if (!isLogin) {
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm password';
        else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
      }
    } else if (authMethod === 'phone') {
      if (!formData.phone) newErrors.phone = 'Phone number is required';
      else if (!/^\d{10}$/.test(formData.phone)) newErrors.phone = 'Enter a valid 10-digit number';
      if (otpSent && !formData.otp) newErrors.otp = 'OTP is required';
      if (!isLogin && !otpSent && !formData.firstName.trim()) newErrors.firstName = 'First name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      if (isLogin) {
        await dispatch(loginUser({ email: formData.email, password: formData.password })).unwrap();
        toast.success('Welcome back!');
      } else {
        await dispatch(registerUser({ email: formData.email, password: formData.password, displayName: `${formData.firstName} ${formData.lastName}`.trim() })).unwrap();
        toast.success('Account created!');
      }
      navigate('/');
    } catch (err) { toast.error(err || 'Authentication failed'); }
  };

  const handlePhoneAuth = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!otpSent) {
      try {
        const formattedPhone = formData.phone.startsWith('+') ? formData.phone : `+91${formData.phone}`;
        const phoneExists = await checkPhoneNumber(formattedPhone);
        if (isLogin && !phoneExists) { toast.error('Phone not registered. Please sign up.'); return; }
        if (!isLogin && phoneExists) { toast.error('Phone already registered. Please sign in.'); return; }
        cleanupRecaptcha();
        const result = await sendOTP(formattedPhone, 'recaptcha-container');
        if (result.success) {
          setConfirmationResult(result.confirmationResult);
          setOtpSent(true); setCountdown(60);
          toast.success('OTP sent!');
        } else throw new Error(result.error);
      } catch (err) { toast.error(err.message || 'Failed to send OTP'); }
    } else {
      try {
        const userName = isLogin ? 'User' : `${formData.firstName} ${formData.lastName}`.trim() || 'User';
        const result = await verifyOTP(formData.otp, userName);
        if (result.user) { dispatch(setUser(result.user)); toast.success('Verified!'); navigate('/'); }
        else throw new Error(result.error);
      } catch (err) { toast.error(err.message || 'OTP verification failed'); }
    }
  };

  const handleGoogleAuth = async () => {
    try {
      await dispatch(signInWithGoogle()).unwrap();
      toast.success('Signed in with Google!');
      navigate('/');
    } catch (err) { toast.error(err || 'Google sign-in failed'); }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    try {
      cleanupRecaptcha();
      const formattedPhone = formData.phone.startsWith('+') ? formData.phone : `+91${formData.phone}`;
      const result = await sendOTP(formattedPhone, 'recaptcha-container');
      if (result.success) { setConfirmationResult(result.confirmationResult); setCountdown(60); toast.success('OTP resent!'); }
      else throw new Error(result.error);
    } catch (err) { toast.error(err.message || 'Failed to resend OTP'); }
  };

  const resetForm = () => {
    setFormData({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '', phone: '', otp: '' });
    setErrors({}); setOtpSent(false); setCountdown(0); setConfirmationResult(null);
  };

  const switchAuthMethod = (method) => { setAuthMethod(method); resetForm(); dispatch(clearError()); };

  // Icons
  const EmailIcon = () => <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>;
  const LockIcon = () => <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
  const UserIcon = () => <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
  const PhoneIcon = () => <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
  const ShieldIcon = () => <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
  const SpinIcon = () => <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>;

  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4"
      style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #f7faf9 40%, #ecfdf5 100%)' }}
    >
      {/* Decorative background circles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10" style={{ background: '#082B27' }} />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full opacity-10" style={{ background: '#082B27' }} />
        <div className="leaf-deco absolute top-1/4 left-8 text-4xl opacity-20">🌿</div>
        <div className="leaf-deco absolute bottom-1/3 right-12 text-3xl opacity-15" style={{ animationDelay: '2s' }}>🍃</div>
      </div>

      <div className="auth-card relative w-full max-w-md">
        {/* Card */}
        <div
          className="relative bg-white rounded-3xl overflow-hidden"
          style={{ boxShadow: '0 24px 80px rgba(8,43,39,0.12), 0 4px 24px rgba(8,43,39,0.06)' }}
        >
          {/* Top accent bar */}
          <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #082B27, #1a6b5e, #082B27)' }} />

          <div className="px-8 py-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div
                className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
                style={{ background: '#082B27' }}
              >
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2
                className="text-3xl font-black mb-1"
                style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#082B27', letterSpacing: '-0.02em' }}
              >
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-sm" style={{ color: '#7a9e99' }}>
                {isLogin ? 'Sign in to your Niya account' : 'Join us for an elegant experience'}
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl border" style={{ background: '#fff5f5', borderColor: '#fca5a5' }}>
                <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#e05555' }} />
                <p className="text-sm" style={{ color: '#c53030' }}>{error}</p>
              </div>
            )}

            {/* Auth method tabs */}
            <div className="flex gap-2 p-1.5 rounded-2xl mb-6" style={{ background: '#f0fdf4' }}>
              <button type="button" className={`auth-tab ${authMethod === 'email' ? 'active' : ''}`} onClick={() => switchAuthMethod('email')}>
                <FaEnvelope className="text-xs" /> Email
              </button>
              <button type="button" className={`auth-tab ${authMethod === 'phone' ? 'active' : ''}`} onClick={() => switchAuthMethod('phone')}>
                <FaPhone className="text-xs" /> Phone
              </button>
            </div>

            {/* ── Email Form ── */}
            {authMethod === 'email' && (
              <form className="space-y-4" onSubmit={handleEmailAuth}>
                {!isLogin && (
                  <div className="grid grid-cols-2 gap-3">
                    <InputField label="First name" required error={errors.firstName} icon={<UserIcon />}
                      type="text" name="firstName" placeholder="First" value={formData.firstName} onChange={handleInputChange} />
                    <InputField label="Last name" icon={<UserIcon />}
                      type="text" name="lastName" placeholder="Last" value={formData.lastName} onChange={handleInputChange} />
                  </div>
                )}

                <InputField label="Email" required error={errors.email} icon={<EmailIcon />}
                  type="email" name="email" placeholder="you@example.com" value={formData.email} onChange={handleInputChange} />

                <InputField label="Password" required error={errors.password} icon={<LockIcon />}
                  type={showPassword ? 'text' : 'password'} name="password"
                  placeholder={isLogin ? 'Your password' : 'Min. 6 characters'}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  value={formData.password} onChange={handleInputChange}
                >
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center"
                    style={{ color: '#082B27', opacity: 0.4 }}>
                    <EyeIcon open={showPassword} />
                  </button>
                </InputField>

                {!isLogin && (
                  <InputField label="Confirm Password" required error={errors.confirmPassword} icon={<ShieldIcon />}
                    type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword"
                    placeholder="Repeat password" autoComplete="new-password"
                    value={formData.confirmPassword} onChange={handleInputChange}
                  >
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center"
                      style={{ color: '#082B27', opacity: 0.4 }}>
                      <EyeIcon open={showConfirmPassword} />
                    </button>
                  </InputField>
                )}

                <div className="pt-2">
                  <button type="submit" className="auth-btn-primary" disabled={loading}>
                    {loading ? <><SpinIcon />{isLogin ? 'Signing in…' : 'Creating account…'}</> : (isLogin ? 'Sign In' : 'Create Account')}
                  </button>
                </div>
              </form>
            )}

            {/* ── Phone Form ── */}
            {authMethod === 'phone' && (
              <form className="space-y-4" onSubmit={handlePhoneAuth}>
                {!isLogin && !otpSent && (
                  <div className="grid grid-cols-2 gap-3">
                    <InputField label="First name" required error={errors.firstName} icon={<UserIcon />}
                      type="text" name="firstName" placeholder="First" value={formData.firstName} onChange={handleInputChange} />
                    <InputField label="Last name" icon={<UserIcon />}
                      type="text" name="lastName" placeholder="Last" value={formData.lastName} onChange={handleInputChange} />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#082B27', opacity: 0.7 }}>
                    Phone Number <span style={{ color: '#e05555' }}>*</span>
                  </label>
                  <div className="relative flex items-center">
                    <span
                      className="absolute left-3.5 text-xs font-bold px-2 py-1 rounded-lg"
                      style={{ background: '#082B27', color: 'white', zIndex: 1 }}
                    >+91</span>
                    <input
                      type="tel" name="phone" placeholder="10-digit number"
                      disabled={otpSent}
                      className={`auth-input ${errors.phone ? 'error' : ''}`}
                      style={{ paddingLeft: '72px' }}
                      value={formData.phone} onChange={handleInputChange}
                    />
                    {otpSent && (
                      <div className="absolute right-3 flex items-center">
                        <svg className="h-4 w-4" style={{ color: '#16a34a' }} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {errors.phone && <p className="mt-1.5 text-xs flex items-center gap-1" style={{ color: '#e05555' }}><ExclamationCircleIcon className="h-3.5 w-3.5" />{errors.phone}</p>}
                </div>

                {otpSent && (
                  <div className="rounded-2xl p-4 border" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                    <p className="text-xs font-semibold mb-3 flex items-center gap-2" style={{ color: '#16a34a' }}>
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      OTP sent to +91 {formData.phone}
                    </p>
                    <InputField label="Enter OTP" required error={errors.otp} icon={<LockIcon />}
                      type="text" name="otp" placeholder="6-digit OTP" maxLength="6"
                      value={formData.otp} onChange={handleInputChange} />
                    <div className="flex justify-between items-center mt-3">
                      {countdown > 0
                        ? <p className="text-xs" style={{ color: '#7a9e99' }}>Resend in {countdown}s</p>
                        : <button type="button" onClick={handleResendOTP} disabled={loading}
                            className="text-xs font-semibold underline" style={{ color: '#082B27' }}>
                            Resend OTP
                          </button>
                      }
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button type="submit" className="auth-btn-primary" disabled={loading}>
                    {loading ? <><SpinIcon />{otpSent ? 'Verifying…' : 'Sending OTP…'}</> : (otpSent ? 'Verify OTP' : 'Send OTP')}
                  </button>
                </div>
              </form>
            )}

            {/* ── Divider ── */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: '#d1e8e4' }} />
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-white text-xs font-medium" style={{ color: '#a8cec8' }}>or continue with</span>
              </div>
            </div>

            {/* ── Google Button ── */}
            <button
              type="button" onClick={handleGoogleAuth} disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl border-2 font-semibold text-sm transition-all duration-200 hover:shadow-md"
              style={{
                borderColor: '#d1e8e4',
                color: '#082B27',
                background: 'white',
                fontFamily: 'DM Sans, sans-serif',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#082B27'; e.currentTarget.style.background = '#f7faf9'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1e8e4'; e.currentTarget.style.background = 'white'; }}
            >
              <FaGoogle className="text-red-500" />
              {isLogin ? 'Sign in with Google' : 'Sign up with Google'}
            </button>

            {/* ── Switch link ── */}
            <p className="text-center text-sm mt-6" style={{ color: '#7a9e99' }}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => navigate(isLogin ? '/register' : '/login')}
                className="font-bold underline underline-offset-2"
                style={{ color: '#082B27' }}
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>

        <div id="recaptcha-container" />
      </div>
    </div>
  );
};

export default AuthenticationForm;