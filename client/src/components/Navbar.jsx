import { useState } from 'react'
import { NavLink } from 'react-router-dom'

function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => setIsOpen(!isOpen)
  const closeMenu = () => setIsOpen(false)

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <h1>Rising Esports</h1>
        <span>Compete · Rise · Dominate</span>
      </div>

      <div className={`navbar-links ${isOpen ? 'open' : ''}`}>
        <NavLink to="/" onClick={closeMenu} className={({ isActive }) => isActive ? 'active' : ''}>Home</NavLink>
        <NavLink to="/tournaments" onClick={closeMenu} className={({ isActive }) => isActive ? 'active' : ''}>Tournaments</NavLink>
        <NavLink to="/tier" onClick={closeMenu} className={({ isActive }) => isActive ? 'active' : ''}>Tier</NavLink>
        <NavLink to="/slots" onClick={closeMenu} className={({ isActive }) => isActive ? 'active' : ''}>Today Slots</NavLink>
        <NavLink to="/rankings" onClick={closeMenu} className={({ isActive }) => isActive ? 'active' : ''}>Rankings</NavLink>
        <NavLink 
          to={localStorage.getItem('adminInfo') ? "/admin/dashboard" : "/admin/login"} 
          onClick={closeMenu} 
          className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
          style={{
            border: '1px solid var(--purple-primary)',
            borderRadius: '20px',
            color: 'var(--purple-light)'
          }}
        >
          {localStorage.getItem('adminInfo') ? "Dashboard" : "Admin"}
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
