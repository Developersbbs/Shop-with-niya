import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, Navigate, useLocation } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { uploadProfilePhoto } from '../services/storageService';
import orderService from '../services/orderService';
import addressService from '../services/addressService';

const STYLE_ID = 'profile-v2-styles';
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');
    .pp { font-family: 'DM Sans', sans-serif; }
    @keyframes pp-in { from{opacity:0;transform:translateY(24px) scale(0.98)} to{opacity:1;transform:translateY(0) scale(1)} }
    @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
    .pp-fade { animation: pp-in 0.55s cubic-bezier(0.22,1,0.36,1) both; }
    .pp-shimmer { background:linear-gradient(90deg,#f0f0f0 25%,#e4e4e4 50%,#f0f0f0 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; border-radius:12px; }
    .pp-input {
      width:100%; padding:12px 16px; border-radius:12px;
      border:1.5px solid #d1e8e4; background:#f7faf9;
      font-size:14px; font-family:'DM Sans',sans-serif; color:#111;
      transition:all 0.2s; outline:none; box-sizing:border-box;
    }
    .pp-input:focus { border-color:#082B27; background:#fff; box-shadow:0 0 0 4px rgba(8,43,39,0.07); }
    .pp-input:hover:not(:focus) { border-color:#a8cec8; }
    .pp-input:disabled { background:#f0f0f0; color:#aaa; cursor:not-allowed; }
    select.pp-input { cursor:pointer; }
    .pp-label { display:block; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:#082B27; opacity:0.55; margin-bottom:6px; }
    .pp-primary {
      display:inline-flex; align-items:center; justify-content:center; gap:7px;
      padding:11px 22px; border-radius:12px; background:#082B27;
      color:#fff; font-weight:600; font-size:14px; font-family:'DM Sans',sans-serif;
      border:none; cursor:pointer; transition:all 0.25s;
    }
    .pp-primary:hover { background:#0d3d38; transform:translateY(-1px); box-shadow:0 8px 24px rgba(8,43,39,0.25); }
    .pp-primary:active { transform:scale(0.97); }
    .pp-primary:disabled { opacity:0.5; cursor:not-allowed; transform:none; box-shadow:none; }
    .pp-ghost {
      display:inline-flex; align-items:center; justify-content:center; gap:7px;
      padding:11px 22px; border-radius:12px;
      border:1.5px solid #d1e8e4; background:#fff;
      color:#082B27; font-weight:500; font-size:14px; font-family:'DM Sans',sans-serif;
      cursor:pointer; transition:all 0.2s;
    }
    .pp-ghost:hover { border-color:#082B27; background:#f7faf9; }
    .pp-ghost:disabled { opacity:0.5; cursor:not-allowed; }
    .pp-tab {
      padding:14px 22px; font-size:13px; font-weight:500;
      font-family:'DM Sans',sans-serif; border:none; background:transparent;
      cursor:pointer; color:#94b5b0; border-bottom:2px solid transparent;
      transition:all 0.2s; white-space:nowrap; display:flex; align-items:center; gap:6px;
    }
    .pp-tab.active { color:#082B27; border-bottom-color:#082B27; font-weight:700; }
    .pp-tab:hover:not(.active) { color:#082B27; background:#f7faf9; }
    .pp-status {
      display:inline-flex; align-items:center; gap:5px;
      padding:4px 12px; border-radius:99px;
      font-size:11px; font-weight:700; text-transform:capitalize; letter-spacing:0.03em;
    }
    .pp-order-card {
      display:flex; align-items:center; justify-content:space-between;
      padding:16px 20px; border-radius:16px; border:1.5px solid #e8f4f1;
      background:#fff; transition:all 0.2s; cursor:pointer;
    }
    .pp-order-card:hover { border-color:#082B27; box-shadow:0 4px 20px rgba(8,43,39,0.08); transform:translateY(-1px); }
    .pp-addr-card {
      padding:20px; border-radius:16px; border:1.5px solid #e8f4f1;
      background:#fff; transition:all 0.25s; position:relative;
    }
    .pp-addr-card.default { border-color:#082B27; background:linear-gradient(135deg,#f7faf9,#f0fdf8); }
    .pp-addr-card:hover { box-shadow:0 4px 20px rgba(8,43,39,0.08); }
    .pp-info-row {
      display:flex; padding:14px 20px; align-items:flex-start; gap:16px;
      border-bottom:1px solid #f0f7f5; transition:background 0.15s;
    }
    .pp-info-row:last-child { border-bottom:none; }
    .pp-info-row:hover { background:#fafcfb; }
    .pp-check {
      width:18px; height:18px; border-radius:6px; border:1.5px solid #d1e8e4;
      display:flex; align-items:center; justify-content:center;
      cursor:pointer; transition:all 0.2s; flex-shrink:0;
    }
    .pp-check.checked { background:#082B27; border-color:#082B27; }
  `;
  document.head.appendChild(s);
}

const STATUS_STYLES = {
  delivered:  { bg:'#dcfce7', color:'#166534', dot:'#16a34a' },
  shipped:    { bg:'#dbeafe', color:'#1e40af', dot:'#3b82f6' },
  processing: { bg:'#fef9c3', color:'#854d0e', dot:'#ca8a04' },
  cancelled:  { bg:'#fee2e2', color:'#991b1b', dot:'#ef4444' },
  default:    { bg:'#f3f4f6', color:'#374151', dot:'#9ca3af' },
};

/* ── tiny reusable field ── */
const Field = ({ label, error, children }) => (
  <div>
    {label && <label className="pp-label">{label}</label>}
    {children}
    {error && <p style={{ color:'#e05555', fontSize:12, marginTop:5 }}>{error}</p>}
  </div>
);

const Spinner = () => (
  <svg className="animate-spin" style={{ width:16, height:16 }} fill="none" viewBox="0 0 24 24">
    <circle style={{ opacity:0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
    <path style={{ opacity:0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
  </svg>
);

export default function ProfilePage() {
  const [activeTab, setActiveTab]               = useState('profile');
  const [isPageLoading, setIsPageLoading]       = useState(true);
  const [isSaving, setIsSaving]                 = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError]                       = useState(null);
  const [authChecked, setAuthChecked]           = useState(false);
  const { loading: authLoading }                = useSelector(s => s.auth);

  const [userData, setUserData] = useState({ firstName:'', lastName:'', email:'', phone:'', address:'', avatar:'https://via.placeholder.com/150', memberSince:'' });
  const [isEditing, setIsEditing]               = useState(false);
  const [formData, setFormData]                 = useState({ ...userData });
  const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);

  const [orders, setOrders]                   = useState([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);

  const [addresses, setAddresses]                   = useState([]);
  const [isAddressesLoading, setIsAddressesLoading] = useState(false);
  const [showAddressModal, setShowAddressModal]     = useState(false);
  const [editingAddress, setEditingAddress]         = useState(null);

  const emptyAddrForm = { type:'Home', firstName:'', lastName:'', email:'', phone:'', street:'', city:'', state:'', zipCode:'', country:'India', is_default:false };
  const [addressForm, setAddressForm] = useState(emptyAddrForm);

  const navigate = useNavigate();
  const location = useLocation();
  const auth     = getAuth();

  /* ── fetch profile ── */
  const fetchUserData = useCallback(async () => {
    if (!authChecked || authLoading) return;
    setIsPageLoading(true); setError(null);
    try {
      const cu = auth.currentUser;
      if (!cu) { setError('Please sign in'); setIsPageLoading(false); return; }
      const res  = await fetch(`http://localhost:5000/api/auth/profile/${cu.uid}`);
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed'); }
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed');
      const d = result.data;
      const fmt = {
        firstName: d.name?.split(' ')[0] || '',
        lastName:  d.name?.split(' ').slice(1).join(' ') || '',
        email:     d.email   || '',
        phone:     d.phone   || '',
        address:   d.address || '',
        avatar:    d.image_url || 'https://via.placeholder.com/150',
        memberSince: d.created_at ? new Date(d.created_at).toLocaleDateString('en-US',{ year:'numeric', month:'long' }) : 'N/A',
      };
      setUserData(fmt); setFormData(fmt);
    } catch(e) { setError('Failed to load profile data. Please try again.'); }
    finally { setIsPageLoading(false); }
  }, [authChecked, authLoading, auth]);

  /* ── fetch orders ── */
  const fetchUserOrders = useCallback(async () => {
    const cu = auth.currentUser; if (!cu) return;
    setIsOrdersLoading(true);
    try {
      const res = await orderService.getMyOrders(cu.uid);
      setOrders(Array.isArray(res) ? res : []);
    } catch { setOrders([]); toast.error('Failed to load orders'); }
    finally { setIsOrdersLoading(false); }
  }, [auth]);

  /* ── fetch addresses ── */
  const fetchUserAddresses = useCallback(async () => {
    const cu = auth.currentUser; if (!cu) return;
    setIsAddressesLoading(true);
    try {
      const res = await addressService.getAddresses();
      setAddresses(res.success ? (res.data || []) : []);
      if (!res.success) toast.error('Failed to load addresses');
    } catch { setAddresses([]); toast.error('Failed to load addresses'); }
    finally { setIsAddressesLoading(false); }
  }, [auth]);

  /* ── address CRUD ── */
  const handleAddAddress = () => { setEditingAddress(null); setAddressForm(emptyAddrForm); setShowAddressModal(true); };

  const handleEditAddress = (a) => {
    setEditingAddress(a);
    setAddressForm({ type:a.type||'Home', firstName:a.firstName||'', lastName:a.lastName||'', email:a.email||'', phone:a.phone||'', street:a.street||'', city:a.city||'', state:a.state||'', zipCode:a.zipCode||'', country:a.country||'India', is_default:a.is_default||false });
    setShowAddressModal(true);
  };

  const handleSaveAddress = async () => {
    const f = addressForm;
    if (!f.firstName.trim()||!f.lastName.trim()||!f.email.trim()||!f.phone.trim()||!f.street.trim()||!f.city.trim()||!f.state.trim()||!f.zipCode.trim()) {
      toast.error('Please fill all required fields'); return;
    }
    try {
      const payload = { type:f.type, firstName:f.firstName, lastName:f.lastName, email:f.email, phone:f.phone, street:f.street, city:f.city, state:f.state, zipCode:f.zipCode, country:f.country, is_default:f.is_default||false };
      const res = editingAddress ? await addressService.updateAddress(editingAddress._id, payload) : await addressService.createAddress(payload);
      if (res.success) {
        setShowAddressModal(false); setEditingAddress(null); setAddressForm(emptyAddrForm);
        toast.success(editingAddress ? 'Address updated!' : 'Address added!');
        await fetchUserAddresses();
      } else throw new Error(res.error || 'Failed to save');
    } catch { toast.error('Failed to save address.'); }
  };

  const handleDeleteAddress = async (a) => {
    if (!confirm('Delete this address?')) return;
    try {
      const res = await addressService.deleteAddress(a._id);
      if (res.success) { toast.success('Address deleted!'); await fetchUserAddresses(); }
      else throw new Error(res.error);
    } catch { toast.error('Failed to delete address.'); }
  };

  /* ── effects ── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => { setAuthChecked(true); if (!u) { setError('Please sign in'); setIsPageLoading(false); } });
    return () => unsub();
  }, []);

  useEffect(() => { fetchUserData(); }, [fetchUserData]);
  useEffect(() => { if (activeTab==='orders'    && auth.currentUser) fetchUserOrders(); },    [activeTab]);
  useEffect(() => { if (activeTab==='addresses' && auth.currentUser) fetchUserAddresses(); }, [activeTab]);

  /* ── profile edit ── */
  const handleEditProfile = useCallback(e => { e.preventDefault(); e.stopPropagation(); setIsEditing(true); }, []);
  const handleChange = e => { const {name,value}=e.target; setFormData(p=>({...p,[name]:value})); };

  const handleSubmit = async e => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const cu = auth.currentUser;
      if (!cu) { setError('Please sign in'); setIsSaving(false); return; }
      let avatarUrl = formData.avatar;
      if (selectedAvatarFile) {
        try { const { downloadURL } = await uploadProfilePhoto(cu.uid, selectedAvatarFile); avatarUrl = downloadURL; }
        catch { toast.error('Failed to upload photo.'); setIsSaving(false); return; }
      }
      if (typeof avatarUrl==='string' && avatarUrl.startsWith('data:')) avatarUrl = userData.avatar;
      const res = await fetch(`http://localhost:5000/api/auth/profile/${cu.uid}`, {
        method:'PUT', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ name:`${formData.firstName} ${formData.lastName}`.trim(), email:formData.email, phone:formData.phone, address:formData.address, image_url:avatarUrl })
      });
      if (!res.ok) { const e=await res.json(); throw new Error(e.error||'Failed'); }
      const result = await res.json();
      if (!result.success) throw new Error(result.error||'Failed');
      const upd = { ...formData, avatar:avatarUrl, memberSince:userData.memberSince };
      setUserData(upd); setFormData(upd); setSelectedAvatarFile(null); setIsEditing(false); setError(null);
      toast.success('Profile updated!'); await fetchUserData();
    } catch(e) { setError(e.message||'Failed to update.'); toast.error('Failed to update profile.'); }
    finally { setIsSaving(false); }
  };

  const handleCancel = () => { setFormData({...userData}); setSelectedAvatarFile(null); setIsEditing(false); setError(null); };

  const handleFileChange = e => {
    const file = e.target.files[0]; if (!file) return;
    if (!file.type.match('image.*')) { setError('Invalid image file'); return; }
    if (file.size > 5*1024*1024) { setError('Image must be under 5MB'); return; }
    const reader = new FileReader();
    reader.onloadstart = () => setIsUploadingImage(true);
    reader.onloadend  = () => { setFormData(p=>({...p,avatar:reader.result})); setSelectedAvatarFile(file); setError(null); setIsUploadingImage(false); };
    reader.onerror    = () => { setError('Error reading file'); setIsUploadingImage(false); };
    reader.readAsDataURL(file);
  };

  /* ── guards ── */
  if (!authChecked || authLoading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f7faf9' }}>
      <div style={{ width:40, height:40, borderRadius:'50%', border:'3px solid #082B27', borderTopColor:'transparent', animation:'spin 0.8s linear infinite' }} />
    </div>
  );
  if (!auth.currentUser) return <Navigate to="/login" state={{ from:location }} replace />;
  if (isPageLoading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f7faf9' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:44, height:44, borderRadius:'50%', border:'3px solid #082B27', borderTopColor:'transparent', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }} />
        <p style={{ color:'#7a9e99', fontSize:13, fontFamily:'DM Sans,sans-serif' }}>Loading your profile…</p>
      </div>
    </div>
  );

  const initials = `${userData.firstName?.[0]||''}${userData.lastName?.[0]||''}`.toUpperCase() || '?';
  const fullName = `${userData.firstName} ${userData.lastName}`.trim();

  const tabs = [
    { key:'profile',   icon:'👤', label:'Profile'   },
    { key:'orders',    icon:'📦', label:'Orders'     },
    { key:'addresses', icon:'📍', label:'Addresses'  },
  ];

  return (
    <div className="pp pp-fade" style={{ minHeight:'100vh', background:'linear-gradient(160deg,#f0fdf4 0%,#f7faf9 45%,#ecfdf5 100%)', paddingTop:40, paddingBottom:60 }}>
      <div style={{ maxWidth:860, margin:'0 auto', padding:'0 16px' }}>

        {/* ══════════ HERO CARD ══════════ */}
        <div style={{ borderRadius:28, overflow:'hidden', boxShadow:'0 12px 50px rgba(8,43,39,0.11)', marginBottom:20 }}>
          {/* Banner */}
          <div style={{ height:130, background:'linear-gradient(135deg,#052018 0%,#082B27 40%,#155e4c 75%,#0a3830 100%)', position:'relative', overflow:'hidden' }}>
            {/* decorative rings */}
            {[180,120,70].map((size,i)=>(
              <div key={i} style={{ position:'absolute', right:-size*0.3, top:-size*0.3, width:size, height:size, borderRadius:'50%', border:'1.5px solid rgba(255,255,255,0.07)' }} />
            ))}
            {/* dot grid */}
            <div style={{ position:'absolute', inset:0, opacity:0.06, backgroundImage:'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize:'22px 22px' }} />
            {/* Niya brand text watermark */}
            <div style={{ position:'absolute', right:24, bottom:12, fontFamily:'"Playfair Display",serif', fontSize:42, fontWeight:900, color:'white', opacity:0.04, letterSpacing:'-1px', userSelect:'none' }}>NIYA</div>
          </div>

          {/* Profile info row */}
          <div style={{ background:'white', padding:'0 28px 24px' }}>
            <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginTop:-15 }}>
              {/* Avatar */}
              <div style={{ position:'relative', width:80, height:80, flexShrink:0 }}>
                {userData.avatar && !userData.avatar.includes('placeholder') ? (
                  <img src={userData.avatar} alt="avatar" style={{ width:80, height:80, borderRadius:20, objectFit:'cover', border:'4px solid white', boxShadow:'0 4px 20px rgba(8,43,39,0.18)' }} />
                ) : (
                  <div style={{ width:80, height:80, borderRadius:20, background:'#082B27', border:'4px solid white', boxShadow:'0 4px 20px rgba(8,43,39,0.18)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:900, color:'white', fontFamily:'"Playfair Display",serif' }}>
                    {initials}
                  </div>
                )}
                {/* online dot */}
                <div style={{ position:'absolute', bottom:4, right:4, width:14, height:14, borderRadius:'50%', background:'#22c55e', border:'2.5px solid white' }} />
              </div>

              {/* Name + email */}
              <div style={{ flex:1, minWidth:0, paddingBottom:12 }}>
                <h1 style={{ margin:0, fontSize:22, fontWeight:900, color:'#082B27', fontFamily:'"Playfair Display",serif', letterSpacing:'-0.5px' }}>{fullName || 'Your Name'}</h1>
                <p style={{ margin:'3px 0 0', fontSize:13, color:'#7a9e99' }}>{userData.email}</p>
              </div>

              {/* Stats pills */}
              <div style={{ display:'flex', gap:10, flexWrap:'wrap', paddingBottom:4 }}>
                <div style={{ padding:'7px 16px', borderRadius:99, background:'#f0fdf4', border:'1px solid #bbf7d0', fontSize:12, fontWeight:600, color:'#082B27', display:'flex', alignItems:'center', gap:5 }}>
                  🌿 Since {userData.memberSince}
                </div>
                <div style={{ padding:'7px 16px', borderRadius:99, background:'#fefce8', border:'1px solid #fde68a', fontSize:12, fontWeight:600, color:'#854d0e', display:'flex', alignItems:'center', gap:5 }}>
                  📦 {orders.length} Orders
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════ MAIN CARD ══════════ */}
        <div style={{ background:'white', borderRadius:24, overflow:'hidden', boxShadow:'0 8px 40px rgba(8,43,39,0.08)' }}>

          {/* Tab bar */}
          <div style={{ display:'flex', borderBottom:'1.5px solid #e8f4f1', padding:'0 12px', background:'white', position:'sticky', top:0, zIndex:10 }}>
            {tabs.map(t => (
              <button key={t.key} className={`pp-tab ${activeTab===t.key?'active':''}`} onClick={()=>setActiveTab(t.key)}>
                <span>{t.icon}</span> {t.label}
              </button>
            ))}
          </div>

          <div style={{ padding:'28px 32px' }}>

            {/* ════ PROFILE TAB ════ */}
            {activeTab==='profile' && (
              <div>
                {/* Section header */}
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
                  <div>
                    <h2 style={{ margin:0, fontSize:18, fontWeight:900, color:'#082B27', fontFamily:'"Playfair Display",serif' }}>Profile Information</h2>
                    <p style={{ margin:'4px 0 0', fontSize:13, color:'#7a9e99' }}>Update your personal details</p>
                  </div>
                  {!isEditing && (
                    <button className="pp-ghost" style={{ fontSize:13, padding:'9px 18px' }} onClick={handleEditProfile}>
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      Edit Profile
                    </button>
                  )}
                </div>

                {error && (
                  <div style={{ display:'flex', gap:10, padding:'12px 16px', borderRadius:12, background:'#fff5f5', border:'1px solid #fca5a5', marginBottom:20 }}>
                    <svg width="16" height="16" style={{ color:'#e05555', flexShrink:0, marginTop:1 }} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/></svg>
                    <p style={{ margin:0, fontSize:13, color:'#c53030' }}>{error}</p>
                  </div>
                )}

                {isEditing ? (
                  <form key="edit" onSubmit={handleSubmit}>
                    {/* Avatar row */}
                    <div style={{ display:'flex', alignItems:'center', gap:20, padding:20, borderRadius:16, background:'#f7faf9', border:'1.5px dashed #d1e8e4', marginBottom:20 }}>
                      <div style={{ width:68, height:68, borderRadius:16, overflow:'hidden', border:'2px solid #d1e8e4', flexShrink:0 }}>
                        {formData.avatar && !formData.avatar.includes('placeholder') ? (
                          <img src={formData.avatar} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                        ) : (
                          <div style={{ width:'100%', height:'100%', background:'#082B27', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:900, color:'white' }}>{initials}</div>
                        )}
                      </div>
                      <div>
                        <label htmlFor="avatar-input" className="pp-ghost" style={{ fontSize:13, padding:'8px 16px', cursor:'pointer' }}>
                          {isUploadingImage ? 'Uploading…' : '📷 Change Photo'}
                          <input id="avatar-input" name="avatar" type="file" style={{ display:'none' }} onChange={handleFileChange} accept="image/*" />
                        </label>
                        <p style={{ margin:'6px 0 0', fontSize:11, color:'#a0b8b4' }}>JPG, PNG or GIF · Max 5MB</p>
                      </div>
                    </div>

                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                      <Field label="First Name"><input className="pp-input" type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="First name" /></Field>
                      <Field label="Last Name"><input className="pp-input" type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Last name" /></Field>
                    </div>
                    <div style={{ marginBottom:16 }}>
                      <Field label="Email Address"><input className="pp-input" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" /></Field>
                    </div>
                    <div style={{ marginBottom:16 }}>
                      <Field label="Phone Number"><input className="pp-input" type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone" /></Field>
                    </div>
                    <div style={{ marginBottom:24 }}>
                      <Field label="Address"><input className="pp-input" type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Your address" /></Field>
                    </div>

                    <div style={{ display:'flex', justifyContent:'flex-end', gap:12 }}>
                      <button type="button" className="pp-ghost" onClick={handleCancel}>Cancel</button>
                      <button type="submit" className="pp-primary" disabled={isSaving}>
                        {isSaving ? <><Spinner /> Saving…</> : '✓ Save Changes'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div style={{ borderRadius:16, overflow:'hidden', border:'1.5px solid #e8f4f1' }}>
                    {[
                      { icon:'👤', label:'Full Name',     value: fullName || '—'            },
                      { icon:'✉️', label:'Email',         value: userData.email || '—'      },
                      { icon:'📱', label:'Phone',         value: userData.phone || '—'      },
                      { icon:'📍', label:'Address',       value: userData.address || '—'    },
                      { icon:'📅', label:'Member Since',  value: userData.memberSince || '—'},
                    ].map((row, i) => (
                      <div key={i} className="pp-info-row" style={{ background: i%2===0 ? 'white' : '#fafcfb' }}>
                        <span style={{ fontSize:18, flexShrink:0, marginTop:1 }}>{row.icon}</span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'#082B27', opacity:0.45, marginBottom:3 }}>{row.label}</div>
                          <div style={{ fontSize:14, fontWeight:500, color:'#1a1a1a', wordBreak:'break-word' }}>{row.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ════ ORDERS TAB ════ */}
            {activeTab==='orders' && (
              <div>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
                  <div>
                    <h2 style={{ margin:0, fontSize:18, fontWeight:900, color:'#082B27', fontFamily:'"Playfair Display",serif' }}>Order History</h2>
                    <p style={{ margin:'4px 0 0', fontSize:13, color:'#7a9e99' }}>Track and review your orders</p>
                  </div>
                  <button className="pp-ghost" style={{ fontSize:13, padding:'9px 18px' }} onClick={fetchUserOrders} disabled={isOrdersLoading}>
                    {isOrdersLoading ? <><Spinner /> Loading</> : '↻ Refresh'}
                  </button>
                </div>

                {isOrdersLoading ? (
                  <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                    {[...Array(3)].map((_,i)=><div key={i} className="pp-shimmer" style={{ height:72 }} />)}
                  </div>
                ) : orders.length===0 ? (
                  <div style={{ textAlign:'center', padding:'48px 0' }}>
                    <div style={{ width:64, height:64, borderRadius:20, background:'#f0fdf4', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:28 }}>🛍️</div>
                    <h3 style={{ margin:'0 0 6px', fontSize:15, fontWeight:700, color:'#082B27' }}>No orders yet</h3>
                    <p style={{ margin:'0 0 20px', fontSize:13, color:'#7a9e99' }}>Your order history will appear here</p>
                    <Link to="/products"><button className="pp-primary">Start Shopping</button></Link>
                  </div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {orders.map(order => {
                      const st = (order.status||'').toLowerCase();
                      const sc = STATUS_STYLES[st] || STATUS_STYLES.default;
                      return (
                        <div key={order._id||order.id} className="pp-order-card">
                          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                            <div style={{ width:44, height:44, borderRadius:14, background:'#f0fdf4', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:20 }}>🛍️</div>
                            <div>
                              <p style={{ margin:0, fontSize:14, fontWeight:700, color:'#082B27' }}>Order #{order.order_number || order._id?.slice(-8) || 'N/A'}</p>
                              <p style={{ margin:'3px 0 0', fontSize:12, color:'#7a9e99' }}>
                                {order.items?.length||0} item{order.items?.length!==1?'s':''} · {order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                            <span style={{ fontSize:15, fontWeight:800, color:'#082B27' }}>₹{order.total_amount||order.total||0}</span>
                            <span className="pp-status" style={{ background:sc.bg, color:sc.color }}>
                              <span style={{ width:7, height:7, borderRadius:'50%', background:sc.dot, display:'inline-block' }} />
                              {order.status||'Processing'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ════ ADDRESSES TAB ════ */}
            {activeTab==='addresses' && (
              <div>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
                  <div>
                    <h2 style={{ margin:0, fontSize:18, fontWeight:900, color:'#082B27', fontFamily:'"Playfair Display",serif' }}>Saved Addresses</h2>
                    <p style={{ margin:'4px 0 0', fontSize:13, color:'#7a9e99' }}>Manage your delivery addresses</p>
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button className="pp-ghost" style={{ fontSize:13, padding:'9px 14px' }} onClick={fetchUserAddresses} disabled={isAddressesLoading}>{isAddressesLoading?'…':'↻'}</button>
                    <button className="pp-primary" style={{ fontSize:13, padding:'9px 18px' }} onClick={handleAddAddress}>
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>
                      Add Address
                    </button>
                  </div>
                </div>

                {isAddressesLoading ? (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:16 }}>
                    {[...Array(2)].map((_,i)=><div key={i} className="pp-shimmer" style={{ height:140 }} />)}
                  </div>
                ) : addresses.length===0 ? (
                  <div style={{ textAlign:'center', padding:'48px 0' }}>
                    <div style={{ width:64, height:64, borderRadius:20, background:'#f0fdf4', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:28 }}>📍</div>
                    <h3 style={{ margin:'0 0 6px', fontSize:15, fontWeight:700, color:'#082B27' }}>No addresses saved</h3>
                    <p style={{ margin:'0 0 20px', fontSize:13, color:'#7a9e99' }}>Add an address for faster checkout</p>
                    <button className="pp-primary" onClick={handleAddAddress}>Add Your First Address</button>
                  </div>
                ) : (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:16 }}>
                    {addresses.map(addr => (
                      <div key={addr._id||addr.id} className={`pp-addr-card ${addr.is_default?'default':''}`}>
                        {addr.is_default && (
                          <div style={{ position:'absolute', top:14, right:14 }}>
                            <span style={{ fontSize:10, fontWeight:800, padding:'3px 10px', borderRadius:99, background:'#082B27', color:'white', letterSpacing:'0.06em', textTransform:'uppercase' }}>Default</span>
                          </div>
                        )}
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                          <span style={{ fontSize:18 }}>{addr.type==='Home'?'🏠':addr.type==='Work'?'💼':'📍'}</span>
                          <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'#082B27', background:'#f0fdf4', padding:'3px 8px', borderRadius:8 }}>{addr.type||'Home'}</span>
                        </div>
                        <div style={{ fontSize:13, color:'#333', lineHeight:1.6 }}>
                          {addr.firstName && <p style={{ margin:0, fontWeight:600 }}>{addr.firstName} {addr.lastName}</p>}
                          <p style={{ margin:0 }}>{addr.street}</p>
                          <p style={{ margin:0 }}>{addr.city}, {addr.state} {addr.zipCode}</p>
                          <p style={{ margin:0, color:'#7a9e99' }}>{addr.country}</p>
                          {addr.phone && <p style={{ margin:'4px 0 0', color:'#7a9e99', fontSize:12 }}>📱 {addr.phone}</p>}
                        </div>
                        <div style={{ display:'flex', gap:16, marginTop:14, paddingTop:12, borderTop:'1px solid #e8f4f1' }}>
                          <button style={{ background:'none', border:'none', fontSize:12, fontWeight:700, color:'#082B27', cursor:'pointer', padding:0, textDecoration:'underline', textUnderlineOffset:3 }} onClick={()=>handleEditAddress(addr)}>Edit</button>
                          {!addr.is_default && <button style={{ background:'none', border:'none', fontSize:12, fontWeight:700, color:'#e05555', cursor:'pointer', padding:0, textDecoration:'underline', textUnderlineOffset:3 }} onClick={()=>handleDeleteAddress(addr)}>Delete</button>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════ ADDRESS MODAL ══════════ */}
      {showAddressModal && (
        <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16, background:'rgba(8,43,39,0.45)', backdropFilter:'blur(6px)' }}>
          <div className="pp-fade" style={{ width:'100%', maxWidth:520, borderRadius:24, background:'white', boxShadow:'0 24px 80px rgba(8,43,39,0.22)', maxHeight:'90vh', overflowY:'auto' }}>
            {/* Modal header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:'1.5px solid #e8f4f1' }}>
              <h3 style={{ margin:0, fontSize:17, fontWeight:900, color:'#082B27', fontFamily:'"Playfair Display",serif' }}>
                {editingAddress ? '✏️ Edit Address' : '➕ Add New Address'}
              </h3>
              <button style={{ width:32, height:32, borderRadius:10, border:'1.5px solid #e8f4f1', background:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#666', transition:'all 0.2s' }}
                onClick={()=>{ setShowAddressModal(false); setEditingAddress(null); setAddressForm(emptyAddrForm); }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:14 }}>
              <Field label="Address Type">
                <select className="pp-input" value={addressForm.type} onChange={e=>setAddressForm(p=>({...p,type:e.target.value}))}>
                  <option value="Home">🏠 Home</option>
                  <option value="Work">💼 Work</option>
                  <option value="Other">📍 Other</option>
                </select>
              </Field>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <Field label="First Name *"><input className="pp-input" type="text" placeholder="First" value={addressForm.firstName} onChange={e=>setAddressForm(p=>({...p,firstName:e.target.value}))} /></Field>
                <Field label="Last Name *"><input className="pp-input" type="text" placeholder="Last" value={addressForm.lastName} onChange={e=>setAddressForm(p=>({...p,lastName:e.target.value}))} /></Field>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <Field label="Email *"><input className="pp-input" type="email" placeholder="Email" value={addressForm.email} onChange={e=>setAddressForm(p=>({...p,email:e.target.value}))} /></Field>
                <Field label="Phone *"><input className="pp-input" type="tel" placeholder="Phone" value={addressForm.phone} onChange={e=>setAddressForm(p=>({...p,phone:e.target.value}))} /></Field>
              </div>

              <Field label="Street Address *"><input className="pp-input" type="text" placeholder="Street address" value={addressForm.street} onChange={e=>setAddressForm(p=>({...p,street:e.target.value}))} /></Field>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                <Field label="City *"><input className="pp-input" type="text" placeholder="City" value={addressForm.city} onChange={e=>setAddressForm(p=>({...p,city:e.target.value}))} /></Field>
                <Field label="State *"><input className="pp-input" type="text" placeholder="State" value={addressForm.state} onChange={e=>setAddressForm(p=>({...p,state:e.target.value}))} /></Field>
                <Field label="PIN Code *"><input className="pp-input" type="text" placeholder="PIN" value={addressForm.zipCode} onChange={e=>setAddressForm(p=>({...p,zipCode:e.target.value}))} /></Field>
              </div>

              {/* Custom checkbox */}
              <label style={{ display:'flex', alignItems:'center', gap:12, cursor:'pointer', marginTop:4 }} onClick={()=>setAddressForm(p=>({...p,is_default:!p.is_default}))}>
                <div className={`pp-check ${addressForm.is_default?'checked':''}`}>
                  {addressForm.is_default && <svg width="10" height="10" fill="none" stroke="white" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                </div>
                <span style={{ fontSize:13, fontWeight:500, color:'#374151' }}>Set as default address</span>
              </label>
            </div>

            {/* Modal footer */}
            <div style={{ display:'flex', justifyContent:'flex-end', gap:12, padding:'16px 24px', borderTop:'1.5px solid #e8f4f1' }}>
              <button className="pp-ghost" onClick={()=>{ setShowAddressModal(false); setEditingAddress(null); setAddressForm(emptyAddrForm); }}>Cancel</button>
              <button className="pp-primary" onClick={handleSaveAddress}>
                {editingAddress ? '✓ Update Address' : '✓ Save Address'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}