import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { RefreshCw, Trophy, ArrowLeft, Search, X } from 'lucide-react'

const STICKER_PALETTES = [
  { bg: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)', text: '#f3e8ff' },
  { bg: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', text: '#e0f2fe' },
  { bg: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)', text: '#fee2e2' },
  { bg: 'linear-gradient(135deg, #d97706 0%, #92400e 100%)', text: '#fef3c7' },
  { bg: 'linear-gradient(135deg, #059669 0%, #065f46 100%)', text: '#d1fae5' },
  { bg: 'linear-gradient(135deg, #db2777 0%, #9d174d 100%)', text: '#fce7f3' },
  { bg: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)', text: '#e0e7ff' },
  { bg: 'linear-gradient(135deg, #ea580c 0%, #9a3412 100%)', text: '#ffedd5' },
]

function Rankings() {
  const navigate = useNavigate()
  const [rankings, setRankings] = useState([])
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
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
  }, [fetchRankings, startPolling, stopPolling])

  const getTeamMark = (teamName = '') => {
    const words = teamName.trim().split(/\s+/).filter(Boolean)
    return (words.length > 1 ? `${words[0][0]}${words[1][0]}` : teamName.slice(0, 2)).toUpperCase()
  }

  const filteredRankings = useMemo(() => {
    if (!searchTerm.trim()) return rankings
    const term = searchTerm.toLowerCase().trim()
    return rankings.filter(team =>
      (team.teamName && team.teamName.toLowerCase().includes(term)) ||
      (team.teamTag && team.teamTag.toLowerCase().includes(term))
    )
  }, [rankings, searchTerm])

  return (
    <div className="rankings-page fade-in" style={{ padding: '0.5rem 0.75rem 5rem' }}>
      {/* Screen Header */}
      <div className="category-screen-header">
        <button type="button" className="category-back-btn" onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft size={18} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 className="category-screen-title" style={{ margin: 0 }}>Team Ranking</h2>
          {rankings.length > 0 && (
            <span style={{
              background: 'rgba(139, 92, 246, 0.2)',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              color: '#c084fc',
              fontSize: '0.68rem',
              fontWeight: 800,
              padding: '2px 7px',
              borderRadius: '999px'
            }}>
              {rankings.length} Teams
            </span>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="rankings-search-bar" style={{ margin: '0.6rem 0 0.75rem' }}>
        <Search size={15} style={{ color: '#94a3b8', flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Search team name or tag..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: 0
            }}
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Live metadata strip */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        margin: '0.2rem 0.2rem 0.85rem',
        fontSize: '0.72rem',
        color: '#94a3b8'
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="rankings-live-dot" />
          <span style={{ fontWeight: 600, color: '#4ade80' }}>Live Standings</span>
          {lastUpdated && (
            <span style={{ fontSize: '0.66rem', color: '#64748b' }}>
              · {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={() => fetchRankings(true)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#c084fc',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.72rem',
            fontWeight: 700
          }}
        >
          <RefreshCw size={12} className={isUpdating ? 'is-spinning' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="loading" style={{ padding: '3rem 0', textAlign: 'center' }}>
          <div className="spinner"></div>
          <p style={{ marginTop: '0.8rem', color: '#94a3b8', fontSize: '0.82rem' }}>Loading Team Rankings...</p>
        </div>
      ) : rankings.length === 0 ? (
        <div className="empty-state" style={{ padding: '3rem 1rem', textAlign: 'center' }}>
          <Trophy size={48} style={{ color: '#c084fc', margin: '0 auto 1rem', opacity: 0.6 }} />
          <h3 style={{ color: '#ffffff', fontWeight: 800 }}>No Points Added Yet</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: '0.35rem' }}>
            Points table will be updated after matches conclude.
          </p>
        </div>
      ) : filteredRankings.length === 0 ? (
        <div className="empty-state" style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
          <Search size={36} style={{ color: '#94a3b8', margin: '0 auto 0.75rem', opacity: 0.6 }} />
          <h4 style={{ color: '#ffffff', fontWeight: 700 }}>No Teams Found</h4>
          <p style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '0.25rem' }}>
            No team matches "{searchTerm}".
          </p>
        </div>
      ) : (
        <div className="rankings-cards-container">
          {filteredRankings.map((team, idx) => {
            const rank = team.rank || idx + 1
            const pal = STICKER_PALETTES[idx % STICKER_PALETTES.length]
            const matches = team.totalMatches != null ? team.totalMatches : 0
            const wwcd = team.wwcd != null ? team.wwcd : 0
            const finishes = team.finishes != null ? team.finishes : 0
            const placePoints = team.placePoints != null
              ? team.placePoints
              : Math.max(0, (team.totalPoints || 0) - finishes)
            const totalPoints = team.totalPoints != null ? team.totalPoints : (placePoints + finishes)

            // Badge styling class
            let badgeClass = 'rank-other'
            let cardClass = ''
            if (rank === 1) {
              badgeClass = 'rank-gold'
              cardClass = 'rank-top1'
            } else if (rank === 2) {
              badgeClass = 'rank-silver'
              cardClass = 'rank-top2'
            } else if (rank === 3) {
              badgeClass = 'rank-bronze'
              cardClass = 'rank-top3'
            }

            return (
              <div key={team._id || idx} className={`ranking-team-card ${cardClass}`}>
                {/* Left side: Rank badge + Team Avatar + Team Name & Matches */}
                <div className="ranking-team-left">
                  <div className={`ranking-rank-badge ${badgeClass}`}>
                    {rank}
                  </div>
                  <div className="ranking-team-avatar-wrap">
                    {team.logo ? (
                      <img
                        src={team.logo}
                        alt={team.teamName}
                        className="ranking-team-avatar-img"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          if (e.target.nextSibling) {
                            e.target.nextSibling.style.display = 'flex'
                          }
                        }}
                      />
                    ) : null}
                    <div
                      className="ranking-team-avatar-fallback"
                      style={{
                        background: pal.bg,
                        color: pal.text,
                        display: team.logo ? 'none' : 'flex'
                      }}
                    >
                      {getTeamMark(team.teamName)}
                    </div>
                  </div>
                  <div className="ranking-team-info">
                    <span className="ranking-team-title" title={team.teamName}>
                      {team.teamName}
                    </span>
                    <span className="ranking-team-matches">
                      {matches} Matches
                    </span>
                  </div>
                </div>

                {/* Right side: 4 Stat Columns (WWCD | PLACE | FINISH | TOTAL) */}
                <div className="ranking-team-stats">
                  <div className="ranking-stat-col">
                    <span className="ranking-stat-label">WWCD</span>
                    <span className="ranking-stat-val">{wwcd}</span>
                  </div>
                  <div className="ranking-stat-divider" />
                  <div className="ranking-stat-col">
                    <span className="ranking-stat-label">PLACE</span>
                    <span className="ranking-stat-val">{placePoints}</span>
                  </div>
                  <div className="ranking-stat-divider" />
                  <div className="ranking-stat-col">
                    <span className="ranking-stat-label">FINISH</span>
                    <span className="ranking-stat-val">{finishes}</span>
                  </div>
                  <div className="ranking-stat-divider" />
                  <div className="ranking-stat-col col-total">
                    <span className="ranking-stat-label">TOTAL</span>
                    <span className="ranking-stat-val">{totalPoints}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Rankings
