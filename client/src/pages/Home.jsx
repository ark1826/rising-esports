import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Wallet,
  Plus,
  CreditCard,
  Megaphone,
  BarChart3,
  Zap,
  Users,
  ArrowRight,
  Shield,
  X,
  CheckCircle,
  Copy,
  Check,
  Send,
  Trophy,
  Award,
  AlertTriangle,
  User,
  Clock,
  Calendar
} from 'lucide-react';
import scrimBannerImg from '../assets/scrim_banner.jpg';
import soldierBgImg from '../assets/droplist_bg_soldier.jpg';
import helmetImg from '../assets/droplist_soldier_helmet.jpg';
import walletSoldierImg from '../assets/wallet_soldier.jpg';
import paymentQR from '../assets/payment_qr.png';
import WithdrawalSuccessModal from '../components/WithdrawalSuccessModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Custom BGMI Level 3 Helmet SVG Icon
function BgmiHelmetIcon({ size = 15, color = '#c084fc' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ verticalAlign: 'middle', flexShrink: 0 }}
    >
      {/* Helmet dome */}
      <path
        d="M4 13C4 7.5 7.5 3 12 3C16.5 3 20 7.5 20 13V15C20 15 19 15 18 15V13C18 8.5 15.3 5 12 5C8.7 5 6 8.5 6 13V15C5 15 4 15 4 15V13Z"
        fill={color}
      />
      {/* Visor slit / protective mask */}
      <rect x="7" y="11" width="10" height="3" rx="1" fill="#0c081e" stroke={color} strokeWidth="1.2" />
      {/* Chin guard / strap */}
      <path
        d="M7 16C7 18 9 20 12 20C15 20 17 18 17 16"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12.5" r="0.75" fill={color} />
    </svg>
  );
}

// Custom Chess Pawn Icon matching exact screenshot
function ChessPawnIcon({ size = 19, color = '#c084fc' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ verticalAlign: 'middle', flexShrink: 0 }}
    >
      <circle cx="12" cy="5" r="2.5" fill={color} fillOpacity="0.25" />
      <path d="M9.5 9.5h5" />
      <path d="M10 9.5c0 2.5-1.5 4-2.5 6h9c-1-2-2.5-3.5-2.5-6" />
      <path d="M6 19.5h12" />
      <path d="M7 16.5h10v3H7z" fill={color} fillOpacity="0.3" />
    </svg>
  );
}

