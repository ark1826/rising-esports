import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import { RefreshCw, Trophy } from 'lucide-react'

function Rankings() {
  const [rankings, setRankings] = useState([])
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const intervalRef = useRef(null)
  const isInitialLoad = useRef(true)

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'

  const fetchRankings = useCallback(async (isBackground = false) => {
    try {
      if (isBackground) setIsUpdating(true)
      const { data } = await axios.get(`${apiUrl}/api/rankings`)
      setRankings(data || [])
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Error fetching rankings', err)
    } finally {
      if (isInitialLoad.current) {
        setLoading(false)
        isInitialLoad.current = false
      }
      setIsUpdating(false)
    }
  }, [apiUrl])

  const startPolling = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      fetchRankings(true)
    }, 15000) // 15 seconds
  }, [fetchRankings])

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    // Initial fetch
    fetchRankings(false)
    startPolling()

    // Visibility change handler
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling()
      } else {
        // Immediate refresh when tab becomes visible again
        fetchRankings(true)
        startPolling()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      stopPolling()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [fetchRankings, startPolling, stopPolling])

  const formatTime = (date) => {
    if (!date) return ''
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const getTeamMark = (teamName = '') => {
    const words = teamName.trim().split(/\s+/).filter(Boolean)
    return (words.length > 1 ? `${words[0][0]}${words[1][0]}` : teamName.slice(0, 2)).toUpperCase()
  }

  return (
    <div className="rankings-page fade-in">
      <div className="page-header">
        <div className="rankings-heading-row">
          <div>
            <p className="subtitle">Official Standings</p>
            <h1>Team <span>Rankings</span></h1>
          </div>
          <button
            type="button"
            className="rankings-refresh-btn"
            onClick={() => fetchRankings(true)}
            disabled={isUpdating}
            aria-label="Refresh rankings"
            title="Refresh rankings"
          >
            <RefreshCw size={16} className={isUpdating ? 'is-spinning' : ''} />
            <span>Refresh</span>
          </button>
        </div>
        {lastUpdated && (
          <div className="rankings-meta">
            <span className="rankings-live-status"><span className="rankings-live-dot" /> Live standings</span>
            <span className="last-updated">
              Last updated at {formatTime(lastUpdated)}
            </span>
            {isUpdating && (
              <span className="update-indicator">
                <span className="update-dot"></span>
                Updating...
              </span>
            )}
          </div>
        )}
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
        <div className="leaderboard-list" role="list" aria-label="Team leaderboard">
          <div className="leaderboard-columns" aria-hidden="true">
            <span>Team</span>
            <span>WWCD</span>
            <span>Place</span>
            <span>Finish</span>
            <span>Total</span>
          </div>
          {rankings.map(team => (
            <article key={team._id} className={`leaderboard-row rank-${team.rank}`} role="listitem">
              <div className="leaderboard-rank">{team.rank}</div>
              <div className="leaderboard-team">
                <div className="team-mark" aria-hidden="true">{getTeamMark(team.teamName)}</div>
                <div className="leaderboard-team-copy">
                  <strong>{team.teamName}</strong>
                  <span>{team.teamTag ? `[${team.teamTag}]` : `${team.totalMatches} Matches`}</span>
                </div>
              </div>
              <div className="leaderboard-stat" data-label="WWCD"><span>WWCD</span>{team.wwcd}</div>
              <div className="leaderboard-stat" data-label="Place"><span>Place</span>{team.finishes}</div>
              <div className="leaderboard-stat" data-label="Finish"><span>Finish</span>{team.totalMatches}</div>
              <div className="leaderboard-total" data-label="Total"><span>Total</span>{team.totalPoints}</div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export default Rankings
