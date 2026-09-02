import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { load } from '@cashfreepayments/cashfree-js';
import imgsrc from "../assets/poster.png";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function TodaySlots() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myBookings, setMyBookings] = useState({});
  const [processingSlotId, setProcessingSlotId] = useState(null);
  const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message: string }
  const [credentialsModal, setCredentialsModal] = useState(null); // { slot, data: null, loading: false, error: null }
  const [copiedField, setCopiedField] = useState(null);

  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');

  // ── Fetch slots ──
  const fetchSlots = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/slots`);
      setSlots(data || []);
    } catch (err) {
      console.error('Error fetching slots', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch current user bookings ──
  const fetchMyBookings = useCallback(async () => {
    if (!userInfo || !userInfo.token) return;
    try {
      const { data } = await axios.get(`${API_URL}/api/slots/my-bookings`, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      setMyBookings(data || {});
    } catch (err) {
      console.error('Error fetching user bookings', err);
    }
  }, [userInfo?.token]);

  useEffect(() => {
    fetchSlots();
    fetchMyBookings();
  }, [fetchSlots, fetchMyBookings]);

  // Auto-dismiss notifications after 6 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // ── Build the image URL for a slot ──
  const slotImageUrl = (slot) => {
    if (slot.heroImageUrl) return slot.heroImageUrl;
    if (slot.hasHeroImage) return `${API_URL}/api/slots/${slot._id}/image`;
    return null;
  };

  // ── Initiate Cashfree Payment for Slot ──
  const handleRegisterSlot = async (slot) => {
    if (!userInfo || !userInfo.token) {
      setNotification({
        type: 'error',
        message: 'Please login or register to book a slot.',
      });
      navigate('/user/login');
      return;
    }

    const totalSlots = Number(slot.maxTeams) || 20;
    const bookedSlots = Math.max(0, Number(slot.bookedCount) || 0);
    const remainingSlots = Math.max(0, totalSlots - bookedSlots);

    if (remainingSlots <= 0) {
      setNotification({ type: 'error', message: 'This slot is already full.' });
      return;
    }

    setProcessingSlotId(slot._id);
    setNotification(null);

    try {
      // Create pending booking and generate Cashfree payment session on server
      const { data } = await axios.post(
        `${API_URL}/api/bookings/create`,
        { slotId: slot._id },
        { headers: { Authorization: `Bearer ${userInfo.token}` } }
      );

      if (data && data.paymentSessionId) {
        setNotification({
          type: 'success',
          message: 'Opening Cashfree secure payment gateway...',
        });

        const cashfreeMode = (data.environment || import.meta.env.VITE_CASHFREE_MODE || 'production').toLowerCase();
        try {
          const cashfree = await load({
            mode: cashfreeMode === 'sandbox' ? 'sandbox' : 'production',
          });

          await cashfree.checkout({
            paymentSessionId: data.paymentSessionId,
            redirectTarget: '_self',
          });
        } catch (checkoutErr) {
          console.warn('Cashfree JS checkout failed, using direct hosted checkout URL:', checkoutErr);
          const checkoutDomain = cashfreeMode === 'sandbox' ? 'sandbox.cashfree.com' : 'payments.cashfree.com';
          window.location.href = `https://${checkoutDomain}/order/#${data.paymentSessionId}`;
        }
      } else {
        throw new Error(data?.message || 'Failed to initialize Cashfree payment session');
      }
    } catch (err) {
      console.error('Registration/Cashfree error:', err);
      setNotification({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to initiate Cashfree payment. Please try again.',
      });
      setProcessingSlotId(null);
    }
  };

  // ── Open Room Credentials Modal ──
  const handleOpenCredentials = async (slot) => {
    if (!userInfo || !userInfo.token) {
      navigate('/user/login');
      return;
    }

    setCredentialsModal({ slot, data: null, loading: true, error: null });

    try {
      const { data } = await axios.get(`${API_URL}/api/slots/${slot._id}/room-credentials`, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      setCredentialsModal({ slot, data, loading: false, error: null });
    } catch (err) {
      const errorData = err.response?.data;
      let errorMsg = errorData?.message || 'Unable to fetch room credentials.';
      if (errorData?.error === 'too_early') {
        const unlockTime = errorData.unlockAt ? new Date(errorData.unlockAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '30 minutes before the match';
        errorMsg = `Room credentials will be unlocked at ${unlockTime} (30 mins before match start).`;
      }
      setCredentialsModal({ slot, data: null, loading: false, error: errorMsg });
    }
  };

  const copyToClipboard = (text, field) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Helper to extract Room ID and Password if they are stored in fields or embedded in note
  const getResolvedCredentials = (data) => {
    let roomId = (data?.roomId && data.roomId.trim() !== 'TBA') ? data.roomId.trim() : '';
    let roomPassword = (data?.roomPassword && data.roomPassword.trim() !== 'TBA') ? data.roomPassword.trim() : '';
    let note = (data?.note || '').trim();

    if ((!roomId || !roomPassword) && note) {
      // Check for patterns like "ID: 12345 Pass: abcde"
      const idPassMatch = note.match(/(?:ID|Room\s*ID)[:\s]+([^\s,;]+)[\s,;]+(?:Pass|Password|PWD)[:\s]+([^\s,;]+)/i);
      if (idPassMatch) {
        if (!roomId) roomId = idPassMatch[1];
        if (!roomPassword) roomPassword = idPassMatch[2];
        note = note.replace(idPassMatch[0], '').trim();
      } else {
        // Check for 2 tokens like "123214 adgeuk" or "123214 / adgeuk"
        const parts = note.split(/[\s,;/]+/).filter(Boolean);
        if (parts.length === 2 && !roomId && !roomPassword) {
          roomId = parts[0];
          roomPassword = parts[1];
          note = '';
        }
      }
    }

    return {
      roomId: roomId || 'TBA',
      roomPassword: roomPassword || 'TBA',
      note,
    };
  };

  // ────────────────────────── RENDER ──────────────────────────
  return (
    <div className="slots-page fade-in">
      {/* Toast Notification */}
      {notification && (
        <div className={`slot-toast-alert ${notification.type === 'success' ? 'toast-success' : 'toast-error'}`}>
          <div className="toast-icon">
            {notification.type === 'success' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            )}
          </div>
          <span className="toast-text">{notification.message}</span>
          <button className="toast-close-btn" onClick={() => setNotification(null)}>×</button>
        </div>
      )}

      {/* Header */}
      <div className="book-slots-header">
        <div className="header-title-container">
          <h1>BOOK <span>SLOTS</span></h1>
          <div className="header-underline"></div>
          <p>Register your team for the upcoming match with instant confirmation via Cashfree</p>
        </div>
      </div>

      {/* Loading / Empty / Slots Grid */}
      {loading ? (
        <div className="loading" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner" />
          <p>Loading Slots...</p>
        </div>
      ) : slots.length === 0 ? (
        <div className="empty-state" style={{ textAlign: 'center', padding: '3rem' }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ fill: 'none', stroke: '#6b6b80', width: '64px', height: '64px', margin: '0 auto 1rem' }}>
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          <h3>No Slots Available</h3>
          <p>Check back later for upcoming tournament slots.</p>
        </div>
      ) : (
        <div className="slots-grid">
          {slots.map((slot) => {
            const heroImage = slotImageUrl(slot) || imgsrc;
            const totalSlots = Number(slot.maxTeams) || 20;
            const bookedSlots = Math.max(0, Number(slot.bookedCount) || 0);
            const remainingSlots = Math.max(0, totalSlots - bookedSlots);
            const bookingProgress = Math.min(100, (bookedSlots / totalSlots) * 100);
            const userBooking = myBookings[slot._id];
            const isPaid = userBooking?.paymentStatus === 'paid';
            const isProcessing = processingSlotId === slot._id;

            return (
              <div key={slot._id} className={`slot-card ${isPaid ? 'slot-card-paid' : ''}`}>
                {/* ── Hero Image ── */}
                {heroImage && (
                  <div className="slot-image-container">
                    <img
                      src={heroImage}
                      alt={slot.matchName || 'Slot poster'}
                      className="slot-hero-image"
                    />
                    {isPaid && (
                      <div className="slot-paid-badge">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        BOOKED
                      </div>
                    )}
                  </div>
                )}

                <div className="slot-content">
                  {/* ── VIEW MODE ── */}
                  <div className="slot-view-mode">
                    <div className="tournament-details-header">
                      <div className="vertical-line"></div>
                      <h3>{slot.matchName ? slot.matchName.toUpperCase() : 'TOURNAMENT DETAILS'}</h3>
                    </div>
                    
                    <div className="details-grid">
                      <div className="detail-item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="detail-icon"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
                        <div className="detail-text">
                          <span className="detail-label">Prize Pool</span>
                          <span className="detail-value">
                            {slot.prizePool && slot.prizePool.length > 0 
                              ? `₹${slot.prizePool.reduce((sum, p) => sum + p.amount, 0)}` 
                              : '-'}
                          </span>
                        </div>
                      </div>

                      <div className="detail-item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="detail-icon"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                        <div className="detail-text">
                          <span className="detail-label">Entry Fee</span>
                          <span className="detail-value">₹{slot.entryFee}</span>
                        </div>
                      </div>

                      <div className="detail-item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="detail-icon"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
                        <div className="detail-text">
                          <span className="detail-label">Date</span>
                          <span className="detail-value">{slot.date || '-'}</span>
                        </div>
                      </div>

                      <div className="detail-item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="detail-icon"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        <div className="detail-text">
                          <span className="detail-label">Time</span>
                          <span className="detail-value">{slot.timing || '-'}</span>
                        </div>
                      </div>

                      <div className="detail-item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="detail-icon"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        <div className="detail-text">
                          <span className="detail-label">Teams</span>
                          <span className="detail-value">{slot.teams || '-'}</span>
                        </div>
                      </div>

                      <div className="detail-item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="detail-icon"><line x1="6" x2="10" y1="12" y2="12"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="15" x2="15.01" y1="13" y2="13"/><line x1="18" x2="18.01" y1="11" y2="11"/><rect width="20" height="12" x="2" y="6" rx="2"/></svg>
                        <div className="detail-text">
                          <span className="detail-label">Mode</span>
                          <span className="detail-value">{slot.mode || '-'}</span>
                        </div>
                      </div>

                      <div className="detail-item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="detail-icon"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/></svg>
                        <div className="detail-text">
                          <span className="detail-label">Maps</span>
                          <span className="detail-value">{slot.maps && slot.maps.length > 0 ? slot.maps.join(' + ') : '-'}</span>
                        </div>
                      </div>

                      <div className="detail-item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="detail-icon"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                        <div className="detail-text">
                          <span className="detail-label">ID Password</span>
                          <span className="detail-value">{slot.note || 'Will be provided 30 min before match'}</span>
                        </div>
                      </div>
                    </div>

                    {/* ── Action Buttons ── */}
                    {isPaid ? (
                      <button
                        type="button"
                        onClick={() => handleOpenCredentials(slot)}
                        className="register-now-btn credentials-btn"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        VIEW ROOM CREDENTIALS
                      </button>
                    ) : remainingSlots === 0 ? (
                      <button
                        type="button"
                        disabled
                        className="register-now-btn disabled-btn"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                        SLOT FULL
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRegisterSlot(slot)}
                        disabled={isProcessing}
                        className={`register-now-btn ${isProcessing ? 'btn-loading' : ''}`}
                      >
                        {isProcessing ? (
                          <>
                            <span className="btn-spinner"></span>
                            PROCESSING PAYMENT...
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                            REGISTER NOW • ₹{slot.entryFee}
                          </>
                        )}
                      </button>
                    )}

                    <div className={`limited-slots-footer ${remainingSlots === 0 ? 'slots-full' : remainingSlots <= 3 ? 'slots-low' : ''}`}>
                      <div className="slots-availability-copy">
                        <span className="slots-availability-label">
                          {remainingSlots === 0 ? 'Slot Full' : `${remainingSlots} Slot${remainingSlots === 1 ? '' : 's'} Remaining`}
                        </span>
                        <span className="slots-availability-detail">{bookedSlots} of {totalSlots} booked</span>
                      </div>
                      <div className="slots-availability-track" aria-label={`${bookedSlots} of ${totalSlots} slots booked`}>
                        <span style={{ width: `${bookingProgress}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Room Credentials Modal ── */}
      {credentialsModal && (() => {
        const resolved = getResolvedCredentials(credentialsModal.data);
        return (
          <div className="credentials-modal-overlay" onClick={() => setCredentialsModal(null)}>
            <div className="credentials-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="credentials-modal-header">
                <div>
                  <h2>ROOM <span>CREDENTIALS</span></h2>
                  <p className="credentials-modal-sub">{credentialsModal.slot.matchName || 'Tournament Match'}</p>
                </div>
                <button className="modal-close-btn" onClick={() => setCredentialsModal(null)}>×</button>
              </div>

              <div className="credentials-modal-body">
                {credentialsModal.loading ? (
                  <div className="modal-loading">
                    <div className="spinner"></div>
                    <p>Fetching latest credentials from server...</p>
                  </div>
                ) : credentialsModal.error ? (
                  <div className="credentials-locked-state">
                    <div className="lock-icon-wrap">
                      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <h3>Credentials Protected</h3>
                    <p className="locked-message">{credentialsModal.error}</p>
                  </div>
                ) : (
                  <div className="credentials-unlocked-state">
                    {credentialsModal.data?.isScheduled && resolved.roomId === 'TBA' && (
                      <div style={{ marginBottom: '1.25rem', padding: '0.75rem', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.25)', borderRadius: '8px', color: '#fef08a', fontSize: '0.85rem' }}>
                        ℹ️ {credentialsModal.data.message}
                      </div>
                    )}

                    <div className="credentials-field">
                      <span className="field-label">ROOM ID</span>
                      <div className="field-box">
                        <span className="field-value">{resolved.roomId}</span>
                        {resolved.roomId !== 'TBA' && (
                          <button
                            className="copy-field-btn"
                            onClick={() => copyToClipboard(resolved.roomId, 'roomId')}
                          >
                            {copiedField === 'roomId' ? 'COPIED!' : 'COPY'}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="credentials-field">
                      <span className="field-label">PASSWORD</span>
                      <div className="field-box">
                        <span className="field-value">{resolved.roomPassword}</span>
                        {resolved.roomPassword !== 'TBA' && (
                          <button
                            className="copy-field-btn"
                            onClick={() => copyToClipboard(resolved.roomPassword, 'password')}
                          >
                            {copiedField === 'password' ? 'COPIED!' : 'COPY'}
                          </button>
                        )}
                      </div>
                    </div>

                    {resolved.note && (
                      <div style={{ marginTop: '1.25rem', padding: '0.75rem 1rem', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '8px', borderLeft: '3px solid var(--purple-primary)', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                        <strong style={{ color: '#fff', display: 'block', marginBottom: '0.2rem' }}>📌 Match Instructions / Note:</strong>
                        {resolved.note}
                      </div>
                    )}

                    {credentialsModal.data?.whatsappLink && (
                      <div className="credentials-whatsapp-section">
                        <a
                          href={credentialsModal.data.whatsappLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="credentials-whatsapp-btn"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                          JOIN OFFICIAL MATCH WHATSAPP GROUP
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="credentials-modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button 
                  className="modal-refresh-btn" 
                  onClick={() => handleOpenCredentials(credentialsModal.slot)}
                  disabled={credentialsModal.loading}
                  style={{
                    background: 'rgba(124, 58, 237, 0.15)',
                    border: '1px solid rgba(124, 58, 237, 0.4)',
                    color: 'var(--purple-light)',
                    padding: '0.6rem 1rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                  REFRESH
                </button>

                <button className="modal-done-btn" onClick={() => setCredentialsModal(null)}>
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default TodaySlots;
