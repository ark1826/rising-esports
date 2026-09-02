import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { load } from '@cashfreepayments/cashfree-js';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function Tournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myRegistrations, setMyRegistrations] = useState({});
  const [processingTournamentId, setProcessingTournamentId] = useState(null);
  const [notification, setNotification] = useState(null);

  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');

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
    if (!userInfo || !userInfo.token) return;
    try {
      const { data } = await axios.get(`${API_BASE}/api/tournaments/my-registrations`, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      setMyRegistrations(data || {});
    } catch (err) {
      console.error('Error fetching user registrations', err);
    }
  }, [userInfo?.token]);

  useEffect(() => {
    fetchTournaments();
    fetchMyRegistrations();
  }, [fetchTournaments, fetchMyRegistrations]);

  // Auto-dismiss notifications after 6 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // ── Initiate Cashfree Payment for Tournament ──
  const handleRegisterTournament = async (tournament) => {
    if (!userInfo || !userInfo.token) {
      setNotification({
        type: 'error',
        message: 'Please login or create an account to register for this tournament.',
      });
      navigate('/user/login');
      return;
    }

    if (!tournament.registrationOpen) {
      setNotification({ type: 'error', message: 'Registration is currently closed for this tournament.' });
      return;
    }

    setProcessingTournamentId(tournament._id);
    setNotification(null);

    try {
      // Create pending booking and generate Cashfree payment session on server
      const { data } = await axios.post(
        `${API_BASE}/api/bookings/create`,
        { tournamentId: tournament._id },
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
      console.error('Tournament Registration/Cashfree error:', err);
      setNotification({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to initiate Cashfree payment. Please try again.',
      });
      setProcessingTournamentId(null);
    }
  };

  return (
    <div className="tournaments-page fade-in">
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
            const isRegistered = myRegistrations[t._id]?.paymentStatus === 'paid';
            const isProcessing = processingTournamentId === t._id;

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
                      <span className="tournament-price-value">₹{t.entryFee || 0}</span>
                    </div>

                    {isRegistered ? (
                      <button
                        type="button"
                        disabled
                        className="tournament-reg-btn registered-btn"
                        style={{
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: '#fff',
                          borderColor: '#10b981',
                          fontWeight: '700',
                          cursor: 'default',
                          opacity: 1
                        }}
                      >
                        ✓ ALREADY REGISTERED
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRegisterTournament(t)}
                        disabled={!t.registrationOpen || isProcessing}
                        className={`tournament-reg-btn ${!t.registrationOpen ? 'closed' : ''} ${isProcessing ? 'btn-loading' : ''}`}
                        style={t.registrationOpen ? {
                          background: 'var(--purple-primary)',
                          color: '#fff',
                          borderColor: 'var(--purple-primary)',
                          cursor: 'pointer',
                          fontWeight: '700',
                          boxShadow: '0 4px 15px rgba(124, 58, 237, 0.3)'
                        } : {}}
                      >
                        {isProcessing ? (
                          <>
                            <span className="btn-spinner"></span>
                            PROCESSING PAYMENT...
                          </>
                        ) : t.registrationOpen ? (
                          `REGISTER NOW • ₹${t.entryFee || 0}`
                        ) : (
                          'REGISTRATION CLOSED'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Tournaments;
