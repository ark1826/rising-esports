import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  Calendar,
  X,
  ExternalLink,
  Image as ImageIcon,
  Trophy
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function ResultsPage() {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewingPhotoModal, setViewingPhotoModal] = useState({ open: false, item: null });

  // Fetch available dates on mount
  useEffect(() => {
    axios.get(`${API_URL}/api/results/dates`)
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setDates(res.data);
          setSelectedDate(res.data[0]);
        }
      })
      .catch((err) => console.error('Error fetching result dates:', err));
  }, []);

  // Fetch results when selectedDate changes (or fetch all if no dates)
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

  return (
    <div
      className="home-page-wrapper fade-in"
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at 50% 0%, rgba(124,58,237,0.15) 0%, rgba(10,8,20,0) 65%), linear-gradient(180deg,#090713 0%,#06040e 100%)',
        color: '#ffffff',
        padding: '0.75rem 0.75rem 5rem',
      }}
    >
      <div className="home-container" style={{ maxWidth: '520px', margin: '0 auto' }}>

        {/* Top Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
            marginTop: '0.4rem',
          }}
        >
          <button
            type="button"
            onClick={() => navigate('/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(139, 92, 246, 0.12)',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              borderRadius: '8px',
              padding: '6px 14px',
              color: '#c084fc',
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
              SCRIM RESULTS
            </h1>
            <span style={{ fontSize: '0.7rem', color: '#c084fc' }}>
              Official Point Tables
            </span>
          </div>

          <div style={{ width: '68px' }} />
        </div>

        {/* Date Filter Bar (if dates exist) */}
        {dates.length > 0 && (
          <div
            style={{
              marginBottom: '1.25rem',
              overflowX: 'auto',
              display: 'flex',
              gap: '8px',
              paddingBottom: '4px',
            }}
          >
            {dates.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setSelectedDate(d)}
                style={{
                  background: selectedDate === d
                    ? 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)'
                    : 'rgba(23, 14, 46, 0.7)',
                  border: `1px solid ${selectedDate === d ? '#c084fc' : 'rgba(168, 85, 247, 0.3)'}`,
                  color: selectedDate === d ? '#ffffff' : '#c084fc',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Calendar size={13} />
                <span>{d}</span>
              </button>
            ))}
          </div>
        )}

        {/* LIST OF RESULTS CARDS */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#c084fc' }}>
            <div style={{ fontSize: '1rem', fontWeight: 800 }}>Loading Result Tables...</div>
          </div>
        ) : results.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {results.map((item) => {
              const lobbyText = item.lobby || 'LOBBY 01';
              return (
                <div
                  key={item._id}
                  style={{
                    position: 'relative',
                    background: 'linear-gradient(135deg, rgba(23,14,46,0.95) 0%, rgba(13,9,28,0.96) 60%, rgba(8,5,18,0.98) 100%)',
                    border: '1.5px solid rgba(168, 85, 247, 0.38)',
                    borderRadius: '14px',
                    padding: '1.1rem 1.15rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    boxShadow: '0 4px 18px rgba(0,0,0,0.5), inset 0 0 12px rgba(139,92,246,0.05)',
                    transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(192, 132, 252, 0.7)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 22px rgba(168,85,247,0.22)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(168,85,247,0.38)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,0.5), inset 0 0 12px rgba(139,92,246,0.05)';
                  }}
                >
                  {/* Purple top neon line */}
                  <div style={{
                    position: 'absolute', top: 0, left: '15%', right: '15%', height: '2px',
                    background: 'linear-gradient(90deg, transparent, #c084fc, #9333ea, transparent)',
                    filter: 'drop-shadow(0 0 4px #c084fc)',
                  }} />

                  {/* Left Column: Title & Lobby Pill */}
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '0.92rem',
                        fontWeight: 800,
                        color: '#ffffff',
                        letterSpacing: '0.4px',
                        lineHeight: 1.35,
                        textTransform: 'uppercase',
                        wordBreak: 'break-word',
                      }}
                    >
                      {item.matchName}
                    </div>

                    <div style={{ marginTop: '0.65rem' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          border: '1px solid rgba(168, 85, 247, 0.5)',
                          borderRadius: '20px',
                          padding: '3px 12px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: '#c084fc',
                          background: 'rgba(139, 92, 246, 0.12)',
                          letterSpacing: '0.5px',
                        }}
                      >
                        {lobbyText}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: VIEW Button */}
                  <button
                    type="button"
                    onClick={() => setViewingPhotoModal({ open: true, item })}
                    style={{
                      background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                      border: 'none',
                      borderRadius: '20px',
                      padding: '10px 24px',
                      color: '#ffffff',
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.85rem',
                      fontWeight: 900,
                      letterSpacing: '0.8px',
                      cursor: 'pointer',
                      boxShadow: '0 3px 12px rgba(139, 92, 246, 0.45)',
                      flexShrink: 0,
                      transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.04)';
                      e.currentTarget.style.boxShadow = '0 5px 18px rgba(168, 85, 247, 0.6)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '0 3px 12px rgba(139, 92, 246, 0.45)';
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
              background: 'linear-gradient(135deg, rgba(23,14,46,0.95) 0%, rgba(13,9,28,0.96) 100%)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '14px',
              padding: '3rem 1.5rem',
              textAlign: 'center',
            }}
          >
            <Trophy size={42} style={{ color: '#c084fc', marginBottom: '0.75rem', opacity: 0.7 }} />
            <h3 style={{ margin: '0 0 6px', color: '#ffffff', fontSize: '1.05rem', fontWeight: 800 }}>
              No Point Tables Published Yet
            </h3>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.8rem' }}>
              Results and point table photos will appear here after matches are completed.
            </p>
          </div>
        )}

      </div>

      {/* RESULT PHOTO LIGHTBOX MODAL */}
      {viewingPhotoModal.open && viewingPhotoModal.item && (
        <div
          className="rules-modal-overlay fade-in"
          onClick={() => setViewingPhotoModal({ open: false, item: null })}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.92)',
            backdropFilter: 'blur(8px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            overflowY: 'auto',
          }}
        >
          <div
            className="rules-modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, rgba(23,14,46,0.98) 0%, rgba(10,7,22,0.99) 100%)',
              border: '1.5px solid rgba(168, 85, 247, 0.5)',
              borderRadius: '16px',
              maxWidth: '640px',
              width: '100%',
              padding: '1.25rem',
              boxShadow: '0 12px 36px rgba(0,0,0,0.8), 0 0 24px rgba(139,92,246,0.25)',
              position: 'relative',
              maxHeight: '92vh',
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
                borderBottom: '1px solid rgba(168, 85, 247, 0.25)',
                paddingBottom: '0.75rem',
                marginBottom: '1rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span
                    style={{
                      background: 'rgba(139, 92, 246, 0.15)',
                      border: '1px solid rgba(168, 85, 247, 0.5)',
                      color: '#c084fc',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '12px',
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
                onClick={() => setViewingPhotoModal({ open: false, item: null })}
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

            {/* Modal Content: Image Display */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(10, 7, 22, 0.8)',
                borderRadius: '12px',
                border: '1px solid rgba(168, 85, 247, 0.15)',
                padding: '0.5rem',
              }}
            >
              {viewingPhotoModal.item.imageUrl ? (
                <div style={{ width: '100%', textAlign: 'center' }}>
                  <img
                    src={viewingPhotoModal.item.imageUrl}
                    alt={viewingPhotoModal.item.matchName}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '68vh',
                      objectFit: 'contain',
                      borderRadius: '8px',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
                    }}
                  />
                  <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    <a
                      href={viewingPhotoModal.item.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(139, 92, 246, 0.15)',
                        border: '1px solid rgba(168, 85, 247, 0.4)',
                        color: '#c084fc',
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
                  <ImageIcon size={40} style={{ opacity: 0.5, marginBottom: '0.5rem', color: '#c084fc' }} />
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>
                    No point table image attached for this scrim yet.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
