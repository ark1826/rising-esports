import { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'

function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const toggleMenu = () => setIsOpen(!isOpen)
  const closeMenu = () => setIsOpen(false)

  const handleTierClick = (e) => {
    e.preventDefault()
    closeMenu()
    if (location.pathname !== '/') {
      navigate('/')
      setTimeout(() => {
        document.getElementById('tier')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } else {
      document.getElementById('tier')?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <h1>Rising Esports</h1>
        <span>Compete · Rise · Dominate</span>
      </div>

      <div className={`navbar-links ${isOpen ? 'open' : ''}`}>
        <NavLink to="/" onClick={closeMenu} className={({ isActive }) => isActive ? 'active' : ''}>Home</NavLink>
        <NavLink to="/tournaments" onClick={closeMenu} className={({ isActive }) => isActive ? 'active' : ''}>Tournaments</NavLink>
        <a href="#tier" onClick={handleTierClick} className={location.pathname === '/' && location.hash === '#tier' ? 'active' : ''} style={{ textDecoration: 'none' }}>Tier</a>
        <NavLink to="/slots" onClick={closeMenu} className={({ isActive }) => isActive ? 'active' : ''}>Today Slots</NavLink>
        <NavLink to="/rankings" onClick={closeMenu} className={({ isActive }) => isActive ? 'active' : ''}>Rankings</NavLink>
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
