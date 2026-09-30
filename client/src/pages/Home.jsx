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
  AlertTriangle
} from 'lucide-react';
import walletSoldierImg from '../assets/wallet_soldier.jpg';
import scrimBannerImg from '../assets/scrim_banner.jpg';
import paymentQR from '../assets/payment_qr.png';

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

export default function Home() {
  const navigate = useNavigate();
  const [walletBalance, setWalletBalance] = useState(0.0);
  const [featuredSlot, setFeaturedSlot] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

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
          .catch(() => {});
      });

    // 2. Fetch live slots to display as featured
    axios.get(`${API_URL}/api/slots`)
      .then((res) => {
        if (isMounted && Array.isArray(res.data) && res.data.length > 0) {
          const active = res.data.find((s) => !s.isSoldOut) || res.data[0];
          setFeaturedSlot(active);
        }
      })
      .catch(() => {});

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
      await axios.post(
        `${API_URL}/api/wallet/withdraw`,
        {
          amount: amt,
          upiId: withdrawUpi.trim(),
          notes: withdrawNotes.trim(),
        },
        { headers: { Authorization: `Bearer ${userInfo.token}` } }
      );
      setWithdrawMsg({ type: 'success', text: `Withdrawal request of ₹${amt} submitted! Processing shortly.` });
      setWalletBalance((prev) => Math.max(0, prev - amt));
      setTimeout(() => setShowWithdrawModal(false), 2000);
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

            {/* Right Soldier Graphic & Slanted Neon Text */}
            <div className="wallet-soldier-art-wrap" aria-hidden="true">
              <img
                src={walletSoldierImg}
                alt="BGMI Esports Warrior"
                className="wallet-soldier-img"
              />
              <div className="wallet-graffiti-text">
                <span>PLAY</span>
                <span>COMPETE</span>
                <span>RISE</span>
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
              <CreditCard size={18} strokeWidth={2} />
              <span>WITHDRAW</span>
            </button>
          </div>
        </section>

        {/* ── 2. ANNOUNCEMENT CARD ────────────────────────────── */}
        <section className="home-announcement-card" aria-label="Official Announcements">
          <div className="announcement-header-row">
            <div className="announcement-title-wrap">
              <div className="announcement-icon-bubble">
                <Megaphone size={21} strokeWidth={2.2} />
              </div>
              <h2 className="announcement-heading">ANNOUNCEMENT</h2>
            </div>
            <button
              type="button"
              className="announcement-view-all"
              onClick={() => setShowRulesModal(true)}
              id="view-all-announcements-btn"
            >
              <span>View All</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="announcement-inner-box">
            {announcements && announcements.length > 0 ? (
              announcements.map((item, idx) => (
                <div key={item._id || idx} className="announcement-rule-item">
                  <div className="announcement-num-badge">{idx + 1}</div>
                  <div className="announcement-rule-text" style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '2px' }}>
                      <span style={{ fontWeight: 800, color: '#f3e8ff', fontSize: '0.74rem' }}>
                        {item.title}
                      </span>
                      {item.author && (
                        <span style={{ fontSize: '0.62rem', color: '#c084fc', background: 'rgba(167, 139, 250, 0.15)', padding: '1px 5px', borderRadius: '4px', flexShrink: 0 }}>
                          {item.author}
                        </span>
                      )}
                    </div>
                    <p style={{ margin: 0, color: '#d1d5db', fontSize: '0.7rem', lineHeight: 1.35, wordBreak: 'break-word' }}>
                      {item.content}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <>
                <div className="announcement-rule-item">
                  <div className="announcement-num-badge">1</div>
                  <p className="announcement-rule-text">
                    Emulators / iPads / Hacks are strictly prohibited (Permanent Blacklist).
                  </p>
                </div>

                <div className="announcement-rule-item">
                  <div className="announcement-num-badge">2</div>
                  <p className="announcement-rule-text">
                    Match starts strictly on time. Ensure full squad joins respective slots.
                  </p>
                </div>

                <div className="announcement-rule-item">
                  <div className="announcement-num-badge">3</div>
                  <p className="announcement-rule-text">
                    Points table will be updated within 15 minutes after match finish.
                  </p>
                </div>
              </>
            )}
          </div>
        </section>

        {/* ── 3. MATCH RESULTS & POINTS BANNER ────────────────── */}
        <section
          className="home-results-banner"
          onClick={() => navigate('/rankings')}
          role="button"
          tabIndex={0}
          aria-label="View Match Results and Rankings"
          id="match-results-banner"
        >
          <div className="results-left-wrap">
            <div className="results-icon-box">
              <BarChart3 size={22} strokeWidth={2.4} />
            </div>
            <div className="results-text-col">
              <h3 className="results-title">
                <span>MATCH RESULTS</span>
                <span className="highlight">&amp; POINTS</span>
              </h3>
              <p className="results-subtitle">
                View daily results &amp; standings of live scrims
              </p>
            </div>
          </div>

          <button
            type="button"
            className="results-view-btn"
            onClick={(e) => {
              e.stopPropagation();
              navigate('/rankings');
            }}
          >
            <span>VIEW</span>
            <ArrowRight size={14} />
          </button>
        </section>

        {/* ── 4. FEATURED SCRIMS SECTION ──────────────────────── */}
        <section className="home-scrims-section" aria-label="Featured Scrims">
          <div className="scrims-section-header">
            <div className="scrims-heading-wrap">
              <Zap size={20} className="scrims-lightning-icon" fill="#a855f7" />
              <h3 className="scrims-section-title">
                FEATURED <span className="purple">SCRIMS</span>
              </h3>
            </div>
            <button
              type="button"
              className="scrims-view-all"
              onClick={() => navigate('/slots')}
              id="view-all-scrims-btn"
            >
              <span>View all</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Featured Scrim Card */}
          <div
            className="featured-scrim-card"
            onClick={() => navigate('/slots')}
            role="button"
            tabIndex={0}
            id="featured-scrim-card-1"
          >
            {/* Background Soldier Art & R Watermark */}
            <div className="scrim-card-bg-wrap" aria-hidden="true">
              <img
                src={scrimBannerImg}
                alt="Cyber BGMI Esports"
                className="scrim-card-bg-img"
              />
              <span className="scrim-watermark-r">R</span>
            </div>

            <div className="scrim-card-content">
              <div className="scrim-top-status-row">
                <span className="scrim-brand-tag">RISING ESPORTS</span>
                <div className="scrim-live-badge">
                  <span className="scrim-live-dot" />
                  <span>LIVE</span>
                </div>
              </div>

              <h4 className="scrim-card-title">
                RISING 1-3 GRIND SCRIMS
              </h4>

              <div className="scrim-meta-badges">
                <div className="scrim-badge-squad">
                  <Users size={15} />
                  <span>SQUAD</span>
                </div>

                <span className="scrim-badge-divider">|</span>

                <div className="scrim-badge-lobby">
                  <BgmiHelmetIcon size={14} color="#c084fc" />
                  <span>LOBBY 2</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. OFFICIAL COMMUNITY WHATSAPP CTA ───────────────── */}
        <section className="home-community-cta">
          <div className="community-cta-text">
            <h4>Official WhatsApp Group</h4>
            <p>Join for instant Room ID, Password &amp; updates</p>
          </div>
          <a
            href="https://chat.whatsapp.com/FLX8eM2APOFCyiK8ReWER6?mode=gi_t"
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
                <h3>Official Announcements &amp; Rules</h3>
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
              {announcements && announcements.length > 0 && (
                <div style={{ marginBottom: '1.25rem' }}>
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
                  <div style={{ borderBottom: '1px solid rgba(167, 139, 250, 0.2)', margin: '1rem 0' }} />
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                <Shield size={17} style={{ color: '#c084fc' }} />
                <h4 style={{ margin: 0, color: '#f3e8ff', fontSize: '0.9rem', fontWeight: 800, letterSpacing: '0.5px' }}>
                  GENERAL RULES &amp; REWARDS
                </h4>
              </div>

              <div className="rules-full-item">
                <div className="rules-full-num">1</div>
                <div className="rules-full-content">
                  <h5>Team Registration</h5>
                  <p>Register your team on our official WhatsApp to showcase your team in the official Rankings.</p>
                </div>
              </div>

              <div className="rules-full-item">
                <div className="rules-full-num">2</div>
                <div className="rules-full-content">
                  <h5>Unique Rising ID</h5>
                  <p>Your team will receive an official three-digit (XXX) Rising ID to avoid confusion between similar team names.</p>
                </div>
              </div>

              <div className="rules-full-item">
                <div className="rules-full-num">3</div>
                <div className="rules-full-content">
                  <h5>250 Matches Requirement</h5>
                  <p>Teams must complete 250 matches in a month to claim all exclusive rewards and perks provided by Rising Esports.</p>
                </div>
              </div>

              <div className="rules-full-item">
                <div className="rules-full-num">4</div>
                <div className="rules-full-content">
                  <h5>Cash Prizes for #1 Team</h5>
                  <p>The #1 ranked team wins cash prizes starting from ₹1,000, increasing daily with community prize pool support.</p>
                </div>
              </div>

              <div className="rules-full-item">
                <div className="rules-full-num">5</div>
                <div className="rules-full-content">
                  <h5>Top 5 Discounts</h5>
                  <p>Top 5 ranked teams receive a 50% discount on all 3-day slot bookings.</p>
                </div>
              </div>

              <div className="rules-full-item">
                <div className="rules-full-num">6</div>
                <div className="rules-full-content">
                  <h5>Invited Slots for Top 20</h5>
                  <p>All Top 20 ranked teams get invited priority slots based on their rankings leaderboard standing.</p>
                </div>
              </div>

              <div className="rules-full-item">
                <div className="rules-full-num">7</div>
                <div className="rules-full-content">
                  <h5>Sponsorship Placement</h5>
                  <p>Higher tier rankings gain direct sponsor visibility and esports organization scout opportunities.</p>
                </div>
              </div>

              <div className="rules-full-item">
                <div className="rules-full-num">8</div>
                <div className="rules-full-content">
                  <h5>Managers &amp; Coaches</h5>
                  <p>Top 10 teams gain access to dedicated team managers, coaches, and strategic drop maps coordination.</p>
                </div>
              </div>

              <div className="rules-full-item" style={{ borderColor: 'rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.06)' }}>
                <div className="rules-full-num" style={{ background: '#ef4444' }}>!</div>
                <div className="rules-full-content">
                  <h5 style={{ color: '#f87171' }}>Fair Play &amp; Anti-Cheat Policy</h5>
                  <p style={{ color: '#fca5a5' }}>
                    Emulators, iPads, and unauthorized modifications are strictly banned. Violating teams face immediate, permanent blacklisting.
                  </p>
                </div>
              </div>
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
    </div>
  );
}
