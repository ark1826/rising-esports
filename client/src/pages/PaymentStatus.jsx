import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function PaymentStatus() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id') || searchParams.get('orderId') || searchParams.get('txnId') || searchParams.get('transactionId');
  const urlError = searchParams.get('error');

  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState(null);
  const [copiedField, setCopiedField] = useState('');
  const [pollCount, setPollCount] = useState(0);

  const pollTimerRef = useRef(null);

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const verifyPayment = async (isBackgroundPoll = false) => {
    if (!orderId) {
      if (urlError === 'no_order_id' || urlError === 'no_transaction_id') {
        setError('No order reference was returned by Cashfree.');
      } else {
        setError('No order ID found in the URL. Please check your registered slots or bookings.');
      }
      setLoading(false);
      return;
    }

    if (!isBackgroundPoll) {
      setLoading(true);
      setError(null);
    }

    try {
      const { data } = await axios.get(`${API_URL}/api/bookings/status/${encodeURIComponent(orderId)}`);
      setPaymentData(data);

      // If status is still pending and we haven't polled 3 times yet, auto-retry in 2 seconds
      if (data.paymentStatus === 'pending' && pollCount < 3) {
        pollTimerRef.current = setTimeout(() => {
          setPollCount(prev => prev + 1);
          verifyPayment(true);
        }, 2000);
      }
    } catch (err) {
      console.error('Error verifying payment status:', err);
      setError(
        err.response?.data?.message ||
        'Unable to verify payment status with Cashfree. Please check your bookings or retry.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifyPayment();
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [orderId]);

  const booking = paymentData?.booking;
  const isSuccess = paymentData?.paymentStatus === 'paid' || booking?.paymentStatus === 'paid';
  const isPending = paymentData?.paymentStatus === 'pending' || booking?.paymentStatus === 'pending';

  const matchTitle = booking?.slotId?.matchName || booking?.tournamentId?.title || 'Esports Match';
  const gameMode = booking?.slotId?.mode || (booking?.type === 'tournament' ? 'Tournament Entry' : 'Custom Room');
  const matchDate = booking?.slotId?.date || (booking?.tournamentId?.date ? new Date(booking.tournamentId.date).toLocaleDateString('en-IN') : '');
  const matchTiming = booking?.slotId?.timing || '';

  return (
    <div style={{
      minHeight: '90vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1rem',
      background: 'radial-gradient(ellipse at top, #1e1145 0%, #0d0a1e 60%, #06040c 100%)',
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{
        maxWidth: '620px',
        width: '100%',
        background: 'rgba(19, 15, 43, 0.92)',
        backdropFilter: 'blur(20px)',
        border: isSuccess 
          ? '1px solid rgba(34, 197, 94, 0.4)' 
          : isPending 
          ? '1px solid rgba(234, 179, 8, 0.4)' 
          : '1px solid rgba(239, 68, 68, 0.4)',
        borderRadius: '24px',
        padding: '2.5rem 2rem',
        boxShadow: isSuccess 
          ? '0 0 50px rgba(34, 197, 94, 0.18), inset 0 0 30px rgba(34, 197, 94, 0.04)'
          : isPending
          ? '0 0 50px rgba(234, 179, 8, 0.18), inset 0 0 30px rgba(234, 179, 8, 0.04)'
          : '0 0 50px rgba(239, 68, 68, 0.18), inset 0 0 30px rgba(239, 68, 68, 0.04)',
        textAlign: 'center',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden'
      }}>

        {/* Top Glowing Ambient Light */}
        <div style={{
          position: 'absolute',
          top: '-80px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '260px',
          height: '160px',
          background: isSuccess ? 'rgba(34, 197, 94, 0.25)' : isPending ? 'rgba(234, 179, 8, 0.25)' : 'rgba(239, 68, 68, 0.25)',
          filter: 'blur(60px)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        {loading ? (
          <div style={{ padding: '2rem 1rem' }}>
            <div style={{
              width: '70px',
              height: '70px',
              border: '4px solid rgba(139, 92, 246, 0.2)',
              borderTopColor: '#a855f7',
              borderRadius: '50%',
              margin: '0 auto 1.5rem',
              animation: 'spin 0.9s linear infinite'
            }} />
            <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '1.4rem', letterSpacing: '1.5px', marginBottom: '0.6rem', color: '#f8fafc' }}>
              VERIFYING PAYMENT
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
              Checking real-time transaction confirmation with Cashfree...
            </p>
          </div>
        ) : error ? (
          <div>
            <div style={{
              width: '76px',
              height: '76px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '2px solid #ef4444',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              color: '#ef4444',
              fontSize: '2.2rem',
              boxShadow: '0 0 25px rgba(239, 68, 68, 0.3)'
            }}>
              ✕
            </div>
            <h2 style={{ fontFamily: "'Orbitron', sans-serif", color: '#f87171', fontSize: '1.4rem', marginBottom: '0.75rem', letterSpacing: '1px' }}>
              VERIFICATION ISSUE
            </h2>
            <p style={{ color: '#cbd5e1', fontSize: '0.95rem', marginBottom: '1.75rem', lineHeight: '1.6' }}>
              {error}
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => verifyPayment(false)}
                style={{
                  background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '0.8rem 1.6rem',
                  borderRadius: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  boxShadow: '0 4px 15px rgba(124, 58, 237, 0.35)'
                }}
              >
                Retry Status Check
              </button>
              <Link
                to="/slots"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#e2e8f0',
                  padding: '0.8rem 1.5rem',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '0.9rem'
                }}
              >
                Go to Slots
              </Link>
            </div>
          </div>
        ) : isSuccess ? (
          <div>
            {/* Animated Checkmark */}
            <div style={{
              width: '80px',
              height: '80px',
              background: 'rgba(34, 197, 94, 0.15)',
              border: '2px solid #22c55e',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              color: '#22c55e',
              fontSize: '2.5rem',
              boxShadow: '0 0 30px rgba(34, 197, 94, 0.35)',
              animation: 'bounceIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}>
              ✓
            </div>

            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(34, 197, 94, 0.15)',
              color: '#4ade80',
              padding: '0.4rem 1.2rem',
              borderRadius: '999px',
              fontSize: '0.78rem',
              fontWeight: '800',
              letterSpacing: '1.2px',
              textTransform: 'uppercase',
              marginBottom: '0.75rem',
              border: '1px solid rgba(34, 197, 94, 0.3)'
            }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#4ade80' }} />
              Cashfree Payment Verified
            </span>

            <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '1.55rem', marginBottom: '0.4rem', color: '#f8fafc', letterSpacing: '0.5px' }}>
              REGISTRATION CONFIRMED!
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
              Your entry has been booked in the Rising Esports system.
            </p>

            {/* Official Receipt Breakdown Card */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '1.4rem',
              textAlign: 'left',
              marginBottom: '1.75rem',
              fontSize: '0.9rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ color: '#94a3b8' }}>Event / Match:</span>
                <span style={{ fontWeight: '700', color: '#f1f5f9', textAlign: 'right' }}>
                  {matchTitle}
                </span>
              </div>

              {(gameMode || matchDate || matchTiming) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ color: '#94a3b8' }}>Schedule / Mode:</span>
                  <span style={{ color: '#cbd5e1', fontWeight: '500', textAlign: 'right' }}>
                    {[gameMode, matchDate, matchTiming].filter(Boolean).join(' • ')}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ color: '#94a3b8' }}>Amount Paid:</span>
                <span style={{ fontWeight: '800', color: '#4ade80', fontSize: '1.05rem' }}>
                  ₹{booking?.amount || '1'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ color: '#94a3b8' }}>Order ID:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontFamily: 'monospace', color: '#cbd5e1', fontSize: '0.82rem' }}>
                    {orderId}
                  </span>
                  <button
                    onClick={() => copyToClipboard(orderId, 'order')}
                    title="Copy Order ID"
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: 'none',
                      color: copiedField === 'order' ? '#4ade80' : '#94a3b8',
                      cursor: 'pointer',
                      borderRadius: '6px',
                      padding: '2px 6px',
                      fontSize: '0.75rem'
                    }}
                  >
                    {copiedField === 'order' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {booking?.paymentId && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ color: '#94a3b8' }}>Cashfree Ref:</span>
                  <span style={{ fontFamily: 'monospace', color: '#cbd5e1', fontSize: '0.82rem' }}>
                    {booking.paymentId}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                <span style={{ color: '#94a3b8' }}>Registered Team:</span>
                <span style={{ fontWeight: '700', color: '#a78bfa' }}>
                  {booking?.userId?.teamName || booking?.userId?.username || 'Your Team'}
                </span>
              </div>
            </div>

            {/* Direct Action Buttons */}
            <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                to="/slots"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                  color: '#fff',
                  padding: '0.85rem 1.8rem',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  fontWeight: '700',
                  fontSize: '0.92rem',
                  letterSpacing: '0.5px',
                  boxShadow: '0 4px 18px rgba(124, 58, 237, 0.45)',
                  transition: 'transform 0.2s'
                }}
              >
                View Match Slot & Room ID
              </Link>
              <Link
                to="/tournaments"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#e2e8f0',
                  padding: '0.85rem 1.5rem',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '0.92rem'
                }}
              >
                Tournaments
              </Link>
              <Link
                to="/"
                style={{
                  background: 'transparent',
                  color: '#94a3b8',
                  padding: '0.85rem 1.2rem',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  fontWeight: '500',
                  fontSize: '0.88rem'
                }}
              >
                Home
              </Link>
            </div>
          </div>
        ) : isPending ? (
          <div>
            <div style={{
              width: '76px',
              height: '76px',
              background: 'rgba(234, 179, 8, 0.12)',
              border: '2px solid #eab308',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              color: '#eab308',
              fontSize: '2.2rem',
              boxShadow: '0 0 25px rgba(234, 179, 8, 0.3)'
            }}>
              ⏳
            </div>
            <h2 style={{ fontFamily: "'Orbitron', sans-serif", color: '#facc15', fontSize: '1.4rem', marginBottom: '0.75rem', letterSpacing: '1px' }}>
              PAYMENT PROCESSING
            </h2>
            <p style={{ color: '#cbd5e1', fontSize: '0.95rem', marginBottom: '1.75rem', lineHeight: '1.6' }}>
              Your transaction is currently awaiting confirmation from Cashfree. If you completed payment, click below to check status.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => verifyPayment(false)}
                style={{
                  background: '#eab308',
                  color: '#000',
                  border: 'none',
                  padding: '0.8rem 1.6rem',
                  borderRadius: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  boxShadow: '0 4px 15px rgba(234, 179, 8, 0.35)'
                }}
              >
                Refresh Payment Status
              </button>
              <Link
                to="/slots"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                  padding: '0.8rem 1.5rem',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '0.9rem'
                }}
              >
                Go to Slots
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <div style={{
              width: '76px',
              height: '76px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '2px solid #ef4444',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              color: '#ef4444',
              fontSize: '2.2rem',
              boxShadow: '0 0 25px rgba(239, 68, 68, 0.3)'
            }}>
              ✕
            </div>
            <h2 style={{ fontFamily: "'Orbitron', sans-serif", color: '#f87171', fontSize: '1.4rem', marginBottom: '0.75rem', letterSpacing: '1px' }}>
              PAYMENT NOT COMPLETED
            </h2>
            <p style={{ color: '#cbd5e1', fontSize: '0.95rem', marginBottom: '1.75rem', lineHeight: '1.6' }}>
              {paymentData?.message || 'The payment was not completed or was cancelled at checkout.'}
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                to="/slots"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                  color: '#fff',
                  padding: '0.8rem 1.6rem',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  boxShadow: '0 4px 15px rgba(124, 58, 237, 0.35)'
                }}
              >
                Try Booking Again
              </Link>
              <Link
                to="/"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                  padding: '0.8rem 1.5rem',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '0.9rem'
                }}
              >
                Home
              </Link>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.08); opacity: 1; }
          70% { transform: scale(0.92); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

export default PaymentStatus;
