import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  const toggleMenu = () => setIsOpen(!isOpen)
  const closeMenu = () => setIsOpen(false)

  const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null')
  const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || 'null')

  const handleUserLogout = () => {
    localStorage.removeItem('userInfo')
    closeMenu()
    navigate('/')
  }

  return (
    <>
      {isOpen && <div className="navbar-backdrop" onClick={closeMenu} aria-hidden="true" />}
      <nav className="navbar">
        <div className="navbar-logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
          <h1>Rising Esports</h1>
          <span>Compete · Rise · Dominate</span>
        </div>

        <div className={`navbar-links ${isOpen ? 'open' : ''}`}>
          <NavLink to="/" onClick={closeMenu} className={({ isActive }) => isActive ? 'active' : ''}>Home</NavLink>
          <NavLink to="/tournaments" onClick={closeMenu} className={({ isActive }) => isActive ? 'active' : ''}>Tournaments</NavLink>
          <NavLink to="/slots" onClick={closeMenu} className={({ isActive }) => isActive ? 'active' : ''}>Today Slots</NavLink>
          <NavLink to="/rankings" onClick={closeMenu} className={({ isActive }) => isActive ? 'active' : ''}>Rankings</NavLink>
          
          {userInfo ? (
            <>
              <NavLink 
                to="/profile" 
                onClick={closeMenu} 
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
            <NavLink to="/user/login" onClick={closeMenu} className={({ isActive }) => isActive ? 'active' : ''}>Login</NavLink>
          )}

          <NavLink 
            to={adminInfo ? "/admin/dashboard" : "/admin/login"} 
            onClick={closeMenu} 
            className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
          >
            {adminInfo ? "Admin Panel" : "Admin"}
          </NavLink>
        </div>

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
      </nav>
    </>
  )
}

export default Navbar
