import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PaymentModal from '../components/PaymentModal';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function Tournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myRegistrations, setMyRegistrations] = useState({});
  const [notification, setNotification] = useState(null);
  const [paymentModal, setPaymentModal] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);

  const navigate = useNavigate();
  const getUserInfo = useCallback(() => {
    try {
      return JSON.parse(localStorage.getItem('userInfo') || 'null');
    } catch {
      return null;
    }
  }, []);
  const userInfo = getUserInfo();

  // ── Fetch all tournaments ──
  const fetchTournaments = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/tournaments`);
      setTournaments(data || []);
    } catch (error) {
      console.error('Error fetching tournaments', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch current user's tournament registrations ──
  const fetchMyRegistrations = useCallback(async () => {
    const currentUsr = getUserInfo();
    if (!currentUsr || !currentUsr.token) return;
    try {
      const { data } = await axios.get(`${API_BASE}/api/tournaments/my-registrations`, {
        headers: { Authorization: `Bearer ${currentUsr.token}` },
      });
      setMyRegistrations(data || {});
    } catch (err) {
      console.error('Error fetching user registrations', err);
    }
  }, [getUserInfo]);

  // ── Fetch wallet balance ──
  const fetchWalletBalance = useCallback(async () => {
    const currentUsr = getUserInfo();
    if (!currentUsr || !currentUsr.token) return;
    try {
      const { data } = await axios.get(`${API_BASE}/api/wallet/balance`, {
        headers: { Authorization: `Bearer ${currentUsr.token}` },
      });
      setWalletBalance(data.balance || 0);
    } catch {}
  }, [getUserInfo]);

  useEffect(() => {
    fetchTournaments();
    fetchMyRegistrations();
    fetchWalletBalance();
  }, [fetchTournaments, fetchMyRegistrations, fetchWalletBalance]);

  // Auto-dismiss notifications after 6 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // ── Tournament Registration via PaymentModal ──
  const handleRegisterTournament = (tournament) => {
    const currentUsr = getUserInfo();
    if (!currentUsr || !currentUsr.token) {
      navigate('/user/login', {
        state: {
          from: '/tournaments',
          message: 'Please login or register to participate in tournaments.',
        },
      });
      return;
    }
    if (!tournament.registrationOpen) {
      setNotification({ type: 'error', message: 'Registration is currently closed for this tournament.' });
      return;
    }

    const userReg = myRegistrations[tournament._id];
    if (userReg?.paymentStatus === 'paid') {
      setNotification({ type: 'info', message: 'You have already registered for this tournament!' });
      return;
    }
    if (userReg?.paymentStatus === 'pending' || userReg?.paymentStatus === 'pending_verification') {
      setNotification({ type: 'info', message: 'Your registration payment is already submitted and awaiting verification.' });
      return;
    }

    setPaymentModal(tournament);
  };

  // ── Handle payment success ──
  const handlePaymentSuccess = ({ method }) => {
    setPaymentModal(null);
    if (method === 'wallet') {
      setNotification({ type: 'success', message: '✅ Tournament registered successfully using wallet balance!' });
    } else {
      setNotification({ type: 'success', message: '⏳ UPI payment submitted! Awaiting admin verification.' });
    }
    fetchTournaments();
    fetchMyRegistrations();
    fetchWalletBalance();
  };

  return (
    <div className="tournaments-page fade-in">
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

      <div className="page-header">
        <h1>Available <span>Tournaments</span></h1>
        <p>Browse upcoming open events and competitive leagues. Register your team to compete for professional rewards.</p>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /><p>Loading Tournaments...</p></div>
      ) : tournaments.length === 0 ? (
        <div className="empty-state"><h3>No Tournaments Yet</h3><p>New events will appear here soon.</p></div>
      ) : (
        <div className="tournaments-grid">
          {tournaments.map(t => {
            const userReg = myRegistrations[t._id];
            const isRegistered = userReg?.paymentStatus === 'paid';
            const isPendingVerification = userReg?.paymentStatus === 'pending_verification' || userReg?.paymentStatus === 'pending';

            return (
              <div key={t._id} className={`tournament-card ${isRegistered ? 'tournament-card-paid' : ''}`}>
                <div className="tournament-image">
                  {t.hasPoster && <img src={`${API_BASE}/api/tournaments/${t._id}/poster`} alt={`${t.title} poster`} />}
                  <span className={`tournament-status-badge ${t.status ? t.status.toLowerCase() : 'upcoming'}`}>
                    {t.status}
                  </span>
                  {isRegistered ? (
                    <span className="tournament-coming-soon" style={{ background: '#10b981', color: '#fff', border: '1px solid #10b981' }}>
                      ✓ Registered
                    </span>
                  ) : isPendingVerification ? (
                    <span className="tournament-coming-soon" style={{ background: '#eab308', color: '#000', fontWeight: '800', border: '1px solid #eab308' }}>
                      ⏳ Pending Verification
                    </span>
                  ) : (
                    <span className="tournament-coming-soon">Upcoming</span>
                  )}
                </div>

                <div className="tournament-content">
                  <div className="tournament-poster-copy">
                    <span className="poster-kicker">MATCH DAY</span>
                    <span className="poster-title"><strong>{t.game || 'BGMI'}</strong> SHOWDOWN</span>
                    <span className="poster-lines" />
                  </div>

                  <div className="tournament-game">{t.game}</div>
                  <div className="tournament-title">{t.title}</div>
                  {t.description && <p className="tournament-description">{t.description}</p>}

                  <div className="tournament-info">
                    <div className="tournament-info-item">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{fill: 'none', stroke: '#6b6b80'}}>
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      <span>{t.date || 'TBA'}</span>
                    </div>
                    <div className="tournament-info-item">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{fill: 'none', stroke: '#6b6b80'}}>
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      <span>{t.location || 'ONLINE TOURNAMENT'}</span>
                    </div>
                  </div>

                  <div className="tournament-footer">
                    <div className="tournament-price-row">
                      <span className="tournament-price-label">Prize Pool</span>
                      <span className="tournament-price-value">₹{(t.prizePool || 0).toLocaleString()}</span>
                    </div>
                    <div className="tournament-price-row">
                      <span className="tournament-price-label">Entry Fee</span>
                      <span className="tournament-price-value">
                        {Number(t.entryFee || 0) === 0 ? 'FREE' : `₹${t.entryFee || 0}`}
                      </span>
                    </div>

                    {isRegistered ? (
                      <button
                        type="button"
                        disabled
                        className="tournament-reg-btn registered-btn"
                        title="You are registered for this tournament"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        REGISTERED ✓
                      </button>
                    ) : isPendingVerification ? (
                      <button
                        type="button"
                        onClick={() => setNotification({
                          type: 'info',
                          message: '⏳ Payment is pending verification. Admin will confirm your registration shortly!',
                        })}
                        className="tournament-reg-btn verifying-btn"
                        title="Click to check verification status"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        VERIFICATION PENDING ⏳
                      </button>
                    ) : !t.registrationOpen ? (
                      <button
                        type="button"
                        disabled
                        className="tournament-reg-btn closed-btn"
                        title="Registration is currently closed"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                        REGISTRATION CLOSED
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRegisterTournament(t)}
                        className="tournament-reg-btn open-btn"
                      >
                        {Number(t.entryFee || 0) === 0 ? 'REGISTER NOW • FREE' : `REGISTER NOW • ₹${t.entryFee || 0}`}
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {paymentModal && (
        <PaymentModal
          tournament={paymentModal}
          userInfo={getUserInfo()}
          walletBalance={walletBalance}
          onClose={() => setPaymentModal(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}

export default Tournaments;
