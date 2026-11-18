import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  Plus,
  X,
  UserCheck,
  Users,
  Shield,
  Smartphone,
  Crosshair,
  Clock,
  Calendar,
  Video,
  ExternalLink,
  Trash2,
  AlertCircle,
  CheckCircle2,
  MessageCircle,
  Award,
  Info,
  Filter
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Custom Pawn Icon matching screenshot
function PawnIcon({ size = 20, color = '#c084fc' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="6" r="3" fill={color} fillOpacity="0.25" />
      <path d="M9 10h6" />
      <path d="M10 10v2a4 4 0 0 1-2 3.5V17h8v-1.5a4 4 0 0 1-2-3.5v-2" />
      <path d="M6 20h12a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1z" fill={color} fillOpacity="0.3" />
    </svg>
  );
}

export default function RequirementsPage() {
  const navigate = useNavigate();
  const [publicRequirements, setPublicRequirements] = useState([]);
  const [myRequirements, setMyRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'PLAYER' | 'TEAM'
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [formStep, setFormStep] = useState(1); // 1: Selection ("What are you looking for?"), 2: Actual Form
  const [selectedType, setSelectedType] = useState(null); // 'PLAYER' | 'TEAM'
  
  // Form input state
  const [formData, setFormData] = useState({
    device: '',
    role: '',
    availability: '',
    playingTime: '',
    age: '',
    experience: '',
    contact: '',
    achievements: '',
    additionalInfo: '',
    clips: '',
  });

  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const userInfo = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('userInfo') || 'null');
    } catch {
      return null;
    }
  }, []);

  const authHeaders = useMemo(() => {
    return userInfo?.token ? { Authorization: `Bearer ${userInfo.token}` } : null;
  }, [userInfo]);

  // Fetch public requirements
  const fetchPublicRequirements = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/requirements`);
      setPublicRequirements(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching public requirements:', err);
    }
  }, []);

  // Fetch logged-in user's own requirements
  const fetchMyRequirements = useCallback(async () => {
    if (!authHeaders) {
      setMyRequirements([]);
      return;
    }
    try {
      const res = await axios.get(`${API_URL}/api/requirements/my`, { headers: authHeaders });
      setMyRequirements(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching user requirements:', err);
    }
  }, [authHeaders]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchPublicRequirements(), fetchMyRequirements()])
      .finally(() => setLoading(false));
  }, [fetchPublicRequirements, fetchMyRequirements]);

  // Open modal handler
  const handleOpenAddModal = () => {
    if (!userInfo || !userInfo.token) {
      navigate('/user/login', {
        state: { from: '/requirements', message: 'Please sign in to publish your requirement.' }
      });
      return;
    }

    // Check frontend limit
    if (myRequirements.length >= 2) {
      alert("You can have a maximum of 2 active requirements at a time. Please remove one of your existing requirements before publishing another.");
      return;
    }

    setSelectedType(null);
    setFormStep(1);
    setFormData({
      device: '',
      role: '',
      availability: '',
      playingTime: '',
      age: '',
      experience: '',
      contact: userInfo.whatsappNumber || userInfo.phone || '',
      achievements: '',
      additionalInfo: '',
      clips: '',
    });
    setFormError('');
    setSuccessMsg('');
    setShowModal(true);
  };

  // Select requirement type in step 1
  const handleSelectType = (type) => {
    setSelectedType(type);
    setFormStep(2);
    setFormError('');
  };

  // URL validator for Clips
  const isValidClipsUrl = (urlString) => {
    if (!urlString || typeof urlString !== 'string') return false;
    const trimmed = urlString.trim();
    try {
      const urlObj = new URL(trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`);
      const host = urlObj.hostname.toLowerCase();
      const isYouTube = host === 'youtube.com' || host === 'www.youtube.com' || host === 'm.youtube.com' || host === 'youtu.be';
      const isInstagram = host === 'instagram.com' || host === 'www.instagram.com' || host === 'm.instagram.com';
      return isYouTube || isInstagram;
    } catch {
      return false;
    }
  };

  // Submit requirement
  const handlePublish = async (e) => {
    e.preventDefault();
    setFormError('');

    if (myRequirements.length >= 2) {
      setFormError("You can have a maximum of 2 active requirements at a time. Please remove one of your existing requirements before publishing another.");
      return;
    }

    // Validation
    if (!formData.device.trim()) return setFormError('Device is required.');
    if (!formData.role.trim()) return setFormError('Role is required.');
    if (!formData.age.trim()) return setFormError('Age is required.');
    if (!formData.experience.trim()) return setFormError('Experience is required.');
    if (!formData.contact.trim()) return setFormError('Contact detail (e.g. WhatsApp) is required.');

    if (selectedType === 'PLAYER') {
      if (!formData.availability.trim()) {
        return setFormError('Availability is required (e.g. 2 PM - 6 PM Daily).');
      }
    } else if (selectedType === 'TEAM') {
      if (!formData.playingTime.trim()) {
        return setFormError('Playing Time is required (e.g. 8 PM - 12 AM Daily).');
      }
      if (!formData.clips.trim()) {
        return setFormError('Clips link is required for Looking for Team.');
      }
      if (!isValidClipsUrl(formData.clips)) {
        return setFormError('Clips must be a valid YouTube (video/Shorts) or Instagram (Reel/post) link.');
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        type: selectedType,
        device: formData.device.trim(),
        role: formData.role.trim(),
        age: formData.age.trim(),
        experience: formData.experience.trim(),
        contact: formData.contact.trim(),
        achievements: formData.achievements.trim(),
        additionalInfo: formData.additionalInfo.trim(),
        availability: selectedType === 'PLAYER' ? formData.availability.trim() : '',
        playingTime: selectedType === 'TEAM' ? formData.playingTime.trim() : '',
        clips: selectedType === 'TEAM' ? formData.clips.trim() : '',
      };

      await axios.post(`${API_URL}/api/requirements`, payload, {
        headers: authHeaders,
      });

      setSuccessMsg('Requirement published successfully!');
      setTimeout(() => {
        setShowModal(false);
        setSuccessMsg('');
        fetchPublicRequirements();
        fetchMyRequirements();
      }, 1000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to publish requirement. Please try again.';
      setFormError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete own requirement
  const handleDeleteOwn = async (reqId) => {
    if (!window.confirm('Are you sure you want to remove this requirement? This will free up 1 slot for you to publish a new requirement.')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/requirements/${reqId}`, {
        headers: authHeaders,
      });
      fetchMyRequirements();
      fetchPublicRequirements();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove requirement.');
    }
  };

  // Filtered public requirements (excluding current user's own from public list if already displayed at top)
  const filteredPublicList = useMemo(() => {
    let list = publicRequirements;
    if (userInfo && userInfo._id) {
      list = list.filter((r) => {
        const ownerId = typeof r.user === 'object' ? r.user?._id : r.user;
        return String(ownerId) !== String(userInfo._id);
      });
    }
    if (activeFilter !== 'ALL') {
      list = list.filter((r) => r.type === activeFilter);
    }
    return list;
  }, [publicRequirements, userInfo, activeFilter]);

  return (
    <div className="home-page-wrapper fade-in" style={{ minHeight: '100vh', paddingBottom: '5rem' }}>
      <div className="home-container" style={{ maxWidth: '680px' }}>
        
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', marginTop: '0.5rem' }}>
          <button
            type="button"
            onClick={() => navigate('/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '8px',
              padding: '6px 12px',
              color: '#c084fc',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={16} />
            <span>Home</span>
          </button>

          <div style={{ textAlign: 'center' }}>
            <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', letterSpacing: '1px' }}>
              REQUIREMENTS
            </h1>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              Find Players &amp; Teams for BGMI
            </span>
          </div>

          {/* Add Requirement Button */}
          <button
            type="button"
            onClick={handleOpenAddModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 50%, #a855f7 100%)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 12px',
              color: '#ffffff',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(124, 58, 237, 0.4)',
            }}
          >
            <Plus size={15} strokeWidth={2.8} />
            <span>Add (+)</span>
          </button>
        </div>

        {/* ── Active requirements count banner (if logged in) ── */}
        {userInfo && (
          <div
            style={{
              background: 'rgba(124, 58, 237, 0.1)',
              border: '1px solid rgba(168, 85, 247, 0.25)',
              borderRadius: '10px',
              padding: '8px 12px',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.76rem',
              color: '#c4b5fd',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Info size={14} color="#a855f7" />
              <span>Your Active Requirements: <strong>{myRequirements.length} / 2</strong></span>
            </div>
            {myRequirements.length >= 2 ? (
              <span style={{ color: '#f87171', fontWeight: 700, fontSize: '0.7rem' }}>Limit Reached (2/2)</span>
            ) : (
              <span style={{ color: '#4ade80', fontWeight: 700, fontSize: '0.7rem' }}>{2 - myRequirements.length} slot available</span>
            )}
          </div>
        )}

        {/* ── 1. MY REQUIREMENTS SECTION (Displayed at top for logged-in user) ── */}
        {userInfo && myRequirements.length > 0 && (
          <section style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.65rem' }}>
              <span style={{ background: '#7c3aed', color: '#fff', fontSize: '0.66rem', fontWeight: 900, padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.5px' }}>
                MY REQUIREMENTS
              </span>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>({myRequirements.length} active)</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {myRequirements.map((req) => (
                <RequirementCard
                  key={req._id}
                  item={req}
                  isOwner={true}
                  onDelete={() => handleDeleteOwn(req._id)}
                />
              ))}
            </div>

            <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(168, 85, 247, 0.35), transparent)', margin: '1.5rem 0 1rem' }} />
          </section>
        )}

        {/* ── 2. PUBLIC REQUIREMENTS SECTION ── */}
        <section>
          {/* Header & Filter Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '0.85rem' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f3e8ff', letterSpacing: '0.5px' }}>
              COMMUNITY REQUIREMENTS
            </div>

            {/* Filter Chips */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {['ALL', 'PLAYER', 'TEAM'].map((filterKey) => (
                <button
                  key={filterKey}
                  type="button"
                  onClick={() => setActiveFilter(filterKey)}
                  style={{
                    background: activeFilter === filterKey ? 'linear-gradient(135deg, #7c3aed, #9333ea)' : 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${activeFilter === filterKey ? '#c084fc' : 'rgba(168, 85, 247, 0.25)'}`,
                    color: activeFilter === filterKey ? '#ffffff' : '#a0a0c4',
                    padding: '4px 10px',
                    borderRadius: '16px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {filterKey === 'ALL' ? 'All' : filterKey === 'PLAYER' ? 'Looking for Player' : 'Looking for Team'}
                </button>
              ))}
            </div>
          </div>

          {/* Cards List */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#c084fc' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>Loading requirements...</div>
            </div>
          ) : filteredPublicList.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredPublicList.map((req) => (
                <RequirementCard
                  key={req._id}
                  item={req}
                  isOwner={false}
                />
              ))}
            </div>
          ) : (
            <div
              style={{
                background: 'rgba(20, 14, 40, 0.7)',
                border: '1px solid rgba(168, 85, 247, 0.2)',
                borderRadius: '14px',
                padding: '2.5rem 1rem',
                textAlign: 'center',
              }}
            >
              <PawnIcon size={38} color="#a855f7" />
              <h3 style={{ margin: '0.75rem 0 4px', color: '#ffffff', fontSize: '0.95rem' }}>
                No Requirements Found
              </h3>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.78rem' }}>
                Be the first to publish a requirement for a player or an esports team!
              </p>
              <button
                type="button"
                onClick={handleOpenAddModal}
                style={{
                  marginTop: '1rem',
                  background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '7px 16px',
                  color: '#ffffff',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                + Add Requirement
              </button>
            </div>
          )}
        </section>

      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ── MODAL: STEP 1 (Selection) & STEP 2 (Form A or Form B) ── */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showModal && (
        <div
          className="rules-modal-overlay fade-in"
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(6px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            overflowY: 'auto',
          }}
        >
          <div
            className="rules-modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, rgba(23, 14, 46, 0.98) 0%, rgba(12, 8, 26, 0.99) 100%)',
              border: '1px solid rgba(168, 85, 247, 0.5)',
              borderRadius: '16px',
              maxWidth: '480px',
              width: '100%',
              padding: '1.25rem',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.7), 0 0 20px rgba(139, 92, 246, 0.2)',
              position: 'relative',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(168, 85, 247, 0.25)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {formStep === 2 && (
                  <button
                    type="button"
                    onClick={() => setFormStep(1)}
                    style={{ background: 'none', border: 'none', color: '#c084fc', cursor: 'pointer', padding: 0 }}
                    title="Back to selection"
                  >
                    <ArrowLeft size={18} />
                  </button>
                )}
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#ffffff' }}>
                    {formStep === 1
                      ? 'What are you looking for?'
                      : selectedType === 'PLAYER'
                      ? 'LOOKING FOR PLAYER'
                      : 'LOOKING FOR TEAM'}
                  </h3>
                  <span style={{ fontSize: '0.7rem', color: '#a0a0c4' }}>
                    {formStep === 1 ? 'Step 1 of 2: Select recruitment type' : 'Step 2 of 2: Fill in requirement details'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={19} />
              </button>
            </div>

            {/* Success Notification */}
            {successMsg && (
              <div style={{ background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(168, 85, 247, 0.6)', borderRadius: '10px', padding: '10px', marginBottom: '1rem', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                <CheckCircle2 size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Error Notification */}
            {formError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '10px', padding: '10px', marginBottom: '1rem', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            {/* ── STEP 1: WHAT ARE YOU LOOKING FOR? ── */}
            {formStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {/* Option 1: Looking for Player */}
                <div
                  onClick={() => handleSelectType('PLAYER')}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1.5px solid rgba(168, 85, 247, 0.35)',
                    borderRadius: '12px',
                    padding: '1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#c084fc';
                    e.currentTarget.style.background = 'rgba(124, 58, 237, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.35)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#38bdf8',
                      flexShrink: 0,
                    }}
                  >
                    <UserCheck size={22} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#ffffff' }}>
                      1. Looking for Player
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>
                      Recruit skilled individual players for your BGMI squad.
                    </div>
                  </div>
                  <div style={{ color: '#c084fc', fontSize: '1.1rem', fontWeight: 800 }}>&gt;</div>
                </div>

                {/* Option 2: Looking for Team */}
                <div
                  onClick={() => handleSelectType('TEAM')}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1.5px solid rgba(168, 85, 247, 0.35)',
                    borderRadius: '12px',
                    padding: '1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#c084fc';
                    e.currentTarget.style.background = 'rgba(124, 58, 237, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.35)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      background: 'rgba(232, 121, 249, 0.15)',
                      border: '1px solid rgba(232, 121, 249, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#e879f9',
                      flexShrink: 0,
                    }}
                  >
                    <Users size={22} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#ffffff' }}>
                      2. Looking for Team
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>
                      Showcase your clips and join an esports lineup / organization.
                    </div>
                  </div>
                  <div style={{ color: '#c084fc', fontSize: '1.1rem', fontWeight: 800 }}>&gt;</div>
                </div>
              </div>
            )}

            {/* ── STEP 2: FORMS A & B ── */}
            {formStep === 2 && (
              <form onSubmit={handlePublish} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Notice */}
                <div style={{ fontSize: '0.7rem', color: '#a0a0c4', background: 'rgba(124, 58, 237, 0.1)', padding: '6px 10px', borderRadius: '8px' }}>
                  Please fill in all details manually. No dummy values allowed.
                </div>

                {/* Device */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#c4b5fd', fontWeight: 700, marginBottom: '3px' }}>
                    Device *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. iPhone 13 Pro Max / OnePlus 11"
                    value={formData.device}
                    onChange={(e) => setFormData({ ...formData, device: e.target.value })}
                    required
                    style={inputStyle}
                  />
                </div>

                {/* Role */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#c4b5fd', fontWeight: 700, marginBottom: '3px' }}>
                    Role *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. IGL / Main Assaulter / Sniper / Filter"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    required
                    style={inputStyle}
                  />
                </div>

                {/* Availability (for Player) OR Playing Time (for Team) */}
                {selectedType === 'PLAYER' ? (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: '#c4b5fd', fontWeight: 700, marginBottom: '3px' }}>
                      Availability *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 2:00 PM - 6:00 PM & 8:00 PM - 11:00 PM"
                      value={formData.availability}
                      onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                      required
                      style={inputStyle}
                    />
                  </div>
                ) : (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: '#c4b5fd', fontWeight: 700, marginBottom: '3px' }}>
                      Playing Time *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 6:00 PM to 12:00 AM Daily"
                      value={formData.playingTime}
                      onChange={(e) => setFormData({ ...formData, playingTime: e.target.value })}
                      required
                      style={inputStyle}
                    />
                  </div>
                )}

                {/* Clips URL (Only for Looking for Team) */}
                {selectedType === 'TEAM' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: '#e879f9', fontWeight: 700, marginBottom: '3px' }}>
                      Clips Link (YouTube or Instagram URL) *
                    </label>
                    <input
                      type="url"
                      placeholder="https://youtube.com/shorts/... or https://instagram.com/reel/..."
                      value={formData.clips}
                      onChange={(e) => setFormData({ ...formData, clips: e.target.value })}
                      required
                      style={{ ...inputStyle, borderColor: 'rgba(232, 121, 249, 0.45)' }}
                    />
                    <span style={{ fontSize: '0.66rem', color: '#94a3b8', display: 'block', marginTop: '2px' }}>
                      Accepts YouTube video/Shorts or Instagram post/Reel link only.
                    </span>
                  </div>
                )}

                {/* Age & Experience (2 columns) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: '#c4b5fd', fontWeight: 700, marginBottom: '3px' }}>
                      Age *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 19"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      required
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: '#c4b5fd', fontWeight: 700, marginBottom: '3px' }}>
                      Experience *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 2 Years / T1 Scrims"
                      value={formData.experience}
                      onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                      required
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Contact */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#c4b5fd', fontWeight: 700, marginBottom: '3px' }}>
                    Contact (WhatsApp / Phone) *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +91 9876543210 or WhatsApp link"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    required
                    style={inputStyle}
                  />
                </div>

                {/* Achievements */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#c4b5fd', fontWeight: 700, marginBottom: '3px' }}>
                    Achievements
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Winner of BGIS Round 3, Top 5 Daily Grind, 500+ Scrims played"
                    value={formData.achievements}
                    onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>

                {/* Additional Info */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#c4b5fd', fontWeight: 700, marginBottom: '3px' }}>
                    Additional Info
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Non-gyro, good comms, aggressive playstyle, available immediately"
                    value={formData.additionalInfo}
                    onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>

                {/* Publish Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    marginTop: '0.5rem',
                    background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 50%, #a855f7 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px',
                    color: '#ffffff',
                    fontSize: '0.86rem',
                    fontWeight: 800,
                    letterSpacing: '0.5px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 16px rgba(124, 58, 237, 0.4)',
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? 'Publishing...' : 'Publish Requirement'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

// ──────────────────────────────────────────────
// REQUIREMENT CARD COMPONENT
// ──────────────────────────────────────────────
function RequirementCard({ item, isOwner, onDelete }) {
  const isPlayer = item.type === 'PLAYER';
  const ownerName = item.user?.teamName || (item.user?.registrationNumber ? `Rising #${item.user.registrationNumber}` : 'Competitive Player');
  const publishedDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently';

  // Format clean contact for WhatsApp link if digits
  const cleanPhone = (item.contact || '').replace(/[^\d+]/g, '');
  const isLikelyPhone = cleanPhone.length >= 10;
  const whatsappUrl = isLikelyPhone ? `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(`Hi, I saw your recruitment requirement on Rising Esports for ${item.type === 'PLAYER' ? 'a Player' : 'a Team'}.`)}` : null;

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(22, 13, 44, 0.95) 0%, rgba(11, 7, 24, 0.98) 100%)',
        border: `1px solid ${isPlayer ? 'rgba(56, 189, 248, 0.35)' : 'rgba(232, 121, 249, 0.35)'}`,
        borderRadius: '14px',
        padding: '0.9rem',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top Accent Line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: isPlayer
            ? 'linear-gradient(90deg, transparent, #38bdf8, transparent)'
            : 'linear-gradient(90deg, transparent, #e879f9, transparent)',
        }}
      />

      {/* Card Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              background: isPlayer ? 'rgba(56, 189, 248, 0.18)' : 'rgba(232, 121, 249, 0.18)',
              color: isPlayer ? '#38bdf8' : '#e879f9',
              border: `1px solid ${isPlayer ? 'rgba(56, 189, 248, 0.45)' : 'rgba(232, 121, 249, 0.45)'}`,
              borderRadius: '6px',
              padding: '2px 8px',
              fontSize: '0.68rem',
              fontWeight: 900,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}
          >
            {isPlayer ? 'Looking for Player' : 'Looking for Team'}
          </span>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
            📅 {publishedDate}
          </span>
        </div>

        {/* Delete button if user's own */}
        {isOwner && (
          <button
            type="button"
            onClick={onDelete}
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '6px',
              padding: '3px 8px',
              color: '#f87171',
              fontSize: '0.7rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
            }}
            title="Remove your requirement"
          >
            <Trash2 size={13} />
            <span>Remove</span>
          </button>
        )}
      </div>

      {/* Role & Device Title */}
      <div style={{ marginBottom: '0.65rem' }}>
        <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#ffffff' }}>
          {item.role}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#a0a0c4', marginTop: '2px' }}>
          <Smartphone size={13} color="#c084fc" />
          <span>Device: <strong style={{ color: '#e2e8f0' }}>{item.device}</strong></span>
        </div>
      </div>

      {/* Meta Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '6px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(168, 85, 247, 0.15)',
          borderRadius: '10px',
          padding: '8px',
          marginBottom: '0.75rem',
          fontSize: '0.72rem',
        }}
      >
        <div>
          <span style={{ color: '#94a3b8' }}>
            {isPlayer ? '⏰ Availability:' : '⏰ Playing Time:'}
          </span>
          <div style={{ color: '#ffffff', fontWeight: 600, marginTop: '1px' }}>
            {isPlayer ? (item.availability || 'Flexible') : (item.playingTime || 'Flexible')}
          </div>
        </div>

        <div>
          <span style={{ color: '#94a3b8' }}>👤 Age &amp; Exp:</span>
          <div style={{ color: '#ffffff', fontWeight: 600, marginTop: '1px' }}>
            {item.age} yrs • {item.experience}
          </div>
        </div>
      </div>

      {/* Achievements (if provided) */}
      {item.achievements && (
        <div style={{ marginBottom: '0.5rem', fontSize: '0.74rem' }}>
          <span style={{ color: '#fbbf24', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Award size={13} /> Achievements:
          </span>
          <p style={{ margin: '2px 0 0', color: '#e2e8f0', lineHeight: 1.35, whiteSpace: 'pre-wrap' }}>
            {item.achievements}
          </p>
        </div>
      )}

      {/* Additional Info (if provided) */}
      {item.additionalInfo && (
        <div style={{ marginBottom: '0.5rem', fontSize: '0.74rem' }}>
          <span style={{ color: '#c4b5fd', fontWeight: 700 }}>Additional Info:</span>
          <p style={{ margin: '2px 0 0', color: '#cbd5e1', lineHeight: 1.35, whiteSpace: 'pre-wrap' }}>
            {item.additionalInfo}
          </p>
        </div>
      )}

      {/* Clips link for Looking for Team */}
      {item.clips && (
        <div style={{ marginBottom: '0.75rem' }}>
          <a
            href={item.clips.startsWith('http') ? item.clips : `https://${item.clips}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, rgba(232, 121, 249, 0.2), rgba(168, 85, 247, 0.2))',
              border: '1px solid rgba(232, 121, 249, 0.45)',
              borderRadius: '8px',
              padding: '5px 10px',
              color: '#f472b6',
              fontSize: '0.74rem',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            <Video size={14} />
            <span>Watch Gameplay Clips</span>
            <ExternalLink size={12} />
          </a>
        </div>
      )}

      {/* Footer: Publisher & Contact */}
      <div
        style={{
          borderTop: '1px solid rgba(168, 85, 247, 0.18)',
          paddingTop: '0.65rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '6px',
        }}
      >
        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
          Posted by: <strong style={{ color: '#c084fc' }}>{ownerName}</strong>
        </div>

        {/* Contact Button */}
        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              background: '#22c55e',
              color: '#ffffff',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '0.72rem',
              fontWeight: 800,
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)',
            }}
          >
            <MessageCircle size={13} />
            <span>Contact on WhatsApp</span>
          </a>
        ) : (
          <div style={{ fontSize: '0.72rem', color: '#e2e8f0', background: 'rgba(255, 255, 255, 0.05)', padding: '3px 8px', borderRadius: '6px' }}>
            Contact: {item.contact}
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(168, 85, 247, 0.35)',
  borderRadius: '8px',
  padding: '8px 10px',
  color: '#ffffff',
  fontSize: '0.8rem',
  outline: 'none',
  boxSizing: 'border-box',
};

