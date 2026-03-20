import { Link } from 'react-router-dom'
import Rankings from './Rankings'

function Home() {
  return (
    <div className="fade-in">
      {/* Hero Section */}
      <section className="home-hero">
        <h1>Rising Esports</h1>
        <p style={{ maxWidth: '800px', margin: '1.5rem auto 2.5rem', color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '1rem' }}>
          Welcome to Rising Esports, a competitive gaming platform built for passionate BGMI players and teams. Our mission is to create a fair, competitive, and transparent scrims environment where every team gets the opportunity to showcase their skills and grow in the esports scene. We regularly host organized scrims, maintain clear point systems, and ensure professional management so players can focus on performance. At Rising Esports, we believe in dedication, discipline, and the spirit of competition, bringing together talented teams from across the community to compete, improve, and rise to the next level.
        </p>
        
        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/slots" className="home-cta">
            Today Slots
          </Link>
          
          <Link to="/rankings" className="home-cta">
            Rankings
          </Link>

          <a
            href="https://chat.whatsapp.com/FLX8eM2APOFCyiK8ReWER6?mode=gi_t"
            target="_blank"
            rel="noopener noreferrer"
            className="home-cta"
            style={{ background: 'transparent', border: '1px solid var(--purple-primary)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            WhatsApp
          </a>
        </div>
      </section>

      {/* Embedded Rankings Section */}
      <section style={{ borderBottom: '1px solid var(--border-color)' }}>
        <Rankings />
      </section>

      {/* Rules & Rewards Section */}
      <section className="rules-section">
        <div className="page-header">
          <p className="subtitle">Benefits & Guidelines</p>
          <h1>Rules & <span>Rewards</span></h1>
        </div>
        <div className="rules-grid">
          <div className="rule-card">
            <div className="rule-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{fill: 'none', stroke: '#8b5cf6'}}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <p>1. YOU NEED TO REGISTER YOUR TEAM ON WHATSAPP NUMBER TO SHOWCASE YOUR TEAM ON RANKINGS</p>
          </div>
          <div className="rule-card">
            <div className="rule-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{fill: 'none', stroke: '#8b5cf6'}}>
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
            </div>
            <p>2. YOU WILL GET A THREE DIGIT (XXX) NUMBER CALLED RISING ID TO AVOID CONFUSION BETWEEN TEAMS WITH SIMILAR NAME</p>
          </div>
          <div className="rule-card">
            <div className="rule-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{fill: 'none', stroke: '#8b5cf6'}}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <p>3. YOUR TEAM NEEDS TO COMPLETE 250 MATCHES IN A MONTH TO CLIAM ALL REWARDS AND PERKS WE PROVIDE</p>
          </div>
          <div className="rule-card">
            <div className="rule-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{fill: 'none', stroke: '#8b5cf6'}}>
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <p>4. #1 TEAM GETS CASH PRICE STRTS FROM 1000 AND IT INCREASES DAILY AS PER SUPPORT WE GET YOU CAN SEE THIS ON INSTA</p>
          </div>
          <div className="rule-card">
            <div className="rule-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{fill: 'none', stroke: '#8b5cf6'}}>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
            <p>5. TOP 5 TEAMS GET 3 DAY SLOTS AT 50% PRICE</p>
          </div>
          <div className="rule-card">
            <div className="rule-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{fill: 'none', stroke: '#8b5cf6'}}>
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/>
                <polyline points="17 11 19 13 23 9"/>
              </svg>
            </div>
            <p>6. ALL 20 TEAMS GET INVITED SLOTS ACCORDING TO THEIR RANKINGS</p>
          </div>
          <div className="rule-card">
            <div className="rule-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{fill: 'none', stroke: '#8b5cf6'}}>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
            <p>7. YOU WILL GET SPONSORS EASILY AS YOUR RANK IS GOOD</p>
          </div>
          <div className="rule-card">
            <div className="rule-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{fill: 'none', stroke: '#8b5cf6'}}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <p>8. TOP 10 TEAMS GET MANAGERS AND COACHES</p>
          </div>
        </div>
      </section>

      {/* Tier Section */}
      <section id="tier" style={{ padding: '4rem 0', borderBottom: '1px solid var(--border-color)' }}>
        <div className="tier-page fade-in" style={{ padding: 0 }}>
          <div className="platform-tiers-header">
            <h1><em>PLATFORM</em> <span className="text-purple"><em>TIERS</em></span></h1>
          </div>

          <div className="platform-tiers-grid">
            {/* Tier A */}
            <div className="platform-tier-card">
              <h2 className="tier-title text-green"><em>TIER A</em></h2>
              <p className="tier-subtitle">ADVANCED</p>
              <ul className="tier-list list-green">
                <li>BGIS ROUND 4 OR ABOVE</li>
                <li>#1 TO #10 TEAMS GET A-TIER TAG</li>
              </ul>
            </div>

            {/* Tier B */}
            <div className="platform-tier-card">
              <h2 className="tier-title text-blue"><em>TIER B</em></h2>
              <p className="tier-subtitle">INTERMEDIATE</p>
              <ul className="tier-list list-gray">
                <li>BGIS ROUND 2 OR ABOVE</li>
                <li>#11 TO #30 TEAMS GET B-TIER TAG</li>
              </ul>
            </div>

            {/* Tier C */}
            <div className="platform-tier-card">
              <h2 className="tier-title text-silver"><em>TIER C</em></h2>
              <p className="tier-subtitle">OPEN</p>
              <ul className="tier-list list-gray">
                <li>AT LEAST PLAYED BGIS</li>
                <li>#31 TO #50 TEAMS GET C-TIER TAG</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <h3>Professional Scrims</h3>
            <p>Compete against top-tier teams in daily organized practice matches.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M18 20V10M12 20V4M6 20v-6"/>
              </svg>
            </div>
            <h3>Live Statistics</h3>
            <p>Get detailed performance metrics and player stats for every match played.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <h3>Instant Updates</h3>
            <p>Manual entry ensures that all rankings and tournament details are current.</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