// Custom Square Icon for Withdraw button matching screenshot
function WithdrawSquareIcon({ size = 14, color = '#ffffff' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ verticalAlign: 'middle', flexShrink: 0 }}
    >
      <rect x="3" y="3" width="18" height="18" rx="3" />
    </svg>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [walletBalance, setWalletBalance] = useState(0.0);
  const [featuredSlot, setFeaturedSlot] = useState(null);
  const [allSlots, setAllSlots] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [officialWhatsAppUrl, setOfficialWhatsAppUrl] = useState('https://chat.whatsapp.com/FLX8eM2APOFCyiK8ReWER6?mode=gi_t');

  // Deposit flow state
  const [depositAmount, setDepositAmount] = useState('100');
  const [depositStep, setDepositStep] = useState(1); // 1: Amount, 2: Pay & UTR, 3: Success
  const [depositTxn, setDepositTxn] = useState(null);
  const [depositUtr, setDepositUtr] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [depositError, setDepositError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Withdraw state
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawUpi, setWithdrawUpi] = useState('');
  const [withdrawNotes, setWithdrawNotes] = useState('');
  const [withdrawMsg, setWithdrawMsg] = useState(null);
  const [showWithdrawalSuccessModal, setShowWithdrawalSuccessModal] = useState(false);
  const [withdrawalSuccessData, setWithdrawalSuccessData] = useState(null);

  const userInfo = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('userInfo') || 'null');
    } catch {
      return null;
    }
  }, []);

  // Fetch announcements & slots on mount
  useEffect(() => {
    let isMounted = true;

    // 1. Fetch active announcements broadcasted by Admin
    axios.get(`${API_URL}/api/announcements/active`)
      .then((res) => {
        if (isMounted && Array.isArray(res.data) && res.data.length > 0) {
          setAnnouncements(res.data);
        }
      })
      .catch(() => {
        axios.get(`${API_URL}/api/announcements/latest`)
          .then((res) => {
            if (isMounted && res.data && !res.data.isDefault) {
              setAnnouncements([res.data]);
            }
          })
          .catch(() => { });
      });

    // 2. Fetch live slots to display as featured
    axios.get(`${API_URL}/api/slots`)
      .then((res) => {
        if (isMounted && Array.isArray(res.data) && res.data.length > 0) {
          setAllSlots(res.data);
          const active = res.data.find((s) => !s.isSoldOut) || res.data[0];
          setFeaturedSlot(active);
        }
      })
      .catch(() => { });

    // 3. Fetch official community WhatsApp group link
    axios.get(`${API_URL}/api/config/official-whatsapp`)
      .then((res) => {
        if (isMounted && res.data?.url) {
          setOfficialWhatsAppUrl(res.data.url);
        }
      })
      .catch(() => { });

    return () => {
      isMounted = false;
    };
  }, []);

  // 3. Fetch live wallet balance if user is logged in
  useEffect(() => {
    if (userInfo && userInfo.token) {
      axios.get(`${API_URL}/api/wallet/balance`, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      })
        .then((res) => {
          if (typeof res.data?.balance === 'number') {
            setWalletBalance(res.data.balance);
          } else {
            setWalletBalance(0.0);
          }
        })
        .catch(() => {
          setWalletBalance(0.0);
        });
    } else {
      setWalletBalance(0.0);
    }
  }, [userInfo]);

  // Handler for Add Money button
  const handleAddMoneyClick = () => {
    if (!userInfo || !userInfo.token) {
      navigate('/user/login', {
        state: { from: '/', message: 'Please sign in to add money to your wallet.' }
      });
      return;
    }
    setDepositStep(1);
    setDepositError('');
    setShowDepositModal(true);
  };

  // Handler for Withdraw button
  const handleWithdrawClick = () => {
    if (!userInfo || !userInfo.token) {
      navigate('/user/login', {
        state: { from: '/', message: 'Please sign in to withdraw funds.' }
      });
      return;
    }
    setWithdrawMsg(null);
    setShowWithdrawModal(true);
  };

  // Submit Step 1: Initiate Deposit
  const handleInitiateDeposit = async (e) => {
    e.preventDefault();
    const amt = Number(depositAmount);
    if (!amt || amt < 10) {
      setDepositError('Minimum deposit amount is ₹10');
      return;
    }

    setIsProcessing(true);
    setDepositError('');
    try {
      const { data } = await axios.post(
        `${API_URL}/api/wallet/deposit/initiate`,
        { amount: amt },
        { headers: { Authorization: `Bearer ${userInfo.token}` } }
      );
      setDepositTxn(data);
      setDepositStep(2);
    } catch (err) {
      setDepositError(err.response?.data?.message || 'Could not initiate payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Submit Step 2: Submit UTR proof
  const handleSubmitDepositUtr = async (e) => {
    e.preventDefault();
    if (!depositUtr.trim() || depositUtr.trim().length < 6) {
      setDepositError('Please enter a valid 12-digit UTR / Transaction Reference number');
      return;
    }

    setIsProcessing(true);
    setDepositError('');
    try {
      await axios.post(
        `${API_URL}/api/wallet/deposit/submit-utr`,
        {
          txnId: depositTxn?.txnId,
          utrNumber: depositUtr.trim(),
        },
        { headers: { Authorization: `Bearer ${userInfo.token}` } }
      );
      setDepositStep(3);
    } catch (err) {
      setDepositError(err.response?.data?.message || 'Failed to submit UTR. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Copy UPI ID
  const copyDepositUpiId = () => {
    const upi = depositTxn?.upiId || 'Q264921089@ybl';
    navigator.clipboard.writeText(upi);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  // Submit Withdraw
  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    const amt = Number(withdrawAmount);
    if (!amt || amt < 30) {
      setWithdrawMsg({ type: 'error', text: 'Minimum withdrawal is ₹30' });
      return;
    }
    if (amt > walletBalance) {
      setWithdrawMsg({ type: 'error', text: 'Insufficient wallet balance' });
      return;
    }
    if (!withdrawUpi.trim()) {
      setWithdrawMsg({ type: 'error', text: 'Please enter a valid UPI ID (e.g. mobile@upi)' });
      return;
    }

    setIsProcessing(true);
    try {
      const { data } = await axios.post(
        `${API_URL}/api/wallet/withdraw`,
        {
          amount: amt,
          upiId: withdrawUpi.trim(),
          notes: withdrawNotes.trim(),
        },
        { headers: { Authorization: `Bearer ${userInfo.token}` } }
      );
      setWalletBalance((prev) => Math.max(0, prev - amt));
      setShowWithdrawModal(false);
      setWithdrawalSuccessData({
        amount: amt,
        upiId: withdrawUpi.trim(),
        transactionId: data?.transaction?.transactionId || `WAL_WTH_${Date.now()}`,
      });
      setShowWithdrawalSuccessModal(true);
      setWithdrawAmount('');
      setWithdrawUpi('');
      setWithdrawNotes('');
      setWithdrawMsg(null);
    } catch (err) {
      setWithdrawMsg({ type: 'error', text: err.response?.data?.message || 'Withdrawal failed. Try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Formatted balance split
  const balanceParts = Number(walletBalance || 0).toFixed(2).split('.');

  return (
    <div className="home-page-wrapper fade-in">
      <div className="home-container">
        {/* ── WELCOME BACK HEADER (Screen 1) ───────────────── */}
        <div className="home-welcome-header">
          <div className="home-welcome-avatar">
            <User size={19} />
          </div>
          <div>
            <div className="home-welcome-sub">Welcome Back,</div>
            <div className="home-welcome-name">
              {userInfo?.name || userInfo?.username || 'Arun Katiyar'}
            </div>
          </div>
        </div>

        {/* ── 1. WALLET BALANCE CARD ──────────────────────────── */}
        <section className="home-wallet-card" aria-label="Wallet Overview">
          <div className="wallet-card-top">
            {/* Left Balance Details */}
            <div className="wallet-balance-col">
              <div className="wallet-icon-box" title="Rising Wallet">
                <Wallet size={24} strokeWidth={2.2} />
              </div>
              <div className="wallet-amount-info">
                <span className="wallet-label">WALLET BALANCE</span>
                <div className="wallet-amount-row">
                  <span className="wallet-currency">₹</span>
                  <span className="wallet-digits-main">{balanceParts[0]}</span>
                  <span className="wallet-digits-cents">.{balanceParts[1]}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="wallet-actions-row">
            <button
              type="button"
              className="wallet-btn-add"
              onClick={handleAddMoneyClick}
              id="home-add-money-btn"
            >
              <Plus size={18} strokeWidth={3} />
              <span>+ ADD MONEY</span>
            </button>

            <button
              type="button"
              className="wallet-btn-withdraw"
              onClick={handleWithdrawClick}
              id="home-withdraw-btn"
            >
              <WithdrawSquareIcon size={14} />
              <span>WITHDRAW</span>
            </button>
          </div>
        </section>

        {/* ── 2. ANNOUNCEMENT STRIP ──────────────────────────── */}
        <div
          className="home-announcement-strip"
          onClick={() => setShowRulesModal(true)}
          role="button"
          tabIndex={0}
        >
          <div className="announcement-strip-icon">
            <Megaphone size={22} />
          </div>
          <div className="announcement-strip-content">
            <div className="announcement-strip-tag">ANNOUNCEMENT</div>
            <div className="announcement-strip-text">
              {announcements && announcements.length > 0 && announcements[0].content
                ? `🔥 ${announcements[0].content}`
                : '🔥 10K Open For All is Live Now! Register and Win Big!'}
            </div>
          </div>
          <div className="announcement-strip-arrow">&gt;</div>
        </div>

        {/* ── 3. RESULTS & REQUIREMENTS ACTION BUTTONS ───────── */}
        <div className="home-dual-actions-row">
          {/* Left Button: RESULTS */}
          <div
            className="home-feature-btn-card"
            onClick={() => navigate('/results')}
            role="button"
            tabIndex={0}
          >
            <div className="home-feature-btn-arrow">&gt;</div>
            <div className="home-feature-btn-icon-wrap">
              <Trophy size={19} color="#fbbf24" />
            </div>
            <div className="home-feature-btn-info">
              <div className="home-feature-btn-title">RESULTS</div>
              <div className="home-feature-btn-sub">Check latest match results and standings</div>
            </div>
          </div>

          {/* Right Button: REQUIREMENTS */}
          <div
            className="home-feature-btn-card"
            onClick={() => navigate('/requirements')}
            role="button"
            tabIndex={0}
          >
            <div className="home-feature-btn-arrow">&gt;</div>
            <div className="home-feature-btn-icon-wrap">
              <ChessPawnIcon size={19} color="#c084fc" />
            </div>
            <div className="home-feature-btn-info">
              <div className="home-feature-btn-title">REQUIREMENTS</div>
              <div className="home-feature-btn-sub">Rules, formats, slots &amp; more</div>
            </div>
          </div>
        </div>

        {/* Divider Line */}
        <div className="home-neon-divider" />

        {/* ── 4. EXPLORE OUR CATEGORIES (Screen 1 2x2 Grid) ────── */}
        <section className="home-explore-section" aria-label="Explore Categories" style={{ marginTop: '0.2rem' }}>
          <div className="home-explore-title" style={{ marginBottom: '0.65rem' }}>
            <span style={{ color: '#ffffff' }}>EXPLORE OUR </span>
            <span style={{ color: '#a855f7' }}>CATEGORIES</span>
          </div>
          <div className="explore-grid-2x2">
            <div
              className="explore-cat-card scrims"
              onClick={() => navigate('/slots?category=Daily%20Scrims')}
              role="button"
              tabIndex={0}
            >
              <div className="explore-cat-bg" style={{ backgroundImage: `url(${soldierBgImg})` }} />
              <div className="explore-cat-badge">DAILY GRIND</div>
              <div className="explore-cat-bottom">
                <div className="explore-cat-name">SCRIMS</div>
                <div className="explore-cat-sub">Daily Grind</div>
              </div>
            </div>

            <div
              className="explore-cat-card weekly"
              onClick={() => navigate('/slots?category=Weekly%20War')}
              role="button"
              tabIndex={0}
            >
              <div className="explore-cat-bg" style={{ backgroundImage: `url(${soldierBgImg})`, filter: 'hue-rotate(320deg)' }} />
              <div className="explore-cat-badge">COMPETITIVE</div>
              <div className="explore-cat-bottom">
                <div className="explore-cat-name">WEEKLY WAR</div>
                <div className="explore-cat-sub">Competitive Battles</div>
              </div>
            </div>

            <div
              className="explore-cat-card weekend"
              onClick={() => navigate('/slots?category=Weekend%20War')}
              role="button"
              tabIndex={0}
            >
              <div className="explore-cat-bg" style={{ backgroundImage: `url(${soldierBgImg})`, filter: 'hue-rotate(45deg)' }} />
              <div className="explore-cat-badge">BIG REWARDS</div>
              <div className="explore-cat-bottom">
                <div className="explore-cat-name">WEEKEND WAR</div>
                <div className="explore-cat-sub">Big Rewards</div>
              </div>
            </div>

            <div
              className="explore-cat-card grands"
              onClick={() => navigate('/slots?category=Grands')}
              role="button"
              tabIndex={0}
            >
              <div className="explore-cat-bg" style={{ backgroundImage: `url(${soldierBgImg})`, filter: 'hue-rotate(180deg)' }} />
              <div className="explore-cat-badge">ELITE FINALS</div>
              <div className="explore-cat-bottom">
                <div className="explore-cat-name">GRANDS</div>
                <div className="explore-cat-sub">Elite Tournaments</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. OFFICIAL COMMUNITY WHATSAPP CTA ───────────────── */}
        <section className="home-community-cta">
          <div className="community-cta-text">
            <h4>Official Group Link</h4>
          </div>
          <a
            href={officialWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="community-cta-btn"
          >
            <span>Join Now</span>
            <ArrowRight size={14} />
          </a>
        </section>
      </div>

      {/* ── ALL RULES & REWARDS MODAL (When "View All" is clicked) ── */}
      {showRulesModal && (
        <div className="rules-modal-overlay fade-in" onClick={() => setShowRulesModal(false)}>
          <div className="rules-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="rules-modal-header">
              <div className="rules-modal-title">
                <Megaphone size={22} style={{ color: '#c084fc' }} />
                <h3>Official Announcements</h3>
              </div>
              <button
                type="button"
                className="header-icon-btn"
                onClick={() => setShowRulesModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="rules-modal-body">
              {/* Live Admin Broadcasts */}
              {announcements && announcements.length > 0 ? (
                <div style={{ marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                    <Megaphone size={17} style={{ color: '#c084fc' }} />
                    <h4 style={{ margin: 0, color: '#f3e8ff', fontSize: '0.9rem', fontWeight: 800, letterSpacing: '0.5px' }}>
                      ADMIN BROADCASTS ({announcements.length})
                    </h4>
                  </div>
                  {announcements.map((item, idx) => (
                    <div
                      key={item._id || idx}
                      style={{
                        background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(26, 16, 50, 0.7) 100%)',
                        border: '1px solid rgba(168, 85, 247, 0.35)',
                        borderRadius: '12px',
                        padding: '10px 14px',
                        marginBottom: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 800, color: '#f8fafc', fontSize: '0.88rem' }}>
                          {item.title}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: '#c084fc', background: 'rgba(124, 58, 237, 0.3)', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                          {item.author || 'Rising Admin'}
                        </span>
                      </div>
                      <p style={{ margin: 0, color: '#e2e8f0', fontSize: '0.82rem', lineHeight: 1.45, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {item.content}
                      </p>
                      {item.createdAt && (
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '6px', textAlign: 'right' }}>
                          {new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8' }}>
                  <Megaphone size={36} style={{ color: '#a855f7', marginBottom: '0.75rem', opacity: 0.6 }} />
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1' }}>No active announcements right now.</p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#64748b' }}>Stay tuned for upcoming scrims and tournament updates.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── ADD MONEY / DEPOSIT MODAL ───────────────────────── */}
      {showDepositModal && (
        <div className="rules-modal-overlay fade-in" onClick={() => setShowDepositModal(false)}>
          <div className="rules-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="rules-modal-header">
              <div className="rules-modal-title">
                <CreditCard size={20} style={{ color: '#c084fc' }} />
                <h3>{depositStep === 1 ? 'Add Cash to Wallet' : depositStep === 2 ? `Pay ₹${depositAmount}` : 'Deposit Submitted'}</h3>
              </div>
              <button
                type="button"
                className="header-icon-btn"
                onClick={() => setShowDepositModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.25rem' }}>
              {depositStep === 1 && (
                <form onSubmit={handleInitiateDeposit} className="wallet-modal-form">
                  <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.8rem', color: '#c4b5fd', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Shield size={16} />
                    <span>100% Safe &amp; Instant UPI Deposit</span>
                  </div>

                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', color: '#a0a0c4', marginBottom: '0.4rem' }}>
                      Deposit Amount (₹)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(168,85,247,0.4)', borderRadius: '10px', padding: '0.65rem 0.85rem' }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#c084fc', marginRight: '6px' }}>₹</span>
                      <input
                        type="number"
                        min="10"
                        placeholder="100"
                        value={depositAmount}
                        onChange={(e) => { setDepositAmount(e.target.value); setDepositError(''); }}
                        style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.1rem', fontWeight: 700, width: '100%', outline: 'none' }}
                        required
                        autoFocus
                      />
                    </div>
                    {depositError && <p style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '0.4rem' }}>{depositError}</p>}
                  </div>

                  {/* Quick Select Buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1.2rem' }}>
                    {[50, 100, 200, 500].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => { setDepositAmount(String(amt)); setDepositError(''); }}
                        style={{
                          background: Number(depositAmount) === amt ? 'rgba(168,85,247,0.25)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${Number(depositAmount) === amt ? '#c084fc' : 'rgba(168,85,247,0.3)'}`,
                          color: '#fff',
                          borderRadius: '8px',
                          padding: '0.45rem',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        +₹{amt}
                      </button>
                    ))}
                  </div>

                  <button
                    type="submit"
                    className="wallet-btn-add"
                    style={{ width: '100%', padding: '0.85rem' }}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Generating QR...' : `Proceed to Pay ₹${depositAmount || 0}`}
                  </button>
                </form>
              )}

              {depositStep === 2 && (
                <form onSubmit={handleSubmitDepositUtr}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '14px', padding: '1rem', textAlign: 'center', marginBottom: '1rem' }}>
                    <div style={{ display: 'inline-block', padding: '8px', background: '#fff', borderRadius: '10px', marginBottom: '0.6rem' }}>
                      <img
                        src={paymentQR}
                        alt="Deposit QR"
                        width="150"
                        height="150"
                        style={{ display: 'block', borderRadius: '4px' }}
                      />
                    </div>
                    <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '0 0 0.5rem' }}>
                      Scan via GPay / PhonePe / Paytm / BHIM to pay <strong style={{ color: '#c084fc' }}>₹{depositAmount}</strong>
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '8px', padding: '0.45rem 0.75rem' }}>
                      <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>UPI ID:</span>
                      <code style={{ color: '#c4b5fd', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '0.82rem' }}>
                        {depositTxn?.upiId || 'Q264921089@ybl'}
                      </code>
                      <button
                        type="button"
                        onClick={copyDepositUpiId}
                        style={{
                          padding: '0.2rem 0.5rem',
                          background: copiedUpi ? 'rgba(34,197,94,0.2)' : 'rgba(168,85,247,0.2)',
                          border: `1px solid ${copiedUpi ? '#4ade80' : '#c084fc'}`,
                          borderRadius: '4px',
                          color: copiedUpi ? '#4ade80' : '#c4b5fd',
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                        }}
                      >
                        {copiedUpi ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#a0a0c4', marginBottom: '0.35rem' }}>
                      12-Digit UTR / Transaction Reference ID *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 426312598765"
                      value={depositUtr}
                      onChange={(e) => { setDepositUtr(e.target.value); setDepositError(''); }}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(168,85,247,0.4)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontFamily: 'monospace',
                        fontSize: '0.9rem',
                        outline: 'none',
                      }}
                      required
                      autoFocus
                    />
                    {depositError && <p style={{ color: '#f87171', fontSize: '0.76rem', marginTop: '0.35rem' }}>{depositError}</p>}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setDepositStep(1)}
                      style={{
                        flex: 1,
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#fff',
                        borderRadius: '10px',
                        padding: '0.7rem',
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                      }}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="wallet-btn-add"
                      style={{ flex: 2, padding: '0.7rem' }}
                      disabled={isProcessing || !depositUtr.trim()}
                    >
                      {isProcessing ? 'Submitting...' : 'Submit Payment Proof'}
                    </button>
                  </div>
                </form>
              )}

              {depositStep === 3 && (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <CheckCircle size={44} style={{ color: '#4ade80', margin: '0 auto 0.75rem' }} />
                  <h4 style={{ fontSize: '1.1rem', marginBottom: '0.4rem', color: '#fff' }}>Deposit Submitted!</h4>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.45, marginBottom: '1.2rem' }}>
                    Your deposit request of <strong style={{ color: '#4ade80' }}>₹{depositAmount}</strong> with UTR <code style={{ color: '#fbbf24' }}>{depositUtr}</code> is now pending admin verification.
                  </p>
                  <button
                    type="button"
                    className="wallet-btn-add"
                    onClick={() => setShowDepositModal(false)}
                    style={{ width: '100%', padding: '0.75rem' }}
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── WITHDRAW MODAL ──────────────────────────────────── */}
      {showWithdrawModal && (
        <div className="rules-modal-overlay fade-in" onClick={() => setShowWithdrawModal(false)}>
          <div className="rules-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="rules-modal-header">
              <div className="rules-modal-title">
                <CreditCard size={20} style={{ color: '#c084fc' }} />
                <h3>Withdraw from Wallet</h3>
              </div>
              <button
                type="button"
                className="header-icon-btn"
                onClick={() => setShowWithdrawModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} style={{ padding: '1.25rem' }}>
              <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(168,85,247,0.25)', borderRadius: '10px', padding: '0.75rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Available Balance:</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#c084fc', fontFamily: 'Orbitron, sans-serif' }}>
                  ₹{Number(walletBalance).toFixed(2)}
                </span>
              </div>

              {withdrawMsg && (
                <div style={{ padding: '0.65rem', borderRadius: '8px', marginBottom: '0.85rem', fontSize: '0.78rem', background: withdrawMsg.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)', color: withdrawMsg.type === 'error' ? '#f87171' : '#4ade80', border: `1px solid ${withdrawMsg.type === 'error' ? '#ef4444' : '#22c55e'}` }}>
                  {withdrawMsg.text}
                </div>
              )}

              <div style={{ marginBottom: '0.85rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#a0a0c4', marginBottom: '0.3rem' }}>
                  Withdrawal Amount (₹) (Min ₹30)
                </label>
                <input
                  type="number"
                  min="30"
                  max={walletBalance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '8px', color: '#fff', fontSize: '1rem', fontWeight: 700, outline: 'none' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '0.85rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#a0a0c4', marginBottom: '0.3rem' }}>
                  Your UPI ID (GPay / PhonePe / Paytm) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. yourname@okhdfcbank"
                  value={withdrawUpi}
                  onChange={(e) => setWithdrawUpi(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '8px', color: '#fff', fontSize: '0.88rem', outline: 'none' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#a0a0c4', marginBottom: '0.3rem' }}>
                  Remarks / Team Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Scrim winning cashout"
                  value={withdrawNotes}
                  onChange={(e) => setWithdrawNotes(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
                />
              </div>

              <button
                type="submit"
                className="wallet-btn-add"
                style={{ width: '100%', padding: '0.85rem' }}
                disabled={isProcessing || !withdrawAmount || Number(withdrawAmount) > walletBalance}
              >
                {isProcessing ? 'Processing...' : `Submit Request (₹${withdrawAmount || 0})`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: WITHDRAWAL SUCCESS POPUP ── */}
      <WithdrawalSuccessModal
        isOpen={showWithdrawalSuccessModal}
        onClose={() => setShowWithdrawalSuccessModal(false)}
        data={withdrawalSuccessData}
      />
    </div>
  );
}
