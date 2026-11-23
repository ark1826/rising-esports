import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  Calendar,
  X,
  ExternalLink,
  Image as ImageIcon,
  Trophy,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function ResultsPage() {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [dates, setDates] = useState([]);

  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [activeCategory, setActiveCategory] = useState('DAILY SCRIMS'); // 'DAILY SCRIMS' | 'WEEKLY & WEEKEND WAR'
  const [loading, setLoading] = useState(true);
  const [viewingPhotoModal, setViewingPhotoModal] = useState({ open: false, item: null, activePhotoIndex: 0 });

  // Format date for the banner: e.g. "October 11, 2026"
  const formatBannerDate = (dateStr) => {
    if (!dateStr) return 'Select Date';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const [y, m, d] = parts;
        const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
        return dateObj.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Format date for input: MM/DD/YYYY or YYYY-MM-DD
  const formatInputDisplay = (dateStr) => {
    if (!dateStr) return '';
    try {
      const [y, m, d] = dateStr.split('-');
      return `${m}/${d}/${y}`;
    } catch {
      return dateStr;
    }
  };

  // Fetch available dates on mount
  useEffect(() => {
    axios.get(`${API_URL}/api/results/dates`)
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setDates(res.data);
          // If today has no results but database has dates, we still default to today or first date
          if (!res.data.includes(getTodayStr()) && res.data.length > 0) {
            setSelectedDate(res.data[0]);
          }
        }
      })
      .catch((err) => console.error('Error fetching result dates:', err));
  }, []);

  // Fetch results when selectedDate changes (or category changes)
  useEffect(() => {
    setLoading(true);
    const query = selectedDate ? `?date=${encodeURIComponent(selectedDate)}` : '';
    axios.get(`${API_URL}/api/results${query}`)
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        setResults(data);
      })
      .catch((err) => {
        console.error('Error fetching results:', err);
        setResults([]);
      })
      .finally(() => setLoading(false));
  }, [selectedDate]);

  // Filter results by Category (Daily Scrims vs Weekly & Weekend War)
  const filteredResults = results.filter((item) => {
    if (activeCategory === 'DAILY SCRIMS') {
      return !item.category || item.category === 'DAILY SCRIMS';
    }
    return item.category === 'WEEKLY & WEEKEND WAR';
  });

  const isToday = selectedDate === getTodayStr();
  const isYesterday = selectedDate === getYesterdayStr();

  return (
    <div
      className="home-page-wrapper fade-in"
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at 50% 0%, rgba(30,58,138,0.2) 0%, rgba(10,8,20,0) 70%), linear-gradient(180deg,#060913 0%,#03050c 100%)',
        color: '#ffffff',
        padding: '0.75rem 0.85rem 5rem',
      }}
    >
      <div className="home-container" style={{ maxWidth: '500px', margin: '0 auto' }}>

        {/* Top Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.9rem',
            marginTop: '0.2rem',
          }}
        >
          <button
            type="button"
            onClick={() => navigate('/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(37, 99, 235, 0.12)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              borderRadius: '8px',
              padding: '6px 14px',
              color: '#60a5fa',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={16} />
            <span>Home</span>
          </button>

          <div style={{ textAlign: 'center' }}>
            <h1
              style={{
                margin: 0,
                fontSize: '1.15rem',
                fontWeight: 900,
                color: '#ffffff',
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}
            >
              POINT TABLE
            </h1>
            <span style={{ fontSize: '0.68rem', color: '#60a5fa', fontWeight: 600 }}>
              Official Scrim &amp; War Results
            </span>
          </div>

          <div style={{ width: '68px' }} />
        </div>

        {/* ── 1. DATE BANNER (Matching Image 2: e.g. "October 11, 2026") ── */}
        <div style={{ textAlign: 'center', margin: '0.4rem 0 0.85rem' }}>
          <div
            style={{
              fontSize: '1.18rem',
              fontWeight: 800,
              color: '#e2e8f0',
              letterSpacing: '0.4px',
              textShadow: '0 2px 10px rgba(0,0,0,0.5)',
            }}
          >
            {formatBannerDate(selectedDate)}
          </div>
        </div>

        {/* ── 2. DATE SELECTOR INPUT BOX (Matching Image 2: "10/11/2026 📅") ── */}
        <div
          style={{
            position: 'relative',
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(59, 130, 246, 0.35)',
            borderRadius: '10px',
            padding: '11px 16px',
            marginBottom: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
          }}
        >
          <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.5px' }}>
            {formatInputDisplay(selectedDate)}
          </div>
          <Calendar size={19} style={{ color: '#c084fc' }} />

          {/* Hidden HTML5 date picker covering the box for easy clicking */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              if (e.target.value) setSelectedDate(e.target.value);
            }}
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0,
              width: '100%',
              height: '100%',
              cursor: 'pointer',
            }}
          />
        </div>

        {/* ── 3. YESTERDAY & TODAY QUICK BUTTONS (Matching Image 2) ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            marginBottom: '1rem',
          }}
        >
          <button
            type="button"
            onClick={() => setSelectedDate(getYesterdayStr())}
            style={{
              background: isYesterday
                ? 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)'
                : 'rgba(15, 23, 42, 0.8)',
              border: `1.5px solid ${isYesterday ? '#3b82f6' : 'rgba(59, 130, 246, 0.25)'}`,
              color: isYesterday ? '#ffffff' : '#94a3b8',
              borderRadius: '8px',
              padding: '10px',
              fontSize: '0.82rem',
              fontWeight: 800,
              letterSpacing: '0.6px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: isYesterday ? '0 4px 14px rgba(37, 99, 235, 0.4)' : 'none',
            }}
          >
            YESTERDAY
          </button>

          <button
            type="button"
            onClick={() => setSelectedDate(getTodayStr())}
            style={{
              background: isToday
                ? 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)'
                : 'rgba(15, 23, 42, 0.8)',
              border: `1.5px solid ${isToday ? '#3b82f6' : 'rgba(59, 130, 246, 0.25)'}`,
              color: isToday ? '#ffffff' : '#94a3b8',
              borderRadius: '8px',
              padding: '10px',
              fontSize: '0.82rem',
              fontWeight: 800,
              letterSpacing: '0.6px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: isToday ? '0 4px 14px rgba(37, 99, 235, 0.4)' : 'none',
            }}
          >
            TODAY
          </button>
        </div>

        {/* ── 4. TWO CATEGORY PUBLISH OPTIONS: DAILY SCRIMS vs WEEKLY & WEEKEND WAR ── */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            marginBottom: '1.25rem',
            background: 'rgba(15, 23, 42, 0.65)',
            padding: '4px',
            borderRadius: '12px',
            border: '1px solid rgba(59, 130, 246, 0.25)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveCategory('DAILY SCRIMS')}
            style={{
              flex: 1,
              background: activeCategory === 'DAILY SCRIMS'
                ? 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)'
                : 'transparent',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#ffffff',
              fontSize: '0.78rem',
              fontWeight: 800,
              letterSpacing: '0.4px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: activeCategory === 'DAILY SCRIMS' ? '0 2px 10px rgba(139, 92, 246, 0.4)' : 'none',
            }}
          >
            ⚡ DAILY SCRIMS
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('WEEKLY & WEEKEND WAR')}
            style={{
              flex: 1,
              background: activeCategory === 'WEEKLY & WEEKEND WAR'
                ? 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)'
                : 'transparent',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#ffffff',
              fontSize: '0.78rem',
              fontWeight: 800,
              letterSpacing: '0.4px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: activeCategory === 'WEEKLY & WEEKEND WAR' ? '0 2px 10px rgba(245, 158, 11, 0.4)' : 'none',
            }}
          >
            🏆 WEEKLY &amp; WEEKEND WAR
          </button>
        </div>

        {/* ── 5. RESULTS CARDS LIST (Matching Image 2 Exactly) ── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#60a5fa' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>Loading Point Tables...</div>
          </div>
        ) : filteredResults.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredResults.map((item) => {
              const lobbyText = item.lobby || 'LOBBY 01';
              const photos = (item.imageUrls && item.imageUrls.length > 0)
                ? item.imageUrls
                : (item.imageUrl ? [item.imageUrl] : []);

              return (
                <div
                  key={item._id}
                  style={{
                    position: 'relative',
                    background: '#070b18',
                    border: '1.5px solid rgba(37, 99, 235, 0.4)',
                    borderRadius: '12px',
                    padding: '1.1rem 1.15rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    boxShadow: '0 4px 18px rgba(0,0,0,0.6), inset 0 0 10px rgba(37, 99, 235, 0.05)',
                    transition: 'border-color 0.2s, transform 0.2s',
                  }}
                >
                  {/* Left Column: Title & Lobby Badge (Matching Image 2) */}
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '0.94rem',
                        fontWeight: 800,
                        color: '#ffffff',
                        letterSpacing: '0.3px',
                        lineHeight: 1.35,
                        textTransform: 'uppercase',
                        wordBreak: 'break-word',
                      }}
                    >
                      {item.matchName}
                    </div>

                    {/* Lobby Badge (Matching Image 2: blue pill) */}
                    <div style={{ marginTop: '0.55rem' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          border: '1px solid #1d4ed8',
                          background: 'rgba(29, 78, 216, 0.25)',
                          color: '#60a5fa',
                          borderRadius: '5px',
                          padding: '3px 10px',
                          fontSize: '0.74rem',
                          fontWeight: 800,
                          letterSpacing: '0.5px',
                        }}
                      >
                        {lobbyText}
                      </span>

                      {photos.length > 1 && (
                        <span
                          style={{
                            marginLeft: '8px',
                            fontSize: '0.68rem',
                            color: '#93c5fd',
                            background: 'rgba(59, 130, 246, 0.15)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontWeight: 700,
                          }}
                        >
                          {photos.length} Photos
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Column: VIEW Button (Matching Image 2) */}
                  <button
                    type="button"
                    onClick={() => setViewingPhotoModal({ open: true, item, activePhotoIndex: 0 })}
                    style={{
                      border: '1.5px solid #2563eb',
                      background: 'rgba(37, 99, 235, 0.18)',
                      borderRadius: '8px',
                      padding: '9px 24px',
                      color: '#ffffff',
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.86rem',
                      fontWeight: 800,
                      letterSpacing: '0.8px',
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#2563eb';
                      e.currentTarget.style.boxShadow = '0 0 16px rgba(37, 99, 235, 0.6)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(37, 99, 235, 0.18)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    VIEW
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              background: '#070b18',
              border: '1px solid rgba(37, 99, 235, 0.25)',
              borderRadius: '12px',
              padding: '3rem 1.5rem',
              textAlign: 'center',
            }}
          >
            <Trophy size={42} style={{ color: '#60a5fa', marginBottom: '0.75rem', opacity: 0.7 }} />
            <h3 style={{ margin: '0 0 6px', color: '#ffffff', fontSize: '1.05rem', fontWeight: 800 }}>
              No Point Tables for {formatBannerDate(selectedDate)}
            </h3>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.8rem' }}>
              No results published under {activeCategory} for this date. Check another date or category.
            </p>
          </div>
        )}

      </div>

      {/* ── RESULT PHOTO LIGHTBOX MODAL ── */}
      {viewingPhotoModal.open && viewingPhotoModal.item && (() => {
        const modalPhotos = (viewingPhotoModal.item.imageUrls && viewingPhotoModal.item.imageUrls.length > 0)
          ? viewingPhotoModal.item.imageUrls
          : (viewingPhotoModal.item.imageUrl ? [viewingPhotoModal.item.imageUrl] : []);
        const currentPhoto = modalPhotos[viewingPhotoModal.activePhotoIndex || 0] || viewingPhotoModal.item.imageUrl;

        return (
          <div
            className="rules-modal-overlay fade-in"
            onClick={() => setViewingPhotoModal({ open: false, item: null, activePhotoIndex: 0 })}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.94)',
              backdropFilter: 'blur(8px)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.85rem',
              overflowY: 'auto',
            }}
          >
            <div
              className="rules-modal-box"
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#070a16',
                border: '1.5px solid rgba(59, 130, 246, 0.5)',
                borderRadius: '16px',
                maxWidth: '680px',
                width: '100%',
                padding: '1.25rem',
                boxShadow: '0 12px 36px rgba(0,0,0,0.8), 0 0 24px rgba(37,99,235,0.25)',
                position: 'relative',
                maxHeight: '94vh',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid rgba(59, 130, 246, 0.25)',
                  paddingBottom: '0.75rem',
                  marginBottom: '0.85rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span
                      style={{
                        background: 'rgba(29, 78, 216, 0.25)',
                        border: '1px solid #1d4ed8',
                        color: '#60a5fa',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      {viewingPhotoModal.item.lobby || 'LOBBY 01'}
                    </span>
                    {viewingPhotoModal.item.date && (
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        📅 {viewingPhotoModal.item.date}
                      </span>
                    )}
                  </div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '0.98rem',
                      fontWeight: 800,
                      color: '#ffffff',
                      textTransform: 'uppercase',
                    }}
                  >
                    {viewingPhotoModal.item.matchName}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setViewingPhotoModal({ open: false, item: null, activePhotoIndex: 0 })}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    cursor: 'pointer',
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Multiple Photo Tabs (if multiple photos attached) */}
              {modalPhotos.length > 1 && (
                <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {modalPhotos.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setViewingPhotoModal(prev => ({ ...prev, activePhotoIndex: idx }))}
                      style={{
                        background: viewingPhotoModal.activePhotoIndex === idx ? '#2563eb' : 'rgba(255, 255, 255, 0.08)',
                        border: `1px solid ${viewingPhotoModal.activePhotoIndex === idx ? '#60a5fa' : 'rgba(255, 255, 255, 0.15)'}`,
                        color: '#ffffff',
                        padding: '4px 12px',
                        borderRadius: '6px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Photo {idx + 1}
                    </button>
                  ))}
                </div>
              )}

              {/* Modal Content: Image Display */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(3, 7, 18, 0.9)',
                  borderRadius: '12px',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  padding: '0.5rem',
                }}
              >
                {currentPhoto ? (
                  <div style={{ width: '100%', textAlign: 'center' }}>
                    <img
                      src={currentPhoto}
                      alt={viewingPhotoModal.item.matchName}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '66vh',
                        objectFit: 'contain',
                        borderRadius: '8px',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
                      }}
                    />
                    <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                      <a
                        href={currentPhoto}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'rgba(37, 99, 235, 0.25)',
                          border: '1px solid #2563eb',
                          color: '#93c5fd',
                          padding: '6px 14px',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          textDecoration: 'none',
                        }}
                      >
                        <ExternalLink size={14} />
                        <span>Open Full Size Image</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                    <ImageIcon size={40} style={{ opacity: 0.5, marginBottom: '0.5rem', color: '#60a5fa' }} />
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>
                      No point table image attached for this match yet.
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
