import { useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || ''

const defaultSlots = [
  
  {
    _id: '1',
    entryFee: 50,
    prizePool: [
      { position: 1, amount: 350 },
      { position: 2, amount: 120 },
      { position: 3, amount: 90 },
      { position: 4, amount: 60 }
    ]
  },
  {
    _id: '2',
    entryFee: 60,
    prizePool: [
      { position: 1, amount: 450 },
      { position: 2, amount: 150 },
      { position: 3, amount: 100 },
      { position: 4, amount: 70 }
    ]
  },
  {
    _id: '3',
    entryFee: 120,
    prizePool: [
      { position: 1, amount: 900 },
      { position: 2, amount: 400 },
      { position: 3, amount: 250 },
      { position: 4, amount: 150 }
    ]
  },
  {
    _id: '4',
    entryFee: 150,
    prizePool: [
      { position: 1, amount: 1250 },
      { position: 2, amount: 500 },
      { position: 3, amount: 300 },
      { position: 4, amount: 200 }
    ]
  }
]

function TodaySlots() {
  const [slots] = useState(defaultSlots)

  return (
    <div className="slots-page fade-in">
      <div className="page-header">
        <h1>Rising <span>Esports</span></h1>
      </div>

      {/* Register CTA */}
      <div className="slots-cta">
        <a
          href="https://chat.whatsapp.com/FLX8eM2APOFCyiK8ReWER6?mode=gi_t"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Register for Slots
        </a>
      </div>

      {/* Slot Cards */}
      <div className="slots-grid">
        {slots.map(slot => (
          <div key={slot._id} className="slot-card">
            <div className="slot-header">
              <div className="entry-fee">Entry Fee Rs. {slot.entryFee}</div>
              <h3>Prizepool</h3>
            </div>
            <div className="slot-prizes">
              {slot.prizePool.map((prize, idx) => (
                <div key={idx} className="prize-row">
                  <span className="prize-position">#{prize.position}</span>
                  <span className="prize-amount">RS. {prize.amount}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bonus Banners */}
      <div className="bonus-banner">
        B2B 3 WWCD WITH 50 KILLS GET RS. 300
      </div>
      <div className="bonus-banner">
        B2B 3 WWCD WITH 50+ KILLS GET RS. 450
      </div>

      {/* Timing */}
      <div className="timing-section">
        <div className="timing-badge">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{fill: 'none', stroke: '#8b5cf6'}}>
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <div>
            <div className="timing-label">Timings</div>
            <div className="timing-value">1 PM TO 1 AM</div>
          </div>
        </div>
      </div>

      {/* Maps */}
      <div className="maps-section">
        <h2>Official Maps</h2>
        <div className="maps-grid">
          <div className="map-tag">Erangel</div>
          <div className="map-tag">Miramar</div>
          <div className="map-tag">Rondo</div>
        
        </div>
      </div>
    </div>
  )
}

export default TodaySlots
