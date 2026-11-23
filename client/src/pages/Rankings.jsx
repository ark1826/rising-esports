import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { RefreshCw, Trophy, ArrowLeft } from 'lucide-react'

const STICKER_PALETTES = [
  { bg: 'linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)', text: '#fee2e2' },
  { bg: 'linear-gradient(135deg, #0369a1 0%, #0c4a6e 100%)', text: '#e0f2fe' },
  { bg: 'linear-gradient(135deg, #6d28d9 0%, #4c1d95 100%)', text: '#f3e8ff' },
  { bg: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', text: '#e0e7ff' },
  { bg: 'linear-gradient(135deg, #b45309 0%, #78350f 100%)', text: '#fef3c7' },
  { bg: 'linear-gradient(135deg, #047857 0%, #064e3b 100%)', text: '#d1fae5' },
  { bg: 'linear-gradient(135deg, #be185d 0%, #831843 100%)', text: '#ffe4e6' },
  { bg: 'linear-gradient(135deg, #c2410c 0%, #7c2d12 100%)', text: '#ffedd5' },
]

function Rankings() {
  const navigate = useNavigate()
  const [rankings, setRankings] = useState([])
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [activeTab, setActiveTab] = useState('overall')
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
    }, 15000)
  }, [fetchRankings])

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    fetchRankings(false)
    startPolling()

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling()
      } else {
        fetchRankings(true)
        startPolling()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      stopPolling()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [fetchRankings, startPolling, stopPolling, apiUrl])

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
    <div className="rankings-page fade-in" style={{ padding: '0.5rem 0.75rem 5rem' }}>
      {/* Header with Back Arrow (Screen 6) */}
      <div className="category-screen-header">
        <button type="button" className="category-back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={18} />
        </button>
        <h2 className="category-screen-title">Points Table</h2>
      </div>

      {/* Match Tabs: Overall | Match 1 | Match 2 | Match 3 */}
      <div className="points-match-tabs">
        {['overall', 'match1', 'match2', 'match3'].map((tab) => (
          <button
            key={tab}
            type="button"
            className={`points-match-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'overall' ? 'Overall' : tab === 'match1' ? 'Match 1' : tab === 'match2' ? 'Match 2' : 'Match 3'}
          </button>
        ))}
      </div>

      {/* Live metadata */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0.4rem 0.2rem 0.75rem', fontSize: '0.72rem', color: '#94a3b8' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span className="rankings-live-dot" /> Live Standings
        </span>
        <button
          type="button"
          onClick={() => fetchRankings(true)}
          style={{ background: 'transparent', border: 'none', color: '#c084fc', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 700 }}
        >
          <RefreshCw size={12} className={isUpdating ? 'is-spinning' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading Points Table...</p>
        </div>
      ) : rankings.length === 0 ? (
        <div className="empty-state">
          <Trophy size={48} style={{ color: '#c084fc', margin: '0 auto 1rem', opacity: 0.6 }} />
          <h3>No Points Added Yet</h3>
          <p>Points table will be updated after matches conclude.</p>
        </div>
      ) : (
        <table className="standings-table">
          <thead>
            <tr>
              <th style={{ width: '28px' }}>#</th>
              <th className="left-align">Team</th>
              <th>P Pts</th>
              <th>K Pts</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((team, idx) => {
              const pal = STICKER_PALETTES[idx % STICKER_PALETTES.length]
              return (
                <tr key={team._id || idx} className="standings-row">
                  <td className="rank-cell">{team.rank || idx + 1}</td>
                  <td className="team-name-cell">
                    <div
                      className="tourney-team-crest"
                      style={{
                        width: '26px',
                        height: '26px',
                        fontSize: '0.65rem',
                        background: pal.bg,
                        color: pal.text,
                        flexShrink: 0
                      }}
                    >
                      {getTeamMark(team.teamName)}
                    </div>
                    <span>{team.teamName}</span>
                  </td>
                  <td>{team.finishes != null ? team.finishes : '-'}</td>
                  <td>{team.wwcd != null ? team.wwcd : '-'}</td>
                  <td className="total-pts-cell">{team.totalPoints != null ? team.totalPoints : 0}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default Rankings
