import { useState, useEffect, useCallback } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  Bell,
  X,
  LogOut,
  CheckCircle,
  XCircle,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Trophy,
  Sparkles,
  Check,
  Trash2,
  Send,
  ChevronRight
} from 'lucide-react'
import RisingLogo from './RisingLogo'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loadingNotifs, setLoadingNotifs] = useState(false)
  const navigate = useNavigate()

  const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null')

  const toggleMenu = () => {
    setIsOpen(!isOpen)
    if (showNotifications) setShowNotifications(false)
  }
  const closeMenu = () => setIsOpen(false)

  // ── Fetch Notifications ──
  const fetchNotifications = useCallback(async () => {
    if (!userInfo || !userInfo.token) {
      setNotifications([])
      setUnreadCount(0)
      return
    }

    try {
      const { data } = await axios.get(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      })
      if (data?.notifications) {
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (err) {
      // ignore in background
    }
  }, [userInfo?.token])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 15000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Mark all as read
  const handleMarkAllRead = async () => {
    if (!userInfo?.token) return
    try {
      await axios.put(
        `${API_URL}/api/notifications/mark-all-read`,
        {},
        { headers: { Authorization: `Bearer ${userInfo.token}` } }
      )
      setUnreadCount(0)
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch {
      // ignore
    }
  }

  // Clear all notifications
  const handleClearAllNotifs = async () => {
    if (!userInfo?.token) return
    try {
      await axios.delete(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      })
      setNotifications([])
      setUnreadCount(0)
    } catch {
      // ignore
    }
  }

  // Handle individual notification click
  const handleNotificationClick = async (notif) => {
    if (!notif.read && !notif.isSystem && userInfo?.token) {
      try {
        await axios.put(
          `${API_URL}/api/notifications/${notif._id}/read`,
          {},
          { headers: { Authorization: `Bearer ${userInfo.token}` } }
        )
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, read: true } : n))
        )
        setUnreadCount((c) => Math.max(0, c - 1))
      } catch {
        // ignore
      }
    }

    setShowNotifications(false)
    closeMenu()

    // Smart route navigation
    if (notif.type?.includes('withdraw') || notif.type?.includes('deposit') || notif.type?.includes('wallet')) {
      navigate('/profile')
    } else if (notif.type?.includes('booking')) {
      navigate('/slots?tab=my')
    }
  }

  // Format relative time
  const formatTime = (dateStr) => {
    if (!dateStr) return ''
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 172800) return 'Yesterday'
    return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  const handleUserLogout = () => {
    localStorage.removeItem('userInfo')
    closeMenu()
    navigate('/')
  }

  // Calculate user initials from real logged in user data
  const getInitials = () => {
    const name = userInfo?.teamName || userInfo?.name || userInfo?.username || ''
    if (name) {
      const parts = name.trim().split(/\s+/)
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase()
      }
      return name.slice(0, 2).toUpperCase()
    }
    if (userInfo?.phone) {
      return userInfo.phone.slice(-2)
    }
    return ''
  }

  return (
    <>
      {/* ── Mobile Backdrop (dimming overlay) ── */}
      {isOpen && (
        <div
          className="navbar-backdrop"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile Sidebar Drawer (Outside header to prevent stacking context trapping) ── */}
      <aside
        className={`mobile-nav-drawer ${isOpen ? 'open' : ''}`}
        aria-label="Mobile Navigation Menu"
        aria-hidden={!isOpen}
      >
        <div className="mobile-drawer-header">
          <div onClick={() => { navigate('/'); closeMenu(); }} style={{ cursor: 'pointer' }}>
            <RisingLogo size="small" />
          </div>
          <button
            className="mobile-drawer-close"
            onClick={closeMenu}
            aria-label="Close navigation menu"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Card if logged in */}
        {userInfo ? (
          <div
            className="mobile-drawer-user-card"
            onClick={() => { navigate('/profile'); closeMenu(); }}
          >
            <div className="mobile-drawer-avatar">
              {getInitials()}
            </div>
            <div className="mobile-drawer-user-info">
              <strong>{userInfo.teamName || 'Player Profile'}</strong>
              <span>{userInfo.registrationNumber ? `#${userInfo.registrationNumber}` : (userInfo.phone || 'Verified Member')}</span>
            </div>
          </div>
        ) : (
          <div
            className="mobile-drawer-guest-card"
            onClick={() => { navigate('/user/login'); closeMenu(); }}
          >
            <div className="guest-icon-box">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div className="guest-card-text">
              <strong>Welcome, Player</strong>
              <span>Login to book scrims &amp; tournaments</span>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="mobile-drawer-nav">
          <NavLink
            to="/"
            onClick={closeMenu}
            className={({ isActive }) => `drawer-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="drawer-item-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9.5z"/></svg>
            </span>
            <span className="drawer-item-label">Home</span>
          </NavLink>

          <NavLink
            to="/slots"
            onClick={closeMenu}
            className={({ isActive }) => `drawer-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="drawer-item-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </span>
            <span className="drawer-item-label">Today Slots</span>
          </NavLink>

          <NavLink
            to="/slots?tab=my"
            onClick={closeMenu}
            className={({ isActive }) => `drawer-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="drawer-item-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
            </span>
            <span className="drawer-item-label">My Matches</span>
          </NavLink>

          <NavLink
            to="/tournaments"
            onClick={closeMenu}
            className={({ isActive }) => `drawer-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="drawer-item-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
            </span>
            <span className="drawer-item-label">Tournaments</span>
          </NavLink>

          <NavLink
            to="/rankings"
            onClick={closeMenu}
            className={({ isActive }) => `drawer-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="drawer-item-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            </span>
            <span className="drawer-item-label">Rankings</span>
          </NavLink>

          <NavLink
            to="/profile"
            onClick={closeMenu}
            className={({ isActive }) => `drawer-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="drawer-item-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </span>
            <span className="drawer-item-label">Profile &amp; Wallet</span>
          </NavLink>

          {userInfo && (
            <button
              type="button"
              onClick={() => {
                closeMenu()
                setShowNotifications(true)
                fetchNotifications()
              }}
              className="drawer-nav-item"
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                color: '#e2e8f0',
                fontFamily: 'inherit',
                fontSize: '0.9rem'
              }}
            >
              <span className="drawer-item-icon" style={{ display: 'flex', alignItems: 'center', color: '#c084fc' }}>
                <Bell size={18} />
              </span>
              <span className="drawer-item-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', fontWeight: 600 }}>
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="notif-badge-count">{unreadCount} New</span>
                )}
              </span>
            </button>
          )}

          {!userInfo && (
            <NavLink
              to="/user/login"
              onClick={closeMenu}
              className={({ isActive }) => `drawer-nav-item auth-btn ${isActive ? 'active' : ''}`}
            >
              <span className="drawer-item-icon">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
              </span>
              <span className="drawer-item-label">Login / Register</span>
            </NavLink>
          )}

          {userInfo && (
            <>
              <div className="drawer-divider" />
              <button
                onClick={handleUserLogout}
                className="drawer-logout-btn"
                type="button"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </>
          )}

          {/* Official Group Link Card (Screen 8) */}
          <a
            href="https://chat.whatsapp.com/FLX8eM2APOFCyiK8ReWER6?mode=gi_t"
            target="_blank"
            rel="noopener noreferrer"
            onClick={closeMenu}
            className="drawer-official-link-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, rgba(24, 18, 50, 0.95), rgba(16, 12, 34, 0.98))',
              border: '1px solid rgba(139, 92, 246, 0.35)',
              borderRadius: '14px',
              padding: '0.85rem 1rem',
              marginTop: '1.25rem',
              textDecoration: 'none',
              boxShadow: '0 4px 18px rgba(124, 58, 237, 0.2)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 0 10px rgba(2, 132, 199, 0.5)'
              }}>
                <Send size={16} />
              </div>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.88rem' }}>
                Official Group Link
              </span>
            </div>
            <ChevronRight size={18} color="#94a3b8" />
          </a>
        </nav>
      </aside>

      {/* ── Fixed Navbar Header Bar ── */}
      <header className="navbar-header-wrap">
        <nav className="navbar">
          {/* Logo with Stylized R mark */}
          <div className="navbar-logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
            <RisingLogo size="small" />
          </div>

          {/* Desktop Navigation Links (shown only on >= 1024px) */}
          <div className="navbar-links desktop-only">
            <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>Home</NavLink>
            <NavLink to="/tournaments" className={({ isActive }) => isActive ? 'active' : ''}>Tournaments</NavLink>
            <NavLink to="/slots" className={({ isActive }) => isActive ? 'active' : ''}>Today Slots</NavLink>
            <NavLink to="/rankings" className={({ isActive }) => isActive ? 'active' : ''}>Rankings</NavLink>
            
            {userInfo ? (
              <>
                <NavLink 
                  to="/profile" 
                  className={({ isActive }) => `profile-nav-link ${isActive ? 'active' : ''}`}
                >
                  <span className="navbar-team-badge">{userInfo.teamName || 'Profile'}</span>
                  {userInfo.registrationNumber && (
                    <span className="navbar-id-badge">
                      #{userInfo.registrationNumber}
                    </span>
                  )}
                </NavLink>

                <button 
                  onClick={handleUserLogout} 
                  className="navbar-logout-btn"
                  type="button"
                >
                  Logout
                </button>
              </>
            ) : (
              <NavLink to="/user/login" className={({ isActive }) => isActive ? 'active' : ''}>Login / Sign Up</NavLink>
            )}
          </div>

          {/* Right Header Action Icons: Bell, Avatar "AK", Hamburger */}
          <div className="navbar-actions-right">
            {/* Notification Bell */}
            <div className="navbar-notif-wrap" style={{ position: 'relative' }}>
              <button
                className="header-icon-btn notif-btn"
                onClick={() => {
                  setShowNotifications(!showNotifications)
                  if (!showNotifications) fetchNotifications()
                }}
                aria-label="Notifications"
                type="button"
              >
                <Bell size={21} />
                {unreadCount > 0 ? (
                  <span className="notif-badge-bubble">{unreadCount > 9 ? '9+' : unreadCount}</span>
                ) : (
                  <span className="notif-pulse-dot" />
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {showNotifications && (
                <div className="notif-dropdown-menu fade-in">
                  <div className="notif-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4>Notifications</h4>
                      {unreadCount > 0 && (
                        <span className="notif-badge-count">{unreadCount} New</span>
                      )}
                    </div>
                    <div className="notif-header-actions">
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          className="notif-mark-read-btn"
                          onClick={handleMarkAllRead}
                          title="Mark all as read"
                        >
                          Mark Read
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="notif-items-list">
                    {notifications.length === 0 ? (
                      <div className="notif-empty-state">
                        <Sparkles size={28} color="#a855f7" style={{ margin: '0 auto 8px', opacity: 0.7 }} />
                        <p>No notifications yet</p>
                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          Withdrawal and deposit updates will appear here.
                        </span>
                      </div>
                    ) : (
                      notifications.map((notif) => {
                        const isApproved =
                          notif.type?.includes('approved') || notif.status === 'approved'
                        const isRejected =
                          notif.type?.includes('rejected') || notif.status === 'rejected'
                        const isCredit = notif.type === 'wallet_credit'
                        const isDebit = notif.type === 'wallet_debit'

                        return (
                          <div
                            key={notif._id}
                            className={`notif-item ${!notif.read ? 'unread' : ''}`}
                            onClick={() => handleNotificationClick(notif)}
                          >
                            <div
                              className="notif-icon-box"
                              style={{
                                background: isApproved
                                  ? 'rgba(16, 185, 129, 0.15)'
                                  : isRejected
                                  ? 'rgba(239, 68, 68, 0.15)'
                                  : isCredit
                                  ? 'rgba(168, 85, 247, 0.15)'
                                  : isDebit
                                  ? 'rgba(245, 158, 11, 0.15)'
                                  : 'rgba(56, 189, 248, 0.15)',
                                border: `1px solid ${
                                  isApproved
                                    ? 'rgba(16, 185, 129, 0.35)'
                                    : isRejected
                                    ? 'rgba(239, 68, 68, 0.35)'
                                    : isCredit
                                    ? 'rgba(168, 85, 247, 0.35)'
                                    : isDebit
                                    ? 'rgba(245, 158, 11, 0.35)'
                                    : 'rgba(56, 189, 248, 0.35)'
                                }`,
                              }}
                            >
                              {isApproved ? (
                                <CheckCircle size={18} color="#10b981" />
                              ) : isRejected ? (
                                <XCircle size={18} color="#ef4444" />
                              ) : isCredit ? (
                                <ArrowDownLeft size={18} color="#a855f7" />
                              ) : isDebit ? (
                                <ArrowUpRight size={18} color="#f59e0b" />
                              ) : notif.type?.includes('booking') ? (
                                <Trophy size={18} color="#38bdf8" />
                              ) : (
                                <Sparkles size={18} color="#c084fc" />
                              )}
                            </div>

                            <div className="notif-item-body">
                              <div className="notif-title-row">
                                <span className="notif-title">{notif.title}</span>
                                {isApproved && (
                                  <span className="notif-status-badge notif-status-approved">
                                    Approved
                                  </span>
                                )}
                                {isRejected && (
                                  <span className="notif-status-badge notif-status-rejected">
                                    Rejected
                                  </span>
                                )}
                                {isCredit && (
                                  <span className="notif-status-badge notif-status-approved">
                                    Credited
                                  </span>
                                )}
                                {isDebit && (
                                  <span className="notif-status-badge notif-status-info">
                                    Debited
                                  </span>
                                )}
                                {notif.isSystem && (
                                  <span className="notif-status-badge notif-status-info">
                                    Notice
                                  </span>
                                )}
                              </div>
                              <p className="notif-desc">{notif.message}</p>
                              <span className="notif-time">{formatTime(notif.createdAt)}</span>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>

                  <div className="notif-footer">
                    {notifications.length > 0 && (
                      <button
                        className="notif-close-action"
                        onClick={handleClearAllNotifs}
                        type="button"
                        style={{ color: '#94a3b8', fontSize: '0.72rem' }}
                      >
                        Clear All
                      </button>
                    )}
                    <button
                      className="notif-close-action"
                      onClick={() => setShowNotifications(false)}
                      type="button"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Avatar Circle */}
            <div
              className="navbar-avatar-circle"
              onClick={() => navigate(userInfo ? '/profile' : '/user/login')}
              title={userInfo ? (userInfo.teamName || userInfo.name || 'My Profile') : 'Login / Register'}
              role="button"
              tabIndex={0}
              aria-label={userInfo ? "User Profile" : "Login"}
            >
              {userInfo ? (
                <span>{getInitials() || 'U'}</span>
              ) : (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              )}
            </div>

            {/* Hamburger Button */}
            <button 
              className={`navbar-hamburger ${isOpen ? 'open' : ''}`} 
              onClick={toggleMenu}
              aria-label="Toggle navigation menu"
              type="button"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </nav>
      </header>
    </>
  )
}

export default Navbar
