import { useState, useEffect } from 'react'
import axios from 'axios'

function Rankings() {
  const [rankings, setRankings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const { data } = await axios.get(`${apiUrl}/api/rankings`)
        setRankings(data || [])
      } catch (err) {
        console.error('Error fetching rankings', err)
      } finally {
        setLoading(false)
      }
    }
    fetchRankings()
  }, [])

  return (
    <div className="rankings-page fade-in">
      <div className="page-header">
        <p className="subtitle">Official Standings</p>
        <h1>Team <span>Rankings</span></h1>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading Rankings...</p>
        </div>
      ) : rankings.length === 0 ? (
        <div className="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{fill: 'none', stroke: '#6b6b80', width: '64px', height: '64px', margin: '0 auto 1rem'}}>
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
