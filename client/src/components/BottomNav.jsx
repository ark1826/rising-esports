import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

export default function BottomNav() {
  const location = useLocation();

  const navItems = [
    {
      label: 'Home',
      path: '/',
      exact: true,
      icon: (active) => (
        <svg viewBox="0 0 24 24" width="22" height="22" fill={active ? '#a855f7' : 'none'} stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9.5z" />
        </svg>
      ),
    },
    {
      label: 'Today Slots',
      path: '/slots',
      icon: (active) => (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <circle cx="8" cy="14" r="1" fill="currentColor" />
          <circle cx="12" cy="14" r="1" fill="currentColor" />
          <circle cx="16" cy="14" r="1" fill="currentColor" />
          <circle cx="8" cy="18" r="1" fill="currentColor" />
          <circle cx="12" cy="18" r="1" fill="currentColor" />
        </svg>
      ),
    },
    {
      label: 'My Matches',
      path: '/slots?tab=my',
      isActive: (loc) => loc.pathname === '/slots' && loc.search.includes('tab=my'),
      icon: (active) => (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="3" fill={active ? 'currentColor' : 'none'} />
        </svg>
      ),
    },
    {
      label: 'Rankings',
      path: '/rankings',
      icon: (active) => (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
    },
    {
      label: 'Profile',
      path: '/profile',
      isActive: (loc) => loc.pathname === '/profile' || loc.pathname === '/user/login',
      icon: (active) => (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="bottom-nav-bar" aria-label="Mobile Navigation">
      <div className="bottom-nav-container">
        {navItems.map((item) => {
          const active = item.isActive
            ? item.isActive(location)
            : item.exact
            ? location.pathname === item.path && !location.search.includes('tab=my')
            : location.pathname === item.path;

          return (
            <NavLink
              key={item.label}
              to={item.path}
              className={`bottom-nav-item ${active ? 'active' : ''}`}
            >
              {active && <div className="bottom-nav-indicator" />}
              <div className="bottom-nav-icon-wrap">
                {item.icon(active)}
              </div>
              <span className="bottom-nav-label">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
