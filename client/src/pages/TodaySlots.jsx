import { useState, useEffect } from 'react'
import axios from 'axios'

function TodaySlots() {
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const { data } = await axios.get(`${apiUrl}/api/slots`)
        setSlots(data)
      } catch (err) {
        console.error('Error fetching slots', err)
      } finally {
        setLoading(false)
      }
    }
    fetchSlots()
  }, [])

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

      {loading ? (
        <div className="loading" style={{textAlign: 'center', padding: '3rem'}}>
          <div className="spinner"></div>
          <p>Loading Slots...</p>
        </div>
      ) : slots.length === 0 ? (
        <div className="empty-state" style={{textAlign: 'center', padding: '3rem'}}>
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{fill: 'none', stroke: '#6b6b80', width: '64px', height: '64px', margin: '0 auto 1rem'}}>
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          <h3>No Slots Available</h3>
          <p>Check back later for upcoming tournament slots.</p>
        </div>
      ) : (
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
      )}

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
