import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import paymentQR from '../assets/payment_qr.png';
import {
  User,
  Shield,
  Phone,
  MapPin,
  Camera,
  History,
  LogOut,
  Save,
  CheckCircle,
  AlertCircle,
  PlusCircle,
  ArrowUpRight,
  CreditCard,
  SendHorizontal,
  X,
  Copy,
  Check,
  ArrowLeft,
  Clock,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function Profile() {
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'transactions' | 'logout'
  const [profileData, setProfileData] = useState({
    teamName: '',
    phone: '',
    teamLogo: '',
    whatsappNumber: '',
    erangelDrop: '',
    rondoDrop: '',
    miramarDrop: '',
    walletBalance: 0,
    registrationNumber: '',
  });

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState('');
  const [notification, setNotification] = useState(null);

  // Modals for Add Money & Withdraw
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [addAmount, setAddAmount] = useState('100');
  const [withdrawAmount, setWithdrawAmount] = useState('50');
  const [upiId, setUpiId] = useState('');
  const [withdrawNotes, setWithdrawNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  // WinZO-style Deposit flow state
  const [depositStep, setDepositStep] = useState(1); // 1: Select Amount, 2: Pay & Enter UTR, 3: Success Pending Verification
  const [depositTxn, setDepositTxn] = useState(null);
  const [depositUtr, setDepositUtr] = useState('');
  const [depositError, setDepositError] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);

  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');

  // Fetch profile and transactions
  const fetchProfileData = useCallback(async () => {
    if (!userInfo || !userInfo.token) {
      navigate('/user/login');
      return;
    }

    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const [profileRes, txnsRes, walletRes] = await Promise.all([
        axios.get(`${API_URL}/api/users/profile`, config),
        axios.get(`${API_URL}/api/wallet/transactions`, config).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/wallet/balance`, config).catch(() => ({ data: { balance: 0 } })),
      ]);

      const data = profileRes.data;
      const currentBalance = walletRes.data?.balance ?? data.walletBalance ?? 0;

      setProfileData({
        teamName: data.teamName || '',
        phone: data.phone || '',
        teamLogo: data.teamLogo || '',
        whatsappNumber: data.whatsappNumber || '',
        erangelDrop: data.erangelDrop || '',
        rondoDrop: data.rondoDrop || '',
        miramarDrop: data.miramarDrop || '',
        walletBalance: currentBalance,
        registrationNumber: data.registrationNumber || '',
      });
      setLogoPreview(data.teamLogo || '');
      setTransactions(txnsRes.data || []);
    } catch (err) {
      console.error('Error fetching profile:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('userInfo');
        navigate('/user/login');
      }
    } finally {
      setLoading(false);
    }
  }, [userInfo, navigate]);

  useEffect(() => {
    if (!userInfo || !userInfo.token) {
      navigate('/user/login', { replace: true, state: { from: '/profile', message: 'Please sign in to access your profile and wallet.' } });
    } else {
      fetchProfileData();
    }
  }, [userInfo, fetchProfileData, navigate]);

  // Auto-dismiss notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Handle Logo file select and base64 convert
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setNotification({ type: 'error', message: 'Please select a valid image file (PNG, JPG, WEBP)' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setNotification({ type: 'error', message: 'Logo file size must be less than 5MB' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
      setProfileData((prev) => ({ ...prev, teamLogo: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  // Save Team Details & Drops
  const handleSaveDetails = async (e) => {
    e.preventDefault();
    if (!profileData.teamName.trim()) {
      setNotification({ type: 'error', message: 'Team name cannot be empty' });
      return;
    }

    setSaving(true);
    try {
      const { data } = await axios.put(
        `${API_URL}/api/users/profile`,
        {
          teamName: profileData.teamName.trim(),
          teamLogo: profileData.teamLogo,
          whatsappNumber: profileData.whatsappNumber.trim(),
          erangelDrop: profileData.erangelDrop.trim(),
          rondoDrop: profileData.rondoDrop.trim(),
          miramarDrop: profileData.miramarDrop.trim(),
        },
        { headers: { Authorization: `Bearer ${userInfo.token}` } }
      );

      const updatedUserInfo = {
        ...userInfo,
        teamName: data.user?.teamName || profileData.teamName,
      };
      localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));

      setNotification({
        type: 'success',
        message: 'Team Details & Drop Locations updated successfully!',
      });
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to save profile changes.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Step 1: Initiate Deposit (WinZO-style: creates order with dynamic UPI QR & DeepLink)
  const handleInitiateDeposit = async (e) => {
    e.preventDefault();
    const amountNum = Number(addAmount);
    if (!amountNum || amountNum < 10) {
      setDepositError('Minimum deposit amount is ₹10');
      return;
    }

    setDepositError('');
    setProcessing(true);
    try {
      const { data } = await axios.post(
        `${API_URL}/api/wallet/deposit/initiate`,
        { amount: amountNum },
        { headers: { Authorization: `Bearer ${userInfo.token}` } }
      );

      setDepositTxn(data);
      setDepositStep(2);
    } catch (err) {
      setDepositError(err.response?.data?.message || 'Failed to initiate deposit. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Step 2: Submit UTR number for admin verification (No free money credited!)
  const handleSubmitDepositUtr = async (e) => {
    e.preventDefault();
    const cleanUtr = depositUtr.trim();
    if (!cleanUtr) {
      setDepositError('Please enter your 12-digit UPI Transaction ID (UTR number).');
      return;
    }
    if (cleanUtr.length < 6) {
      setDepositError('Transaction ID (UTR) must be at least 6 characters.');
      return;
    }

    setDepositError('');
    setProcessing(true);
    try {
      await axios.post(
        `${API_URL}/api/wallet/deposit/submit-utr`,
        {
          transactionId: depositTxn?.transactionId,
          utrNumber: cleanUtr,
          amount: Number(addAmount),
        },
        { headers: { Authorization: `Bearer ${userInfo.token}` } }
      );

      setDepositStep(3);
      fetchProfileData();
    } catch (err) {
      setDepositError(err.response?.data?.message || 'Failed to submit payment proof. Please check your UTR.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setDepositStep(1);
    setDepositUtr('');
    setDepositError('');
    setDepositTxn(null);
    setAddAmount('100');
  };

  const copyDepositUpiId = () => {
    const upi = depositTxn?.upiId || 'Q264921089@ybl';
    navigator.clipboard.writeText(upi).then(() => {
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    });
  };

  // Withdraw
  const handleWithdraw = async (e) => {
    e.preventDefault();
    const amountNum = Number(withdrawAmount);
    if (!amountNum || amountNum < 50) {
      setNotification({ type: 'error', message: 'Minimum withdrawal amount is ₹50' });
      return;
    }
    if (amountNum > profileData.walletBalance) {
      setNotification({
        type: 'error',
        message: `Insufficient balance. Available: ₹${profileData.walletBalance}.`,
      });
      return;
    }
    if (!upiId || !upiId.trim()) {
      setNotification({ type: 'error', message: 'Please enter your UPI ID' });
      return;
    }

    setProcessing(true);
    try {
      const { data } = await axios.post(
        `${API_URL}/api/wallet/withdraw`,
        { amount: amountNum, upiId: upiId.trim(), notes: withdrawNotes },
        { headers: { Authorization: `Bearer ${userInfo.token}` } }
      );

      setProfileData((prev) => ({
        ...prev,
        walletBalance: data.balance ?? (prev.walletBalance - amountNum),
      }));
      setNotification({
        type: 'success',
        message: data.message || `Withdrawal request for ₹${amountNum} submitted!`,
      });
      setShowWithdrawModal(false);
      setWithdrawAmount('50');
      setUpiId('');
      setWithdrawNotes('');
      fetchProfileData();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Withdrawal request failed.',
      });
    } finally {
      setProcessing(false);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    window.location.href = '/user/login';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'success':
        return <span className="wallet-badge badge-success">✓ Success</span>;
      case 'pending':
        return <span className="wallet-badge badge-pending">⏳ Pending</span>;
      case 'pending_verification':
        return (
          <span
            className="wallet-badge"
            style={{
              background: 'rgba(234, 179, 8, 0.15)',
              color: '#fbbf24',
              border: '1px solid rgba(234, 179, 8, 0.35)',
            }}
          >
            ⏳ Pending Verify
          </span>
        );
      case 'failed':
      case 'rejected':
        return <span className="wallet-badge badge-failed">✗ Rejected</span>;
      default:
        return <span className="wallet-badge">{status}</span>;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'add_balance':
        return { label: 'Deposit', sign: '+', color: '#10b981' };
      case 'withdrawal':
        return { label: 'Withdrawal', sign: '-', color: '#ef4444' };
      case 'payment':
        return { label: 'Slot Booking', sign: '-', color: '#f59e0b' };
      case 'refund':
        return { label: 'Refund', sign: '+', color: '#8b5cf6' };
      case 'admin_adjustment':
        return { label: 'Admin Adjustment', sign: '±', color: '#38bdf8' };
      default:
        return { label: type, sign: '', color: 'inherit' };
    }
  };

  if (loading) {
    return (
      <div className="profile-page loading" style={{ padding: '6rem 1rem', textAlign: 'center' }}>
        <div className="spinner"></div>
        <p>Loading your Profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-page fade-in">
      {/* Toast Notification */}
      {notification && (
        <div className={`slot-toast-alert ${notification.type === 'success' ? 'toast-success' : 'toast-error'}`}>
          <div className="toast-icon">
            {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          </div>
          <span className="toast-text">{notification.message}</span>
          <button className="toast-close-btn" onClick={() => setNotification(null)}>×</button>
        </div>
      )}

      {/* Profile Banner / Header */}
      <div className="profile-header-banner">
        <div className="profile-header-content">
          <div className="profile-avatar-wrap">
            {logoPreview ? (
              <img src={logoPreview} alt="Team Logo" className="profile-avatar-img" />
            ) : (
              <div className="profile-avatar-placeholder">
                <Shield size={36} />
              </div>
            )}
            <label htmlFor="logo-file-input" className="profile-avatar-change-btn" title="Upload Team Logo">
              <Camera size={14} />
              <input
                id="logo-file-input"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleLogoUpload}
              />
            </label>
          </div>

          <div className="profile-header-info">
            <div className="profile-team-title-row">
              <h1>{profileData.teamName || 'Your Team'}</h1>
              {profileData.registrationNumber && (
                <span className="profile-rising-id">ID: #{profileData.registrationNumber}</span>
              )}
            </div>
            <p className="profile-phone-text">
              <Phone size={13} style={{ display: 'inline', marginRight: '4px' }} />
              {profileData.phone ? (profileData.phone.length === 10 ? `+91 ${profileData.phone}` : profileData.phone) : 'No phone linked'}
            </p>
          </div>

          <div className="profile-header-wallet">
            <span className="wallet-badge-label">Wallet Balance</span>
            <span className="wallet-balance-amount">₹{Number(profileData.walletBalance).toFixed(2)}</span>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="action-btn"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem' }}
                onClick={() => setShowAddModal(true)}
              >
                <PlusCircle size={14} style={{ marginRight: '4px' }} />
                Add Money
              </button>
              <button
                type="button"
                className="tab-btn"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem' }}
                onClick={() => setShowWithdrawModal(true)}
              >
                <ArrowUpRight size={14} style={{ marginRight: '4px' }} />
                Withdraw
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Main Options / Tabs */}
      <div className="profile-navigation-tabs">
        <button
          type="button"
          className={`profile-nav-tab ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          <User size={18} />
          <span>Details</span>
        </button>
        <button
          type="button"
          className={`profile-nav-tab ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          <History size={18} />
          <span>Transactions</span>
        </button>
        <button
          type="button"
          className={`profile-nav-tab ${activeTab === 'logout' ? 'active' : ''}`}
          onClick={() => setActiveTab('logout')}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>

      {/* ── TAB 1: DETAILS ── */}
      {activeTab === 'details' && (
        <div className="profile-tab-content fade-in">
          <form onSubmit={handleSaveDetails} className="profile-details-form">
            {/* Team Details Section */}
            <div className="profile-form-section">
              <div className="section-title-wrap">
                <Shield size={20} className="section-icon" />
                <h3>Team Details</h3>
              </div>

              <div className="profile-fields-grid">
                <div className="form-group">
                  <label htmlFor="teamName">Team Name</label>
                  <input
                    id="teamName"
                    type="text"
                    placeholder="Enter official team name"
                    value={profileData.teamName}
                    onChange={(e) => setProfileData({ ...profileData, teamName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="whatsappNumber">WhatsApp Number</label>
                  <input
                    id="whatsappNumber"
                    type="tel"
                    placeholder="e.g. +91 9876543210 (for scrim group invites)"
                    value={profileData.whatsappNumber}
                    onChange={(e) => setProfileData({ ...profileData, whatsappNumber: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Map Drops Section */}
            <div className="profile-form-section">
              <div className="section-title-wrap">
                <MapPin size={20} className="section-icon" />
                <h3>Drop Locations</h3>
              </div>
              <p className="section-subtitle">
                Specify your team&apos;s preferred drop location for official BGMI maps to prevent lobby drop clashes.
              </p>

              <div className="drops-fields-grid">
                <div className="drop-field-item">
                  <div className="drop-map-badge map-erangel">Erangel</div>
                  <input
                    type="text"
                    placeholder="e.g. Pochinki / School"
                    value={profileData.erangelDrop}
                    onChange={(e) => setProfileData({ ...profileData, erangelDrop: e.target.value })}
                  />
                </div>

                <div className="drop-field-item">
                  <div className="drop-map-badge map-miramar">Miramar</div>
                  <input
                    type="text"
                    placeholder="e.g. Pecado / Hacienda"
                    value={profileData.miramarDrop}
                    onChange={(e) => setProfileData({ ...profileData, miramarDrop: e.target.value })}
                  />
                </div>

                <div className="drop-field-item">
                  <div className="drop-map-badge map-rondo">Rondo</div>
                  <input
                    type="text"
                    placeholder="e.g. Jadena City / Neoox"
                    value={profileData.rondoDrop}
                    onChange={(e) => setProfileData({ ...profileData, rondoDrop: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="profile-submit-row">
              <button type="submit" className="action-btn" disabled={saving}>
                <Save size={18} />
                {saving ? 'Saving Details...' : 'Save Profile Details'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── TAB 2: TRANSACTIONS ── */}
      {activeTab === 'transactions' && (
        <div className="profile-tab-content fade-in">
          <div className="profile-form-section">
            <div className="section-title-wrap">
              <History size={20} className="section-icon" />
              <h3>Transaction History</h3>
            </div>

            {transactions.length === 0 ? (
              <div className="empty-state" style={{ padding: '3rem 0', textAlign: 'center' }}>
                <History size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
                <h3>No Transactions Found</h3>
                <p>You haven&apos;t made any wallet deposits, slot payments, or withdrawals yet.</p>
              </div>
            ) : (
              <>
                <div className="profile-table-wrapper">
                <table className="profile-txns-table">
                  <thead>
                    <tr>
                      <th>Txn ID</th>
                      <th>Date &amp; Time</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Details / Item</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((txn) => {
                      const typeInfo = getTypeLabel(txn.type);
                      const formattedDate = new Date(txn.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <tr key={txn._id}>
                          <td>
                            <code className="txn-id-code">{txn.transactionId}</code>
                          </td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {formattedDate}
                          </td>
                          <td>
                            <span className="txn-type-label" style={{ color: typeInfo.color }}>
                              {typeInfo.label}
                            </span>
                          </td>
                          <td style={{ fontWeight: '700', color: typeInfo.color }}>
                            {typeInfo.sign}₹{txn.amount}
                          </td>
                          <td>{getStatusBadge(txn.status)}</td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            <div>{txn.relatedItem || (txn.upiId ? `UPI: ${txn.upiId}` : txn.notes || '-')}</div>
                            {txn.utrNumber && (
                              <div style={{ color: '#fbbf24', fontSize: '0.74rem', fontFamily: 'monospace', marginTop: '2px' }}>
                                UTR: {txn.utrNumber}
                              </div>
                            )}
                            {txn.rejectionReason && (
                              <div style={{ color: '#f87171', fontSize: '0.72rem', marginTop: '2px' }}>
                                Reason: {txn.rejectionReason}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile View Transaction Cards (Zero horizontal overflow) */}
              <div className="mobile-txns-list">
                {transactions.map((txn) => {
                  const typeInfo = getTypeLabel(txn.type);
                  const formattedDate = new Date(txn.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div key={txn._id} className="mobile-txn-card">
                      <div className="mobile-txn-left">
                        <span className="mobile-txn-type" style={{ color: typeInfo.color }}>
                          {typeInfo.label}
                        </span>
                        <span className="mobile-txn-date">{formattedDate}</span>
                        <code style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px' }}>
                          {txn.transactionId}
                        </code>
                        {txn.utrNumber && (
                          <span style={{ fontSize: '0.68rem', color: '#fbbf24', marginTop: '2px' }}>
                            UTR: {txn.utrNumber}
                          </span>
                        )}
                        {txn.rejectionReason && (
                          <span style={{ fontSize: '0.68rem', color: '#f87171', marginTop: '2px' }}>
                            Reason: {txn.rejectionReason}
                          </span>
                        )}
                      </div>
                      <div className="mobile-txn-right">
                        <span className="mobile-txn-amount" style={{ color: typeInfo.color }}>
                          {typeInfo.sign}₹{txn.amount}
                        </span>
                        <div style={{ marginTop: '4px' }}>
                          {getStatusBadge(txn.status)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
          </div>
        </div>
      )}

      {/* ── TAB 3: LOGOUT ── */}
      {activeTab === 'logout' && (
        <div className="profile-tab-content fade-in">
          <div className="profile-logout-card">
            <div className="logout-icon-bubble">
              <LogOut size={32} />
            </div>
            <h2>Log Out of Rising Esports</h2>
            <p>
              Are you sure you want to log out? You will need to log back in with your phone number and password to book slots and manage your wallet.
            </p>

            <div className="logout-confirm-actions">
              <button
                type="button"
                className="action-btn logout-danger-btn"
                onClick={handleLogout}
              >
                Yes, Sign Out
              </button>
              <button
                type="button"
                className="tab-btn"
                onClick={() => setActiveTab('details')}
              >
                Cancel &amp; Stay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD MONEY (WinZO Style) ── */}
      {showAddModal && (
        <div className="modal-overlay fade-in" onClick={handleCloseAddModal}>
          <div className="modal-content wallet-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <CreditCard size={20} style={{ color: 'var(--purple-light)' }} />
                <h3>
                  {depositStep === 1 ? 'Add Cash to Wallet' : depositStep === 2 ? `Pay ₹${addAmount}` : 'Deposit Submitted'}
                </h3>
              </div>
              <button className="modal-close-btn" onClick={handleCloseAddModal}>
                <X size={18} />
              </button>
            </div>

            {/* STEP 1: SELECT AMOUNT */}
            {depositStep === 1 && (
              <form onSubmit={handleInitiateDeposit} className="wallet-modal-form">
                <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.8rem', color: '#c4b5fd', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Shield size={16} />
                  <span>100% Safe &amp; Verified UPI Deposit</span>
                </div>

                <div className="form-group">
                  <label>Deposit Amount (₹)</label>
                  <div className="wallet-input-wrap">
                    <span className="wallet-input-prefix">₹</span>
                    <input
                      type="number"
                      min="10"
                      placeholder="e.g. 100"
                      value={addAmount}
                      onChange={(e) => { setAddAmount(e.target.value); setDepositError(''); }}
                      required
                      autoFocus
                    />
                  </div>
                  {depositError && (
                    <p style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '0.4rem' }}>{depositError}</p>
                  )}
                </div>

                <div className="wallet-quick-amounts">
                  {[50, 100, 200, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      className={`quick-amt-btn ${Number(addAmount) === amt ? 'active' : ''}`}
                      onClick={() => { setAddAmount(String(amt)); setDepositError(''); }}
                    >
                      +₹{amt}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  className="action-btn"
                  style={{ width: '100%', marginTop: '1.2rem', padding: '0.85rem' }}
                  disabled={processing}
                >
                  {processing ? 'Generating Payment QR...' : `Proceed to Pay ₹${addAmount || 0}`}
                </button>
                <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.7rem' }}>
                  Min deposit ₹10 · Instant UPI QR Generation
                </p>
              </form>
            )}

            {/* STEP 2: SCAN QR & ENTER UTR */}
            {depositStep === 2 && (
              <form onSubmit={handleSubmitDepositUtr} className="wallet-modal-form">
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '16px', padding: '1rem', textAlign: 'center', marginBottom: '1rem' }}>
                  <div style={{ display: 'inline-block', padding: '10px', background: '#fff', borderRadius: '12px', marginBottom: '0.6rem' }}>
                    <img
                      src={paymentQR}
                      alt="Deposit QR"
                      width="160"
                      height="160"
                      style={{ display: 'block', borderRadius: '4px', imageRendering: 'crisp-edges' }}
                    />
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '0 0 0.5rem' }}>
                    Scan with any UPI app to pay <strong style={{ color: '#a78bfa' }}>₹{addAmount}</strong>
                  </p>

                  {/* UPI Copy Box */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '8px', padding: '0.5rem 0.8rem', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>UPI ID:</span>
                    <code style={{ color: '#c4b5fd', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '0.85rem' }}>
                      {depositTxn?.upiId || 'Q264921089@ybl'}
                    </code>
                    <button
                      type="button"
                      onClick={copyDepositUpiId}
                      style={{
                        padding: '0.25rem 0.6rem',
                        background: copiedUpi ? 'rgba(34,197,94,0.2)' : 'rgba(139,92,246,0.2)',
                        border: `1px solid ${copiedUpi ? '#4ade80' : '#a78bfa'}`,
                        borderRadius: '4px',
                        color: copiedUpi ? '#4ade80' : '#c4b5fd',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                      }}
                    >
                      {copiedUpi ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* Instructions */}
                <div style={{ background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.15)', borderRadius: '8px', padding: '0.65rem 0.85rem', marginBottom: '1rem', fontSize: '0.74rem', color: '#fef08a' }}>
                  <strong>⚡ How to complete:</strong>
                  <ol style={{ margin: '0.3rem 0 0', paddingLeft: '1.1rem', lineHeight: '1.6' }}>
                    <li>Pay <strong>₹{addAmount}</strong> via GPay / PhonePe / Paytm / BHIM</li>
                    <li>Copy the 12-digit <strong>UTR / UPI Ref Number</strong> from app</li>
                    <li>Paste below and click submit for admin verification</li>
                  </ol>
                </div>

                <div className="form-group">
                  <label>12-Digit UTR / Transaction ID *</label>
                  <input
                    type="text"
                    placeholder="e.g. 426312598765"
                    value={depositUtr}
                    onChange={(e) => { setDepositUtr(e.target.value); setDepositError(''); }}
                    style={{ fontFamily: 'monospace', fontSize: '0.95rem' }}
                    required
                    autoFocus
                  />
                  {depositError && (
                    <p style={{ color: '#f87171', fontSize: '0.76rem', marginTop: '0.4rem' }}>{depositError}</p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button
                    type="button"
                    className="tab-btn"
                    onClick={() => { setDepositStep(1); setDepositError(''); }}
                    style={{ flex: '1', padding: '0.75rem' }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="action-btn"
                    style={{ flex: '2', padding: '0.75rem' }}
                    disabled={processing || !depositUtr.trim()}
                  >
                    {processing ? 'Submitting...' : 'Submit Payment Proof'}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: SUBMITTED SUCCESS */}
            {depositStep === 3 && (
              <div style={{ textAlign: 'center', padding: '1rem 0.5rem' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(34,197,94,0.15)', border: '2px solid #22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: '#22c55e' }}>
                  <CheckCircle size={32} />
                </div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Deposit Submitted!</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.2rem', lineHeight: '1.5' }}>
                  Your deposit request of <strong style={{ color: '#4ade80' }}>₹{addAmount}</strong> with UTR <code style={{ color: '#fbbf24' }}>{depositUtr}</code> is now pending admin verification.
                </p>
                <div style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.25)', borderRadius: '10px', padding: '0.8rem', marginBottom: '1.5rem', fontSize: '0.78rem', color: '#fde68a' }}>
                  ⏱ <strong>Verification Time:</strong> 5–15 minutes. Your wallet balance will be updated automatically as soon as the admin verifies your transaction.
                </div>
                <button
                  type="button"
                  className="action-btn"
                  style={{ width: '100%', padding: '0.8rem' }}
                  onClick={handleCloseAddModal}
                >
                  View in Transactions
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: WITHDRAW ── */}
      {showWithdrawModal && (
        <div className="modal-overlay fade-in" onClick={() => setShowWithdrawModal(false)}>
          <div className="modal-content wallet-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <SendHorizontal size={20} style={{ color: 'var(--purple-light)' }} />
                <h3>Withdraw Earnings</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setShowWithdrawModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleWithdraw} className="wallet-modal-form">
              <div className="wallet-modal-balance-hint">
                <span>Available:</span>
                <strong>₹{profileData.walletBalance}</strong>
              </div>

              <div className="form-group">
                <label>Withdrawal Amount (₹)</label>
                <div className="wallet-input-wrap">
                  <span className="wallet-input-prefix">₹</span>
                  <input
                    type="number"
                    min="50"
                    max={profileData.walletBalance}
                    placeholder="Min ₹50"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>UPI ID</label>
                <input
                  type="text"
                  placeholder="e.g. yourname@okaxis"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Note / Team Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Scrim prize withdrawal"
                  value={withdrawNotes}
                  onChange={(e) => setWithdrawNotes(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="action-btn"
                style={{ width: '100%', marginTop: '1rem', background: 'linear-gradient(135deg, #10b981, #059669)' }}
                disabled={processing}
              >
                {processing ? 'Submitting Request...' : `Withdraw ₹${withdrawAmount || 0}`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
