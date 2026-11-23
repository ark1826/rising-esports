import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Users, MapPin, X, ArrowLeft, Copy, CheckCheck, RefreshCw, Shield, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Helper to determine team monogram
export const getMonogram = (teamName, teamTag) => {
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

// Custom esports sticker / logo renderer
export const TeamEsportsSticker = ({ team, index = 0, size = 'normal' }) => {
  const name = (team?.teamName || '').toUpperCase().trim();
  const tag = (team?.teamTag || '').toUpperCase().trim();
  const logo = team?.teamLogo;

  const dim = size === 'small' ? 28 : (size === 'large' ? 44 : 34);

  if (logo && typeof logo === 'string' && (logo.startsWith('http') || logo.startsWith('data:image/') || logo.startsWith('/'))) {
    return (
      <div
        style={{
          width: `${dim}px`,
          height: `${dim}px`,
          minWidth: `${dim}px`,
          borderRadius: '50%',
          overflow: 'hidden',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(168, 85, 247, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 10px rgba(168, 85, 247, 0.25)',
        }}
      >
        <img
          src={logo}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    );
  }

  // Pre-configured dynamic gradients
  const monogram = getMonogram(name, tag);
  const palettes = [
    { bg: 'linear-gradient(135deg, #7c3aed, #4f46e5)', border: '#a855f7', text: '#ffffff' },
    { bg: 'linear-gradient(135deg, #0284c7, #0369a1)', border: '#38bdf8', text: '#ffffff' },
    { bg: 'linear-gradient(135deg, #e11d48, #9f1239)', border: '#fb7185', text: '#ffffff' },
    { bg: 'linear-gradient(135deg, #d97706, #b45309)', border: '#fcd34d', text: '#ffffff' },
    { bg: 'linear-gradient(135deg, #059669, #047857)', border: '#34d399', text: '#ffffff' },
    { bg: 'linear-gradient(135deg, #9333ea, #c026d3)', border: '#f0abfc', text: '#ffffff' },
  ];
  const pal = palettes[index % palettes.length];

  return (
    <div
      style={{
        width: `${dim}px`,
        height: `${dim}px`,
        minWidth: `${dim}px`,
        borderRadius: '50%',
        background: pal.bg,
        border: `1.5px solid ${pal.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 0 10px rgba(168, 85, 247, 0.3)`,
        flexShrink: 0,
      }}
      title={name}
    >
      <span
        style={{
          color: pal.text,
          fontWeight: 900,
          fontSize: dim <= 28 ? '0.65rem' : '0.78rem',
          fontFamily: "'Outfit', sans-serif",
          letterSpacing: '0.5px',
        }}
      >
        {monogram}
      </span>
    </div>
  );
};

export default function DropListView({ slot, onClose, isStandalonePage = false, initialTab = 'drops' }) {
  const [activeTab, setActiveTab] = useState(initialTab === 'teams' ? 'teams' : 'drops');
  const [currentSlot, setCurrentSlot] = useState(slot);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Fetch real-time fresh slot data so drop updates appear instantly
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
          // fallback
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
    const drops = team?.dropLocations || {};
    const key = (mapKey || '').toLowerCase();
    if (key === 'erangel') {
      return (team?.erangelDrop && team.erangelDrop.trim()) ||
             (drops.erangel && drops.erangel.trim()) ||
             (drops.erangle && drops.erangle.trim()) || '';
    }
    if (key === 'miramar') {
      return (team?.miramarDrop && team.miramarDrop.trim()) ||
             (drops.miramar && drops.miramar.trim()) || '';
    }
    if (key === 'rondo') {
      return (team?.rondoDrop && team.rondoDrop.trim()) ||
             (drops.rondo && drops.rondo.trim()) || '';
    }
    return drops[key] || '';
  };

  const handleDownloadPdf = () => {
    try {
      setIsGeneratingPdf(true);
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Dark background matching website aesthetic
      doc.setFillColor(11, 8, 22);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      // Top title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text((currentSlot?.matchName || 'RISING ESPORTS SCRIMS').toUpperCase(), 40, 42);

      // Subtitle
      doc.setFontSize(9);
      doc.setTextColor(192, 132, 252);
      const slotLobby = currentSlot?.lobby || 'LOBBY 1';
      const slotDate = currentSlot?.date || 'Today';
      const slotTime = currentSlot?.timing || '';
      doc.text(`OFFICIAL DROP LIST • ${slotLobby} • ${slotDate} ${slotTime ? '• ' + slotTime : ''}`, 40, 58);

      // Divider line
      doc.setDrawColor(124, 58, 237);
      doc.setLineWidth(1.5);
      doc.line(40, 68, pageWidth - 40, 68);

      // Table Data
      const tableData = displayTeams.map((team, idx) => [
        idx + 1,
        team.teamName || 'Unknown Team',
        getDrop(team, 'erangel') || 'Not Given',
        getDrop(team, 'miramar') || 'Not Given',
        getDrop(team, 'rondo') || 'Not Given',
      ]);

      autoTable(doc, {
        startY: 80,
        head: [['#', 'TEAM', 'ERANGEL', 'MIRAMAR', 'RONDO']],
        body: tableData.length > 0 ? tableData : [['—', 'No Teams Booked', '—', '—', '—']],
        theme: 'plain',
        margin: { left: 40, right: 40 },
        styles: {
          fillColor: [18, 14, 38],
          textColor: [240, 240, 250],
          fontSize: 8.5,
          cellPadding: 7,
          lineColor: [45, 30, 70],
          lineWidth: 0.5,
          valign: 'middle',
        },
        headStyles: {
          fillColor: [124, 58, 237],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'left',
        },
        alternateRowStyles: {
          fillColor: [24, 18, 48],
        },
        columnStyles: {
          0: { cellWidth: 28, halign: 'center', textColor: [244, 63, 94], fontStyle: 'bold' },
          1: { cellWidth: 130, fontStyle: 'bold', textColor: [255, 255, 255] },
          2: { cellWidth: 120, textColor: [192, 132, 252] },
          3: { cellWidth: 120, textColor: [250, 204, 21] },
          4: { cellWidth: 120, textColor: [45, 212, 191] },
        },
        didDrawPage: () => {
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text(
            'Powered by Rising Esports',
            pageWidth / 2,
            pageHeight - 20,
            { align: 'center' }
          );
        }
      });

      const slotIdSafe = currentSlot?._id ? String(currentSlot._id).slice(-8) : 'export';
      doc.save(`droplist_${slotIdSafe}.pdf`);
    } catch (err) {
      console.error('Error generating PDF', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className={`v2-droplist-modal-card ${isStandalonePage ? 'is-page' : ''}`}>
      {/* ── Top Header ── */}
      <div className="v2-reg-header">
        <div className="v2-reg-title-wrap">
          <div className="v2-reg-shield-badge">
            <Shield size={20} className="v2-shield-icon" />
          </div>
          <div>
            <h2 className="v2-reg-title">REGISTERED TEAMS</h2>
            <p className="v2-reg-subtitle">TEAMS CURRENTLY BOOKED</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            className="v2-reg-refresh-btn"
            onClick={refreshSlotData}
            title="Refresh Teams"
            disabled={isRefreshing}
          >
            <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} />
          </button>
          {onClose && (
            <button
              type="button"
              className="v2-reg-close-btn"
              onClick={onClose}
              aria-label="Close"
            >
              {isStandalonePage ? <ArrowLeft size={16} /> : <X size={18} />}
            </button>
          )}
        </div>
      </div>

      {/* ── Segmented Switcher Track: TEAMS vs DROP LIST ── */}
      <div className="v2-segmented-track">
        <button
          type="button"
          className={`v2-seg-btn ${activeTab === 'teams' ? 'active' : ''}`}
          onClick={() => setActiveTab('teams')}
        >
          <Users size={16} />
          <span>TEAMS</span>
        </button>
        <button
          type="button"
          className={`v2-seg-btn ${activeTab === 'drops' ? 'active' : ''}`}
          onClick={() => setActiveTab('drops')}
        >
          <MapPin size={16} />
          <span>DROP LIST</span>
        </button>
      </div>

      {/* ── Tab 1: TEAMS (2-Column Grid of Registered Teams) ── */}
      {activeTab === 'teams' && (
        <div className="v2-teams-content">
          {displayTeams.length > 0 ? (
            <div className="v2-teams-grid">
              {displayTeams.map((team, idx) => (
                <div key={team.bookingId || idx} className="v2-team-card">
                  <div className="v2-team-avatar-box">
                    <TeamEsportsSticker team={team} index={idx} size="normal" />
                  </div>
                  <span className="v2-team-name" title={team.teamName || 'Unknown Team'}>
                    {team.teamName || 'Unknown Team'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="v2-empty-state">
              <Users size={34} color="#a855f7" />
              <p className="v2-empty-title">No Teams Registered Yet</p>
              <p className="v2-empty-sub">Registered teams will show up here once they book this slot.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 2: DROP LIST ── */}
      {activeTab === 'drops' && (
        <div className="v2-droplist-content">
          {/* PDF Download Button */}
          <button
            type="button"
            className="v2-pdf-btn"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            title="Download Drop List as PDF"
          >
            <FileDown size={16} />
            <span>{isGeneratingPdf ? 'GENERATING PDF...' : 'PDF'}</span>
          </button>

          {/* Table Container with Horizontal Scroll */}
          <div className="v2-table-card">
            <div className="v2-table-scroll">
              <table className="v2-droplist-table">
                <thead>
                  <tr>
                    <th className="v2-th-num">#</th>
                    <th className="v2-th-team">TEAM</th>
                    <th className="v2-th-map v2-th-erangel">ERANGEL</th>
                    <th className="v2-th-map v2-th-miramar">MIRAMAR</th>
                    <th className="v2-th-map v2-th-rondo">RONDO</th>
                  </tr>
                </thead>
                <tbody>
                  {displayTeams.length > 0 ? (
                    displayTeams.map((team, idx) => {
                      const erangel = getDrop(team, 'erangel');
                      const miramar = getDrop(team, 'miramar');
                      const rondo = getDrop(team, 'rondo');

                      return (
                        <tr key={team.bookingId || idx} className="v2-table-row">
                          <td className="v2-td-num">
                            <span className="v2-slot-num">{idx + 1}</span>
                          </td>
                          <td className="v2-td-team">
                            <div className="v2-team-cell">
                              <div className="v2-td-avatar">
                                <TeamEsportsSticker team={team} index={idx} size="small" />
                              </div>
                              <span className="v2-td-team-name">{team.teamName || 'Unknown Team'}</span>
                            </div>
                          </td>
                          <td className="v2-td-drop">
                            {erangel ? (
                              <span className="v2-drop-val">{erangel}</span>
                            ) : (
                              <span className="v2-drop-empty">Not Given</span>
                            )}
                          </td>
                          <td className="v2-td-drop">
                            {miramar ? (
                              <span className="v2-drop-val">{miramar}</span>
                            ) : (
                              <span className="v2-drop-empty">Not Given</span>
                            )}
                          </td>
                          <td className="v2-td-drop">
                            {rondo ? (
                              <span className="v2-drop-val">{rondo}</span>
                            ) : (
                              <span className="v2-drop-empty">Not Given</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="v2-empty-td">
                        <div className="v2-empty-state">
                          <MapPin size={34} color="#a855f7" />
                          <p className="v2-empty-title">No Drop Locations Available</p>
                          <p className="v2-empty-sub">Drop locations will appear here as teams register for this slot.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
