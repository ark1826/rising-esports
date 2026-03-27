import { useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const defaultTournaments = [
  {
    _id: '1',
    title: 'BGMI Pro Series 2024',
    game: 'BGMI',
    date: 'April 1, 2026',
    location: 'ONLINE TOURNAMENT',
    prizePool: 1000,
    entryFee: 100,
    status: 'OPEN',
    registrationOpen: false
  },
  {
    _id: '2',
    title: 'BGMI Rising Series: S1',
    game: 'BGMI',
    date: 'April 1, 2026',
    location: 'ONLINE TOURNAMENT',
    prizePool: 1000,
    entryFee: 100,
    status: 'OPEN',
    registrationOpen: false
  },
  {
    _id: '3',
    title: 'Rising Cup: Season 4',
    game: 'BGMI',
    date: 'April 1, 2026',
    location: 'ONLINE TOURNAMENT',
    prizePool: 1000,
    entryFee: 100,
    status: 'OPEN',
    registrationOpen: false
  }
]

function Tournaments() {
  const [tournaments] = useState(defaultTournaments)

  return (
    <div className="tournaments-page fade-in">
      <div className="page-header">
        <h1>Available <span>Tournaments</span></h1>
        <p>Browse upcoming open events and competitive leagues. Register your team to compete for professional rewards.</p>
      </div>

      <div className="tournaments-grid">
        {tournaments.map(t => (
          <div key={t._id} className="tournament-card">
            <div className="tournament-image">
              <span className={`tournament-status-badge ${t.status.toLowerCase()}`}>
                {t.status}
              </span>
              <span className="tournament-coming-soon">Coming Soon</span>
            </div>
            <div className="tournament-content">
              <div className="tournament-game">{t.game}</div>
              <div className="tournament-title">{t.title}</div>
              <div className="tournament-info">
                <div className="tournament-info-item">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{fill: 'none', stroke: '#6b6b80'}}>
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <span>{t.date}</span>
                </div>
                <div className="tournament-info-item">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{fill: 'none', stroke: '#6b6b80'}}>
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span>{t.location}</span>
                </div>
              </div>
              <div className="tournament-footer">
                <div className="tournament-price-row">
                  <span className="tournament-price-label">Prize Pool</span>
                  <span className="tournament-price-value">₹{t.prizePool.toLocaleString()}</span>
                </div>
                <div className="tournament-price-row">
                  <span className="tournament-price-label">Entry Fee</span>
                  <span className="tournament-price-value">₹{t.entryFee}</span>
                </div>
                <button
                  className={`tournament-reg-btn ${!t.registrationOpen ? 'closed' : ''}`}
                  disabled={!t.registrationOpen}
                >
                  {t.registrationOpen ? 'Register Now' : 'Registration Closed'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Tournaments
