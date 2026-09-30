import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import paymentQR from '../assets/payment_qr.png';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ── UPI App icons ──────────────────────────────────────────────────────────
const UPI_APPS = [
  {
    name: 'GPay',
    color: '#1a73e8',
    icon: (
      <svg viewBox="0 0 48 48" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="24" fill="#fff"/>
        <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1a73e8" fontFamily="Arial">GPay</text>
      </svg>
    ),
  },
  {
    name: 'PhonePe',
    color: '#5f259f',
    icon: (
      <svg viewBox="0 0 48 48" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="24" fill="#5f259f"/>
        <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="8" fontWeight="700" fill="#fff" fontFamily="Arial">PhPe</text>
      </svg>
    ),
  },
  {
    name: 'Paytm',
    color: '#00b9f1',
    icon: (
      <svg viewBox="0 0 48 48" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="24" fill="#00b9f1"/>
        <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff" fontFamily="Arial">Paytm</text>
      </svg>
    ),
  },
  {
    name: 'BHIM',
    color: '#00803e',
    icon: (
      <svg viewBox="0 0 48 48" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="24" fill="#00803e"/>
        <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff" fontFamily="Arial">BHIM</text>
      </svg>
    ),
  },
];

export default function PaymentModal({ slot, tournament, onClose, onSuccess, userInfo, walletBalance }) {
  const [activeTab, setActiveTab] = useState('wallet');
  const [utrNumber, setUtrNumber] = useState('');
  const [processing, setProcessing] = useState(false);
  const [utrError, setUtrError] = useState('');
  const [copied, setCopied] = useState(false);
  const [payConfig, setPayConfig] = useState({ upiId: 'Q264921089@ybl', upiName: 'Rising Esports' });

  const item = slot || tournament;
  const isSlot = Boolean(slot);
  const amount = Number(item?.entryFee || item?.price || 0);
  const itemName = isSlot ? (item?.matchName || 'Match Slot') : (item?.title || 'Tournament');

  // Use actual QR code image provided by admin
  const qrUrl = paymentQR;

  // Fetch payment config on mount
  useEffect(() => {
    axios.get(`${API_URL}/api/config/payment`)
      .then(r => setPayConfig(r.data))
      .catch(() => {});
  }, []);

  // Lock body scroll on mount & handle Escape key
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const copyUpiId = () => {
    navigator.clipboard.writeText(payConfig.upiId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Wallet payment ──
  const handleWalletPay = async () => {
    if (!userInfo?.token) return;
    setProcessing(true);
    try {
      const endpoint = isSlot ? '/api/wallet/pay-slot' : '/api/wallet/pay-tournament';
      const body = isSlot ? { slotId: item._id } : { tournamentId: item._id };
      const { data } = await axios.post(`${API_URL}${endpoint}`, body, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      onSuccess({ method: 'wallet', data, status: 'paid' });
    } catch (err) {
      setUtrError(err.response?.data?.message || 'Wallet payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // ── UPI payment ──
  const handleUpiSubmit = async () => {
    const trimmedUtr = utrNumber.trim();
    if (!trimmedUtr) {
      setUtrError('Please enter your UPI Transaction ID (UTR number)');
      return;
    }
    if (trimmedUtr.length < 6) {
      setUtrError('Transaction ID must be at least 6 characters');
      return;
    }
    setUtrError('');
    setProcessing(true);
    try {
      const body = {
        utrNumber: trimmedUtr,
        ...(isSlot ? { slotId: item._id } : { tournamentId: item._id }),
      };
      const { data } = await axios.post(`${API_URL}/api/bookings/create`, body, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      onSuccess({ method: 'upi', data, status: 'pending_verification' });
    } catch (err) {
      setUtrError(err.response?.data?.message || 'Failed to submit payment. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const hasSufficientBalance = (walletBalance || 0) >= amount;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="payment-modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="payment-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pinned Top Header */}
        <div className="payment-modal-header">
          <div className="payment-modal-header-info">
            <div className="payment-modal-badge-row">
              <span className="payment-modal-type-tag">
                {isSlot ? 'MATCH SLOT' : 'TOURNAMENT'}
              </span>
              <span className="payment-modal-status-tag">SECURE CHECKOUT</span>
            </div>
            <h2 className="payment-modal-title" title={itemName}>
              {itemName.toUpperCase()}
            </h2>
          </div>

          <div className="payment-modal-header-actions">
            <div className="payment-modal-amount-box">
              <span className="payment-modal-amount-lbl">ENTRY FEE</span>
              <span className="payment-modal-amount-val">₹{amount}</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="payment-modal-close-btn"
              title="Close payment modal"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* Pinned Top Payment Method Selection Tabs */}
        <div className="payment-modal-tabs">
          <button
            type="button"
            className={`payment-tab-btn ${activeTab === 'wallet' ? 'active' : ''}`}
            onClick={() => { setActiveTab('wallet'); setUtrError(''); }}
          >
            <div className="tab-title-row">
              <span className="tab-icon">💳</span>
              <span className="tab-title">Wallet Pay</span>
              {hasSufficientBalance ? (
                <span className="tab-badge green">READY</span>
              ) : (
                <span className="tab-badge red">LOW</span>
              )}
            </div>
            <div className="tab-sublabel">
              Balance: <span style={{ color: hasSufficientBalance ? '#4ade80' : '#f87171', fontWeight: 700 }}>₹{walletBalance || 0}</span>
            </div>
          </button>

          <button
            type="button"
            className={`payment-tab-btn ${activeTab === 'upi' ? 'active' : ''}`}
            onClick={() => { setActiveTab('upi'); setUtrError(''); }}
          >
            <div className="tab-title-row">
              <span className="tab-icon">📱</span>
              <span className="tab-title">UPI / QR Code</span>
              <span className="tab-badge purple">FAST</span>
            </div>
            <div className="tab-sublabel">
              GPay • PhonePe • Paytm
            </div>
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="payment-modal-scroll">

          {/* ── WALLET TAB ── */}
          {activeTab === 'wallet' && (
            <div className="wallet-tab-content">
              {/* Balance Card */}
              <div className={`wallet-balance-card ${hasSufficientBalance ? 'has-funds' : 'low-funds'}`}>
                <div>
                  <p className="wallet-card-lbl">Available Wallet Balance</p>
                  <p className="wallet-card-amount">
                    ₹{walletBalance || 0}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p className="wallet-card-lbl">Required Amount</p>
                  <p className="wallet-card-required">₹{amount}</p>
                </div>
              </div>

              {hasSufficientBalance ? (
                <>
                  {/* Cost Breakdown */}
                  <div className="wallet-breakdown-box">
                    <div className="wallet-breakdown-row">
                      <span>Entry Fee</span>
                      <span>₹{amount}</span>
                    </div>
                    <div className="wallet-breakdown-row total">
                      <span>Remaining Balance After Payment</span>
                      <span>₹{(walletBalance || 0) - amount}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleWalletPay}
                    disabled={processing}
                    className="payment-action-btn wallet-btn"
                  >
                    {processing ? (
                      <>
                        <span className="btn-spinner" />
                        PROCESSING PAYMENT...
                      </>
                    ) : (
                      <>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        PAY ₹{amount} INSTANTLY WITH WALLET
                      </>
                    )}
                  </button>
                  <p className="payment-secure-note">
                    🔒 Instant slot confirmation · Deducted from your wallet balance
                  </p>
                </>
              ) : (
                <div className="wallet-insufficient-box">
                  <div className="insufficient-icon">💸</div>
                  <h3 className="insufficient-title">Insufficient Wallet Balance</h3>
                  <p className="insufficient-desc">
                    You have <strong style={{ color: '#fff' }}>₹{walletBalance || 0}</strong>, but need <strong style={{ color: '#f87171' }}>₹{amount}</strong> (short by ₹{amount - (walletBalance || 0)}).
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('upi')}
                    className="payment-action-btn switch-upi-btn"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><line x1="12" x2="12.01" y1="18" y2="18"/></svg>
                    PAY VIA UPI / QR INSTEAD
                  </button>
                </div>
              )}

              {utrError && (
                <div className="payment-error-alert">
                  ⚠️ {utrError}
                </div>
              )}
            </div>
          )}

          {/* ── UPI TAB ── */}
          {activeTab === 'upi' && (
            <div className="upi-tab-content">
              {/* Step indicator */}
              <div className="upi-step-indicator">
                {[
                  { step: '1', title: 'Scan QR' },
                  { step: '2', title: `Pay ₹${amount}` },
                  { step: '3', title: 'Enter UTR' },
                ].map((s, i) => (
                  <div key={i} className="step-item">
                    <div className="step-num">{s.step}</div>
                    <div className="step-label">{s.title}</div>
                  </div>
                ))}
              </div>

              {/* QR Code Container */}
              <div className="upi-qr-card">
                <div className="upi-qr-wrapper">
                  <img
                    src={qrUrl}
                    alt="UPI QR Code - Scan to pay Rising Esports"
                    className="upi-qr-img"
                  />
                </div>
                <p className="upi-scan-caption">
                  Scan & pay <strong style={{ color: '#c084fc', fontSize: '1rem' }}>₹{amount}</strong> using any UPI app
                </p>

                {/* UPI Apps Row */}
                <div className="upi-apps-row">
                  {UPI_APPS.map(app => (
                    <div key={app.name} className="upi-app-item">
                      <div
                        className="upi-app-icon-wrap"
                        style={{ background: `${app.color}20`, borderColor: `${app.color}44` }}
                      >
                        {app.icon}
                      </div>
                      <span className="upi-app-name">{app.name}</span>
                    </div>
                  ))}
                </div>

                {/* UPI ID copy row */}
                <div className="upi-id-copy-row">
                  <div style={{ textAlign: 'left', minWidth: 0 }}>
                    <p className="upi-id-lbl">OFFICIAL UPI ID</p>
                    <p className="upi-id-val">{payConfig.upiId}</p>
                  </div>
                  <button
                    type="button"
                    onClick={copyUpiId}
                    className={`upi-copy-btn ${copied ? 'copied' : ''}`}
                  >
                    {copied ? '✓ COPIED' : '📋 COPY ID'}
                  </button>
                </div>
              </div>

              {/* Instructions banner */}
              <div className="upi-guide-box">
                <div className="guide-header">⚡ How to complete payment:</div>
                <ol className="guide-list">
                  <li>Scan the QR code or send <strong>₹{amount}</strong> to <strong>{payConfig.upiId}</strong></li>
                  <li>Copy the <strong>12-digit UPI Reference / UTR Number</strong> from your payment receipt</li>
                  <li>Paste the UTR number in the box below and click <strong>"Confirm Payment"</strong></li>
                </ol>
              </div>

              {/* UTR Input Section */}
              <div className="utr-input-group">
                <label className="utr-label">
                  UPI Transaction ID / UTR Number *
                </label>
                <input
                  type="text"
                  value={utrNumber}
                  onChange={e => { setUtrNumber(e.target.value); setUtrError(''); }}
                  placeholder="e.g. 426312598765"
                  className={`utr-input ${utrError ? 'input-error' : ''}`}
                />
                {utrError && (
                  <p className="utr-error-text">⚠️ {utrError}</p>
                )}
                <p className="utr-helper-text">
                  Tip: Look under "Transaction Details" or "UTR / Ref No." in GPay, PhonePe, or Paytm.
                </p>
              </div>

              <button
                type="button"
                onClick={handleUpiSubmit}
                disabled={processing || !utrNumber.trim()}
                className="payment-action-btn upi-confirm-btn"
              >
                {processing ? (
                  <>
                    <span className="btn-spinner" />
                    SUBMITTING FOR VERIFICATION...
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    CONFIRM PAYMENT (₹{amount})
                  </>
                )}
              </button>

              <p className="payment-secure-note">
                ⏱ Admin verifies within 30 min · Slot is reserved upon submission
              </p>
            </div>
          )}
        </div>

        {/* Pinned Bottom Footer */}
        <div className="payment-modal-footer">
          <p className="footer-secure-badge">
            <span>🔒</span> 256-Bit Encrypted · Rising Esports
          </p>
          <button
            type="button"
            onClick={onClose}
            className="payment-modal-cancel-btn"
          >
            Cancel
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes modalDropIn {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(-14px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .payment-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          inset: 0;
          z-index: 999999;
          background: rgba(4, 3, 10, 0.88);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          display: flex;
          justify-content: center;
          align-items: flex-start;
          overflow-y: auto !important;
          -webkit-overflow-scrolling: touch;
          padding: 1.25rem 1rem 2.5rem;
          padding-top: max(1.25rem, env(safe-area-inset-top, 1.25rem));
          padding-bottom: max(2rem, env(safe-area-inset-bottom, 2rem));
          box-sizing: border-box;
        }

        .payment-modal-container {
          width: 100%;
          max-width: 490px;
          background: linear-gradient(165deg, #131127 0%, #0d0c18 50%, #090812 100%);
          border: 1px solid rgba(139, 92, 246, 0.35);
          border-radius: 18px;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.85), 0 0 40px rgba(124, 58, 237, 0.25);
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          max-height: calc(100dvh - 2.5rem);
          max-height: calc(100vh - 2.5rem);
          min-height: 0;
          overflow: hidden;
          position: relative;
          animation: modalDropIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          box-sizing: border-box;
        }

        /* ── Header ── */
        .payment-modal-header {
          padding: 1rem 1.25rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
          background: rgba(18, 16, 36, 0.7);
          box-sizing: border-box;
        }
        .payment-modal-header-info {
          flex: 1;
          min-width: 0;
          padding-right: 0.75rem;
        }
        .payment-modal-badge-row {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          margin-bottom: 0.25rem;
        }
        .payment-modal-type-tag {
          font-size: 0.62rem;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
          padding: 2px 7px;
          border-radius: 4px;
          background: rgba(139, 92, 246, 0.2);
          color: #c4b5fd;
          border: 1px solid rgba(139, 92, 246, 0.35);
        }
        .payment-modal-status-tag {
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.5px;
          color: #4ade80;
        }
        .payment-modal-title {
          font-family: 'Orbitron', sans-serif;
          font-size: 0.98rem;
          font-weight: 700;
          color: #f8fafc;
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .payment-modal-header-actions {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          flex-shrink: 0;
        }
        .payment-modal-amount-box {
          text-align: right;
        }
        .payment-modal-amount-lbl {
          font-size: 0.62rem;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 1px;
          display: block;
        }
        .payment-modal-amount-val {
          font-family: 'Orbitron', sans-serif;
          font-size: 1.4rem;
          font-weight: 800;
          background: linear-gradient(135deg, #c084fc, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          line-height: 1;
          display: block;
        }
        .payment-modal-close-btn {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #94a3b8;
          border-radius: 50%;
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 1.3rem;
          line-height: 1;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        .payment-modal-close-btn:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.4);
          color: #f87171;
          transform: rotate(90deg);
        }

        /* ── Tabs (Always Pinned At Top) ── */
        .payment-modal-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: rgba(14, 12, 28, 0.9);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          flex-shrink: 0;
          gap: 1px;
        }
        .payment-tab-btn {
          padding: 0.85rem 0.6rem;
          border: none;
          background: rgba(255, 255, 255, 0.02);
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
        }
        .payment-tab-btn:hover {
          background: rgba(124, 58, 237, 0.08);
        }
        .payment-tab-btn.active {
          background: rgba(124, 58, 237, 0.16);
          border-bottom: 3px solid #8b5cf6;
          box-shadow: inset 0 -3px 8px rgba(139, 92, 246, 0.25);
        }
        .tab-title-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          flex-wrap: wrap;
        }
        .tab-icon {
          font-size: 0.95rem;
        }
        .tab-title {
          font-family: 'Orbitron', sans-serif;
          font-size: 0.85rem;
          font-weight: 700;
          color: #94a3b8;
          letter-spacing: 0.5px;
        }
        .payment-tab-btn.active .tab-title {
          color: #f1f5f9;
        }
        .tab-sublabel {
          font-size: 0.68rem;
          color: #64748b;
        }
        .tab-badge {
          font-size: 0.58rem;
          font-weight: 800;
          padding: 1px 5px;
          border-radius: 4px;
          letter-spacing: 0.5px;
        }
        .tab-badge.green {
          background: rgba(34, 197, 94, 0.2);
          color: #4ade80;
          border: 1px solid rgba(34, 197, 94, 0.35);
        }
        .tab-badge.red {
          background: rgba(239, 68, 68, 0.2);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.35);
        }
        .tab-badge.purple {
          background: rgba(139, 92, 246, 0.2);
          color: #c4b5fd;
          border: 1px solid rgba(139, 92, 246, 0.35);
        }

        /* ── Scroll Area ── */
        .payment-modal-scroll {
          padding: 1.25rem 1.4rem;
          overflow-y: auto;
          flex: 1 1 auto;
          min-height: 0;
          scrollbar-width: thin;
          scrollbar-color: rgba(139, 92, 246, 0.4) transparent;
          box-sizing: border-box;
        }
        .payment-modal-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .payment-modal-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .payment-modal-scroll::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.35);
          border-radius: 4px;
        }
        .payment-modal-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(168, 85, 247, 0.6);
        }

        /* ── Wallet Tab Styles ── */
        .wallet-balance-card {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 14px;
          padding: 1.1rem 1.25rem;
          margin-bottom: 1.2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .wallet-balance-card.has-funds {
          border: 1px solid rgba(34, 197, 94, 0.3);
          background: radial-gradient(circle at top right, rgba(34, 197, 94, 0.08), transparent 70%), rgba(255, 255, 255, 0.03);
        }
        .wallet-balance-card.low-funds {
          border: 1px solid rgba(239, 68, 68, 0.3);
          background: radial-gradient(circle at top right, rgba(239, 68, 68, 0.08), transparent 70%), rgba(255, 255, 255, 0.03);
        }
        .wallet-card-lbl {
          font-size: 0.72rem;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 0.25rem;
        }
        .wallet-card-amount {
          font-family: 'Orbitron', sans-serif;
          font-size: 1.6rem;
          font-weight: 800;
          color: #f1f5f9;
          margin: 0;
        }
        .wallet-balance-card.has-funds .wallet-card-amount {
          color: #4ade80;
        }
        .wallet-balance-card.low-funds .wallet-card-amount {
          color: #f87171;
        }
        .wallet-card-required {
          font-size: 1.15rem;
          font-weight: 700;
          color: #e2e8f0;
          margin: 0;
        }
        .wallet-breakdown-box {
          background: rgba(34, 197, 94, 0.06);
          border: 1px solid rgba(34, 197, 94, 0.18);
          border-radius: 10px;
          padding: 0.85rem 1rem;
          margin-bottom: 1.3rem;
          font-size: 0.82rem;
          color: #86efac;
        }
        .wallet-breakdown-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.4rem;
        }
        .wallet-breakdown-row.total {
          padding-top: 0.45rem;
          border-top: 1px solid rgba(34, 197, 94, 0.18);
          font-weight: 700;
          color: #4ade80;
          margin-bottom: 0;
        }
        .wallet-insufficient-box {
          text-align: center;
          padding: 1rem 0;
        }
        .insufficient-icon {
          font-size: 2.5rem;
          margin-bottom: 0.6rem;
        }
        .insufficient-title {
          font-family: 'Orbitron', sans-serif;
          color: #f87171;
          font-size: 1rem;
          margin: 0 0 0.4rem;
        }
        .insufficient-desc {
          color: #94a3b8;
          font-size: 0.85rem;
          line-height: 1.5;
          margin: 0 0 1.25rem;
        }

        /* ── UPI Tab Styles ── */
        .upi-step-indicator {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.1rem;
        }
        .step-item {
          flex: 1;
          text-align: center;
        }
        .step-num {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(124, 58, 237, 0.2);
          border: 1px solid rgba(124, 58, 237, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 0.25rem;
          font-size: 0.7rem;
          font-weight: 700;
          color: #a78bfa;
        }
        .step-label {
          font-size: 0.65rem;
          color: #64748b;
          font-weight: 600;
        }
        .upi-qr-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(139, 92, 246, 0.25);
          border-radius: 16px;
          padding: 1.2rem;
          text-align: center;
          margin-bottom: 1.1rem;
        }
        .upi-qr-wrapper {
          display: inline-block;
          padding: 10px;
          background: #fff;
          border-radius: 12px;
          margin-bottom: 0.65rem;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        }
        .upi-qr-img {
          display: block;
          width: 170px;
          height: 170px;
          max-width: 100%;
          border-radius: 4px;
          image-rendering: crisp-edges;
        }
        .upi-scan-caption {
          font-size: 0.76rem;
          color: #94a3b8;
          margin: 0 0 0.8rem;
        }
        .upi-apps-row {
          display: flex;
          justify-content: center;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-bottom: 0.9rem;
        }
        .upi-app-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
        }
        .upi-app-icon-wrap {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .upi-app-name {
          font-size: 0.62rem;
          color: #64748b;
        }
        .upi-id-copy-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          background: rgba(139, 92, 246, 0.08);
          border: 1px solid rgba(139, 92, 246, 0.25);
          border-radius: 10px;
          padding: 0.6rem 0.9rem;
        }
        .upi-id-lbl {
          font-size: 0.62rem;
          color: #64748b;
          letter-spacing: 0.5px;
          margin: 0 0 2px;
        }
        .upi-id-val {
          font-family: monospace;
          font-weight: 700;
          color: #c4b5fd;
          font-size: 0.88rem;
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .upi-copy-btn {
          margin-left: auto;
          padding: 0.4rem 0.85rem;
          background: rgba(139, 92, 246, 0.2);
          border: 1px solid rgba(139, 92, 246, 0.4);
          border-radius: 6px;
          color: #a78bfa;
          font-size: 0.72rem;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        .upi-copy-btn.copied {
          background: rgba(34, 197, 94, 0.2);
          border-color: rgba(34, 197, 94, 0.4);
          color: #4ade80;
        }
        .upi-guide-box {
          background: rgba(234, 179, 8, 0.06);
          border: 1px solid rgba(234, 179, 8, 0.18);
          border-radius: 10px;
          padding: 0.85rem 1rem;
          margin-bottom: 1.1rem;
          font-size: 0.78rem;
          color: #fef08a;
        }
        .guide-header {
          font-weight: 700;
          margin-bottom: 0.35rem;
          color: #fde047;
        }
        .guide-list {
          margin: 0;
          padding-left: 1.15rem;
          line-height: 1.7;
          color: #fde68a;
        }
        .utr-input-group {
          margin-bottom: 1.1rem;
        }
        .utr-label {
          display: block;
          font-size: 0.76rem;
          color: #94a3b8;
          font-weight: 700;
          margin-bottom: 0.4rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .utr-input {
          width: 100%;
          box-sizing: border-box;
          padding: 0.85rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(139, 92, 246, 0.35);
          border-radius: 10px;
          color: #f1f5f9;
          font-size: 1rem;
          font-family: monospace;
          outline: none;
          transition: all 0.2s ease;
        }
        .utr-input:focus {
          border-color: rgba(139, 92, 246, 0.8);
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.2);
        }
        .utr-input.input-error {
          border-color: rgba(239, 68, 68, 0.6);
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
        }
        .utr-error-text {
          color: #f87171;
          font-size: 0.74rem;
          margin: 0.35rem 0 0;
        }
        .utr-helper-text {
          color: #64748b;
          font-size: 0.7rem;
          margin: 0.35rem 0 0;
          line-height: 1.4;
        }

        /* ── Action Buttons ── */
        .payment-action-btn {
          width: 100%;
          padding: 0.95rem 1rem;
          border: none;
          border-radius: 12px;
          color: #fff;
          font-weight: 800;
          font-size: 0.95rem;
          font-family: 'Orbitron', sans-serif;
          letter-spacing: 0.8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        .payment-action-btn.wallet-btn {
          background: linear-gradient(135deg, #16a34a, #15803d);
          box-shadow: 0 4px 20px rgba(22, 163, 74, 0.4);
        }
        .payment-action-btn.wallet-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 25px rgba(22, 163, 74, 0.55);
        }
        .payment-action-btn.switch-upi-btn {
          background: linear-gradient(135deg, #7c3aed, #6d28d9);
          box-shadow: 0 4px 20px rgba(124, 58, 237, 0.4);
        }
        .payment-action-btn.switch-upi-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 25px rgba(124, 58, 237, 0.55);
        }
        .payment-action-btn.upi-confirm-btn {
          background: linear-gradient(135deg, #7c3aed, #6d28d9);
          box-shadow: 0 4px 20px rgba(124, 58, 237, 0.45);
        }
        .payment-action-btn.upi-confirm-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 25px rgba(124, 58, 237, 0.6);
        }
        .payment-action-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          transform: none !important;
          box-shadow: none !important;
        }
        .btn-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          display: inline-block;
        }
        .payment-secure-note {
          text-align: center;
          font-size: 0.72rem;
          color: #64748b;
          margin: 0.75rem 0 0;
        }
        .payment-error-alert {
          margin-top: 0.9rem;
          padding: 0.75rem 1rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          color: #f87171;
          font-size: 0.82rem;
        }

        /* ── Footer ── */
        .payment-modal-footer {
          padding: 0.75rem 1.25rem;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
          background: rgba(12, 10, 24, 0.85);
          box-sizing: border-box;
        }
        .footer-secure-badge {
          font-size: 0.72rem;
          color: #64748b;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }
        .payment-modal-cancel-btn {
          padding: 0.45rem 1.1rem;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          color: #cbd5e1;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .payment-modal-cancel-btn:hover {
          background: rgba(255, 255, 255, 0.12);
          color: #fff;
        }

        /* ── Responsive Mobile (max-width: 480px) ── */
        @media (max-width: 480px) {
          .payment-modal-backdrop {
            padding: 0.5rem 0.5rem 1.5rem;
            padding-top: max(0.5rem, env(safe-area-inset-top, 0.5rem));
          }
          .payment-modal-container {
            border-radius: 16px;
            max-height: calc(100dvh - 1rem);
            max-height: calc(100vh - 1rem);
          }
          .payment-modal-header {
            padding: 0.85rem 1rem;
          }
          .payment-modal-title {
            font-size: 0.88rem !important;
          }
          .payment-modal-amount-val {
            font-size: 1.25rem !important;
          }
          .payment-modal-scroll {
            padding: 1rem 0.9rem !important;
          }
          .payment-tab-btn {
            padding: 0.75rem 0.4rem;
          }
          .tab-title {
            font-size: 0.78rem !important;
          }
          .tab-sublabel {
            font-size: 0.62rem !important;
          }
          .upi-qr-img {
            width: 150px;
            height: 150px;
          }
          .payment-action-btn {
            font-size: 0.85rem;
            padding: 0.85rem 0.75rem;
          }
        }

        /* ── Short Viewports (Landscape Phones) ── */
        @media (max-height: 520px) {
          .payment-modal-container {
            max-height: none !important;
          }
        }
      `}</style>
    </div>,
    document.body
  );
}
