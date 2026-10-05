import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, MapPin, X, ArrowLeft, Copy, CheckCheck, RefreshCw } from 'lucide-react';
import helmetImg from '../assets/droplist_soldier_helmet.jpg';
import bgSoldierImg from '../assets/droplist_bg_soldier.jpg';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Helper to determine team monogram
const getMonogram = (teamName, teamTag) => {
  if (teamTag && teamTag.trim().length > 0) return teamTag.trim().toUpperCase();
  const cleaned = (teamName || 'TEAM').trim().replace(/[^a-zA-Z0-9\s]/g, '');
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'T';
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  if (words.length === 2 && (/^\d+$/.test(words[1]) || words[1].length <= 2)) {
    return (words[0][0] + words[1]).toUpperCase();
  }
  return (words[0][0] + (words[1] ? words[1][0] : '')).toUpperCase();
};

// Custom esports stickers faithful to target design (matches all 8 teams from user images)
export const TeamEsportsSticker = ({ team, index = 0, size = 'normal' }) => {
  const name = (team?.teamName || '').toUpperCase().trim();
  const tag = (team?.teamTag || '').toUpperCase().trim();
  const logo = team?.teamLogo;

  const w = size === 'large' ? 52 : (size === 'table-logo' ? 48 : 38);
  const h = size === 'large' ? 52 : (size === 'table-logo' ? 48 : 38);

  if (logo && typeof logo === 'string' && (logo.startsWith('http') || logo.startsWith('data:image/') || logo.startsWith('/'))) {
    return (
      <div className={`ts-esports-sticker-box custom-logo ${size}`}>
        <img src={logo} alt={name} className="ts-sticker-custom-img" />
      </div>
    );
  }

  // 1. RACIST 4 (R4) - Red shield
  if (name.includes('RACIST') || tag === 'R4') {
    return (
      <div className={`ts-esports-sticker-box r4-badge ${size}`} title={name || 'RACIST 4'}>
        <svg viewBox="0 0 50 50" width={w} height={h} className="ts-sticker-svg">
          <defs>
            <filter id="r4Glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#ef4444" floodOpacity="0.8" />
            </filter>
            <linearGradient id="r4Grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2a0509" />
              <stop offset="100%" stopColor="#0d0103" />
            </linearGradient>
          </defs>
          <path
            d="M 25 3 L 44 10 L 44 30 C 44 39, 25 47, 25 47 C 25 47, 6 39, 6 30 L 6 10 Z"
            fill="url(#r4Grad)"
            stroke="#ef4444"
            strokeWidth="2"
            filter="url(#r4Glow)"
          />
          <path d="M 25 6 L 40 12 L 40 28 C 40 35, 25 42, 25 42 C 25 42, 10 35, 10 28 L 10 12 Z" fill="#180306" />
          <text
            x="25"
            y="30"
            textAnchor="middle"
            fill="#ffffff"
            fontWeight="900"
            fontSize="16"
            fontFamily="'Outfit', sans-serif"
            fontStyle="italic"
            letterSpacing="0.5"
          >
            <tspan fill="#ef4444">R</tspan>
            <tspan fill="#ffffff">4</tspan>
          </text>
        </svg>
      </div>
    );
  }

  // 2. DF ESPORTS (DF) - Stylized Valkyrie wings / cross
  if (name.includes('DF') || tag === 'DF') {
    return (
      <div className={`ts-esports-sticker-box df-badge ${size}`} title={name || 'DF ESPORTS'}>
        <svg viewBox="0 0 50 50" width={w} height={h} className="ts-sticker-svg">
          <defs>
            <filter id="dfGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#38bdf8" floodOpacity="0.85" />
            </filter>
          </defs>
          <path d="M 9 17 L 25 8 L 41 17 L 37 25 L 25 19 L 13 25 Z" fill="#ffffff" filter="url(#dfGlow)" />
          <path d="M 14 26 L 25 21 L 36 26 L 25 42 Z" fill="#38bdf8" opacity="0.95" />
          <text
            x="25"
            y="30"
            textAnchor="middle"
            fill="#ffffff"
            fontWeight="900"
            fontSize="14"
            fontFamily="'Outfit', sans-serif"
            fontStyle="italic"
            letterSpacing="0.8"
          >
            DF
          </text>
        </svg>
      </div>
    );
  }

  // 3. Team YODHA - Purple Winged Crown
  if (name.includes('YODHA') || tag.includes('YODHA')) {
    return (
      <div className={`ts-esports-sticker-box yodha-badge ${size}`} title={name || 'Team YODHA'}>
        <svg viewBox="0 0 50 50" width={w} height={h} className="ts-sticker-svg">
          <defs>
            <filter id="yodhaGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#c084fc" floodOpacity="0.9" />
            </filter>
            <linearGradient id="yodhaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#581c87" />
              <stop offset="100%" stopColor="#2e1065" />
            </linearGradient>
          </defs>
          <path
            d="M 7 17 L 16 23 L 25 9 L 34 23 L 43 17 L 39 32 L 25 42 L 11 32 Z"
            fill="url(#yodhaGrad)"
            stroke="#c084fc"
            strokeWidth="2"
            filter="url(#yodhaGlow)"
          />
          <path d="M 17 25 L 25 17 L 33 25 L 25 35 Z" fill="#f3e8ff" opacity="0.95" />
          <polygon points="25,12 28,19 22,19" fill="#ffffff" />
        </svg>
      </div>
    );
  }

  // 4. Team DNG - Futuristic text emblem
  if (name.includes('DNG') || tag.includes('DNG')) {
    return (
      <div className={`ts-esports-sticker-box dng-badge ${size}`} title={name || 'Team DNG'}>
        <svg viewBox="0 0 50 50" width={w} height={h} className="ts-sticker-svg">
          <defs>
            <filter id="dngGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#818cf8" floodOpacity="0.85" />
            </filter>
          </defs>
          <rect x="4" y="13" width="42" height="24" rx="6" fill="#080718" stroke="#818cf8" strokeWidth="1.6" />
          <text
            x="25"
            y="30"
            textAnchor="middle"
            fill="#ffffff"
            fontWeight="900"
            fontSize="14"
            fontFamily="'Outfit', sans-serif"
            fontStyle="italic"
            letterSpacing="1.2"
            filter="url(#dngGlow)"
          >
            DNG
          </text>
        </svg>
      </div>
    );
  }

  // 5. Team APEX - Stylized R/A gradient polygon
  if (name.includes('APEX') || tag.includes('APEX')) {
    return (
      <div className={`ts-esports-sticker-box apex-badge ${size}`} title={name || 'Team APEX'}>
        <svg viewBox="0 0 50 50" width={w} height={h} className="ts-sticker-svg">
          <defs>
            <linearGradient id="apexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <filter id="apexGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#a855f7" floodOpacity="0.8" />
            </filter>
          </defs>
          <path
            d="M 14 10 L 32 10 C 38 10, 42 14, 42 20 C 42 25, 38 29, 32 29 L 24 29 L 36 42 L 27 42 L 18 31 L 18 42 L 12 42 L 12 10 Z M 18 16 L 18 24 L 30 24 C 33 24, 35 22, 35 20 C 35 18, 33 16, 30 16 Z"
            fill="url(#apexGrad)"
            filter="url(#apexGlow)"
          />
        </svg>
      </div>
    );
  }

  // 6. Future Masters - Crowned FM Shield
  if (name.includes('FUTURE') || name.includes('MASTER') || tag.includes('FM')) {
    return (
      <div className={`ts-esports-sticker-box fm-badge ${size}`} title={name || 'Future Masters'}>
        <svg viewBox="0 0 50 50" width={w} height={h} className="ts-sticker-svg">
          <defs>
            <filter id="fmGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#a855f7" floodOpacity="0.8" />
            </filter>
            <linearGradient id="fmGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b0764" />
              <stop offset="100%" stopColor="#1e1035" />
            </linearGradient>
          </defs>
          <path
            d="M 25 4 L 43 12 L 39 34 C 39 41, 25 47, 25 47 C 25 47, 11 41, 11 34 L 7 12 Z"
            fill="url(#fmGrad)"
            stroke="#c084fc"
            strokeWidth="1.8"
            filter="url(#fmGlow)"
          />
          <path d="M 21 8 L 25 4 L 29 8 L 27 12 L 23 12 Z" fill="#fef08a" />
          <text
            x="25"
            y="32"
            textAnchor="middle"
            fill="#ffffff"
            fontWeight="900"
            fontSize="14"
            fontFamily="'Outfit', sans-serif"
            letterSpacing="0.5"
          >
            FM
          </text>
        </svg>
      </div>
    );
  }

  // 7. Rising Warriors - Pink/White Wolf Mascot
  if (name.includes('WARRIOR') || name.includes('RISING') || tag.includes('RW')) {
    return (
      <div className={`ts-esports-sticker-box wolf-badge ${size}`} title={name || 'Rising Warriors'}>
        <svg viewBox="0 0 50 50" width={w} height={h} className="ts-sticker-svg">
          <defs>
            <filter id="wolfGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#ec4899" floodOpacity="0.8" />
            </filter>
          </defs>
          <circle cx="25" cy="25" r="20" fill="#0f0717" stroke="#ec4899" strokeWidth="1.8" filter="url(#wolfGlow)" />
          <path d="M 15 16 L 20 22 L 25 15 L 30 22 L 35 16 L 33 26 L 37 29 L 32 34 L 25 38 L 18 34 L 13 29 L 17 26 Z" fill="#f43f5e" />
          <path d="M 18 20 L 22 24 L 25 18 L 28 24 L 32 20 L 30 27 L 25 35 L 20 27 Z" fill="#ffffff" />
          <polygon points="21,25 24,27 21,27" fill="#0f0717" />
          <polygon points="29,25 26,27 29,27" fill="#0f0717" />
          <polygon points="25,29 23,32 27,32" fill="#0f0717" />
        </svg>
      </div>
    );
  }

  // 8. Gods Reign - Red Crown G Shield
  if (name.includes('GOD') || name.includes('REIGN') || tag.includes('GR')) {
    return (
      <div className={`ts-esports-sticker-box gods-badge ${size}`} title={name || 'Gods Reign'}>
        <svg viewBox="0 0 50 50" width={w} height={h} className="ts-sticker-svg">
          <defs>
            <filter id="godsGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#ef4444" floodOpacity="0.85" />
            </filter>
          </defs>
          <path
            d="M 12 14 L 25 6 L 38 14 L 38 32 C 38 40, 25 46, 25 46 C 25 46, 12 40, 12 32 Z"
            fill="#180404"
            stroke="#ef4444"
            strokeWidth="2"
            filter="url(#godsGlow)"
          />
          <polygon points="21,11 25,7 29,11 27,14 23,14" fill="#fbbf24" />
          <text
            x="25"
            y="32"
            textAnchor="middle"
            fill="#ffffff"
            fontWeight="900"
            fontSize="16"
            fontFamily="'Outfit', sans-serif"
            letterSpacing="0.5"
          >
            G
          </text>
          <path d="M 8 30 C 8 26, 11 23, 11 23 C 11 23, 11 28, 12 32 Z" fill="#f97316" />
          <path d="M 42 30 C 42 26, 39 23, 39 23 C 39 23, 39 28, 38 32 Z" fill="#f97316" />
        </svg>
      </div>
    );
  }

  // Fallback: Dynamic esports monogram badge
  const monogram = getMonogram(name, tag);
  const palettes = [
    { bg: '#31103f', border: '#a855f7', text: '#ffffff', glow: 'rgba(168, 85, 247, 0.7)' },
    { bg: '#082f49', border: '#0ea5e9', text: '#ffffff', glow: 'rgba(14, 165, 233, 0.7)' },
    { bg: '#3f1118', border: '#f43f5e', text: '#ffffff', glow: 'rgba(244, 63, 94, 0.7)' },
    { bg: '#372008', border: '#f59e0b', text: '#ffffff', glow: 'rgba(245, 158, 11, 0.7)' },
    { bg: '#083321', border: '#10b981', text: '#ffffff', glow: 'rgba(16, 185, 129, 0.7)' },
  ];
  const pal = palettes[index % palettes.length];

  return (
    <div
      className={`ts-esports-sticker-box fallback-badge ${size}`}
      style={{
        background: pal.bg,
        borderColor: pal.border,
        boxShadow: `0 0 12px ${pal.glow}`,
      }}
      title={name}
    >
      <span style={{ color: pal.text, fontWeight: 900, fontSize: monogram.length > 2 ? '0.72rem' : '0.85rem' }}>
        {monogram}
      </span>
    </div>
  );
};

