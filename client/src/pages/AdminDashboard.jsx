import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Plus,
  Edit2,
  Trash2,
  LogOut,
  Trophy,
  Layout,
  ShieldAlert,
  Users,
  ChevronDown,
  ChevronUp,
  LayoutList,
  ImageIcon,
  Save,
  X,
  Upload,
  CheckCircle
} from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('rankings');
  const [rankings, setRankings] = useState([]);
  const [slots, setSlots] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [bookingView, setBookingView] = useState('grouped'); // 'flat' | 'grouped'
  const [expandedSlots, setExpandedSlots] = useState({});

  // ── Slot Editor state ──
  const [editorData, setEditorData] = useState({});
  const [editorImageFiles, setEditorImageFiles] = useState({});
  const [editorImagePreviews, setEditorImagePreviews] = useState({});
  const [editorSaving, setEditorSaving] = useState({});
  const [editorSaved, setEditorSaved] = useState({});

  const adminInfo = JSON.parse(localStorage.getItem('adminInfo'));
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const config = {
    headers: { Authorization: `Bearer ${adminInfo?.token}` }
  };

  useEffect(() => {
    fetchData();
  }, [apiUrl]);

  const fetchData = async () => {
    try {
      const [rankRes, slotRes, bookingRes] = await Promise.all([
        axios.get(`${apiUrl}/api/rankings`),
        axios.get(`${apiUrl}/api/slots/admin`, config).catch(() => axios.get(`${apiUrl}/api/slots`)),
        axios.get(`${apiUrl}/api/bookings`, config)
      ]);
      const tournamentRes = await axios.get(`${apiUrl}/api/tournaments`);
      setRankings(rankRes.data);
      setSlots(slotRes.data);
      setTournaments(tournamentRes.data);
      setBookings(bookingRes.data);
    } catch (err) {
      console.error('Error fetching data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slots.length > 0) {
      const map = {};
      slots.forEach((s) => {
        map[s._id] = {
          matchName: s.matchName || '', date: s.date || '', timing: s.timing || '',
          mode: s.mode || '', teams: s.teams || '', maps: Array.isArray(s.maps) ? s.maps.join(', ') : '',
          entryFee: s.entryFee ?? 0, prizePool: Array.isArray(s.prizePool) ? s.prizePool.map(p => ({ ...p })) : [],
          roomId: s.roomId || '', roomPassword: s.roomPassword || '',
          note: s.note || '', whatsappLink: s.whatsappLink || '',
        };
      });
      setEditorData(map);
    }
  }, [slots]);

  const handleLogout = () => {
    localStorage.removeItem('adminInfo');
    window.location.href = '/admin/login';
  };

  const formatForInput = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      setFormData(activeTab === 'slots' ? {
        ...item, slotTime: item.slotTime ? formatForInput(item.slotTime) : '', price: item.price ?? 0,
        maxTeams: item.maxTeams ?? 20, matchName: item.matchName || '', roomId: item.roomId || '', roomPassword: item.roomPassword || ''
      } : activeTab === 'tournaments' ? { ...item } : item);
    } else {
      setFormData(activeTab === 'rankings'
        ? { rank: rankings.length + 1, teamName: '', teamTag: '', totalMatches: 0, finishes: 0, wwcd: 0, totalPoints: 0 }
        : activeTab === 'tournaments' ? {
            title: '', game: 'BGMI', date: '', location: 'ONLINE TOURNAMENT', prizePool: 0,
            entryFee: 0, status: 'UPCOMING', registrationOpen: false, description: '',
          } : {
            entryFee: 0,
            price: 0,
            maxTeams: 20,
            prizePool: [{ position: 1, amount: 0 }],
            matchName: '',
            slotTime: '',
            date: '',
            timing: '',
            mode: '',
            teams: '',
            maps: '',
            roomId: '',
            roomPassword: '',
            note: '',
            whatsappLink: '',
          });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = activeTab === 'slots'
        ? {
            ...formData,
            price: Number(formData.price ?? formData.entryFee ?? 0),
            maxTeams: Number(formData.maxTeams ?? 20),
            maps: typeof formData.maps === 'string'
              ? formData.maps.split(',').map(map => map.trim()).filter(Boolean)
              : formData.maps || [],
          }
        : activeTab === 'tournaments'
          ? { ...formData, prizePool: Number(formData.prizePool || 0), entryFee: Number(formData.entryFee || 0) }
          : formData;
      delete payload.heroImageFile;

      let savedId;
      if (editingItem) {
        await axios.put(`${apiUrl}/api/${activeTab}/${editingItem._id}`, payload, config);
        savedId = editingItem._id;
      } else {
        const res = await axios.post(`${apiUrl}/api/${activeTab}`, payload, config);
        savedId = res.data._id;
      }

      if (activeTab === 'slots' && formData.heroImageFile && savedId) {
        const fd = new FormData();
        fd.append('heroImage', formData.heroImageFile);
        await axios.post(`${apiUrl}/api/slots/${savedId}/upload-image`, fd, {
          headers: {
            Authorization: `Bearer ${adminInfo?.token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      if (activeTab === 'tournaments' && formData.posterFile && savedId) {
        const fd = new FormData();
        fd.append('poster', formData.posterFile);
        await axios.post(`${apiUrl}/api/tournaments/${savedId}/upload-poster`, fd, {
          headers: { Authorization: `Bearer ${adminInfo?.token}`, 'Content-Type': 'multipart/form-data' },
        });
      }

      await fetchData();
      setShowModal(false);
    } catch (err) {
      alert('Operation failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this?')) {
      try {
        const resource = activeTab === 'slots' ? 'slots' : activeTab;
        await axios.delete(`${apiUrl}/api/${resource}/${id}`, config);

        if (resource === 'slots') {
          setSlots(currentSlots => currentSlots.filter(slot => slot._id !== id));
          setEditorData(currentData => {
            const nextData = { ...currentData };
            delete nextData[id];
            return nextData;
          });
        } else {
          if (resource === 'tournaments') {
            setTournaments(current => current.filter(tournament => tournament._id !== id));
          }
          await fetchData();
        }
      } catch (err) {
        alert('Delete failed: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const removePrizeRow = (index) => {
    const newPrizes = formData.prizePool.filter((_, i) => i !== index);
    const adjustedPrizes = newPrizes.map((p, i) => ({ ...p, position: i + 1 }));
    setFormData({ ...formData, prizePool: adjustedPrizes });
  };

  const handlePrizeChange = (index, field, value) => {
    const newPrizes = [...formData.prizePool];
    newPrizes[index][field] = Number(value);
    setFormData({ ...formData, prizePool: newPrizes });
  };

  const addPrizeRow = () => {
    setFormData({
      ...formData,
      prizePool: [...formData.prizePool, { position: formData.prizePool.length + 1, amount: 0 }]
    });
  };

  // ── Group bookings by event (Slot or Tournament) ──
  const groupedBookings = bookings.reduce((acc, booking) => {
    const isTournament = booking.type === 'tournament' || Boolean(booking.tournamentId);
    const eventId = isTournament 
      ? (booking.tournamentId?._id || 'unknown_tournament')
      : (booking.slotId?._id || 'unknown_slot');
    const groupKey = `${isTournament ? 'tournament' : 'slot'}_${eventId}`;

    if (!acc[groupKey]) {
      acc[groupKey] = {
        isTournament,
        event: isTournament ? booking.tournamentId : booking.slotId,
        bookings: [],
      };
    }
    acc[groupKey].bookings.push(booking);
    return acc;
  }, {});

  const toggleSlotExpand = (slotId) => {
    setExpandedSlots(prev => ({ ...prev, [slotId]: !prev[slotId] }));
  };

  const statusStyle = (status) => {
    if (status === 'paid') return { background: 'rgba(34,197,94,0.15)', color: '#22c55e' };
    if (status === 'pending') return { background: 'rgba(234,179,8,0.15)', color: '#eab308' };
    return { background: 'rgba(239,68,68,0.15)', color: '#ef4444' };
  };

  // ────────────────────────── SLOT EDITOR HELPERS ──────────────────────────

  const handleEditorFieldChange = (slotId, field, value) => {
    setEditorData(prev => ({
      ...prev,
      [slotId]: { ...prev[slotId], [field]: value }
    }));
  };

  const handleEditorPrizeChange = (slotId, idx, field, value) => {
    setEditorData(prev => {
      const updated = { ...prev };
      const pool = [...(updated[slotId]?.prizePool || [])];
      pool[idx] = { ...pool[idx], [field]: Number(value) };
      updated[slotId] = { ...updated[slotId], prizePool: pool };
      return updated;
    });
  };

  const addEditorPrizeRow = (slotId) => {
    setEditorData(prev => {
      const pool = [...(prev[slotId]?.prizePool || [])];
      pool.push({ position: pool.length + 1, amount: 0 });
      return { ...prev, [slotId]: { ...prev[slotId], prizePool: pool } };
    });
  };

  const removeEditorPrizeRow = (slotId, idx) => {
    setEditorData(prev => {
      const pool = (prev[slotId]?.prizePool || []).filter((_, i) => i !== idx)
        .map((p, i) => ({ ...p, position: i + 1 }));
      return { ...prev, [slotId]: { ...prev[slotId], prizePool: pool } };
    });
  };

  const handleEditorImageSelect = (slotId, file) => {
    if (!file) return;
    setEditorImageFiles(prev => ({ ...prev, [slotId]: file }));
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditorImagePreviews(prev => ({ ...prev, [slotId]: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleEditorSave = async (slotId) => {
    setEditorSaving(prev => ({ ...prev, [slotId]: true }));
    try {
      const data = editorData[slotId];
      // Parse maps from comma-separated string back to array
      const payload = {
        ...data,
        maps: typeof data.maps === 'string'
          ? data.maps.split(',').map(s => s.trim()).filter(Boolean)
          : data.maps,
      };

      // 1. Update text fields
      await axios.put(`${apiUrl}/api/slots/${slotId}`, payload, config);

      // 2. Upload image if selected
      if (editorImageFiles[slotId]) {
        const fd = new FormData();
        fd.append('heroImage', editorImageFiles[slotId]);
        await axios.post(`${apiUrl}/api/slots/${slotId}/upload-image`, fd, {
          headers: {
            Authorization: `Bearer ${adminInfo?.token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        // Clear the file selection after upload
        setEditorImageFiles(prev => { const n = { ...prev }; delete n[slotId]; return n; });
      }

      // Refresh data
      await fetchData();

      // Flash success
      setEditorSaved(prev => ({ ...prev, [slotId]: true }));
      setTimeout(() => setEditorSaved(prev => ({ ...prev, [slotId]: false })), 2500);

    } catch (err) {
      console.error('Save error', err);
      alert('Failed to save: ' + (err.response?.data?.message || err.message));
    } finally {
      setEditorSaving(prev => ({ ...prev, [slotId]: false }));
    }
  };

  const clearEditorImage = (slotId) => {
    setEditorImageFiles(prev => { const n = { ...prev }; delete n[slotId]; return n; });
    setEditorImagePreviews(prev => { const n = { ...prev }; delete n[slotId]; return n; });
  };

  const getSlotImageSrc = (slot) => {
    if (editorImagePreviews[slot._id]) return editorImagePreviews[slot._id];
    if (slot.heroImageUrl) return slot.heroImageUrl;
    if (slot.hasHeroImage) return `${apiUrl}/api/slots/${slot._id}/image`;
    return null;
  };

  // ──────────────────────────── RENDER ────────────────────────────
  return (
    <div className="admin-dashboard fade-in">
      <div className="admin-nav">
        <h1>Admin <span>Panel</span></h1>
        <button onClick={handleLogout} className="tab-btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent' }}>
          <LogOut size={18} /> Logout
        </button>
      </div>

      <div className="admin-tabs">
        <button
          className={`tab-btn ${activeTab === 'rankings' ? 'active' : ''}`}
          onClick={() => setActiveTab('rankings')}
        >
          <Trophy size={18} style={{ marginRight: '8px' }} /> Rankings
        </button>
        <button
          className={`tab-btn ${activeTab === 'slots' ? 'active' : ''}`}
          onClick={() => setActiveTab('slots')}
        >
          <Layout size={18} style={{ marginRight: '8px' }} /> Manage Slots
        </button>
        <button
          className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          <ShieldAlert size={18} style={{ marginRight: '8px' }} /> Bookings
        </button>
        <button
          className={`tab-btn ${activeTab === 'tournaments' ? 'active' : ''}`}
          onClick={() => setActiveTab('tournaments')}
        >
          <Trophy size={18} style={{ marginRight: '8px' }} /> Tournaments
        </button>
      </div>

      <div className="admin-section">
        <div className="admin-header">
          <h2>
            {activeTab === 'rankings' ? 'Manage Rankings'
              : activeTab === 'slots' ? 'Manage Slots'
              : activeTab === 'tournaments' ? 'Manage Tournaments'
              : 'Manage Bookings'}
          </h2>

          {activeTab === 'bookings' ? (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className={`tab-btn ${bookingView === 'grouped' ? 'active' : ''}`}
                onClick={() => setBookingView('grouped')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}
              >
                <Users size={15} /> Group by Slot
              </button>
              <button
                className={`tab-btn ${bookingView === 'flat' ? 'active' : ''}`}
                onClick={() => setBookingView('flat')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}
              >
                <LayoutList size={15} /> All Bookings
              </button>
            </div>
          ) : activeTab === 'slots' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ImageIcon size={14} />
                Edit poster &amp; details for each slot below
              </div>
              <button className="action-btn" onClick={() => handleOpenModal()}>
                <Plus size={18} /> Add New
              </button>
            </div>
          ) : activeTab === 'tournaments' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ImageIcon size={14} /> Upload posters and publish event details
              </div>
              <button className="action-btn" onClick={() => handleOpenModal()}>
                <Plus size={18} /> Add Tournament
              </button>
            </div>
          ) : (
            <button className="action-btn" onClick={() => handleOpenModal()}>
              <Plus size={18} /> Add New
            </button>
          )}
        </div>

        {loading ? <p>Loading...</p> : (
          <>
            {/* ── RANKINGS ── */}
            {activeTab === 'rankings' && (
              <div className="rankings-table-wrapper">
                <table className="rankings-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Team</th>
                      <th>Points</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankings.map(team => (
                      <tr key={team._id}>
                        <td>#{team.rank}</td>
                        <td>{team.teamName} [{team.teamTag}]</td>
                        <td>{team.totalPoints}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="action-btn edit-btn" onClick={() => handleOpenModal(team)}><Edit2 size={14} /></button>
                            <button className="action-btn delete-btn" onClick={() => handleDelete(team._id)}><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'tournaments' && (
              <div className="admin-tournaments-grid">
                {tournaments.length === 0 ? (
                  <div className="admin-tournament-empty">No tournaments yet. Add your first event.</div>
                ) : tournaments.map(tournament => (
                  <article className="admin-tournament-card" key={tournament._id}>
                    <div className="admin-tournament-poster">
                      {tournament.hasPoster ? <img src={`${apiUrl}/api/tournaments/${tournament._id}/poster`} alt={`${tournament.title} poster`} /> : <ImageIcon size={34} />}
                    </div>
                    <div className="admin-tournament-card-body">
                      <span className={`tournament-status-badge ${tournament.status.toLowerCase()}`}>{tournament.status}</span>
                      <h3>{tournament.title}</h3>
                      <p>{tournament.game} · {tournament.date || 'Date TBA'}</p>
                      <strong>₹{Number(tournament.prizePool || 0).toLocaleString()} prize pool</strong>
                      <div className="admin-tournament-actions">
                        <button className="action-btn edit-btn" onClick={() => handleOpenModal(tournament)}><Edit2 size={14} /> Edit</button>
                        <button className="action-btn delete-btn" onClick={() => handleDelete(tournament._id)}><Trash2 size={14} /> Delete</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}



            {/* ── BOOKINGS: FLAT VIEW ── */}
            {activeTab === 'bookings' && bookingView === 'flat' && (
              <div className="rankings-table-wrapper">
                <table className="rankings-table">
                  <thead>
                    <tr>
                      <th>Reg #</th>
                      <th>User</th>
                      <th>Match</th>
                      <th>Amount</th>
                      <th>Payment Details</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map(booking => (
                      <tr key={booking._id}>
                        <td>
                          <span style={{
                            fontWeight: 'bold',
                            fontFamily: 'monospace',
                            fontSize: '0.95rem',
                            color: 'var(--purple-light)',
                            background: 'rgba(139,92,246,0.12)',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px'
                          }}>
                            #{booking.userId?.registrationNumber ?? '—'}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 'bold' }}>{booking.userId?.teamName || 'No Team Name'}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{booking.userId?.phone}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 'bold' }}>{booking.slotId?.matchName || 'Unknown Match'}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {booking.slotId?.slotTime ? new Date(booking.slotId.slotTime).toLocaleString('en-IN') : ''}
                          </div>
                        </td>
                        <td>₹{booking.slotId?.price ?? booking.slotId?.entryFee ?? 0}</td>
                        <td>
                          <div style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>
                            Ref: {booking.paymentId || '—'}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                            Txn: {booking.merchantTransactionId || booking.razorpayOrderId || '—'}
                          </div>
                        </td>
                        <td>
                          <span style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 'bold',
                            ...statusStyle(booking.paymentStatus)
                          }}>
                            {booking.paymentStatus.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.78rem' }}>
                          {booking.paidAt
                            ? new Date(booking.paidAt).toLocaleString('en-IN')
                            : new Date(booking.createdAt).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── BOOKINGS: GROUPED BY SLOT ── */}
            {activeTab === 'bookings' && bookingView === 'grouped' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {Object.entries(groupedBookings).length === 0 && (
                  <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
                    No bookings yet.
                  </p>
                )}

                {Object.entries(groupedBookings).map(([groupKey, group]) => {
                  const paidCount = group.bookings.filter(b => b.paymentStatus === 'paid').length;
                  const totalCollected = group.bookings
                    .filter(b => b.paymentStatus === 'paid')
                    .reduce((sum, b) => {
                      const amt = b.amount ?? (group.isTournament ? b.tournamentId?.entryFee : (b.slotId?.price ?? b.slotId?.entryFee ?? 0));
                      return sum + (Number(amt) || 0);
                    }, 0);
                  const isOpen = expandedSlots[groupKey] !== false;

                  const eventTitle = group.isTournament
                    ? (group.event?.title || 'Tournament Event')
                    : (group.event?.matchName || 'Match Slot');
                  
                  const eventSub = group.isTournament
                    ? `${group.event?.game || 'BGMI'} • ${group.event?.date || 'Online Tournament'}`
                    : (group.event?.slotTime ? new Date(group.event.slotTime).toLocaleString('en-IN') : (group.event?.date || 'TBA'));

                  return (
                    <div key={groupKey} style={{
                      border: '1px solid rgba(139,92,246,0.25)',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      background: 'rgba(139,92,246,0.04)',
                    }}>
                      <button
                        onClick={() => toggleSlotExpand(groupKey)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '1rem 1.25rem',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'inherit',
                          textAlign: 'left',
                          gap: '1rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontWeight: 'bold', fontSize: '1rem', color: 'var(--purple-light)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span>{eventTitle}</span>
                              <span style={{
                                fontSize: '0.65rem',
                                padding: '0.15rem 0.45rem',
                                borderRadius: '4px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                fontWeight: '700',
                                background: group.isTournament ? 'rgba(59, 130, 246, 0.2)' : 'rgba(139, 92, 246, 0.2)',
                                color: group.isTournament ? '#60a5fa' : 'var(--purple-light)',
                                border: `1px solid ${group.isTournament ? 'rgba(59, 130, 246, 0.4)' : 'rgba(139, 92, 246, 0.4)'}`
                              }}>
                                {group.isTournament ? 'TOURNAMENT' : 'SLOT'}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                              {eventSub}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{
                              background: 'rgba(34,197,94,0.15)',
                              color: '#22c55e',
                              padding: '0.2rem 0.65rem',
                              borderRadius: '20px',
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem'
                            }}>
                              <Users size={12} /> {paidCount} Paid
                            </span>
                            <span style={{
                              background: 'rgba(139,92,246,0.15)',
                              color: 'var(--purple-light)',
                              padding: '0.2rem 0.65rem',
                              borderRadius: '20px',
                              fontSize: '0.75rem',
                              fontWeight: 'bold'
                            }}>
                              {group.bookings.length} Total
                            </span>
                            <span style={{
                              background: 'rgba(234,179,8,0.12)',
                              color: '#eab308',
                              padding: '0.2rem 0.65rem',
                              borderRadius: '20px',
                              fontSize: '0.75rem',
                              fontWeight: 'bold'
                            }}>
                              ₹{totalCollected} Collected
                            </span>
                          </div>
                        </div>

                        {isOpen
                          ? <ChevronUp size={18} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                          : <ChevronDown size={18} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                        }
                      </button>

                      {isOpen && (
                        <div style={{ borderTop: '1px solid rgba(139,92,246,0.15)', overflowX: 'auto' }}>
                          <table className="rankings-table" style={{ margin: 0 }}>
                            <thead>
                              <tr>
                                <th style={{ width: '90px' }}>Reg #</th>
                                <th>Team / Phone</th>
                                <th>Amount Paid</th>
                                <th>Payment ID</th>
                                <th>Status</th>
                                <th>Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[...group.bookings]
                                .sort((a, b) =>
                                  (a.userId?.registrationNumber ?? 9999) - (b.userId?.registrationNumber ?? 9999)
                                )
                                .map((booking) => {
                                  const displayAmount = booking.amount ?? (group.isTournament ? booking.tournamentId?.entryFee : (booking.slotId?.price ?? booking.slotId?.entryFee ?? 0));
                                  return (
                                    <tr key={booking._id}>
                                      <td>
                                        <span style={{
                                          fontWeight: 'bold',
                                          fontFamily: 'monospace',
                                          color: 'var(--purple-light)',
                                          background: 'rgba(139,92,246,0.12)',
                                          padding: '0.15rem 0.5rem',
                                          borderRadius: '4px',
                                          fontSize: '0.9rem'
                                        }}>
                                          #{booking.userId?.registrationNumber ?? '—'}
                                        </span>
                                      </td>
                                      <td>
                                        <div style={{ fontWeight: 'bold' }}>
                                          {booking.userId?.teamName || '(No Team Name)'}
                                        </div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                          {booking.userId?.phone}
                                        </div>
                                      </td>
                                      <td style={{ fontWeight: 'bold' }}>
                                        ₹{displayAmount}
                                      </td>
                                      <td>
                                        <div style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                          {booking.paymentId || <span style={{ color: 'var(--text-secondary)' }}>—</span>}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                          {booking.merchantTransactionId || booking.razorpayOrderId || ''}
                                        </div>
                                      </td>
                                      <td>
                                        <span style={{
                                          padding: '0.2rem 0.5rem',
                                          borderRadius: '4px',
                                          fontSize: '0.72rem',
                                          fontWeight: 'bold',
                                          ...statusStyle(booking.paymentStatus)
                                        }}>
                                          {booking.paymentStatus.toUpperCase()}
                                        </span>
                                      </td>
                                      <td style={{ fontSize: '0.75rem' }}>
                                        {booking.paidAt
                                          ? new Date(booking.paidAt).toLocaleString('en-IN')
                                          : new Date(booking.createdAt).toLocaleString('en-IN')}
                                      </td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── SLOT EDITOR ── */}
            {activeTab === 'slots' && (
              <div className="slot-editor-grid">
                {slots.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    <ImageIcon size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <p>No slots yet. Create slots by clicking Add New.</p>
                  </div>
                ) : (
                  slots.map((slot) => {
                    const ed = editorData[slot._id] || {};
                    const imgSrc = getSlotImageSrc(slot);
                    const isSaving = editorSaving[slot._id];
                    const isSaved = editorSaved[slot._id];
                    const hasNewImage = !!editorImageFiles[slot._id];

                    return (
                      <div key={slot._id} className="slot-editor-card">
                        {/* Card Header */}
                        <div className="slot-editor-card-header">
                          <div>
                            <div className="slot-editor-card-title">
                              {slot.matchName || 'Unnamed Slot'}
                            </div>
                            <div className="slot-editor-card-subtitle">
                              ID: <code>{slot._id}</code>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {isSaved && (
                              <div className="slot-editor-saved-badge">
                                <CheckCircle size={14} /> Saved!
                              </div>
                            )}
                            <button
                              type="button"
                              className="action-btn delete-btn"
                              onClick={() => handleDelete(slot._id)}
                              style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #ef4444', color: '#ef4444', background: 'transparent', cursor: 'pointer' }}
                              title="Delete Slot"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="slot-editor-body">
                          {/* ── LEFT: Poster Upload ── */}
                          <div className="slot-editor-poster-section">
                            <label className="slot-editor-section-label">
                              <ImageIcon size={14} /> Slot Poster
                            </label>

                            {imgSrc ? (
                              <div className="poster-preview-wrap">
                                <img src={imgSrc} alt="Poster preview" className="poster-preview" />
                                {hasNewImage && (
                                  <button
                                    className="poster-clear-btn"
                                    onClick={() => clearEditorImage(slot._id)}
                                    title="Remove new image"
                                  >
                                    <X size={14} />
                                  </button>
                                )}
                                {hasNewImage && (
                                  <div className="poster-new-badge">New — unsaved</div>
                                )}
                              </div>
                            ) : (
                              <div className="poster-placeholder">
                                <ImageIcon size={32} style={{ opacity: 0.3 }} />
                                <span>No poster yet</span>
                              </div>
                            )}

                            <label className="poster-upload-btn">
                              <Upload size={14} />
                              {imgSrc ? 'Replace Poster' : 'Upload Poster'}
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={(e) => handleEditorImageSelect(slot._id, e.target.files[0])}
                              />
                            </label>
                            <p className="poster-hint">Max 5 MB · JPG / PNG / WEBP</p>
                          </div>

                          {/* ── RIGHT: Fields ── */}
                          <div className="slot-editor-fields">
                            <div className="slot-editor-fields-grid">
                              <div className="se-field">
                                <label>Match Name</label>
                                <input
                                  type="text"
                                  value={ed.matchName || ''}
                                  onChange={(e) => handleEditorFieldChange(slot._id, 'matchName', e.target.value)}
                                  placeholder="e.g. Rising Cup #12"
                                />
                              </div>
                              <div className="se-field">
                                <label>Date</label>
                                <input
                                  type="text"
                                  value={ed.date || ''}
                                  onChange={(e) => handleEditorFieldChange(slot._id, 'date', e.target.value)}
                                  placeholder="e.g. 25 Aug 2026"
                                />
                              </div>
                              <div className="se-field">
                                <label>Timing</label>
                                <input
                                  type="text"
                                  value={ed.timing || ''}
                                  onChange={(e) => handleEditorFieldChange(slot._id, 'timing', e.target.value)}
                                  placeholder="e.g. 9:00 PM"
                                />
                              </div>
                              <div className="se-field">
                                <label>Mode</label>
                                <input
                                  type="text"
                                  value={ed.mode || ''}
                                  onChange={(e) => handleEditorFieldChange(slot._id, 'mode', e.target.value)}
                                  placeholder="Squad / Duo / Solo"
                                />
                              </div>
                              <div className="se-field">
                                <label>Teams</label>
                                <input
                                  type="text"
                                  value={ed.teams || ''}
                                  onChange={(e) => handleEditorFieldChange(slot._id, 'teams', e.target.value)}
                                  placeholder="e.g. 18-19 Teams"
                                />
                              </div>
                              <div className="se-field">
                                <label>Maps (comma separated)</label>
                                <input
                                  type="text"
                                  value={ed.maps || ''}
                                  onChange={(e) => handleEditorFieldChange(slot._id, 'maps', e.target.value)}
                                  placeholder="Erangel, Miramar"
                                />
                              </div>
                              <div className="se-field">
                                <label>Entry Fee (₹)</label>
                                <input
                                  type="number"
                                  value={ed.entryFee ?? 0}
                                  onChange={(e) => handleEditorFieldChange(slot._id, 'entryFee', Number(e.target.value))}
                                  min="0"
                                />
                              </div>
                              <div className="se-field">
                                <label style={{ color: '#a78bfa', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                  🔑 Room ID
                                </label>
                                <input
                                  type="text"
                                  value={ed.roomId || ''}
                                  onChange={(e) => handleEditorFieldChange(slot._id, 'roomId', e.target.value)}
                                  placeholder="e.g. 84729103"
                                  style={{ borderColor: 'rgba(167, 139, 250, 0.4)', background: 'rgba(167, 139, 250, 0.05)' }}
                                />
                              </div>
                              <div className="se-field">
                                <label style={{ color: '#a78bfa', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                  🔒 Room Password
                                </label>
                                <input
                                  type="text"
                                  value={ed.roomPassword || ''}
                                  onChange={(e) => handleEditorFieldChange(slot._id, 'roomPassword', e.target.value)}
                                  placeholder="e.g. pass123"
                                  style={{ borderColor: 'rgba(167, 139, 250, 0.4)', background: 'rgba(167, 139, 250, 0.05)' }}
                                />
                              </div>
                              <div className="se-field" style={{ gridColumn: 'span 2' }}>
                                <label>ID / Password Note</label>
                                <input
                                  type="text"
                                  value={ed.note || ''}
                                  onChange={(e) => handleEditorFieldChange(slot._id, 'note', e.target.value)}
                                  placeholder="e.g. Will be provided 30 min before match"
                                />
                              </div>
                              <div className="se-field" style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                                  WhatsApp Group Link
                                </label>
                                <input
                                  type="url"
                                  value={ed.whatsappLink || ''}
                                  onChange={(e) => handleEditorFieldChange(slot._id, 'whatsappLink', e.target.value)}
                                  placeholder="https://chat.whatsapp.com/..."
                                />
                              </div>
                            </div>

                            {/* Prize Pool */}
                            <div className="se-prize-section">
                              <label className="slot-editor-section-label" style={{ marginBottom: '0.6rem' }}>
                                🏆 Prize Pool
                              </label>
                              {(ed.prizePool || []).map((prize, idx) => (
                                <div key={idx} className="se-prize-row">
                                  <span className="se-prize-pos">#{prize.position}</span>
                                  <input
                                    type="number"
                                    value={prize.amount}
                                    onChange={(e) => handleEditorPrizeChange(slot._id, idx, 'amount', e.target.value)}
                                    placeholder="₹ Amount"
                                    min="0"
                                  />
                                  {(ed.prizePool || []).length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeEditorPrizeRow(slot._id, idx)}
                                      className="se-prize-remove"
                                    >
                                      <X size={14} />
                                    </button>
                                  )}
                                </div>
                              ))}
                              <button
                                type="button"
                                className="se-prize-add"
                                onClick={() => addEditorPrizeRow(slot._id)}
                              >
                                + Add Position
                              </button>
                            </div>

                            {/* Save Button */}
                            <button
                              className={`slot-editor-save-btn ${isSaved ? 'saved' : ''}`}
                              onClick={() => handleEditorSave(slot._id)}
                              disabled={isSaving}
                            >
                              {isSaving ? (
                                <>
                                  <div className="se-spinner" /> Saving…
                                </>
                              ) : isSaved ? (
                                <>
                                  <CheckCircle size={16} /> Saved!
                                </>
                              ) : (
                                <>
                                  <Save size={16} /> Save Changes
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── MODAL ── */}
      {showModal && (
        <div className="modal-overlay">
          <div className={`modal ${activeTab === 'slots' ? 'slot-modal' : ''}`}>
            <h3>{editingItem ? 'Edit' : 'Add'} {activeTab === 'rankings' ? 'Ranking' : activeTab === 'tournaments' ? 'Tournament' : 'Slot'}</h3>
            <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
              {activeTab === 'rankings' ? (
                <>
                  <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Rank</label>
                      <input type="number" value={formData.rank} onChange={e => setFormData({ ...formData, rank: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label>Team Name</label>
                      <input type="text" value={formData.teamName} onChange={e => setFormData({ ...formData, teamName: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label>Team Tag</label>
                      <input type="text" value={formData.teamTag} onChange={e => setFormData({ ...formData, teamTag: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Total Matches</label>
                      <input type="number" value={formData.totalMatches} onChange={e => setFormData({ ...formData, totalMatches: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Finishes</label>
                      <input type="number" value={formData.finishes} onChange={e => setFormData({ ...formData, finishes: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>WWCD</label>
                      <input type="number" value={formData.wwcd} onChange={e => setFormData({ ...formData, wwcd: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Total Points</label>
                      <input type="number" value={formData.totalPoints} onChange={e => setFormData({ ...formData, totalPoints: e.target.value })} />
                    </div>
                  </div>
                </>
              ) : activeTab === 'tournaments' ? (
                <div className="tournament-editor-layout">
                  <div className="tournament-editor-poster">
                    {formData.posterFile ? (
                      <img src={URL.createObjectURL(formData.posterFile)} alt="Tournament poster preview" />
                    ) : editingItem?.hasPoster ? (
                      <img src={`${apiUrl}/api/tournaments/${editingItem._id}/poster`} alt="Tournament poster" />
                    ) : (
                      <div><ImageIcon size={36} /><span>No poster yet</span></div>
                    )}
                    <label className="poster-upload-btn">
                      <Upload size={14} /> Upload Poster
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setFormData({ ...formData, posterFile: e.target.files[0] })} />
                    </label>
                    <p className="poster-hint">Max 5 MB · JPG / PNG / WEBP</p>
                  </div>
                  <div className="tournament-editor-fields">
                    <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group"><label>Event Title</label><input type="text" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} required /></div>
                      <div className="form-group"><label>Game</label><input type="text" value={formData.game || ''} onChange={e => setFormData({ ...formData, game: e.target.value })} /></div>
                      <div className="form-group"><label>Date</label><input type="text" placeholder="e.g. 25 Aug 2026" value={formData.date || ''} onChange={e => setFormData({ ...formData, date: e.target.value })} /></div>
                      <div className="form-group"><label>Location</label><input type="text" value={formData.location || ''} onChange={e => setFormData({ ...formData, location: e.target.value })} /></div>
                      <div className="form-group"><label>Prize Pool (₹)</label><input type="number" min="0" value={formData.prizePool ?? 0} onChange={e => setFormData({ ...formData, prizePool: e.target.value })} /></div>
                      <div className="form-group"><label>Entry Fee (₹)</label><input type="number" min="0" value={formData.entryFee ?? 0} onChange={e => setFormData({ ...formData, entryFee: e.target.value })} /></div>
                      <div className="form-group"><label>Status</label><select value={formData.status || 'UPCOMING'} onChange={e => setFormData({ ...formData, status: e.target.value })}><option value="OPEN">Open</option><option value="UPCOMING">Upcoming</option><option value="CLOSED">Closed</option></select></div>
                      <div className="form-group"><label>Registration</label><select value={formData.registrationOpen ? 'open' : 'closed'} onChange={e => setFormData({ ...formData, registrationOpen: e.target.value === 'open' })}><option value="open">Open</option><option value="closed">Closed</option></select></div>
                      <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Description</label><textarea rows="3" value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Short event details shown on the public page" /></div>
                    </div>
                  </div>
                </div>
              ) : editingItem ? (
                <>
                  <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Match Name</label>
                      <input type="text" value={formData.matchName || ''} onChange={e => setFormData({ ...formData, matchName: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label>Slot Time</label>
                      <input type="datetime-local" value={formData.slotTime || ''} onChange={e => setFormData({ ...formData, slotTime: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label>Room ID</label>
                      <input type="text" value={formData.roomId || ''} onChange={e => setFormData({ ...formData, roomId: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Room Password</label>
                      <input type="text" value={formData.roomPassword || ''} onChange={e => setFormData({ ...formData, roomPassword: e.target.value })} />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                        WhatsApp Group Link
                      </label>
                      <input
                        type="url"
                        value={formData.whatsappLink || ''}
                        onChange={e => setFormData({ ...formData, whatsappLink: e.target.value })}
                        placeholder="https://chat.whatsapp.com/..."
                      />
                      <small style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', marginTop: '0.25rem', display: 'block' }}>
                        Only visible to users with a paid booking for this slot.
                      </small>
                    </div>
                    <div className="form-group">
                      <label>Booking Price (₹)</label>
                      <input type="number" value={formData.price ?? 0} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} required min="0" />
                    </div>
                    <div className="form-group">
                      <label>Entry Fee (Display Only) (₹)</label>
                      <input type="number" value={formData.entryFee ?? 0} onChange={e => setFormData({ ...formData, entryFee: Number(e.target.value) })} required min="0" />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label>Max Teams</label>
                      <input type="number" value={formData.maxTeams ?? 20} onChange={e => setFormData({ ...formData, maxTeams: Number(e.target.value) })} required min="1" />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label>Slot Poster (Upload Image)</label>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={e => {
                          const file = e.target.files[0];
                          if (file) {
                            setFormData({ ...formData, heroImageFile: file });
                          }
                        }}
                        style={{ padding: '0.4rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', background: 'var(--bg-card)' }}
                      />
                      {formData.heroImageFile && (
                        <p style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.5rem' }}>✓ Image selected: {formData.heroImageFile.name}</p>
                      )}
                    </div>
                  </div>
                  <div className="prizes-list" style={{ marginTop: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--purple-light)' }}>PRIZE POOL</label>
                    {formData.prizePool?.map((prize, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', width: '30px' }}>#{prize.position}</span>
                        <input
                          type="number"
                          value={prize.amount}
                          placeholder="Amount"
                          onChange={e => handlePrizeChange(idx, 'amount', e.target.value)}
                          required
                          style={{ flex: 1 }}
                        />
                        {formData.prizePool.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePrizeRow(idx)}
                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '5px' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={addPrizeRow} className="tab-btn" style={{ fontSize: '0.7rem', padding: '0.4rem 1rem', marginTop: '0.5rem' }}>
                      + Add Position
                    </button>
                  </div>
                </>
              ) : (
                <div className="new-slot-layout">
                  <div className="new-slot-poster">
                    <label className="slot-editor-section-label"><ImageIcon size={14} /> Slot Poster</label>
                    {formData.heroImageFile ? (
                      <img src={URL.createObjectURL(formData.heroImageFile)} alt="New slot poster preview" className="poster-preview" />
                    ) : (
                      <div className="poster-placeholder"><ImageIcon size={32} style={{ opacity: 0.3 }} /><span>No poster yet</span></div>
                    )}
                    <label className="poster-upload-btn">
                      <Upload size={14} /> Upload Poster
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setFormData({ ...formData, heroImageFile: e.target.files[0] })} />
                    </label>
                    <p className="poster-hint">Max 5 MB · JPG / PNG / WEBP</p>
                  </div>
                  <div className="slot-editor-fields new-slot-fields">
                    <div className="slot-editor-fields-grid">
                      {[
                        ['matchName', 'Match Name', 'e.g. Rising Cup #12'],
                        ['date', 'Date', 'e.g. 25 Aug 2026'],
                        ['timing', 'Timing', 'e.g. 9:00 PM'],
                        ['mode', 'Mode', 'Squad / Duo / Solo'],
                        ['teams', 'Teams', 'e.g. 18-19 Teams'],
                        ['maps', 'Maps (comma separated)', 'Erangel, Miramar'],
                      ].map(([field, label, placeholder]) => (
                        <div className="se-field" key={field}>
                          <label>{label}</label>
                          <input type="text" value={formData[field] || ''} placeholder={placeholder} onChange={e => setFormData({ ...formData, [field]: e.target.value })} required={field === 'matchName'} />
                        </div>
                      ))}
                      <div className="se-field">
                        <label>Entry Fee (₹)</label>
                        <input type="number" min="0" value={formData.entryFee ?? 0} onChange={e => setFormData({ ...formData, entryFee: Number(e.target.value) })} required />
                      </div>
                      <div className="se-field" style={{ gridColumn: 'span 2' }}>
                        <label>ID / Password Note</label>
                        <input type="text" value={formData.note || ''} placeholder="e.g. Will be provided 30 min before match" onChange={e => setFormData({ ...formData, note: e.target.value })} />
                      </div>
                      <div className="se-field" style={{ gridColumn: 'span 2' }}>
                        <label className="whatsapp-label">WhatsApp Group Link</label>
                        <input type="url" value={formData.whatsappLink || ''} placeholder="https://chat.whatsapp.com/..." onChange={e => setFormData({ ...formData, whatsappLink: e.target.value })} />
                      </div>
                    </div>
                    <div className="se-prize-section">
                      <label className="slot-editor-section-label">🏆 Prize Pool</label>
                      {formData.prizePool?.map((prize, idx) => (
                        <div key={idx} className="se-prize-row">
                          <span className="se-prize-pos">#{prize.position}</span>
                          <input type="number" min="0" value={prize.amount} placeholder="Amount" onChange={e => handlePrizeChange(idx, 'amount', e.target.value)} required />
                          {formData.prizePool.length > 1 && <button type="button" onClick={() => removePrizeRow(idx)} className="se-prize-remove"><X size={14} /></button>}
                        </div>
                      ))}
                      <button type="button" onClick={addPrizeRow} className="se-prize-add">+ Add Position</button>
                    </div>
                  </div>
                </div>
              )}
              <div className="modal-footer">
                <button type="button" className="tab-btn cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="tab-btn active" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
