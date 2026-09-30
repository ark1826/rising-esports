import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PaymentModal from '../components/PaymentModal';
import bannerImg from '../assets/slots_banner.jpg';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const CATEGORIES = ['SCRIMS', 'GRANDS', 'WEEKLY WAR', 'WEEKEND WAR', 'ALL'];

function TodaySlots() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myBookings, setMyBookings] = useState({});
  const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message: string }
  const [credentialsModal, setCredentialsModal] = useState(null); // { slot, data: null, loading: false, error: null }
  const [teamsModalSlot, setTeamsModalSlot] = useState(null); // slot object for registered teams list modal
  const [copiedField, setCopiedField] = useState(null);
  const [paymentModal, setPaymentModal] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);

  // Filter States
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [selectedCategory, setSelectedCategory] = useState('SCRIMS');

  const navigate = useNavigate();
  const getUserInfo = useCallback(() => {
    try {
      return JSON.parse(localStorage.getItem('userInfo') || 'null');
    } catch {
      return null;
    }
  }, []);
  const userInfo = getUserInfo();

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
    const currentUsr = getUserInfo();
    if (!currentUsr || !currentUsr.token) return;
    try {
      const { data } = await axios.get(`${API_URL}/api/slots/my-bookings`, {
        headers: { Authorization: `Bearer ${currentUsr.token}` },
      });
      setMyBookings(data || {});
    } catch (err) {
      console.error('Error fetching user bookings', err);
    }
  }, [getUserInfo]);

  // ── Fetch wallet balance ──
  const fetchWalletBalance = useCallback(async () => {
    const currentUsr = getUserInfo();
    if (!currentUsr || !currentUsr.token) return;
    try {
      const { data } = await axios.get(`${API_URL}/api/wallet/balance`, {
        headers: { Authorization: `Bearer ${currentUsr.token}` },
      });
      setWalletBalance(data.balance || 0);
    } catch {}
  }, [getUserInfo]);

  useEffect(() => {
    fetchSlots();
    fetchMyBookings();
    fetchWalletBalance();
  }, [fetchSlots, fetchMyBookings, fetchWalletBalance]);

  // Auto-dismiss notifications after 6 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // ── Date Navigation Helpers ──
  const changeDate = (days) => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + days);
      return next;
    });
  };

  const resetToToday = () => {
    setSelectedDate(new Date());
  };

  const formatDateDisplay = (dateObj) => {
    return dateObj.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const isTodaySelected = useMemo(() => {
    const today = new Date();
    return (
      today.getFullYear() === selectedDate.getFullYear() &&
      today.getMonth() === selectedDate.getMonth() &&
      today.getDate() === selectedDate.getDate()
    );
  }, [selectedDate]);

  // ── Filtered Slots ──
  const filteredSlots = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const localIso = `${year}-${month}-${day}`;

    return slots.filter((slot) => {
      // 1. Filter by category
      if (selectedCategory !== 'ALL') {
        const slotCat = (slot.category || 'SCRIMS').toUpperCase();
        if (slotCat !== selectedCategory.toUpperCase()) {
          return false;
        }
      }

      // 2. Filter by date if slot has a date specified
      if (slot.date) {
        const slotDateStr = String(slot.date).trim();
        // Check ISO format YYYY-MM-DD
        if (slotDateStr.includes(localIso)) return true;

        // Check local date formatting e.g. 23 Sep 2026 or 28 Sep
        const formattedSel = formatDateDisplay(selectedDate).toLowerCase();
        if (slotDateStr.toLowerCase().includes(formattedSel)) return true;

        // If today is selected and slot is marked today, allow
        if (isTodaySelected && slotDateStr.toLowerCase().includes('today')) return true;

        // If the slot has a specific ISO date that differs from selected date, exclude
        if (/^\d{4}-\d{2}-\d{2}$/.test(slotDateStr) && slotDateStr !== localIso) {
          return false;
        }
      }

      return true;
    });
  }, [slots, selectedCategory, selectedDate, isTodaySelected]);

  // ── Open payment modal ──
  const openPaymentModal = (slot) => {
    const currentUsr = getUserInfo();
    if (!currentUsr || !currentUsr.token) {
      navigate('/user/login', {
        state: {
          from: '/slots',
          message: 'Please login or register to book a slot.',
        },
      });
      return;
    }

    const totalSlots = Number(slot.maxTeams) || 20;
    const bookedSlots = Math.max(0, Number(slot.bookedCount) || 0);
    const remainingSlots = Math.max(0, totalSlots - bookedSlots);

    if (slot.isSoldOut || remainingSlots <= 0) {
      setNotification({ type: 'error', message: 'This slot is already full / sold out.' });
      return;
    }

    const userBooking = myBookings[slot._id];
    if (userBooking?.paymentStatus === 'paid') {
      setNotification({ type: 'info', message: 'You have already booked and paid for this slot!' });
      return;
    }
    if (userBooking?.paymentStatus === 'pending' || userBooking?.paymentStatus === 'pending_verification') {
      setNotification({ type: 'info', message: 'Your payment is already submitted and awaiting admin verification.' });
      return;
    }

    setPaymentModal(slot);
  };

  const handlePaymentSuccess = ({ method }) => {
    setPaymentModal(null);
    if (method === 'wallet') {
      setNotification({ type: 'success', message: '✅ Slot booked successfully using wallet balance!' });
    } else {
      setNotification({ type: 'success', message: '⏳ Payment submitted! Awaiting admin verification.' });
    }
    fetchSlots();
    fetchMyBookings();
    fetchWalletBalance();
  };

  // ── Open Room Credentials Modal ──
  const handleOpenCredentials = async (slot) => {
    const currentUsr = getUserInfo();
    if (!currentUsr || !currentUsr.token) {
      navigate('/user/login', {
        state: {
          from: '/slots',
          message: 'Please login to access room credentials.',
        },
      });
      return;
    }

    setCredentialsModal({ slot, data: null, loading: true, error: null });

    try {
      const { data } = await axios.get(`${API_URL}/api/slots/${slot._id}/room-credentials`, {
        headers: { Authorization: `Bearer ${currentUsr.token}` },
      });
      setCredentialsModal({ slot, data, loading: false, error: null });
    } catch (err) {
      const errorData = err.response?.data;
      let errorMsg = errorData?.message || 'Unable to fetch room credentials.';
      if (errorData?.error === 'too_early') {
        const unlockTime = errorData.unlockAt
          ? new Date(errorData.unlockAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '30 minutes before the match';
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

  const getResolvedCredentials = (data) => {
    let roomId = (data?.roomId && data.roomId.trim() !== 'TBA') ? data.roomId.trim() : '';
    let roomPassword = (data?.roomPassword && data.roomPassword.trim() !== 'TBA') ? data.roomPassword.trim() : '';
    let note = (data?.note || '').trim();

    if ((!roomId || !roomPassword) && note) {
      const idPassMatch = note.match(/(?:ID|Room\s*ID)[:\s]+([^\s,;]+)[\s,;]+(?:Pass|Password|PWD)[:\s]+([^\s,;]+)/i);
      if (idPassMatch) {
        if (!roomId) roomId = idPassMatch[1];
        if (!roomPassword) roomPassword = idPassMatch[2];
        note = note.replace(idPassMatch[0], '').trim();
      } else {
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

  // Helper to resolve Prize Distribution
  const resolvePrizes = (slot) => {
    if (slot.prizeDistribution && slot.prizeDistribution.length > 0) {
      return slot.prizeDistribution.map((p, idx) => ({
        rank: p.rank ? (String(p.rank).startsWith('#') ? p.rank : `#${p.rank}`) : `#${idx + 1}`,
        prize: p.prize || (p.amount !== undefined ? `₹${p.amount}` : '-'),
      }));
    }
    if (slot.prizePool && slot.prizePool.length > 0) {
      return slot.prizePool.map((p, idx) => ({
        rank: `#${p.position || p.rank || idx + 1}`,
        prize: p.amount !== undefined ? `₹${p.amount}` : (p.prize || '-'),
      }));
    }
    // Fallback default structure
    return [
      { rank: '#1', prize: '₹400' },
      { rank: '#2', prize: '₹150' },
      { rank: '#3', prize: '₹100' },
      { rank: '#4', prize: '₹70' },
      { rank: '#5', prize: 'FREE' },
    ];
  };

  // Helper to resolve Match Schedule
  const resolveSchedule = (slot) => {
    if (slot.scheduleMatches && slot.scheduleMatches.length > 0) {
      return slot.scheduleMatches;
    }
    if (slot.timing) {
      const parts = slot.timing.split(/[-–|]+/).map((s) => s.trim()).filter(Boolean);
      if (parts.length > 1) {
        return parts.map((timeStr, idx) => ({
          matchNumber: idx + 1,
          label: `MATCH ${idx + 1}`,
          time: /am|pm/i.test(timeStr) ? timeStr : `${timeStr} PM`,
        }));
      }
      return [{ matchNumber: 1, label: 'MATCH 1', time: slot.timing }];
    }
    return [
      { matchNumber: 1, label: 'MATCH 1', time: '1:42 PM' },
      { matchNumber: 2, label: 'MATCH 2', time: '2:22 PM' },
      { matchNumber: 3, label: 'MATCH 3', time: '3:02 PM' },
    ];
  };

  // Helper to resolve Maps
  const resolveMaps = (slot) => {
    if (slot.maps && Array.isArray(slot.maps) && slot.maps.length > 0) {
      const flattened = slot.maps.flatMap((m) => {
        if (!m) return [];
        if (typeof m === 'string') {
          return m.split(/[\s,+/]+/).filter(Boolean);
        }
        return [String(m)];
      });
      if (flattened.length > 0) return flattened;
    }
    return ['ERANGEL', 'RONDO', 'MIRAMAR'];
  };

  // Avatar color helper
  const avatarColors = ['coral', 'blue', 'emerald', 'purple'];

  return (
    <div className="ts-page-wrapper fade-in">
      {/* Toast Notification */}
      {notification && (
        <div className={`slot-toast-alert ${notification.type === 'success' ? 'toast-success' : notification.type === 'info' ? 'toast-info' : 'toast-error'}`}>
          <div className="toast-icon">
            {notification.type === 'success' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            ) : notification.type === 'info' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            )}
          </div>
          <span className="toast-text">{notification.message}</span>
          <button className="toast-close-btn" onClick={() => setNotification(null)}>×</button>
        </div>
      )}

      {/* ── Hero Banner (Matching Screenshot) ── */}
      <div className="ts-hero-banner">
        <div
          className="ts-hero-bg"
          style={{ backgroundImage: `url(${bannerImg})` }}
        />
        <div className="ts-hero-overlay" />
        <div className="ts-hero-content">
          <div className="ts-hero-left">
            <div className="ts-calendar-icon-box">
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
                <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
              </svg>
            </div>
            <div className="ts-hero-titles">
              <h4>TODAY'S</h4>
              <h1>SLOTS</h1>
              <p>Book your slot, participate in tournaments and climb the rankings!</p>
            </div>
          </div>
          <div className="ts-hero-badge">
            <div className="ts-hero-crest">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <span>RISING</span>
              <span style={{ color: '#fff', fontWeight: 900 }}>TOGETHER</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Date Navigator Bar ── */}
      <div className="ts-date-bar">
        <button
          type="button"
          className="ts-date-arrow-btn"
          onClick={() => changeDate(-1)}
          aria-label="Previous day"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className="ts-date-info" onClick={resetToToday} title="Click to reset to today">
          <div className="ts-date-sub">{isTodaySelected ? 'TODAY' : 'SELECTED DATE'}</div>
          <div className="ts-date-main">{formatDateDisplay(selectedDate)}</div>
        </div>

        <button
          type="button"
          className="ts-date-arrow-btn"
          onClick={() => changeDate(1)}
          aria-label="Next day"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* ── Category Filter Tabs ── */}
      <div className="ts-tabs-row">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`ts-tab-pill ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Available Slots Header ── */}
      <div className="ts-section-header">
        <div className="ts-section-title">
          <div className="ts-indicator-bar" />
          <h2>Available Slots</h2>
        </div>
        <div className="ts-count-badge">
          {filteredSlots.length} AVAILABLE
        </div>
      </div>

      {/* ── Content Grid / Loading / Empty State ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#a78bfa' }}>
          <div className="spinner" style={{ margin: '0 auto 1.5rem' }} />
          <p style={{ fontWeight: 700, letterSpacing: '1px' }}>LOADING SLOTS...</p>
        </div>
      ) : filteredSlots.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3.5rem 1.5rem',
          background: 'rgba(15, 12, 30, 0.6)',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          borderRadius: '18px',
          color: '#94a3b8'
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ stroke: '#8b5cf6', margin: '0 auto 1rem', opacity: 0.6 }}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <h3 style={{ color: '#fff', fontSize: '1.25rem', marginBottom: '0.4rem' }}>No Slots Available</h3>
          <p style={{ fontSize: '0.9rem', maxWidth: '360px', margin: '0 auto 1.25rem' }}>
            There are no slots scheduled under <strong>{selectedCategory}</strong> for {formatDateDisplay(selectedDate)}.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {selectedCategory !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                style={{
                  background: 'rgba(121, 40, 202, 0.25)',
                  border: '1px solid #7928ca',
                  color: '#c084fc',
                  padding: '0.5rem 1.25rem',
                  borderRadius: '8px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                VIEW ALL CATEGORIES
              </button>
            )}
            {!isTodaySelected && (
              <button
                type="button"
                onClick={resetToToday}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  padding: '0.5rem 1.25rem',
                  borderRadius: '8px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                GO TO TODAY
              </button>
            )}
          </div>
        </div>
      ) : (
        filteredSlots.map((slot) => {
          const totalSlots = Number(slot.maxTeams) || 20;
          const bookedSlots = Math.max(0, Number(slot.bookedCount) || 0);
          const remainingSlots = Math.max(0, totalSlots - bookedSlots);
          const userBooking = myBookings[slot._id];
          const isPaid = userBooking?.paymentStatus === 'paid';
          const isPending = userBooking?.paymentStatus === 'pending' || userBooking?.paymentStatus === 'pending_verification';
          const isSoldOut = Boolean(slot.isSoldOut || remainingSlots <= 0);

          const prizes = resolvePrizes(slot);
          const schedule = resolveSchedule(slot);
          const maps = resolveMaps(slot);
          const bookedTeams = slot.bookedTeams || [];

          return (
            <div key={slot._id} className="ts-slot-card">
              {/* ── Top Header Row ── */}
              <div className="ts-card-top">
                <h3 className="ts-card-title">{slot.matchName || 'RISING 1-3 GRIND SCRIMS'}</h3>
                <span className="ts-lobby-badge">{slot.lobby || 'LOBBY 1'}</span>
              </div>

              {/* ── Box 1: Prize Pool Distribution ── */}
              <div className="ts-inner-panel">
                <div className="ts-panel-head">
                  <div className="ts-panel-label">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="6 9 12 15 18 9"/>
                      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                      <path d="M4 22h16"/>
                      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
                    </svg>
                    PRIZE POOL DISTRIBUTION
                  </div>
                </div>

                <div className="ts-prize-grid">
                  {prizes.map((p, idx) => {
                    const isGold = p.rank === '#1' || String(p.rank).includes('1') || idx === 0;
                    const isFree = String(p.prize).toUpperCase().includes('FREE');
                    return (
                      <div key={idx} className="ts-prize-card">
                        <div className="ts-prize-rank">{p.rank}</div>
                        <div className={`ts-prize-val ${isGold ? 'gold' : isFree ? 'free' : ''}`}>
                          {p.prize}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Box 2: Schedule ── */}
              <div className="ts-inner-panel">
                <div className="ts-panel-head">
                  <div className="ts-panel-label">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    SCHEDULE ({schedule.length} MATCH{schedule.length === 1 ? '' : 'ES'})
                  </div>
                  <div className="ts-slots-fraction">
                    SLOTS: {bookedSlots}/{totalSlots}
                  </div>
                </div>

                <div className="ts-schedule-grid">
                  {schedule.map((m, idx) => (
                    <div key={idx} className="ts-match-card">
                      <div className="ts-match-name">{m.label || `MATCH ${m.matchNumber || idx + 1}`}</div>
                      <div className="ts-match-clock">{m.time}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Box 3: Teams Row (Clickable) ── */}
              <div
                className="ts-teams-row"
                onClick={() => setTeamsModalSlot(slot)}
                title="Click to view registered teams"
              >
                <div className="ts-teams-left">
                  <div className="ts-avatars-cluster">
                    {bookedTeams.slice(0, 2).map((team, idx) => {
                      const initial = (team.teamName || 'T').charAt(0).toUpperCase();
                      const colorClass = avatarColors[idx % avatarColors.length];
                      return (
                        <div key={idx} className={`ts-avatar-dot ${colorClass}`}>
                          {initial}
                        </div>
                      );
                    })}
                    {bookedTeams.length > 2 && (
                      <div className="ts-avatar-dot more">
                        +{bookedTeams.length - 2}
                      </div>
                    )}
                    {bookedTeams.length === 0 && (
                      <div className="ts-avatar-dot purple">
                        0
                      </div>
                    )}
                  </div>
                  <span className="ts-teams-text">
                    Teams ({bookedSlots}/{totalSlots})
                  </span>
                </div>

                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>

              {/* ── Map Rotation ── */}
              <div className="ts-maps-block">
                <div className="ts-maps-title">MAP ROTATION</div>
                <div className="ts-maps-pills">
                  {maps.map((mapName, idx) => (
                    <span
                      key={idx}
                      className={`ts-map-badge ${idx === 0 ? 'active' : ''}`}
                    >
                      {mapName}
                    </span>
                  ))}
                </div>
              </div>

              {/* ── Card Footer: Entry Fee & Book Action ── */}
              <div className="ts-card-bottom">
                <div className="ts-fee-col">
                  <span className="ts-fee-label">SLOT ENTRY FEE</span>
                  <span className="ts-fee-value">
                    {Number(slot.entryFee ?? slot.price ?? 0) === 0 ? 'FREE' : `₹${slot.entryFee ?? slot.price ?? 0}`}
                  </span>
                </div>

                {isPaid ? (
                  <button
                    type="button"
                    onClick={() => handleOpenCredentials(slot)}
                    className="ts-book-action-btn booked"
                    title="View room credentials"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    ROOM CREDENTIALS 🔑
                  </button>
                ) : isPending ? (
                  <button
                    type="button"
                    onClick={() => setNotification({
                      type: 'info',
                      message: '⏳ Payment submitted and pending admin verification. Room credentials will unlock as soon as approved!',
                    })}
                    className="ts-book-action-btn verifying"
                    title="Click for verification status"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    VERIFICATION PENDING ⏳
                  </button>
                ) : isSoldOut ? (
                  <button
                    type="button"
                    disabled
                    className="ts-book-action-btn sold-out"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                    </svg>
                    SOLD OUT
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => openPaymentModal(slot)}
                    className="ts-book-action-btn"
                  >
                    BOOK SLOT
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}

      {/* ── Registered Teams Modal ── */}
      {teamsModalSlot && createPortal(
        <div className="ts-modal-overlay" onClick={() => setTeamsModalSlot(null)}>
          <div className="ts-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="ts-modal-header">
              <div>
                <h3 className="ts-modal-title">REGISTERED TEAMS</h3>
                <p style={{ fontSize: '0.8rem', color: '#a78bfa', margin: '0.2rem 0 0' }}>
                  {teamsModalSlot.matchName} • {teamsModalSlot.lobby || 'LOBBY 1'}
                </p>
              </div>
              <button className="ts-modal-close-btn" onClick={() => setTeamsModalSlot(null)}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
              {teamsModalSlot.bookedTeams && teamsModalSlot.bookedTeams.length > 0 ? (
                teamsModalSlot.bookedTeams.map((team, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      background: 'rgba(22, 17, 46, 0.75)',
                      border: '1px solid rgba(139, 92, 246, 0.25)',
                      borderRadius: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'rgba(121, 40, 202, 0.3)',
                        border: '1px solid #7928ca',
                        color: '#c084fc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem',
                        fontWeight: 800
                      }}>
                        {idx + 1}
                      </span>
                      <div>
                        <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.92rem' }}>
                          {team.teamName}
                        </div>
                        {team.teamTag && (
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', letterSpacing: '0.5px' }}>
                            [{team.teamTag}]
                          </span>
                        )}
                      </div>
                    </div>

                    <span style={{
                      padding: '0.25rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      background: team.paymentStatus === 'paid' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      color: team.paymentStatus === 'paid' ? '#10b981' : '#f59e0b',
                      border: team.paymentStatus === 'paid' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)'
                    }}>
                      {team.paymentStatus === 'paid' ? 'CONFIRMED' : 'PENDING'}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8' }}>
                  <p style={{ margin: 0, fontWeight: 700 }}>No teams registered yet.</p>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>Be the first team to book this slot!</p>
                </div>
              )}
            </div>

            <div style={{ marginTop: '1.25rem', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setTeamsModalSlot(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  padding: '0.55rem 1.25rem',
                  borderRadius: '8px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Room Credentials Modal ── */}
      {credentialsModal && (() => {
        const resolved = getResolvedCredentials(credentialsModal.data);
        return createPortal(
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
                    <div className="spinner" />
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
                            type="button"
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
                            type="button"
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
                  type="button"
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

                <button
                  type="button"
                  className="modal-done-btn"
                  onClick={() => setCredentialsModal(null)}
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}

      {/* ── Payment Modal ── */}
      {paymentModal && (
        <PaymentModal
          slot={paymentModal}
          userInfo={getUserInfo()}
          walletBalance={walletBalance}
          onClose={() => setPaymentModal(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}

export default TodaySlots;