export default function DropListView({ slot, onClose, isStandalonePage = false, initialTab = 'drops' }) {
  // 'drops' or 'teams'
  const [activeTab, setActiveTab] = useState(initialTab);
  const [copied, setCopied] = useState(false);

  const [currentSlot, setCurrentSlot] = useState(slot);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch real-time fresh slot data so profile drop location updates appear immediately
  const refreshSlotData = async () => {
    try {
      setIsRefreshing(true);
      const targetId = currentSlot?._id || slot?._id;
      if (targetId) {
        try {
          const { data } = await axios.get(`${API_URL}/api/slots/${targetId}`);
          if (data && data._id) {
            setCurrentSlot(data);
            return;
          }
        } catch {
          // fallback to all slots
        }
      }
      const { data } = await axios.get(`${API_URL}/api/slots`);
      if (Array.isArray(data) && data.length > 0) {
        const fresh = targetId ? data.find((s) => String(s._id) === String(targetId)) : data[0];
        if (fresh) setCurrentSlot(fresh);
      }
    } catch (err) {
      console.warn('Failed to refresh slot data', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (slot) setCurrentSlot(slot);
  }, [slot]);

  useEffect(() => {
    refreshSlotData();
  }, [slot?._id]);

  // Strictly display only teams that registered/booked for this slot
  const displayTeams = currentSlot?.bookedTeams || slot?.bookedTeams || [];

  const getDrop = (team, mapKey) => {
    // Check user profile fields directly first, then booking dropLocations
    const drops = team.dropLocations || {};
    if (mapKey === 'erangel') {
      return (team.erangelDrop && team.erangelDrop.trim()) ||
             (drops.erangel && drops.erangel.trim()) ||
             (drops.erangle && drops.erangle.trim()) || '';
    }
    if (mapKey === 'miramar') {
      return (team.miramarDrop && team.miramarDrop.trim()) ||
             (drops.miramar && drops.miramar.trim()) || '';
    }
    if (mapKey === 'rondo') {
      return (team.rondoDrop && team.rondoDrop.trim()) ||
             (drops.rondo && drops.rondo.trim()) || '';
    }
    return drops[mapKey] || '';
  };

  const handleCopySheet = () => {
    const title = slot?.matchName || 'RISING ESPORTS SCRIM';
    let text = activeTab === 'teams' ? `📋 *${title} - REGISTERED TEAMS*\n` : `📍 *${title} - DROP LIST*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    displayTeams.forEach((team, idx) => {
      text += `*#${idx + 1} ${team.teamName}*\n`;
      if (activeTab === 'drops') {
        text += `🗺️ Erangel: ${getDrop(team, 'erangel') || 'TBD'}\n`;
        text += `🏜️ Miramar: ${getDrop(team, 'miramar') || 'TBD'}\n`;
        text += `🏙️ Rondo: ${getDrop(team, 'rondo') || 'TBD'}\n`;
      }
      text += `\n`;
    });

    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `⚡ Powered by Rising Esports`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  return (
    <div className={`ts-droplist-page-root ${isStandalonePage ? 'is-page' : 'is-modal'}`}>
      {/* Background Soldier Art */}
      <div
        className="ts-droplist-page-bg-soldier"
        style={{ backgroundImage: `url(${bgSoldierImg})` }}
      />
      <div className="ts-droplist-page-bg-gradient" />

      {/* Main Container */}
      <div className="ts-droplist-page-container">
        {/* Navigation & Mode Switcher Bar */}
        <div className="ts-droplist-top-actions">
          {onClose && (
            <button
              type="button"
              className="ts-droplist-back-btn"
              onClick={onClose}
              title="Close"
            >
              {isStandalonePage ? <ArrowLeft size={18} /> : <X size={20} />}
              <span>{isStandalonePage ? 'Back to Scrims' : 'Close'}</span>
            </button>
          )}

          {/* Mode Switcher Pills: Registered Teams vs Drop List */}
          <div className="ts-esports-mode-switch">
            <button
              type="button"
              className={`ts-mode-switch-btn ${activeTab === 'teams' ? 'active' : ''}`}
              onClick={() => setActiveTab('teams')}
            >
              <Users size={15} />
              <span>Registered Teams</span>
            </button>
            <button
              type="button"
              className={`ts-mode-switch-btn ${activeTab === 'drops' ? 'active' : ''}`}
              onClick={() => setActiveTab('drops')}
            >
              <MapPin size={15} />
              <span>Drop List</span>
            </button>
          </div>

          <div className="ts-droplist-utility-right" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              className="ts-droplist-refresh-btn"
              onClick={refreshSlotData}
              title="Refresh profile drop locations"
              disabled={isRefreshing}
            >
              <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} />
              <span>{isRefreshing ? 'Updating...' : 'Refresh'}</span>
            </button>
            <button
              type="button"
              className="ts-droplist-copy-btn"
              onClick={handleCopySheet}
              title="Copy for WhatsApp / Discord"
            >
              {copied ? <CheckCheck size={16} /> : <Copy size={16} />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* ── Top Hero Banner (Dynamic: DROP LIST vs REGISTERED TEAMS) ── */}
        <div className="ts-exact-hero-banner">
          <div className="ts-exact-banner-left">
            <div className="ts-exact-banner-icon-box">
              <Users size={28} color="#e9d5ff" strokeWidth={2.2} />
            </div>
            <div className="ts-exact-banner-text">
              {activeTab === 'teams' ? (
                <>
                  <h1 className="ts-exact-banner-title">
                    <span className="text-white">REGISTERED </span>
                    <span className="text-purple">TEAMS</span>
                  </h1>
                  <p className="ts-exact-banner-sub">Teams registered for this scrim</p>
                </>
              ) : (
                <>
                  <h1 className="ts-exact-banner-title">
                    <span className="text-white">DROP </span>
                    <span className="text-purple">LIST</span>
                  </h1>
                  <p className="ts-exact-banner-sub">Team wise drop locations for this scrim</p>
                </>
              )}
            </div>
          </div>

          <div className="ts-exact-banner-right">
            <div className="ts-exact-helmet-wrap">
              <img
                src={helmetImg}
                alt="PUBG Level 3 Helmet"
                className="ts-exact-helmet-img"
              />
              <div className="ts-exact-helmet-glow" />
            </div>
          </div>
        </div>

        {/* ── Master Card (Switches between Registered Teams & Drop List) ── */}
        <div className="ts-exact-table-card">
          <div className="ts-exact-table-scroll">
            {activeTab === 'teams' ? (
              /* ── VIEW A: REGISTERED TEAMS TABLE (# | TEAM NAME | TEAM LOGO) ── */
              <table className="ts-exact-table ts-registered-teams-table">
                <thead>
                  <tr>
                    <th className="col-num">#</th>
                    <th className="col-reg-name">TEAM NAME</th>
                    <th className="col-reg-logo">TEAM LOGO</th>
                  </tr>
                </thead>
                <tbody>
                  {displayTeams.length > 0 ? (
                    displayTeams.map((team, idx) => (
                      <tr key={team.bookingId || idx} className="ts-exact-row ts-reg-team-row">
                        {/* # Slot Number */}
                        <td className="col-num">
                          <span className="ts-slot-number-text">{idx + 1}</span>
                        </td>

                        {/* Team Name */}
                        <td className="col-reg-name">
                          <span className="ts-reg-team-name-text">
                            {team.teamName || 'Unknown Team'}
                          </span>
                        </td>

                        {/* Team Logo */}
                        <td className="col-reg-logo">
                          <div className="ts-reg-logo-cell">
                            <TeamEsportsSticker team={team} index={idx} size="table-logo" />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', padding: '3rem 1.5rem', color: '#94a3b8' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                          <Users size={32} color="#c084fc" />
                          <p style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem', color: '#ffffff' }}>
                            No Teams Registered For This Slot Yet
                          </p>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: '#a78bfa' }}>
                            Only teams that book this slot will be listed here.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              /* ── VIEW B: DROP LIST TABLE (# | Team | Erangel | Miramar | Rondo) ── */
              <table className="ts-exact-table ts-droplist-main-table">
                <thead>
                  <tr>
                    <th className="col-num">#</th>
                    <th
                      className="col-team clickable-team-th"
                      onClick={() => setActiveTab('teams')}
                      title="Click to view full Registered Teams with Logos"
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                        Team <span style={{ fontSize: '0.68rem', color: '#c084fc', textDecoration: 'underline' }}>(View Logos)</span>
                      </span>
                    </th>
                    <th className="col-map">Erangel</th>
                    <th className="col-map">Miramar</th>
                    <th className="col-map">Rondo</th>
                  </tr>
                </thead>
                <tbody>
                  {displayTeams.length > 0 ? (
                    displayTeams.map((team, idx) => {
                      const erangel = getDrop(team, 'erangel');
                      const miramar = getDrop(team, 'miramar');
                      const rondo = getDrop(team, 'rondo');

                      return (
                        <tr key={team.bookingId || idx} className="ts-exact-row">
                          {/* Slot # */}
                          <td className="col-num">
                            <span className="ts-slot-number-text">{idx + 1}</span>
                          </td>

                          {/* Team Name & Sticker (Clickable to jump to team view) */}
                          <td className="col-team" onClick={() => setActiveTab('teams')} style={{ cursor: 'pointer' }}>
                            <div className="ts-team-cell">
                              <TeamEsportsSticker team={team} index={idx} size="normal" />
                              <span className="ts-team-name-text">
                                {team.teamName || 'Unknown Team'}
                              </span>
                            </div>
                          </td>

                          {/* Erangel Drop */}
                          <td className="col-map">
                            <div className="ts-drop-pin-cell">
                              <MapPin
                                size={18}
                                className="ts-exact-map-pin"
                                fill="#8b5cf6"
                                stroke="#8b5cf6"
                              />
                              <span className="ts-exact-drop-text">
                                {erangel || '—'}
                              </span>
                            </div>
                          </td>

                          {/* Miramar Drop */}
                          <td className="col-map">
                            <div className="ts-drop-pin-cell">
                              <MapPin
                                size={18}
                                className="ts-exact-map-pin"
                                fill="#8b5cf6"
                                stroke="#8b5cf6"
                              />
                              <span className="ts-exact-drop-text">
                                {miramar || '—'}
                              </span>
                            </div>
                          </td>

                          {/* Rondo Drop */}
                          <td className="col-map">
                            <div className="ts-drop-pin-cell">
                              <MapPin
                                size={18}
                                className="ts-exact-map-pin"
                                fill="#8b5cf6"
                                stroke="#8b5cf6"
                              />
                              <span className="ts-exact-drop-text">
                                {rondo || '—'}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '3rem 1.5rem', color: '#94a3b8' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                          <MapPin size={32} color="#c084fc" />
                          <p style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem', color: '#ffffff' }}>
                            No Teams Registered For This Slot Yet
                          </p>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: '#a78bfa' }}>
                            Drop locations will be fetched directly from player profiles once slots are booked!
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
