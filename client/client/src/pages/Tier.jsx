import React from 'react'

function Tier() {
  return (
    <div className="tier-page fade-in">
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
  )
}

export default Tier
