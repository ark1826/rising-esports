import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Bell, X, LogOut } from 'lucide-react'
import RisingLogo from './RisingLogo'

function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const navigate = useNavigate()

  const toggleMenu = () => {
    setIsOpen(!isOpen)
    if (showNotifications) setShowNotifications(false)
  }
  const closeMenu = () => setIsOpen(false)

  const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null')
  const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || 'null')

  const handleUserLogout = () => {
    localStorage.removeItem('userInfo')
    closeMenu()
    navigate('/')
  }

  // Calculate user initials from real logged in user data
  const getInitials = () => {
    const name = userInfo?.teamName || userInfo?.name || userInfo?.username || '';
    if (name) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    if (userInfo?.phone) {
      return userInfo.phone.slice(-2);
    }
    return '';
  };

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

          <div className="drawer-divider" />

          <NavLink
            to={adminInfo ? "/admin/dashboard" : "/admin/login"}
            onClick={closeMenu}
            className={({ isActive }) => `drawer-nav-item admin-link ${isActive ? 'active' : ''}`}
          >
            <span className="drawer-item-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </span>
            <span className="drawer-item-label">{adminInfo ? "Admin Dashboard" : "Admin Panel"}</span>
          </NavLink>

          {userInfo && (
            <button
              onClick={handleUserLogout}
              className="drawer-logout-btn"
              type="button"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          )}
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

            <NavLink 
              to={adminInfo ? "/admin/dashboard" : "/admin/login"} 
              className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
            >
              {adminInfo ? "Admin Panel" : "Admin"}
            </NavLink>
          </div>

          {/* Right Header Action Icons: Bell, Avatar "AK", Hamburger */}
          <div className="navbar-actions-right">
            {/* Notification Bell */}
            <div className="navbar-notif-wrap" style={{ position: 'relative' }}>
              <button
                className="header-icon-btn notif-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Notifications"
                type="button"
              >
                <Bell size={21} />
                <span className="notif-pulse-dot" />
              </button>

              {/* Notification Popover Dropdown */}
              {showNotifications && (
                <div className="notif-dropdown-menu fade-in">
                  <div className="notif-header">
                    <h4>Notifications</h4>
                    <span className="notif-badge-count">Live</span>
                  </div>
                  <div className="notif-items-list">
                    <div className="notif-item">
                      <div className="notif-item-dot" />
                      <div className="notif-item-body">
                        <p className="notif-title">Official BGMI Scrims</p>
                        <p className="notif-desc">Room ID &amp; Password will be published in your registered slot details 15 mins prior to match start.</p>
                        <span className="notif-time">Official</span>
                      </div>
                    </div>
                  </div>
                  <div className="notif-footer">
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
