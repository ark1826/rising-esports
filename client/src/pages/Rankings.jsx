import { useState } from 'react'

// Hardcode rankings data here
const defaultRankings = [
  { _id: '1', rank: 1, teamName: 'GodLike Esports', teamTag: 'GodL', totalMatches: 250, finishes: 134, wwcd: 12, totalPoints: 245 },
  { _id: '2', rank: 2, teamName: 'Team Soul', teamTag: 'SOUL', totalMatches: 245, finishes: 112, wwcd: 9, totalPoints: 210 },
  { _id: '3', rank: 3, teamName: 'Blind Esports', teamTag: 'BLND', totalMatches: 240, finishes: 105, wwcd: 8, totalPoints: 195 },
  { _id: '4', rank: 4, teamName: 'Gladiators Esports', teamTag: 'GLXT', totalMatches: 235, finishes: 98, wwcd: 7, totalPoints: 180 },
  { _id: '5', rank: 5, teamName: 'Global Esports', teamTag: 'GE', totalMatches: 230, finishes: 89, wwcd: 6, totalPoints: 165 },
]

function Rankings() {
  const [rankings] = useState(defaultRankings)
  const [loading] = useState(false)

  return (
    <div className="rankings-page fade-in">
      <div className="page-header">
        <p className="subtitle">Official Standings</p>
        <h1>Team <span>Rankings</span></h1>
        <p>Season 4 — Updated manually for accuracy</p>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading Rankings...</p>
        </div>
      ) : rankings.length === 0 ? (
        <div className="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{fill: 'none', stroke: '#6b6b80'}}>
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          <h3>No Rankings Yet</h3>
          <p>Rankings will appear here once the admin adds team data.</p>
        </div>
      ) : (
        <div className="rankings-table-wrapper">
          <table className="rankings-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Team Name</th>
                <th>Total Matches</th>
                <th>Finishes</th>
                <th>WWCD</th>
                <th>Total Points</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map(team => (
                <tr key={team._id} className={`rank-${team.rank}`}>
                  <td><span className="rank-number">#{team.rank}</span></td>
                  <td>
                    <span className="team-name">{team.teamName}</span>
                    {team.teamTag && <span className="team-tag">[{team.teamTag}]</span>}
                  </td>
                  <td><span className="stat-value">{team.totalMatches}</span></td>
                  <td><span className="stat-value">{team.finishes}</span></td>
                  <td><span className="stat-value">{team.wwcd}</span></td>
                  <td><span className="stat-value">{team.totalPoints}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default Rankings
