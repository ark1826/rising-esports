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
    <nav className="navbar">
      <div className="navbar-logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
        <h1>Rising Esports</h1>
        <span>Compete · Rise · Dominate</span>
      </div>

      <div className={`navbar-links ${isOpen ? 'open' : ''}`}>
        <NavLink to="/" onClick={closeMenu} className={({ isActive }) => isActive ? 'active' : ''}>Home</NavLink>
        <NavLink to="/tournaments" onClick={closeMenu} className={({ isActive }) => isActive ? 'active' : ''}>Tournaments</NavLink>
        <NavLink to="/tier" onClick={closeMenu} className={({ isActive }) => isActive ? 'active' : ''}>Tier</NavLink>
        <NavLink to="/slots" onClick={closeMenu} className={({ isActive }) => isActive ? 'active' : ''}>Today Slots</NavLink>
        <NavLink to="/rankings" onClick={closeMenu} className={({ isActive }) => isActive ? 'active' : ''}>Rankings</NavLink>
        
        {userInfo ? (
          <>

            <button 
              onClick={handleUserLogout} 
              className="navbar-logout-btn"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-accent)',
                fontSize: '0.8rem',
                fontWeight: '600',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color: 'var(--text-secondary)',
                padding: '0.5rem 1rem',
                borderRadius: '20px',
              }}
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
          style={{
            border: '1px solid var(--purple-primary)',
            borderRadius: '20px',
            color: 'var(--purple-light)'
          }}
        >
          {adminInfo ? "Admin Panel" : "Admin"}
        </NavLink>
      </div>

      <div className={`navbar-hamburger ${isOpen ? 'open' : ''}`} onClick={toggleMenu}>
        <span></span>
        <span></span>
        <span></span>
      </div>
    </nav>
  )
}

export default Navbar
