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
  CheckCircle,
  Megaphone,
  Swords,
  Send,
  Calendar,
  DollarSign,
  Check,
  CheckSquare,
  RefreshCw,
  Crosshair,
  Award,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Filter,
} from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('rankings');
  const [rankings, setRankings] = useState([]);
  const [slots, setSlots] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [matches, setMatches] = useState([]);
  const [matchResults, setMatchResults] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [walletSubTab, setWalletSubTab] = useState('deposits'); // 'deposits' | 'withdrawals' | 'all' | 'adjust'
  const [todaySlotsDate, setTodaySlotsDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [slotFormData, setSlotFormData] = useState({});
  const [slotEditTarget, setSlotEditTarget] = useState(null); // null = create, slot obj = edit
  const [depositFilter, setDepositFilter] = useState('pending'); // 'pending' | 'all'
  const [withdrawalFilter, setWithdrawalFilter] = useState('pending'); // 'pending' | 'all'
  const [txnSearchQuery, setTxnSearchQuery] = useState('');
  const [txnTypeFilter, setTxnTypeFilter] = useState('all');
  const [adjustFormData, setAdjustFormData] = useState({ userId: '', type: 'credit', amount: '', reason: '' });
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [syncingRankings, setSyncingRankings] = useState(false);
  const [resultsModal, setResultsModal] = useState(false);
  const [selectedMatchForResults, setSelectedMatchForResults] = useState(null);
  const [resultsFormData, setResultsFormData] = useState({
    matchName: '',
    date: new Date().toISOString().split('T')[0],
    timing: '9:00 PM',
    mode: 'Squad TPP',
  });
  const [teamResultsRows, setTeamResultsRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [bookingView, setBookingView] = useState('grouped'); // 'flat' | 'grouped'
  const [expandedSlots, setExpandedSlots] = useState({});
  const [paymentFilter, setPaymentFilter] = useState('pending'); // 'pending' | 'all'
  const [copiedUtr, setCopiedUtr] = useState(null);

  // ── Slot Editor state ──
  const [editorData, setEditorData] = useState({});
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
      const [rankRes, slotRes, bookingRes, tourRes, annRes, matchRes, resultsRes, wthRes, depRes, allTxnRes, usersRes] = await Promise.all([
        axios.get(`${apiUrl}/api/rankings`),
        axios.get(`${apiUrl}/api/slots/admin`, config).catch(() => axios.get(`${apiUrl}/api/slots`)),
        axios.get(`${apiUrl}/api/bookings`, config),
        axios.get(`${apiUrl}/api/tournaments`),
        axios.get(`${apiUrl}/api/announcements`, config).catch(() => ({ data: [] })),
        axios.get(`${apiUrl}/api/matches`).catch(() => ({ data: [] })),
        axios.get(`${apiUrl}/api/results/admin/all`, config).catch(() => ({ data: [] })),
        axios.get(`${apiUrl}/api/wallet/admin/withdrawals`, config).catch(() => ({ data: [] })),
        axios.get(`${apiUrl}/api/wallet/admin/deposits`, config).catch(() => ({ data: [] })),
        axios.get(`${apiUrl}/api/wallet/admin/all`, config).catch(() => ({ data: { transactions: [] } })),
        axios.get(`${apiUrl}/api/users/admin/all`, config).catch(() => ({ data: [] })),
      ]);
      setRankings(rankRes.data || []);
      setSlots(slotRes.data || []);
      setTournaments(tourRes.data || []);
      setBookings(bookingRes.data || []);
      setAnnouncements(annRes.data || []);
      setMatches(matchRes.data || []);
      setMatchResults(resultsRes.data || []);
      setWithdrawals(wthRes.data || []);
      setDeposits(depRes.data || []);
      setAllTransactions(allTxnRes.data?.transactions || allTxnRes.data || []);
      setAllUsers(usersRes.data || []);
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
        const matches = Array.isArray(s.scheduleMatches) && s.scheduleMatches.length > 0
          ? s.scheduleMatches
          : (s.timing ? [{ matchNumber: 1, label: 'MATCH 1', time: s.timing }] : [
              { matchNumber: 1, label: 'MATCH 1', time: '1:42 PM' },
              { matchNumber: 2, label: 'MATCH 2', time: '2:22 PM' },
              { matchNumber: 3, label: 'MATCH 3', time: '3:02 PM' }
            ]);

        const pDist = Array.isArray(s.prizeDistribution) && s.prizeDistribution.length > 0
          ? s.prizeDistribution
          : (Array.isArray(s.prizePool) && s.prizePool.length > 0
              ? s.prizePool.map(p => ({ rank: `#${p.position}`, prize: `₹${p.amount}` }))
              : [
                  { rank: '#1', prize: '₹400' },
                  { rank: '#2', prize: '₹150' },
                  { rank: '#3', prize: '₹100' },
                  { rank: '#4', prize: '₹70' },
                  { rank: '#5', prize: 'FREE' }
                ]);

        map[s._id] = {
          matchName: s.matchName || '',
          category: s.category || 'SCRIMS',
          lobby: s.lobby || 'LOBBY 1',
          date: s.date || '',
          timing: s.timing || '',
          mode: s.mode || 'Squad TPP',
          maxTeams: s.maxTeams ?? 19,
          teams: s.teams || '',
          maps: Array.isArray(s.maps) ? s.maps.join(', ') : (s.maps || 'ERANGEL, RONDO, MIRAMAR'),
          entryFee: s.entryFee ?? s.price ?? 60,
          price: s.price ?? s.entryFee ?? 60,
          scheduleMatches: matches,
          prizeDistribution: pDist,
          roomId: s.roomId || '',
          roomPassword: s.roomPassword || '',
          note: s.note || '',
          whatsappLink: s.whatsappLink || '',
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
      if (activeTab === 'slots') {
        const matches = Array.isArray(item.scheduleMatches) && item.scheduleMatches.length > 0
          ? item.scheduleMatches
          : (item.timing ? [{ matchNumber: 1, label: 'MATCH 1', time: item.timing }] : [
              { matchNumber: 1, label: 'MATCH 1', time: '1:42 PM' },
              { matchNumber: 2, label: 'MATCH 2', time: '2:22 PM' },
              { matchNumber: 3, label: 'MATCH 3', time: '3:02 PM' }
            ]);

        const pDist = Array.isArray(item.prizeDistribution) && item.prizeDistribution.length > 0
          ? item.prizeDistribution
          : (Array.isArray(item.prizePool) && item.prizePool.length > 0
              ? item.prizePool.map(p => ({ rank: `#${p.position}`, prize: `₹${p.amount}` }))
              : [
                  { rank: '#1', prize: '₹400' },
                  { rank: '#2', prize: '₹150' },
                  { rank: '#3', prize: '₹100' },
                  { rank: '#4', prize: '₹70' },
                  { rank: '#5', prize: 'FREE' }
                ]);

        setFormData({
          ...item,
          category: item.category || 'SCRIMS',
          lobby: item.lobby || 'LOBBY 1',
          matchName: item.matchName || '',
          date: item.date || '',
          timing: item.timing || '',
          entryFee: item.entryFee ?? item.price ?? 60,
          price: item.price ?? item.entryFee ?? 60,
          maxTeams: item.maxTeams ?? 19,
          maps: Array.isArray(item.maps) ? item.maps.join(', ') : (item.maps || 'ERANGEL, RONDO, MIRAMAR'),
          scheduleMatches: matches,
          prizeDistribution: pDist,
          roomId: item.roomId || '',
          roomPassword: item.roomPassword || '',
          note: item.note || '',
          whatsappLink: item.whatsappLink || '',
        });
      } else if (activeTab === 'announcements') {
        setFormData({
          title: item.title || '',
          content: item.content || '',
          isActive: item.isActive ?? true,
          priority: item.priority || 1,
          author: item.author || 'Admin',
        });
      } else if (activeTab === 'matches') {
        setFormData({
          matchName: item.matchName || '',
          date: item.date || new Date().toISOString().split('T')[0],
          timing: item.timing || '9:00 PM',
          mode: item.mode || 'Squad TPP',
          maps: Array.isArray(item.maps) ? item.maps.join(', ') : (item.maps || 'Erangel'),
          status: item.status || 'UPCOMING',
          totalTeams: item.totalTeams || 20,
          entryFee: item.entryFee || 0,
          prizePool: item.prizePool || 0,
          notes: item.notes || '',
        });
      } else if (activeTab === 'tournaments') {
        setFormData({ ...item });
      } else {
        setFormData({ ...item });
      }
    } else {
      if (activeTab === 'rankings') {
        setFormData({ rank: rankings.length + 1, teamName: '', teamTag: '', totalMatches: 0, finishes: 0, wwcd: 0, totalPoints: 0 });
      } else if (activeTab === 'announcements') {
        setFormData({ title: 'Official Announcement', content: '', isActive: true, priority: 1, author: 'Rising Admin' });
      } else if (activeTab === 'matches') {
        setFormData({
          matchName: '',
          date: new Date().toISOString().split('T')[0],
          timing: '9:00 PM',
          mode: 'Squad TPP',
          maps: 'Erangel, Miramar',
          status: 'UPCOMING',
          totalTeams: 20,
          entryFee: 0,
          prizePool: 0,
          notes: '',
        });
      } else if (activeTab === 'tournaments') {
        setFormData({
          title: '', game: 'BGMI', date: '', location: 'ONLINE TOURNAMENT', prizePool: 0,
          entryFee: 0, status: 'UPCOMING', registrationOpen: false, description: '',
        });
      } else if (activeTab === 'slots') {
        setFormData({
          category: 'SCRIMS',
          lobby: 'LOBBY 1',
          matchName: 'RISING 1-3 GRIND SCRIMS',
          date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          timing: '1:42 PM',
          mode: 'Squad TPP',
          entryFee: 60,
          price: 60,
          maxTeams: 19,
          maps: 'ERANGEL, RONDO, MIRAMAR',
          scheduleMatches: [
            { matchNumber: 1, label: 'MATCH 1', time: '1:42 PM' },
            { matchNumber: 2, label: 'MATCH 2', time: '2:22 PM' },
            { matchNumber: 3, label: 'MATCH 3', time: '3:02 PM' }
          ],
          prizeDistribution: [
            { rank: '#1', prize: '₹400' },
            { rank: '#2', prize: '₹150' },
            { rank: '#3', prize: '₹100' },
            { rank: '#4', prize: '₹70' },
            { rank: '#5', prize: 'FREE' }
          ],
          roomId: '',
          roomPassword: '',
          note: 'ID / Pass will be provided 30 min before match',
          whatsappLink: '',
        });
      } else {
        setFormData({
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
    }
    setShowModal(true);
  };

  const handleSyncRankings = async () => {
    setSyncingRankings(true);
    try {
      await axios.post(`${apiUrl}/api/results/sync-rankings`, {}, config);
      await fetchData();
      alert('Team Rankings successfully recalculated from all match results!');
    } catch (err) {
      alert('Sync failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setSyncingRankings(false);
    }
  };

  const handleWithdrawalAction = async (id, status) => {
    let note = '';
    if (status === 'rejected') {
      note = prompt('Enter rejection reason (funds will be refunded to user wallet):');
      if (note === null) return;
    }

    try {
      await axios.put(`${apiUrl}/api/wallet/admin/withdrawals/${id}`, { status, notes: note }, config);
      await fetchData();
      alert(`Withdrawal marked as ${status}!`);
    } catch (err) {
      alert('Action failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDepositAction = async (id, status) => {
    let note = '';
    if (status === 'rejected') {
      note = prompt('Enter rejection reason (e.g. UTR not found / Payment not received):');
      if (note === null) return;
    }

    try {
      const { data } = await axios.put(`${apiUrl}/api/wallet/admin/deposits/${id}/verify`, { status, notes: note }, config);
      await fetchData();
      alert(data?.message || `Deposit marked as ${status}!`);
    } catch (err) {
      alert('Deposit action failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleAdjustBalanceSubmit = async (e) => {
    e.preventDefault();
    if (!adjustFormData.userId) {
      alert('Please select a player to adjust balance.');
      return;
    }
    const amt = Number(adjustFormData.amount);
    if (!amt || amt <= 0) {
      alert('Please enter a valid positive amount.');
      return;
    }

    setAdjustLoading(true);
    try {
      const { data } = await axios.post(
        `${apiUrl}/api/wallet/admin/adjust-balance`,
        {
          userId: adjustFormData.userId,
          type: adjustFormData.type,
          amount: amt,
          reason: adjustFormData.reason.trim(),
        },
        config
      );
      alert(data.message || 'Balance adjusted successfully!');
      setAdjustFormData({ userId: '', type: 'credit', amount: '', reason: '' });
      await fetchData();
    } catch (err) {
      alert('Adjustment failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setAdjustLoading(false);
    }
  };

  const handleVerifyPayment = async (bookingId, status) => {
    let note = '';
    if (status === 'failed') {
      note = prompt('Enter rejection note (optional):');
      if (note === null) return;
    }

    try {
      await axios.put(`${apiUrl}/api/bookings/${bookingId}/verify`, { status, note }, config);
      await fetchData();
      alert(`Payment ${status === 'paid' ? 'approved' : 'rejected'} successfully!`);
    } catch (err) {
      alert('Action failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const copyUtr = (utr) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(utr);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  const handleOpenResultsModal = (match = null) => {
    setSelectedMatchForResults(match);
    const initialMatchName = match ? match.matchName : '';
    const initialDate = match ? match.date : new Date().toISOString().split('T')[0];
    const initialTiming = match ? match.timing : '9:00 PM';
    const initialMode = match ? match.mode : 'Squad TPP';

    setResultsFormData({
      matchName: initialMatchName,
      date: initialDate,
      timing: initialTiming,
      mode: initialMode,
    });

    const defaultPointsTable = { 1: 10, 2: 6, 3: 5, 4: 4, 5: 3, 6: 2, 7: 1, 8: 1 };
    const defaultRows = Array.from({ length: 16 }, (_, i) => {
      const pos = i + 1;
      const placementPts = defaultPointsTable[pos] || 0;
      return {
        position: pos,
        teamName: '',
        teamTag: '',
        kills: 0,
        placementPoints: placementPts,
        totalPoints: placementPts,
      };
    });
    setTeamResultsRows(defaultRows);
    setResultsModal(true);
  };

  const handleTeamRowChange = (index, field, value) => {
    setTeamResultsRows(prev => {
      const copy = [...prev];
      const row = { ...copy[index], [field]: value };
      if (field === 'kills' || field === 'placementPoints') {
        const kills = field === 'kills' ? Number(value || 0) : Number(row.kills || 0);
        const placement = field === 'placementPoints' ? Number(value || 0) : Number(row.placementPoints || 0);
        row.totalPoints = placement + kills;
      }
      copy[index] = row;
      return copy;
    });
  };

  const handleSaveMatchResults = async (e) => {
    e.preventDefault();
    if (!resultsFormData.matchName || !resultsFormData.date) {
      alert('Match Name and Date are required');
      return;
    }

    const validRows = teamResultsRows.filter(r => r.teamName && r.teamName.trim());
    if (validRows.length === 0) {
      alert('Please fill in at least 1 team name');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(`${apiUrl}/api/results`, {
        matchId: selectedMatchForResults?._id || null,
        matchName: resultsFormData.matchName.trim(),
        date: resultsFormData.date.trim(),
        timing: resultsFormData.timing.trim(),
        mode: resultsFormData.mode.trim(),
        results: validRows,
        isPublished: true,
      }, config);

      await fetchData();
      setResultsModal(false);
      alert('Match Results published successfully! Team rankings have been synced automatically.');
    } catch (err) {
      alert('Failed to save results: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      let payload;
      if (activeTab === 'slots') {
        payload = {
          ...formData,
          category: formData.category || 'SCRIMS',
          lobby: formData.lobby || 'LOBBY 1',
          price: Number(formData.price ?? formData.entryFee ?? 0),
          entryFee: Number(formData.entryFee ?? formData.price ?? 0),
          maxTeams: Number(formData.maxTeams ?? 19),
          maps: typeof formData.maps === 'string'
            ? formData.maps.split(',').map(map => map.trim().toUpperCase()).filter(Boolean)
            : formData.maps || ['ERANGEL', 'RONDO', 'MIRAMAR'],
          scheduleMatches: formData.scheduleMatches || [],
          prizeDistribution: formData.prizeDistribution || [],
        };
      } else if (activeTab === 'tournaments') {
        payload = { ...formData, prizePool: Number(formData.prizePool || 0), entryFee: Number(formData.entryFee || 0) };
      } else if (activeTab === 'matches') {
        payload = {
          ...formData,
          maps: typeof formData.maps === 'string'
            ? formData.maps.split(',').map(m => m.trim()).filter(Boolean)
            : formData.maps || ['Erangel'],
          totalTeams: Number(formData.totalTeams || 20),
          entryFee: Number(formData.entryFee || 0),
          prizePool: Number(formData.prizePool || 0),
        };
      } else {
        payload = formData;
      }
      delete payload.heroImageFile;

      let savedId;
      if (editingItem) {
        await axios.put(`${apiUrl}/api/${activeTab}/${editingItem._id}`, payload, config);
        savedId = editingItem._id;
      } else {
        const res = await axios.post(`${apiUrl}/api/${activeTab}`, payload, config);
        savedId = res.data._id;
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
        const resource = (activeTab === 'slots' || activeTab === 'todayslots') ? 'slots' : activeTab;
        await axios.delete(`${apiUrl}/api/${resource}/${id}`, config);

        if (resource === 'slots') {
          setSlots(currentSlots => currentSlots.filter(slot => slot._id !== id));
          setEditorData(currentData => {
            const nextData = { ...currentData };
            delete nextData[id];
            return nextData;
          });
        } else if (resource === 'tournaments') {
          setTournaments(current => current.filter(tournament => tournament._id !== id));
        }
        await fetchData();
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
    if (status === 'pending_verification') return { background: 'rgba(234,179,8,0.2)', color: '#f59e0b', border: '1px solid rgba(234,179,8,0.4)' };
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

  const handleEditorScheduleChange = (slotId, idx, field, value) => {
    setEditorData(prev => {
      const updated = { ...prev };
      const matches = [...(updated[slotId]?.scheduleMatches || [])];
      matches[idx] = { ...matches[idx], [field]: value };
      updated[slotId] = { ...updated[slotId], scheduleMatches: matches };
      return updated;
    });
  };

  const addEditorScheduleMatch = (slotId) => {
    setEditorData(prev => {
      const matches = [...(prev[slotId]?.scheduleMatches || [])];
      const nextNum = matches.length + 1;
      matches.push({ matchNumber: nextNum, label: `MATCH ${nextNum}`, time: '' });
      return { ...prev, [slotId]: { ...prev[slotId], scheduleMatches: matches } };
    });
  };

  const removeEditorScheduleMatch = (slotId, idx) => {
    setEditorData(prev => {
      const matches = (prev[slotId]?.scheduleMatches || []).filter((_, i) => i !== idx)
        .map((m, i) => ({ ...m, matchNumber: i + 1, label: `MATCH ${i + 1}` }));
      return { ...prev, [slotId]: { ...prev[slotId], scheduleMatches: matches } };
    });
  };

  const handleEditorPrizeDistChange = (slotId, idx, field, value) => {
    setEditorData(prev => {
      const updated = { ...prev };
      const dist = [...(updated[slotId]?.prizeDistribution || [])];
      dist[idx] = { ...dist[idx], [field]: value };
      updated[slotId] = { ...updated[slotId], prizeDistribution: dist };
      return updated;
    });
  };

  const addEditorPrizeDistRow = (slotId) => {
    setEditorData(prev => {
      const dist = [...(prev[slotId]?.prizeDistribution || [])];
      const nextRank = `#${dist.length + 1}`;
      dist.push({ rank: nextRank, prize: '₹0' });
      return { ...prev, [slotId]: { ...prev[slotId], prizeDistribution: dist } };
    });
  };

  const removeEditorPrizeDistRow = (slotId, idx) => {
    setEditorData(prev => {
      const dist = (prev[slotId]?.prizeDistribution || []).filter((_, i) => i !== idx);
      return { ...prev, [slotId]: { ...prev[slotId], prizeDistribution: dist } };
    });
  };

  const handleModalScheduleChange = (idx, field, value) => {
    setFormData(prev => {
      const matches = [...(prev.scheduleMatches || [])];
      matches[idx] = { ...matches[idx], [field]: value };
      return { ...prev, scheduleMatches: matches };
    });
  };

  const addModalScheduleMatch = () => {
    setFormData(prev => {
      const matches = [...(prev.scheduleMatches || [])];
      const nextNum = matches.length + 1;
      matches.push({ matchNumber: nextNum, label: `MATCH ${nextNum}`, time: '' });
      return { ...prev, scheduleMatches: matches };
    });
  };

  const removeModalScheduleMatch = (idx) => {
    setFormData(prev => {
      const matches = (prev.scheduleMatches || []).filter((_, i) => i !== idx)
        .map((m, i) => ({ ...m, matchNumber: i + 1, label: `MATCH ${i + 1}` }));
      return { ...prev, scheduleMatches: matches };
    });
  };

  const handleModalPrizeDistChange = (idx, field, value) => {
    setFormData(prev => {
      const dist = [...(prev.prizeDistribution || [])];
      dist[idx] = { ...dist[idx], [field]: value };
      return { ...prev, prizeDistribution: dist };
    });
  };

  const addModalPrizeDistRow = () => {
    setFormData(prev => {
      const dist = [...(prev.prizeDistribution || [])];
      const nextRank = `#${dist.length + 1}`;
      dist.push({ rank: nextRank, prize: '₹0' });
      return { ...prev, prizeDistribution: dist };
    });
  };

  const removeModalPrizeDistRow = (idx) => {
    setFormData(prev => {
      const dist = (prev.prizeDistribution || []).filter((_, i) => i !== idx);
      return { ...prev, prizeDistribution: dist };
    });
  };

  const handleSlotPrizeDistChange = (idx, field, value) => {
    setSlotFormData(prev => {
      const dist = [...(prev.prizeDistribution || [])];
      dist[idx] = { ...dist[idx], [field]: value };
      return { ...prev, prizeDistribution: dist };
    });
  };

  const addSlotPrizeDistRow = () => {
    setSlotFormData(prev => {
      const dist = [...(prev.prizeDistribution || [])];
      const nextRank = `#${dist.length + 1}`;
      dist.push({ rank: nextRank, prize: '₹0' });
      return { ...prev, prizeDistribution: dist };
    });
  };

  const removeSlotPrizeDistRow = (idx) => {
    setSlotFormData(prev => {
      const dist = (prev.prizeDistribution || []).filter((_, i) => i !== idx);
      return { ...prev, prizeDistribution: dist };
    });
  };

  const setSlotPrizePreset = (preset) => {
    if (preset === 'top3') {
      setSlotFormData(prev => ({
        ...prev,
        prizeDistribution: [
          { rank: '#1', prize: '₹400' },
          { rank: '#2', prize: '₹150' },
          { rank: '#3', prize: '₹100' },
        ],
      }));
    } else if (preset === 'top5') {
      setSlotFormData(prev => ({
        ...prev,
        prizeDistribution: [
          { rank: '#1', prize: '₹400' },
          { rank: '#2', prize: '₹150' },
          { rank: '#3', prize: '₹100' },
          { rank: '#4', prize: '₹70' },
          { rank: '#5', prize: 'FREE' },
        ],
      }));
    } else if (preset === 'winner') {
      setSlotFormData(prev => ({
        ...prev,
        prizeDistribution: [
          { rank: '#1', prize: '₹500' },
        ],
      }));
    }
  };

  const handleEditorSave = async (slotId) => {
    setEditorSaving(prev => ({ ...prev, [slotId]: true }));
    try {
      const data = editorData[slotId];
      const payload = {
        ...data,
        category: data.category || 'SCRIMS',
        lobby: data.lobby || 'LOBBY 1',
        entryFee: Number(data.entryFee ?? data.price ?? 0),
        price: Number(data.price ?? data.entryFee ?? 0),
        maxTeams: Number(data.maxTeams ?? 19),
        maps: typeof data.maps === 'string'
          ? data.maps.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
          : data.maps,
        scheduleMatches: data.scheduleMatches || [],
        prizeDistribution: data.prizeDistribution || [],
      };

      await axios.put(`${apiUrl}/api/slots/${slotId}`, payload, config);
      await fetchData();

      setEditorSaved(prev => ({ ...prev, [slotId]: true }));
      setTimeout(() => setEditorSaved(prev => ({ ...prev, [slotId]: false })), 2500);

    } catch (err) {
      console.error('Save error', err);
      alert('Failed to save: ' + (err.response?.data?.message || err.message));
    } finally {
      setEditorSaving(prev => ({ ...prev, [slotId]: false }));
    }
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
          className={`tab-btn ${activeTab === 'todayslots' ? 'active' : ''}`}
          onClick={() => setActiveTab('todayslots')}
          style={{ background: activeTab === 'todayslots' ? 'rgba(16,185,129,0.15)' : '', borderColor: activeTab === 'todayslots' ? '#10b981' : '' }}
        >
          <Calendar size={18} style={{ marginRight: '8px', color: '#10b981' }} /> Today Slots
          {(() => {
            const todayIso = new Date().toISOString().split('T')[0];
            const todayCount = slots.filter(s => s.date && String(s.date).includes(todayIso)).length;
            return todayCount > 0 ? (
              <span className="tab-counter-badge" style={{ background: '#10b981' }}>{todayCount}</span>
            ) : null;
          })()}
        </button>
        <button
          className={`tab-btn ${activeTab === 'announcements' ? 'active' : ''}`}
          onClick={() => setActiveTab('announcements')}
        >
          <Megaphone size={18} style={{ marginRight: '8px' }} /> Announcements
        </button>
        <button
          className={`tab-btn ${activeTab === 'matches' ? 'active' : ''}`}
          onClick={() => setActiveTab('matches')}
        >
          <Swords size={18} style={{ marginRight: '8px' }} /> Matches
        </button>
        <button
          className={`tab-btn ${activeTab === 'results' ? 'active' : ''}`}
          onClick={() => setActiveTab('results')}
        >
          <Award size={18} style={{ marginRight: '8px' }} /> Results
        </button>
        <button
          className={`tab-btn ${activeTab === 'rankings' ? 'active' : ''}`}
          onClick={() => setActiveTab('rankings')}
        >
          <Trophy size={18} style={{ marginRight: '8px' }} /> Rankings
        </button>
        <button
          className={`tab-btn ${activeTab === 'wallet' || activeTab === 'withdrawals' || activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => { setActiveTab('wallet'); setWalletSubTab('deposits'); }}
        >
          <CreditCard size={18} style={{ marginRight: '8px' }} /> Wallet &amp; Txns
          {(deposits.filter(d => d.status === 'pending' || d.status === 'pending_verification').length + withdrawals.filter(w => w.status === 'pending').length) > 0 && (
            <span className="tab-counter-badge" style={{ background: '#f59e0b' }}>
              {deposits.filter(d => d.status === 'pending' || d.status === 'pending_verification').length + withdrawals.filter(w => w.status === 'pending').length}
            </span>
          )}
        </button>
        <button
          className={`tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          <CheckSquare size={18} style={{ marginRight: '8px' }} /> Slot Payments
          {bookings.filter(b => b.paymentStatus === 'pending_verification').length > 0 && (
            <span className="tab-counter-badge" style={{ background: '#f59e0b' }}>
              {bookings.filter(b => b.paymentStatus === 'pending_verification').length}
            </span>
          )}
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
            {activeTab === 'rankings' ? 'Manage Team Rankings'
              : activeTab === 'slots' ? 'Manage Slots'
              : activeTab === 'todayslots' ? `Today Slots — ${new Date(todaySlotsDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`
              : activeTab === 'announcements' ? 'Manage Announcements'
              : activeTab === 'matches' ? 'Manage Scrims & Matches'
              : activeTab === 'results' ? 'Manage Scrim Results'
              : (activeTab === 'wallet' || activeTab === 'withdrawals' || activeTab === 'transactions') ? 'Wallet & Transaction Management'
              : activeTab === 'tournaments' ? 'Manage Tournaments'
              : activeTab === 'payments' ? 'UPI Slot Payments Verification'
              : 'Manage Bookings'}
          </h2>

          {activeTab === 'payments' ? (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className={`tab-btn ${paymentFilter === 'pending' ? 'active' : ''}`}
                onClick={() => setPaymentFilter('pending')}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}
              >
                Pending Verification ({bookings.filter(b => b.paymentStatus === 'pending_verification').length})
              </button>
              <button
                className={`tab-btn ${paymentFilter === 'all' ? 'active' : ''}`}
                onClick={() => setPaymentFilter('all')}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}
              >
                All UPI Payments
              </button>
            </div>
          ) : activeTab === 'bookings' ? (
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
          ) : activeTab === 'rankings' ? (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="action-btn"
                onClick={handleSyncRankings}
                disabled={syncingRankings}
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                title="Automatically calculate team rankings from all published match results"
              >
                <RefreshCw size={15} className={syncingRankings ? 'is-spinning' : ''} />
                {syncingRankings ? 'Syncing...' : 'Sync from Results'}
              </button>
              <button className="action-btn" onClick={() => handleOpenModal()}>
                <Plus size={18} /> Add Team
              </button>
            </div>
          ) : activeTab === 'results' ? (
            <button className="action-btn" onClick={() => handleOpenResultsModal()}>
              <Plus size={18} /> Enter Match Results
            </button>
          ) : activeTab === 'announcements' ? (
            <button className="action-btn" onClick={() => handleOpenModal()}>
              <Plus size={18} /> New Announcement
            </button>
          ) : activeTab === 'matches' ? (
            <button className="action-btn" onClick={() => handleOpenModal()}>
              <Plus size={18} /> Add Match
            </button>
          ) : (activeTab === 'wallet' || activeTab === 'withdrawals' || activeTab === 'transactions') ? null
          : activeTab === 'todayslots' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Date:</label>
                <input
                  type="date"
                  value={todaySlotsDate}
                  onChange={(e) => setTodaySlotsDate(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(139,92,246,0.35)', borderRadius: '7px', color: '#fff', padding: '0.35rem 0.7rem', fontSize: '0.82rem', cursor: 'pointer' }}
                />
              </div>
              <button className="action-btn" style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid #10b981', color: '#10b981', fontSize: '0.8rem', padding: '0.35rem 0.8rem' }} onClick={() => setTodaySlotsDate(new Date().toISOString().split('T')[0])}>
                Today
              </button>
              <button className="action-btn" style={{ fontSize: '0.8rem', padding: '0.35rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={() => {
                const todayStr = todaySlotsDate;
                setSlotEditTarget(null);
                setSlotFormData({ category: 'SCRIMS', lobby: 'LOBBY 1', matchName: 'RISING 1-3 GRIND SCRIMS', date: todayStr, timing: '1:42 PM', mode: 'Squad TPP', entryFee: 60, price: 60, maxTeams: 19, maps: 'ERANGEL, RONDO, MIRAMAR', scheduleMatches: [{ matchNumber: 1, label: 'MATCH 1', time: '1:42 PM' }, { matchNumber: 2, label: 'MATCH 2', time: '2:22 PM' }, { matchNumber: 3, label: 'MATCH 3', time: '3:02 PM' }], prizeDistribution: [{ rank: '#1', prize: '₹400' }, { rank: '#2', prize: '₹150' }, { rank: '#3', prize: '₹100' }, { rank: '#4', prize: '₹70' }, { rank: '#5', prize: 'FREE' }], roomId: '', roomPassword: '', note: 'ID / Pass will be provided 30 min before match', whatsappLink: '' });
                setShowSlotModal(true);
              }}>
                <Plus size={15} /> Create Slot
              </button>
              <button className="action-btn" onClick={() => fetchData()} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.35rem 0.8rem', background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.5)' }}>
                <RefreshCw size={14} /> Refresh
              </button>
            </div>
          ) : activeTab === 'slots' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Calendar size={14} />
                Configure category, lobby, schedule matches, prize pool &amp; credentials
              </div>
              <button className="action-btn" onClick={() => handleOpenModal()}>
                <Plus size={18} /> Add New Slot
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

            {/* ── ANNOUNCEMENTS ── */}
            {activeTab === 'announcements' && (
              <div className="rankings-table-wrapper">
                {announcements.length === 0 ? (
                  <div className="empty-state" style={{ padding: '2rem', textAlign: 'center' }}>
                    <p>No announcements created yet. Click "New Announcement" above to broadcast to players.</p>
                  </div>
                ) : (
                  <table className="rankings-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Content</th>
                        <th>Author</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {announcements.map(item => (
                        <tr key={item._id}>
                          <td><strong>{item.title}</strong></td>
                          <td style={{ maxWidth: '350px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.content}
                          </td>
                          <td>{item.author || 'Admin'}</td>
                          <td>
                            <span className={`wallet-badge ${item.isActive ? 'badge-success' : 'badge-failed'}`}>
                              {item.isActive ? 'Active' : 'Hidden'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button className="action-btn edit-btn" onClick={() => handleOpenModal(item)}><Edit2 size={14} /></button>
                              <button className="action-btn delete-btn" onClick={() => handleDelete(item._id)}><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* ── MATCHES ── */}
            {activeTab === 'matches' && (
              <div className="rankings-table-wrapper">
                {matches.length === 0 ? (
                  <div className="empty-state" style={{ padding: '2rem', textAlign: 'center' }}>
                    <p>No matches added yet. Click "Add Match" to schedule your first scrim.</p>
                  </div>
                ) : (
                  <table className="rankings-table">
                    <thead>
                      <tr>
                        <th>Match Name</th>
                        <th>Date &amp; Timing</th>
                        <th>Mode / Map</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matches.map(m => (
                        <tr key={m._id}>
                          <td><strong>{m.matchName}</strong></td>
                          <td>{m.date} · {m.timing}</td>
                          <td>{m.mode} ({Array.isArray(m.maps) ? m.maps.join(', ') : m.maps})</td>
                          <td>
                            <span className={`match-status-badge badge-${(m.status || 'upcoming').toLowerCase()}`}>
                              {m.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                className="action-btn"
                                style={{ background: 'var(--purple-dark)', fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                                onClick={() => handleOpenResultsModal(m)}
                                title="Enter results for this match"
                              >
                                <Award size={13} style={{ marginRight: '4px' }} /> Results
                              </button>
                              <button className="action-btn edit-btn" onClick={() => handleOpenModal(m)}><Edit2 size={14} /></button>
                              <button className="action-btn delete-btn" onClick={() => handleDelete(m._id)}><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* ── RESULTS ── */}
            {activeTab === 'results' && (
              <div className="rankings-table-wrapper">
                {matchResults.length === 0 ? (
                  <div className="empty-state" style={{ padding: '2rem', textAlign: 'center' }}>
                    <p>No match results published yet. Click "Enter Match Results" to record scrim winners and kills.</p>
                  </div>
                ) : (
                  <table className="rankings-table">
                    <thead>
                      <tr>
                        <th>Match Name</th>
                        <th>Date</th>
                        <th>WWCD Winner (#1)</th>
                        <th>Teams Count</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matchResults.map(res => (
                        <tr key={res._id}>
                          <td><strong>{res.matchName}</strong></td>
                          <td>{res.date} {res.timing ? `· ${res.timing}` : ''}</td>
                          <td style={{ color: '#fbbf24', fontWeight: 'bold' }}>
                            🏆 {res.results?.[0]?.teamName || 'N/A'}
                          </td>
                          <td>{res.results?.length || 0} Teams</td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                className="action-btn delete-btn"
                                onClick={async () => {
                                  if (window.confirm('Delete this match result? Rankings will be recalculated.')) {
                                    try {
                                      await axios.delete(`${apiUrl}/api/results/${res._id}`, config);
                                      await fetchData();
                                    } catch (e) {
                                      alert('Failed: ' + e.message);
                                    }
                                  }
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* ── WALLET & TRANSACTIONS MANAGEMENT ── */}
            {(activeTab === 'transactions' || activeTab === 'wallet' || activeTab === 'withdrawals') && (
              <div>
                {/* Sub-Navigation Buttons */}
                <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.5rem', flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.8rem' }}>
                  <button
                    className={`tab-btn ${walletSubTab === 'deposits' ? 'active' : ''}`}
                    onClick={() => setWalletSubTab('deposits')}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', padding: '0.45rem 1rem' }}
                  >
                    <ArrowDownLeft size={16} style={{ color: '#10b981' }} />
                    Deposit Verifications
                    {deposits.filter(d => d.status === 'pending' || d.status === 'pending_verification').length > 0 && (
                      <span className="tab-counter-badge" style={{ background: '#10b981', color: '#fff' }}>
                        {deposits.filter(d => d.status === 'pending' || d.status === 'pending_verification').length}
                      </span>
                    )}
                  </button>

                  <button
                    className={`tab-btn ${walletSubTab === 'withdrawals' ? 'active' : ''}`}
                    onClick={() => setWalletSubTab('withdrawals')}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', padding: '0.45rem 1rem' }}
                  >
                    <ArrowUpRight size={16} style={{ color: '#ef4444' }} />
                    Withdrawals
                    {withdrawals.filter(w => w.status === 'pending').length > 0 && (
                      <span className="tab-counter-badge" style={{ background: '#ef4444', color: '#fff' }}>
                        {withdrawals.filter(w => w.status === 'pending').length}
                      </span>
                    )}
                  </button>

                  <button
                    className={`tab-btn ${walletSubTab === 'all' ? 'active' : ''}`}
                    onClick={() => setWalletSubTab('all')}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', padding: '0.45rem 1rem' }}
                  >
                    <LayoutList size={16} />
                    All Transactions Ledger ({allTransactions.length})
                  </button>

                  <button
                    className={`tab-btn ${walletSubTab === 'adjust' ? 'active' : ''}`}
                    onClick={() => setWalletSubTab('adjust')}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', padding: '0.45rem 1rem' }}
                  >
                    <Plus size={16} style={{ color: '#38bdf8' }} />
                    Adjust User Balance
                  </button>
                </div>

                {/* ── SUB-TAB 1: DEPOSITS VERIFICATION ── */}
                {walletSubTab === 'deposits' && (
                  <div>
                    {/* Filters bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className={`tab-btn ${depositFilter === 'pending' ? 'active' : ''}`}
                          onClick={() => setDepositFilter('pending')}
                          style={{ fontSize: '0.78rem', padding: '0.35rem 0.8rem' }}
                        >
                          Pending Verification ({deposits.filter(d => d.status === 'pending' || d.status === 'pending_verification').length})
                        </button>
                        <button
                          className={`tab-btn ${depositFilter === 'all' ? 'active' : ''}`}
                          onClick={() => setDepositFilter('all')}
                          style={{ fontSize: '0.78rem', padding: '0.35rem 0.8rem' }}
                        >
                          All Deposits ({deposits.length})
                        </button>
                      </div>
                      <button
                        className="action-btn"
                        onClick={() => fetchData()}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', padding: '0.35rem 0.8rem' }}
                      >
                        <RefreshCw size={13} /> Refresh
                      </button>
                    </div>

                    {(() => {
                      const filteredDeposits = deposits.filter(d => {
                        if (depositFilter === 'pending') {
                          return d.status === 'pending' || d.status === 'pending_verification';
                        }
                        return true;
                      });

                      if (filteredDeposits.length === 0) {
                        return (
                          <div className="empty-state" style={{ padding: '3rem', textAlign: 'center' }}>
                            <CheckCircle size={48} style={{ color: '#10b981', margin: '0 auto 1rem', display: 'block' }} />
                            <h3>{depositFilter === 'pending' ? 'No Pending Wallet Deposits' : 'No Deposits Found'}</h3>
                            <p style={{ color: 'var(--text-secondary)' }}>
                              {depositFilter === 'pending'
                                ? 'All player deposit requests have been verified and processed.'
                                : 'Player deposits will appear here once submitted.'}
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div className="rankings-table-wrapper">
                          <table className="rankings-table">
                            <thead>
                              <tr>
                                <th>Reg #</th>
                                <th>Player / Team</th>
                                <th>Amount</th>
                                <th>UTR / Ref Number</th>
                                <th>Submitted Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredDeposits.map(d => (
                                <tr key={d._id}>
                                  <td>
                                    <span style={{
                                      fontWeight: 'bold', fontFamily: 'monospace', fontSize: '0.9rem',
                                      color: 'var(--purple-light)', background: 'rgba(139,92,246,0.12)',
                                      padding: '0.15rem 0.5rem', borderRadius: '4px'
                                    }}>
                                      #{d.userId?.registrationNumber ?? '—'}
                                    </span>
                                  </td>
                                  <td>
                                    <div style={{ fontWeight: 'bold' }}>{d.userId?.teamName || 'Player'}</div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{d.userId?.phone}</div>
                                  </td>
                                  <td style={{ fontWeight: 'bold', color: '#10b981', fontSize: '1.05rem' }}>
                                    +₹{d.amount}
                                  </td>
                                  <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                      <code style={{
                                        fontFamily: 'monospace', fontSize: '0.88rem',
                                        background: 'rgba(234,179,8,0.15)', color: '#fbbf24',
                                        padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 'bold'
                                      }}>
                                        {d.utrNumber || d.transactionId}
                                      </code>
                                      {d.utrNumber && (
                                        <button
                                          onClick={() => copyUtr(d.utrNumber)}
                                          style={{
                                            background: copiedUtr === d.utrNumber ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.08)',
                                            border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px',
                                            color: copiedUtr === d.utrNumber ? '#4ade80' : '#cbd5e1',
                                            fontSize: '0.68rem', padding: '0.15rem 0.4rem', cursor: 'pointer'
                                          }}
                                        >
                                          {copiedUtr === d.utrNumber ? 'Copied' : 'Copy'}
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                  <td style={{ fontSize: '0.8rem' }}>
                                    {new Date(d.createdAt).toLocaleString('en-IN')}
                                  </td>
                                  <td>
                                    <span style={{
                                      padding: '0.2rem 0.55rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 'bold',
                                      ...(d.status === 'success'
                                        ? { background: 'rgba(34,197,94,0.15)', color: '#22c55e' }
                                        : (d.status === 'pending' || d.status === 'pending_verification')
                                          ? { background: 'rgba(234,179,8,0.2)', color: '#f59e0b', border: '1px solid rgba(234,179,8,0.4)' }
                                          : { background: 'rgba(239,68,68,0.15)', color: '#ef4444' })
                                    }}>
                                      {d.status === 'pending_verification' ? 'PENDING VERIFY' : d.status.toUpperCase()}
                                    </span>
                                  </td>
                                  <td>
                                    {(d.status === 'pending' || d.status === 'pending_verification') ? (
                                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                                        <button
                                          className="action-btn"
                                          style={{ background: '#10b981', padding: '0.35rem 0.75rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                          onClick={() => handleDepositAction(d._id, 'success')}
                                          title="Verify payment and credit balance"
                                        >
                                          <Check size={14} /> Approve &amp; Credit
                                        </button>
                                        <button
                                          className="action-btn delete-btn"
                                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                          onClick={() => handleDepositAction(d._id, 'rejected')}
                                          title="Reject deposit"
                                        >
                                          <X size={14} /> Reject
                                        </button>
                                      </div>
                                    ) : (
                                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        {d.verifiedBy ? `By: ${d.verifiedBy}` : 'Processed'}
                                        {d.rejectionReason && <div style={{ color: '#ef4444', fontSize: '0.7rem' }}>Reason: {d.rejectionReason}</div>}
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* ── SUB-TAB 2: WITHDRAWALS ── */}
                {walletSubTab === 'withdrawals' && (
                  <div>
                    {/* Filters bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className={`tab-btn ${withdrawalFilter === 'pending' ? 'active' : ''}`}
                          onClick={() => setWithdrawalFilter('pending')}
                          style={{ fontSize: '0.78rem', padding: '0.35rem 0.8rem' }}
                        >
                          Pending Payouts ({withdrawals.filter(w => w.status === 'pending').length})
                        </button>
                        <button
                          className={`tab-btn ${withdrawalFilter === 'all' ? 'active' : ''}`}
                          onClick={() => setWithdrawalFilter('all')}
                          style={{ fontSize: '0.78rem', padding: '0.35rem 0.8rem' }}
                        >
                          All Withdrawals ({withdrawals.length})
                        </button>
                      </div>
                      <button
                        className="action-btn"
                        onClick={() => fetchData()}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', padding: '0.35rem 0.8rem' }}
                      >
                        <RefreshCw size={13} /> Refresh
                      </button>
                    </div>

                    {(() => {
                      const filteredWithdrawals = withdrawals.filter(w => {
                        if (withdrawalFilter === 'pending') return w.status === 'pending';
                        return true;
                      });

                      if (filteredWithdrawals.length === 0) {
                        return (
                          <div className="empty-state" style={{ padding: '3rem', textAlign: 'center' }}>
                            <CheckCircle size={48} style={{ color: '#10b981', margin: '0 auto 1rem', display: 'block' }} />
                            <h3>{withdrawalFilter === 'pending' ? 'No Pending Withdrawal Requests' : 'No Withdrawals Found'}</h3>
                            <p style={{ color: 'var(--text-secondary)' }}>All payout requests have been resolved.</p>
                          </div>
                        );
                      }

                      return (
                        <div className="rankings-table-wrapper">
                          <table className="rankings-table">
                            <thead>
                              <tr>
                                <th>Reg #</th>
                                <th>User / Team</th>
                                <th>Phone</th>
                                <th>Payout Amount</th>
                                <th>UPI ID</th>
                                <th>Request Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredWithdrawals.map(w => (
                                <tr key={w._id}>
                                  <td>
                                    <span style={{
                                      fontWeight: 'bold', fontFamily: 'monospace', fontSize: '0.9rem',
                                      color: 'var(--purple-light)', background: 'rgba(139,92,246,0.12)',
                                      padding: '0.15rem 0.5rem', borderRadius: '4px'
                                    }}>
                                      #{w.userId?.registrationNumber ?? '—'}
                                    </span>
                                  </td>
                                  <td><strong>{w.userId?.teamName || 'Player'}</strong></td>
                                  <td>{w.userId?.phone || '-'}</td>
                                  <td style={{ fontWeight: 'bold', color: '#ef4444', fontSize: '1rem' }}>₹{w.amount}</td>
                                  <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                      <code className="txn-id-code" style={{ color: '#c4b5fd' }}>{w.upiId || '-'}</code>
                                      {w.upiId && (
                                        <button
                                          onClick={() => copyUtr(w.upiId)}
                                          style={{
                                            background: copiedUtr === w.upiId ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.08)',
                                            border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px',
                                            color: copiedUtr === w.upiId ? '#4ade80' : '#cbd5e1',
                                            fontSize: '0.68rem', padding: '0.15rem 0.4rem', cursor: 'pointer'
                                          }}
                                        >
                                          {copiedUtr === w.upiId ? 'Copied' : 'Copy'}
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                  <td style={{ fontSize: '0.82rem' }}>{new Date(w.createdAt).toLocaleString('en-IN')}</td>
                                  <td>
                                    <span style={{
                                      padding: '0.2rem 0.55rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 'bold',
                                      ...(w.status === 'success'
                                        ? { background: 'rgba(34,197,94,0.15)', color: '#22c55e' }
                                        : w.status === 'pending'
                                          ? { background: 'rgba(234,179,8,0.2)', color: '#f59e0b', border: '1px solid rgba(234,179,8,0.4)' }
                                          : { background: 'rgba(239,68,68,0.15)', color: '#ef4444' })
                                    }}>
                                      {w.status.toUpperCase()}
                                    </span>
                                  </td>
                                  <td>
                                    {w.status === 'pending' ? (
                                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                                        <button
                                          className="action-btn"
                                          style={{ background: '#10b981', padding: '0.35rem 0.75rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                          onClick={() => handleWithdrawalAction(w._id, 'success')}
                                          title="Mark payout as completed"
                                        >
                                          <Check size={14} /> Approve Payout
                                        </button>
                                        <button
                                          className="action-btn delete-btn"
                                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                          onClick={() => handleWithdrawalAction(w._id, 'rejected')}
                                          title="Reject and refund money to user wallet"
                                        >
                                          <X size={14} /> Reject &amp; Refund
                                        </button>
                                      </div>
                                    ) : (
                                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Completed</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* ── SUB-TAB 3: ALL TRANSACTIONS LEDGER ── */}
                {walletSubTab === 'all' && (
                  <div>
                    {/* Filters & Search */}
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
                        <input
                          type="text"
                          placeholder="Search by Team, Phone, Reg #, Txn ID, or UTR..."
                          value={txnSearchQuery}
                          onChange={(e) => setTxnSearchQuery(e.target.value)}
                          style={{
                            width: '100%', padding: '0.5rem 0.8rem',
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: '8px', color: '#fff', fontSize: '0.85rem'
                          }}
                        />
                      </div>

                      <select
                        value={txnTypeFilter}
                        onChange={(e) => setTxnTypeFilter(e.target.value)}
                        style={{
                          padding: '0.5rem 0.8rem', background: 'var(--bg-card)',
                          border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px',
                          color: '#fff', fontSize: '0.85rem'
                        }}
                      >
                        <option value="all">All Transaction Types</option>
                        <option value="add_balance">Deposits (Cash Added)</option>
                        <option value="withdrawal">Withdrawals</option>
                        <option value="payment">Match/Slot Payments</option>
                        <option value="refund">Refunds</option>
                        <option value="admin_adjustment">Admin Adjustments</option>
                      </select>

                      <button
                        className="action-btn"
                        onClick={() => fetchData()}
                        style={{ padding: '0.5rem 0.8rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <RefreshCw size={13} /> Refresh
                      </button>
                    </div>

                    {/* Ledger Table */}
                    {(() => {
                      const filteredLedger = allTransactions.filter(t => {
                        if (txnTypeFilter !== 'all' && t.type !== txnTypeFilter) return false;
                        if (txnSearchQuery.trim()) {
                          const q = txnSearchQuery.toLowerCase();
                          const team = (t.userId?.teamName || '').toLowerCase();
                          const phone = (t.userId?.phone || '').toLowerCase();
                          const reg = String(t.userId?.registrationNumber || '');
                          const txnId = (t.transactionId || '').toLowerCase();
                          const utr = (t.utrNumber || '').toLowerCase();
                          return team.includes(q) || phone.includes(q) || reg.includes(q) || txnId.includes(q) || utr.includes(q);
                        }
                        return true;
                      });

                      if (filteredLedger.length === 0) {
                        return (
                          <div className="empty-state" style={{ padding: '3rem', textAlign: 'center' }}>
                            <p style={{ color: 'var(--text-secondary)' }}>No transactions matching your criteria.</p>
                          </div>
                        );
                      }

                      return (
                        <div className="rankings-table-wrapper">
                          <table className="rankings-table">
                            <thead>
                              <tr>
                                <th>Txn ID</th>
                                <th>Reg #</th>
                                <th>User / Team</th>
                                <th>Type</th>
                                <th>Amount</th>
                                <th>UTR / Ref</th>
                                <th>Status</th>
                                <th>Date &amp; Time</th>
                                <th>Details</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredLedger.map(t => {
                                const typeConfig = {
                                  add_balance: { label: 'Deposit', color: '#10b981', sign: '+' },
                                  withdrawal: { label: 'Withdrawal', color: '#ef4444', sign: '-' },
                                  payment: { label: 'Match Entry', color: '#f59e0b', sign: '-' },
                                  refund: { label: 'Refund', color: '#8b5cf6', sign: '+' },
                                  admin_adjustment: { label: 'Admin Adj', color: '#38bdf8', sign: '±' },
                                }[t.type] || { label: t.type, color: 'inherit', sign: '' };

                                return (
                                  <tr key={t._id}>
                                    <td><code className="txn-id-code" style={{ fontSize: '0.75rem' }}>{t.transactionId}</code></td>
                                    <td>
                                      <span style={{ fontWeight: 'bold', fontFamily: 'monospace', color: 'var(--purple-light)' }}>
                                        #{t.userId?.registrationNumber ?? '—'}
                                      </span>
                                    </td>
                                    <td>
                                      <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{t.userId?.teamName || 'Player'}</div>
                                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>{t.userId?.phone}</div>
                                    </td>
                                    <td>
                                      <span style={{
                                        fontSize: '0.72rem', padding: '0.15rem 0.45rem', borderRadius: '4px',
                                        fontWeight: 'bold', textTransform: 'uppercase', color: typeConfig.color,
                                        background: `${typeConfig.color}15`, border: `1px solid ${typeConfig.color}30`
                                      }}>
                                        {typeConfig.label}
                                      </span>
                                    </td>
                                    <td style={{ fontWeight: 'bold', color: typeConfig.color, fontSize: '0.95rem' }}>
                                      {typeConfig.sign}₹{t.amount}
                                    </td>
                                    <td>
                                      {t.utrNumber ? (
                                        <code style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#fbbf24' }}>
                                          {t.utrNumber}
                                        </code>
                                      ) : (
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>—</span>
                                      )}
                                    </td>
                                    <td>
                                      <span style={{
                                        padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold',
                                        ...(t.status === 'success'
                                          ? { background: 'rgba(34,197,94,0.15)', color: '#22c55e' }
                                          : (t.status === 'pending' || t.status === 'pending_verification')
                                            ? { background: 'rgba(234,179,8,0.2)', color: '#f59e0b' }
                                            : { background: 'rgba(239,68,68,0.15)', color: '#ef4444' })
                                      }}>
                                        {t.status.toUpperCase()}
                                      </span>
                                    </td>
                                    <td style={{ fontSize: '0.78rem' }}>{new Date(t.createdAt).toLocaleString('en-IN')}</td>
                                    <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                      {t.relatedItem || t.notes || (t.verifiedBy ? `By: ${t.verifiedBy}` : '-')}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* ── SUB-TAB 4: MANUAL BALANCE ADJUSTMENT ── */}
                {walletSubTab === 'adjust' && (
                  <div style={{ maxWidth: '600px', margin: '0 auto', background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '14px', border: '1px solid rgba(139,92,246,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                      <DollarSign size={22} style={{ color: '#38bdf8' }} />
                      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Manual Player Balance Adjustment</h3>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '1.5rem' }}>
                      Add winning prize money, bonuses, or debit entry adjustments directly to/from a player&apos;s wallet. An audit transaction will be recorded automatically.
                    </p>

                    <form onSubmit={handleAdjustBalanceSubmit}>
                      <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.82rem', fontWeight: 'bold' }}>
                          Select Player / Team *
                        </label>
                        <select
                          value={adjustFormData.userId}
                          onChange={(e) => setAdjustFormData({ ...adjustFormData, userId: e.target.value })}
                          required
                          style={{
                            width: '100%', padding: '0.65rem 0.8rem', background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '0.88rem'
                          }}
                        >
                          <option value="">-- Choose registered player --</option>
                          {allUsers.map(u => (
                            <option key={u._id} value={u._id}>
                              [#{u.registrationNumber || '?'}] {u.teamName || 'No Team'} ({u.phone}) — Balance: ₹{u.walletBalance || 0}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div className="form-group">
                          <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.82rem', fontWeight: 'bold' }}>
                            Action Type *
                          </label>
                          <select
                            value={adjustFormData.type}
                            onChange={(e) => setAdjustFormData({ ...adjustFormData, type: e.target.value })}
                            style={{
                              width: '100%', padding: '0.65rem 0.8rem', background: 'rgba(255,255,255,0.06)',
                              border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '0.88rem'
                            }}
                          >
                            <option value="credit">Credit (+) Add Money</option>
                            <option value="debit">Debit (-) Deduct Money</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.82rem', fontWeight: 'bold' }}>
                            Amount (₹) *
                          </label>
                          <input
                            type="number"
                            min="1"
                            placeholder="e.g. 500"
                            value={adjustFormData.amount}
                            onChange={(e) => setAdjustFormData({ ...adjustFormData, amount: e.target.value })}
                            required
                            style={{
                              width: '100%', padding: '0.65rem 0.8rem', background: 'rgba(255,255,255,0.06)',
                              border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '0.88rem'
                            }}
                          />
                        </div>
                      </div>

                      <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.82rem', fontWeight: 'bold' }}>
                          Reason / Description (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Weekly Scrim #12 WWCD Prize Money"
                          value={adjustFormData.reason}
                          onChange={(e) => setAdjustFormData({ ...adjustFormData, reason: e.target.value })}
                          style={{
                            width: '100%', padding: '0.65rem 0.8rem', background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '0.88rem'
                          }}
                        />
                      </div>

                      <button
                        type="submit"
                        className="action-btn"
                        style={{
                          width: '100%', padding: '0.85rem',
                          background: adjustFormData.type === 'credit'
                            ? 'linear-gradient(135deg, #10b981, #059669)'
                            : 'linear-gradient(135deg, #ef4444, #dc2626)',
                          fontSize: '0.95rem'
                        }}
                        disabled={adjustLoading}
                      >
                        {adjustLoading ? 'Processing...' : `${adjustFormData.type === 'credit' ? 'Credit' : 'Debit'} ₹${adjustFormData.amount || 0}`}
                      </button>
                    </form>
                  </div>
                )}
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



            {/* ── UPI PAYMENTS VERIFICATION TAB ── */}
            {activeTab === 'payments' && (
              <div className="rankings-table-wrapper">
                {(() => {
                  const filtered = bookings.filter(b => {
                    const isUpi = b.paymentMethod === 'upi' || Boolean(b.utrNumber);
                    if (paymentFilter === 'pending') {
                      return b.paymentStatus === 'pending_verification';
                    }
                    return isUpi || b.paymentStatus === 'pending_verification';
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="empty-state" style={{ padding: '3rem', textAlign: 'center' }}>
                        <CheckCircle size={48} style={{ color: '#10b981', margin: '0 auto 1rem', display: 'block' }} />
                        <h3>{paymentFilter === 'pending' ? 'No Pending UPI Verifications' : 'No UPI Payments Found'}</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>
                          {paymentFilter === 'pending'
                            ? 'All user payments have been processed and verified.'
                            : 'Submitted UPI payments will appear here.'}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <table className="rankings-table">
                      <thead>
                        <tr>
                          <th>Reg #</th>
                          <th>Team / User</th>
                          <th>Event / Slot</th>
                          <th>Amount</th>
                          <th>UTR Number / Txn Ref</th>
                          <th>Date Submitted</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map(b => {
                          const eventTitle = b.tournamentId
                            ? (b.tournamentId?.title || 'Tournament')
                            : (b.slotId?.matchName || 'Match Slot');
                          const eventType = b.tournamentId ? 'Tournament' : 'Slot';
                          const amt = b.amount ?? (b.tournamentId ? b.tournamentId?.entryFee : (b.slotId?.price ?? b.slotId?.entryFee ?? 0));

                          return (
                            <tr key={b._id}>
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
                                  #{b.userId?.registrationNumber ?? '—'}
                                </span>
                              </td>
                              <td>
                                <div style={{ fontWeight: 'bold' }}>{b.userId?.teamName || 'Player'}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{b.userId?.phone}</div>
                              </td>
                              <td>
                                <div style={{ fontWeight: 'bold', color: 'var(--purple-light)' }}>{eventTitle}</div>
                                <span style={{
                                  fontSize: '0.65rem',
                                  padding: '0.1rem 0.4rem',
                                  borderRadius: '4px',
                                  textTransform: 'uppercase',
                                  background: b.tournamentId ? 'rgba(59, 130, 246, 0.2)' : 'rgba(139, 92, 246, 0.2)',
                                  color: b.tournamentId ? '#60a5fa' : 'var(--purple-light)',
                                }}>
                                  {eventType}
                                </span>
                              </td>
                              <td style={{ fontWeight: 'bold', color: '#10b981', fontSize: '1rem' }}>
                                ₹{amt}
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <code style={{
                                    fontFamily: 'monospace',
                                    fontSize: '0.9rem',
                                    background: 'rgba(234,179,8,0.15)',
                                    color: '#fbbf24',
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '6px',
                                    fontWeight: 'bold'
                                  }}>
                                    {b.utrNumber || b.merchantTransactionId || '—'}
                                  </code>
                                  {b.utrNumber && (
                                    <button
                                      onClick={() => copyUtr(b.utrNumber)}
                                      style={{
                                        background: copiedUtr === b.utrNumber ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.08)',
                                        border: '1px solid rgba(255,255,255,0.15)',
                                        borderRadius: '4px',
                                        color: copiedUtr === b.utrNumber ? '#4ade80' : '#cbd5e1',
                                        fontSize: '0.68rem',
                                        padding: '0.15rem 0.4rem',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      {copiedUtr === b.utrNumber ? 'Copied' : 'Copy'}
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td style={{ fontSize: '0.8rem' }}>
                                {new Date(b.createdAt).toLocaleString('en-IN')}
                              </td>
                              <td>
                                <span style={{
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '4px',
                                  fontSize: '0.72rem',
                                  fontWeight: 'bold',
                                  ...statusStyle(b.paymentStatus)
                                }}>
                                  {b.paymentStatus === 'pending_verification' ? 'PENDING VERIFY' : b.paymentStatus.toUpperCase()}
                                </span>
                              </td>
                              <td>
                                {b.paymentStatus === 'pending_verification' ? (
                                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                      className="action-btn"
                                      style={{ background: '#10b981', padding: '0.35rem 0.75rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                      onClick={() => handleVerifyPayment(b._id, 'paid')}
                                    >
                                      <Check size={14} /> Approve
                                    </button>
                                    <button
                                      className="action-btn delete-btn"
                                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                      onClick={() => handleVerifyPayment(b._id, 'failed')}
                                    >
                                      <X size={14} /> Reject
                                    </button>
                                  </div>
                                ) : (
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    {b.verifiedBy ? `By: ${b.verifiedBy}` : 'Completed'}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  );
                })()}
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
                      <th>Action</th>
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
                          <div style={{ fontWeight: 'bold' }}>{booking.slotId?.matchName || booking.tournamentId?.title || 'Unknown Match'}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {booking.slotId?.slotTime ? new Date(booking.slotId.slotTime).toLocaleString('en-IN') : (booking.slotId?.date || '')}
                          </div>
                        </td>
                        <td>₹{booking.amount ?? (booking.slotId?.price ?? booking.slotId?.entryFee ?? booking.tournamentId?.entryFee ?? 0)}</td>
                        <td>
                          <div style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>
                            {booking.paymentMethod && (
                              <span style={{ textTransform: 'uppercase', color: '#c4b5fd', fontWeight: 'bold', marginRight: '4px' }}>
                                [{booking.paymentMethod}]
                              </span>
                            )}
                            Ref: {booking.paymentId || '—'}
                          </div>
                          {booking.utrNumber && (
                            <div style={{ color: '#fbbf24', fontSize: '0.75rem', fontWeight: 'bold', fontFamily: 'monospace' }}>
                              UTR: {booking.utrNumber}
                            </div>
                          )}
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
                            {booking.paymentStatus === 'pending_verification' ? 'PENDING VERIFY' : booking.paymentStatus.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.78rem' }}>
                          {booking.paidAt
                            ? new Date(booking.paidAt).toLocaleString('en-IN')
                            : new Date(booking.createdAt).toLocaleString('en-IN')}
                        </td>
                        <td>
                          {booking.paymentStatus === 'pending_verification' ? (
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <button
                                className="action-btn"
                                style={{ background: '#10b981', padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
                                onClick={() => handleVerifyPayment(booking._id, 'paid')}
                                title="Approve Payment"
                              >
                                Approve
                              </button>
                              <button
                                className="action-btn delete-btn"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
                                onClick={() => handleVerifyPayment(booking._id, 'failed')}
                                title="Reject Payment"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>—</span>
                          )}
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
                  const pendingCount = group.bookings.filter(b => b.paymentStatus === 'pending_verification').length;
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
                            {pendingCount > 0 && (
                              <span style={{
                                background: 'rgba(234,179,8,0.2)',
                                color: '#f59e0b',
                                padding: '0.2rem 0.65rem',
                                borderRadius: '20px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                              }}>
                                ⏳ {pendingCount} Pending Verify
                              </span>
                            )}
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
                                <th>Payment Details</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Action</th>
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
                                          {booking.paymentMethod && (
                                            <span style={{ textTransform: 'uppercase', color: '#c4b5fd', fontWeight: 'bold', marginRight: '4px' }}>
                                              [{booking.paymentMethod}]
                                            </span>
                                          )}
                                          {booking.paymentId || <span style={{ color: 'var(--text-secondary)' }}>—</span>}
                                        </div>
                                        {booking.utrNumber && (
                                          <div style={{ color: '#fbbf24', fontSize: '0.72rem', fontWeight: 'bold', fontFamily: 'monospace' }}>
                                            UTR: {booking.utrNumber}
                                          </div>
                                        )}
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
                                          {booking.paymentStatus === 'pending_verification' ? 'PENDING VERIFY' : booking.paymentStatus.toUpperCase()}
                                        </span>
                                      </td>
                                      <td style={{ fontSize: '0.75rem' }}>
                                        {booking.paidAt
                                          ? new Date(booking.paidAt).toLocaleString('en-IN')
                                          : new Date(booking.createdAt).toLocaleString('en-IN')}
                                      </td>
                                      <td>
                                        {booking.paymentStatus === 'pending_verification' ? (
                                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                                            <button
                                              className="action-btn"
                                              style={{ background: '#10b981', padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
                                              onClick={() => handleVerifyPayment(booking._id, 'paid')}
                                              title="Approve Payment"
                                            >
                                              Approve
                                            </button>
                                            <button
                                              className="action-btn delete-btn"
                                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
                                              onClick={() => handleVerifyPayment(booking._id, 'failed')}
                                              title="Reject Payment"
                                            >
                                              Reject
                                            </button>
                                          </div>
                                        ) : (
                                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>—</span>
                                        )}
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

            {/* â”€â”€ TODAY SLOTS ADMIN PANEL â”€â”€ */}
            {activeTab === 'todayslots' && (
              <div>
                {/* Inline Slot Create / Edit Modal */}
                {showSlotModal && (
                  <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '2rem 1rem' }}>
                    <div style={{ width: '100%', maxWidth: '640px', background: 'linear-gradient(160deg,#13131f,#0e0e1a)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '20px', padding: '1.75rem', margin: 'auto' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>{slotEditTarget ? 'Edit Slot' : 'Create New Slot'}</h2>
                        <button onClick={() => setShowSlotModal(false)} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50%', width: '32px', height: '32px', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>x</button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                          <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>Match Title *</label>
                          <input type="text" value={slotFormData.matchName || ''} onChange={e => setSlotFormData(p => ({ ...p, matchName: e.target.value }))} placeholder="e.g. RISING 1-3 GRIND SCRIMS" style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '8px', color: '#fff', padding: '0.55rem 0.75rem', fontSize: '0.88rem' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>Date *</label>
                          <input type="text" value={slotFormData.date || ''} onChange={e => setSlotFormData(p => ({ ...p, date: e.target.value }))} placeholder="e.g. 30 Sep 2026" style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '8px', color: '#fff', padding: '0.55rem 0.75rem', fontSize: '0.88rem' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>Category</label>
                          <select value={slotFormData.category || 'SCRIMS'} onChange={e => setSlotFormData(p => ({ ...p, category: e.target.value }))} style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '8px', color: '#fff', padding: '0.55rem 0.75rem', fontSize: '0.88rem' }}>
                            <option value="SCRIMS">SCRIMS</option>
                            <option value="GRANDS">GRANDS</option>
                            <option value="WEEKLY WAR">WEEKLY WAR</option>
                            <option value="WEEKEND WAR">WEEKEND WAR</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>Lobby</label>
                          <input type="text" value={slotFormData.lobby || ''} onChange={e => setSlotFormData(p => ({ ...p, lobby: e.target.value }))} placeholder="e.g. LOBBY 1" style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '8px', color: '#fff', padding: '0.55rem 0.75rem', fontSize: '0.88rem' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>Timing</label>
                          <input type="text" value={slotFormData.timing || ''} onChange={e => setSlotFormData(p => ({ ...p, timing: e.target.value }))} placeholder="e.g. 1:42 PM" style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '8px', color: '#fff', padding: '0.55rem 0.75rem', fontSize: '0.88rem' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>Entry Fee (Rs.)</label>
                          <input type="number" value={slotFormData.entryFee || ''} onChange={e => setSlotFormData(p => ({ ...p, entryFee: Number(e.target.value), price: Number(e.target.value) }))} placeholder="60" style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '8px', color: '#fff', padding: '0.55rem 0.75rem', fontSize: '0.88rem' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>Max Teams</label>
                          <input type="number" value={slotFormData.maxTeams || ''} onChange={e => setSlotFormData(p => ({ ...p, maxTeams: Number(e.target.value) }))} placeholder="19" style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '8px', color: '#fff', padding: '0.55rem 0.75rem', fontSize: '0.88rem' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>Mode</label>
                          <input type="text" value={slotFormData.mode || ''} onChange={e => setSlotFormData(p => ({ ...p, mode: e.target.value }))} placeholder="Squad TPP" style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '8px', color: '#fff', padding: '0.55rem 0.75rem', fontSize: '0.88rem' }} />
                        </div>
                      </div>
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>Maps (comma-separated)</label>
                        <input type="text" value={slotFormData.maps || ''} onChange={e => setSlotFormData(p => ({ ...p, maps: e.target.value }))} placeholder="ERANGEL, RONDO, MIRAMAR" style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '8px', color: '#fff', padding: '0.55rem 0.75rem', fontSize: '0.88rem' }} />
                      </div>

                      {/* ── RANK-WISE PRIZE DISTRIBUTION ── */}
                      <div style={{ background: 'rgba(234,179,8,0.04)', border: '1px solid rgba(234,179,8,0.22)', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#facc15', fontWeight: '800', fontSize: '0.85rem', letterSpacing: '0.5px' }}>
                            <Trophy size={16} /> RANK-WISE PRIZE MONEY
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Presets:</span>
                            <button
                              type="button"
                              onClick={() => setSlotPrizePreset('top3')}
                              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '5px', color: '#e2e8f0', fontSize: '0.7rem', padding: '0.15rem 0.5rem', cursor: 'pointer' }}
                            >
                              Top 3
                            </button>
                            <button
                              type="button"
                              onClick={() => setSlotPrizePreset('top5')}
                              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '5px', color: '#e2e8f0', fontSize: '0.7rem', padding: '0.15rem 0.5rem', cursor: 'pointer' }}
                            >
                              Top 5
                            </button>
                            <button
                              type="button"
                              onClick={() => setSlotPrizePreset('winner')}
                              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '5px', color: '#e2e8f0', fontSize: '0.7rem', padding: '0.15rem 0.5rem', cursor: 'pointer' }}
                            >
                              #1 Only
                            </button>
                            <button
                              type="button"
                              onClick={addSlotPrizeDistRow}
                              style={{ background: 'rgba(234,179,8,0.18)', border: '1px solid rgba(234,179,8,0.45)', borderRadius: '5px', color: '#fef08a', fontSize: '0.72rem', fontWeight: '700', padding: '0.2rem 0.6rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', marginLeft: '0.25rem' }}
                            >
                              <Plus size={12} /> Add Rank
                            </button>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.6rem' }}>
                          {(slotFormData.prizeDistribution && slotFormData.prizeDistribution.length > 0 ? slotFormData.prizeDistribution : [
                            { rank: '#1', prize: '₹400' },
                            { rank: '#2', prize: '₹150' },
                            { rank: '#3', prize: '₹100' },
                            { rank: '#4', prize: '₹70' },
                            { rank: '#5', prize: 'FREE' },
                          ]).map((item, pIdx) => (
                            <div
                              key={pIdx}
                              style={{
                                background: 'rgba(15,12,30,0.85)',
                                border: '1px solid rgba(234,179,8,0.25)',
                                borderRadius: '8px',
                                padding: '0.55rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.35rem',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <input
                                  type="text"
                                  value={item.rank || `#${pIdx + 1}`}
                                  onChange={(e) => handleSlotPrizeDistChange(pIdx, 'rank', e.target.value)}
                                  placeholder="#1"
                                  style={{
                                    width: '54px',
                                    background: 'rgba(234,179,8,0.15)',
                                    border: '1px solid rgba(234,179,8,0.4)',
                                    borderRadius: '4px',
                                    color: '#fef08a',
                                    fontSize: '0.76rem',
                                    fontWeight: '800',
                                    padding: '0.2rem 0.35rem',
                                    textAlign: 'center',
                                  }}
                                />
                                {(slotFormData.prizeDistribution || []).length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeSlotPrizeDistRow(pIdx)}
                                    style={{
                                      background: 'rgba(239,68,68,0.18)',
                                      border: 'none',
                                      borderRadius: '4px',
                                      color: '#f87171',
                                      width: '20px',
                                      height: '20px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      cursor: 'pointer',
                                      padding: 0,
                                    }}
                                    title="Delete rank"
                                  >
                                    <X size={12} />
                                  </button>
                                )}
                              </div>
                              <input
                                type="text"
                                value={item.prize || ''}
                                onChange={(e) => handleSlotPrizeDistChange(pIdx, 'prize', e.target.value)}
                                placeholder="₹400 / FREE"
                                style={{
                                  width: '100%',
                                  boxSizing: 'border-box',
                                  background: 'rgba(0,0,0,0.4)',
                                  border: '1px solid rgba(255,255,255,0.15)',
                                  borderRadius: '5px',
                                  color: '#fff',
                                  fontSize: '0.82rem',
                                  fontWeight: '700',
                                  padding: '0.35rem 0.5rem',
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                          <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>Room ID</label>
                          <input type="text" value={slotFormData.roomId || ''} onChange={e => setSlotFormData(p => ({ ...p, roomId: e.target.value }))} placeholder="Room ID (set before match)" style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '8px', color: '#fff', padding: '0.55rem 0.75rem', fontSize: '0.88rem' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>Room Password</label>
                          <input type="text" value={slotFormData.roomPassword || ''} onChange={e => setSlotFormData(p => ({ ...p, roomPassword: e.target.value }))} placeholder="Password (set before match)" style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '8px', color: '#fff', padding: '0.55rem 0.75rem', fontSize: '0.88rem' }} />
                        </div>
                      </div>
                      <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.3rem' }}>Note / Instructions</label>
                        <input type="text" value={slotFormData.note || ''} onChange={e => setSlotFormData(p => ({ ...p, note: e.target.value }))} placeholder="e.g. ID/Pass will be provided 30 min before match" style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '8px', color: '#fff', padding: '0.55rem 0.75rem', fontSize: '0.88rem' }} />
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => setShowSlotModal(false)} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: '#94a3b8', padding: '0.65rem 1.25rem', cursor: 'pointer', fontSize: '0.88rem' }}>Cancel</button>
                        <button
                          disabled={isSubmitting}
                          style={{ background: isSubmitting ? 'rgba(124,58,237,0.4)' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', border: 'none', borderRadius: '10px', color: '#fff', padding: '0.65rem 1.5rem', cursor: isSubmitting ? 'not-allowed' : 'pointer', fontSize: '0.88rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                          onClick={async () => {
                            if (!slotFormData.matchName) { alert('Match title is required'); return; }
                            if (!slotFormData.date) { alert('Date is required'); return; }
                            setIsSubmitting(true);
                            try {
                              const payload = {
                                ...slotFormData,
                                category: slotFormData.category || 'SCRIMS',
                                lobby: slotFormData.lobby || 'LOBBY 1',
                                price: Number(slotFormData.price ?? slotFormData.entryFee ?? 0),
                                entryFee: Number(slotFormData.entryFee ?? slotFormData.price ?? 0),
                                maxTeams: Number(slotFormData.maxTeams ?? 19),
                                maps: typeof slotFormData.maps === 'string'
                                  ? slotFormData.maps.split(',').map(m => m.trim().toUpperCase()).filter(Boolean)
                                  : (slotFormData.maps || ['ERANGEL', 'RONDO', 'MIRAMAR']),
                                scheduleMatches: slotFormData.scheduleMatches || [],
                                prizeDistribution: slotFormData.prizeDistribution || [],
                              };
                              if (slotEditTarget) {
                                await axios.put(`${apiUrl}/api/slots/${slotEditTarget._id}`, payload, config);
                              } else {
                                await axios.post(`${apiUrl}/api/slots`, payload, config);
                              }
                              await fetchData();
                              setShowSlotModal(false);
                              setSlotEditTarget(null);
                            } catch (err) {
                              alert('Failed: ' + (err.response?.data?.message || err.message));
                            } finally {
                              setIsSubmitting(false);
                            }
                          }}
                        >
                          {isSubmitting ? 'Saving...' : (slotEditTarget ? 'Save Changes' : 'Create Slot')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {slots.filter(s => s.date && String(s.date).includes(todaySlotsDate)).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-secondary)' }}>
                    <Calendar size={52} style={{ opacity: 0.25, display: 'block', margin: '0 auto 1rem' }} />
                    <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>No Slots for This Date</h3>
                    <p>Nothing scheduled for <strong style={{ color: '#a78bfa' }}>{todaySlotsDate}</strong>.</p>
                    <button
                      className="action-btn"
                      style={{ marginTop: '1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                      onClick={() => { setSlotEditTarget(null); setSlotFormData({ category: 'SCRIMS', lobby: 'LOBBY 1', matchName: 'RISING 1-3 GRIND SCRIMS', date: todaySlotsDate, timing: '1:42 PM', mode: 'Squad TPP', entryFee: 60, price: 60, maxTeams: 19, maps: 'ERANGEL, RONDO, MIRAMAR', scheduleMatches: [], prizeDistribution: [{ rank: '#1', prize: 'Rs.400' }, { rank: '#2', prize: 'Rs.150' }, { rank: '#3', prize: 'Rs.100' }], roomId: '', roomPassword: '', note: 'ID/Pass 30 min before match', whatsappLink: '' }); setShowSlotModal(true); }}
                    >
                      <Plus size={16} /> Create First Slot
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {(() => {
                      const todaySlots = slots.filter(s => s.date && String(s.date).includes(todaySlotsDate));
                      const todayBookings = bookings.filter(b => todaySlots.some(sl => sl._id === (b.slotId && b.slotId._id ? b.slotId._id : b.slotId)));
                      return (
                        <>
                          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            {[
                              { label: 'Total Slots', value: todaySlots.length, color: '#10b981' },
                              { label: 'Teams Booked', value: todaySlots.reduce((s, sl) => s + (Number(sl.bookedCount) || 0), 0), color: '#a78bfa' },
                              { label: 'Pending', value: todayBookings.filter(b => b.paymentStatus === 'pending_verification').length, color: '#f59e0b' },
                              { label: 'Revenue', value: 'Rs.' + todayBookings.filter(b => b.paymentStatus === 'paid').reduce((s, b) => s + (Number(b.amount) || 0), 0), color: '#60a5fa' },
                            ].map(stat => (
                              <div key={stat.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '0.7rem 1.1rem', minWidth: '110px' }}>
                                <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{stat.label}</div>
                                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: stat.color }}>{stat.value}</div>
                              </div>
                            ))}
                          </div>
                          {todaySlots.map(slot => {
                            const totalTeams = Number(slot.maxTeams) || 20;
                            const booked = Number(slot.bookedCount) || 0;
                            const pct = Math.min(100, Math.round((booked / totalTeams) * 100));
                            const slotId = slot._id;
                            const sb = bookings.filter(b => {
                              const bid = b.slotId && b.slotId._id ? b.slotId._id : b.slotId;
                              return bid === slotId;
                            });
                            const paidB = sb.filter(b => b.paymentStatus === 'paid');
                            const pendingB = sb.filter(b => b.paymentStatus === 'pending_verification');
                            const ed = editorData[slotId] || {};
                            return (
                              <div key={slotId} style={{ background: 'linear-gradient(135deg,rgba(15,12,30,0.97),rgba(22,17,46,0.97))', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
                                <div style={{ background: 'linear-gradient(90deg,rgba(124,58,237,0.15),transparent)', borderBottom: '1px solid rgba(139,92,246,0.15)', padding: '0.85rem 1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.6rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: '#fff' }}>{slot.matchName || 'Match Slot'}</h3>
                                    <span style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)', borderRadius: '5px', padding: '0.1rem 0.45rem', fontSize: '0.67rem', fontWeight: '700', color: '#c084fc' }}>{slot.category || 'SCRIMS'}</span>
                                    <span style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '5px', padding: '0.1rem 0.45rem', fontSize: '0.67rem', fontWeight: '700', color: '#10b981' }}>{slot.lobby || 'LOBBY 1'}</span>
                                    <span style={{ fontSize: '0.77rem', color: '#94a3b8' }}>{slot.timing || 'TBA'}</span>
                                  </div>
                                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                                    <button className="action-btn edit-btn" style={{ padding: '0.28rem 0.6rem', fontSize: '0.73rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }} onClick={() => {
                                      const pDist = Array.isArray(slot.prizeDistribution) && slot.prizeDistribution.length > 0
                                        ? slot.prizeDistribution
                                        : [
                                            { rank: '#1', prize: '₹400' },
                                            { rank: '#2', prize: '₹150' },
                                            { rank: '#3', prize: '₹100' },
                                            { rank: '#4', prize: '₹70' },
                                            { rank: '#5', prize: 'FREE' },
                                          ];
                                      setSlotEditTarget(slot);
                                      setSlotFormData({
                                        matchName: slot.matchName || '',
                                        category: slot.category || 'SCRIMS',
                                        lobby: slot.lobby || 'LOBBY 1',
                                        date: slot.date || '',
                                        timing: slot.timing || '',
                                        mode: slot.mode || 'Squad TPP',
                                        entryFee: slot.entryFee ?? 60,
                                        price: slot.price ?? 60,
                                        maxTeams: slot.maxTeams ?? 19,
                                        maps: Array.isArray(slot.maps) ? slot.maps.join(', ') : (slot.maps || ''),
                                        roomId: slot.roomId || '',
                                        roomPassword: slot.roomPassword || '',
                                        note: slot.note || '',
                                        whatsappLink: slot.whatsappLink || '',
                                        scheduleMatches: slot.scheduleMatches || [],
                                        prizeDistribution: pDist,
                                      });
                                      setShowSlotModal(true);
                                    }}><Edit2 size={12} /> Edit</button>
                                    <button className="action-btn delete-btn" style={{ padding: '0.28rem 0.6rem', fontSize: '0.73rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }} onClick={() => handleDelete(slotId)}><Trash2 size={12} /> Delete</button>
                                  </div>
                                </div>
                                <div style={{ padding: '1rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                  <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Fill Rate</span>
                                      <span style={{ fontSize: '0.78rem', fontWeight: '700', color: pct >= 80 ? '#f59e0b' : pct >= 50 ? '#60a5fa' : '#10b981' }}>{booked}/{totalTeams} teams</span>
                                    </div>
                                    <div style={{ height: '5px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                      <div style={{ height: '100%', width: `${pct}%`, borderRadius: '10px', background: pct >= 80 ? '#f59e0b' : pct >= 50 ? '#60a5fa' : '#10b981', transition: 'width 0.5s' }} />
                                    </div>
                                  </div>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.55rem' }}>
                                    {[{ l: 'Paid', v: paidB.length, c: '#10b981' }, { l: 'Pending', v: pendingB.length, c: '#f59e0b' }, { l: 'Fee', v: 'Rs.' + (slot.entryFee || slot.price || 0), c: '#a78bfa' }, { l: 'Revenue', v: 'Rs.' + paidB.reduce((s, b) => s + (Number(b.amount) || Number(slot.entryFee) || 0), 0), c: '#60a5fa' }].map(st => (
                                      <div key={st.l} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '7px', padding: '0.45rem 0.55rem', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.6rem', color: '#64748b', textTransform: 'uppercase' }}>{st.l}</div>
                                        <div style={{ fontSize: '0.95rem', fontWeight: '800', color: st.c }}>{st.v}</div>
                                      </div>
                                    ))}
                                  </div>
                                  {/* Rank-wise Prize Money Preview */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', background: 'rgba(234,179,8,0.04)', border: '1px solid rgba(234,179,8,0.18)', borderRadius: '8px', padding: '0.45rem 0.75rem' }}>
                                    <span style={{ fontSize: '0.68rem', color: '#facc15', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <Trophy size={13} /> Prize Pool:
                                    </span>
                                    {(slot.prizeDistribution && slot.prizeDistribution.length > 0 ? slot.prizeDistribution : [
                                      { rank: '#1', prize: '₹400' },
                                      { rank: '#2', prize: '₹150' },
                                      { rank: '#3', prize: '₹100' },
                                    ]).map((pz, idx) => (
                                      <span key={idx} style={{ background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: '4px', padding: '0.12rem 0.45rem', fontSize: '0.67rem', color: '#fde047', fontWeight: 'bold' }}>
                                        {pz.rank}: {pz.prize}
                                      </span>
                                    ))}
                                  </div>
                                  <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '0.8rem 0.95rem' }}>
                                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '0.6rem' }}>Room Credentials</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                      <input type="text" value={ed.roomId || ''} onChange={e => handleEditorFieldChange(slotId, 'roomId', e.target.value)} placeholder="Room ID" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.22)', borderRadius: '6px', color: '#fff', padding: '0.38rem 0.55rem', fontSize: '0.8rem', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
                                      <input type="text" value={ed.roomPassword || ''} onChange={e => handleEditorFieldChange(slotId, 'roomPassword', e.target.value)} placeholder="Password" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.22)', borderRadius: '6px', color: '#fff', padding: '0.38rem 0.55rem', fontSize: '0.8rem', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
                                    </div>
                                    <input type="text" value={ed.note || ''} onChange={e => handleEditorFieldChange(slotId, 'note', e.target.value)} placeholder="Note / Instructions" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.22)', borderRadius: '6px', color: '#fff', padding: '0.38rem 0.55rem', fontSize: '0.8rem', outline: 'none', width: '100%', boxSizing: 'border-box', marginBottom: '0.6rem' }} />
                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                      <button className="action-btn" onClick={() => handleEditorSave(slotId)} disabled={editorSaving[slotId]} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.38rem 0.85rem', fontSize: '0.78rem', background: editorSaved[slotId] ? 'rgba(16,185,129,0.28)' : 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}>
                                        {editorSaved[slotId] ? <><CheckCircle size={12} /> Saved</> : editorSaving[slotId] ? 'Saving...' : <><Save size={12} /> Save</>}
                                      </button>
                                    </div>
                                  </div>
                                  {sb.length > 0 && (
                                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                                      <div style={{ padding: '0.55rem 0.95rem', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.68rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Bookings ({sb.length})</div>
                                      <div style={{ overflowX: 'auto' }}>
                                        <table className="rankings-table" style={{ margin: 0 }}>
                                          <thead><tr><th>Reg#</th><th>Team</th><th>UTR</th><th>Amt</th><th>Status</th><th>Action</th></tr></thead>
                                          <tbody>
                                            {sb.map((b, idx) => (
                                              <tr key={b._id}>
                                                <td style={{ fontWeight: 'bold', color: '#a78bfa', fontFamily: 'monospace', fontSize: '0.8rem' }}>#{b.userId?.registrationNumber ?? idx + 1}</td>
                                                <td>
                                                  <div style={{ fontWeight: 'bold', fontSize: '0.82rem' }}>{b.userId?.teamName || 'Team'}</div>
                                                  <div style={{ fontSize: '0.69rem', color: 'var(--text-secondary)' }}>{b.userId?.phone}</div>
                                                </td>
                                                <td><code style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#fbbf24' }}>{b.utrNumber || b.paymentMethod || '-'}</code></td>
                                                <td style={{ fontWeight: 'bold', color: '#10b981', fontSize: '0.85rem' }}>Rs.{b.amount || slot.entryFee || 0}</td>
                                                <td><span style={{ padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.66rem', fontWeight: 'bold', ...statusStyle(b.paymentStatus) }}>{b.paymentStatus === 'pending_verification' ? 'PENDING' : (b.paymentStatus || '').toUpperCase()}</span></td>
                                                <td>
                                                  {b.paymentStatus === 'pending_verification' ? (
                                                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                      <button className="action-btn" style={{ background: '#10b981', padding: '0.2rem 0.45rem', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '2px' }} onClick={() => handleVerifyPayment(b._id, 'paid')}><Check size={11} /> OK</button>
                                                      <button className="action-btn delete-btn" style={{ padding: '0.2rem 0.45rem', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '2px' }} onClick={() => handleVerifyPayment(b._id, 'failed')}><X size={11} /> No</button>
                                                    </div>
                                                  ) : <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>-</span>}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  )}
                                  {sb.length === 0 && <div style={{ textAlign: 'center', padding: '0.85rem', color: '#475569', fontSize: '0.8rem' }}>No bookings yet.</div>}
                                </div>
                              </div>
                            );
                          })}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}


            {/* ── SLOT EDITOR ── */}
            {activeTab === 'slots' && (
              <div className="slot-editor-grid">
                {slots.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    <Calendar size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <p>No slots yet. Create slots by clicking "Add New Slot" above.</p>
                  </div>
                ) : (
                  slots.map((slot) => {
                    const ed = editorData[slot._id] || {};
                    const isSaving = editorSaving[slot._id];
                    const isSaved = editorSaved[slot._id];

                    return (
                      <div key={slot._id} className="slot-editor-card slot-editor-modern">
                        {/* Card Header */}
                        <div className="slot-editor-card-header">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                            <div className="slot-editor-card-title">
                              {ed.matchName || slot.matchName || 'Unnamed Slot'}
                            </div>
                            <span className="se-category-pill">{ed.category || 'SCRIMS'}</span>
                            <span className="se-lobby-pill">{ed.lobby || 'LOBBY 1'}</span>
                            <div className="slot-editor-card-subtitle">
                              ID: <code>{slot._id}</code>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            {isSaved && (
                              <div className="slot-editor-saved-badge">
                                <CheckCircle size={14} /> Saved!
                              </div>
                            )}
                            <button
                              type="button"
                              className="action-btn delete-btn"
                              onClick={() => handleDelete(slot._id)}
                              style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #ef4444', color: '#ef4444', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                              title="Delete Slot"
                            >
                              <Trash2 size={15} /> Delete
                            </button>
                          </div>
                        </div>

                        <div className="slot-editor-body-full">
                          {/* ── Basic Info ── */}
                          <div className="se-grid-4">
                            <div className="se-field">
                              <label>Match Title</label>
                              <input
                                type="text"
                                value={ed.matchName || ''}
                                onChange={(e) => handleEditorFieldChange(slot._id, 'matchName', e.target.value)}
                                placeholder="e.g. RISING 1-3 GRIND SCRIMS"
                              />
                            </div>
                            <div className="se-field">
                              <label>Category Tab</label>
                              <select
                                value={ed.category || 'SCRIMS'}
                                onChange={(e) => handleEditorFieldChange(slot._id, 'category', e.target.value)}
                                className="se-select"
                              >
                                <option value="SCRIMS">SCRIMS</option>
                                <option value="GRANDS">GRANDS</option>
                                <option value="WEEKLY WAR">WEEKLY WAR</option>
                                <option value="WEEKEND WAR">WEEKEND WAR</option>
                              </select>
                            </div>
                            <div className="se-field">
                              <label>Lobby Name</label>
                              <input
                                type="text"
                                value={ed.lobby || ''}
                                onChange={(e) => handleEditorFieldChange(slot._id, 'lobby', e.target.value)}
                                placeholder="e.g. LOBBY 1 or LOBBY 2"
                              />
                            </div>
                            <div className="se-field">
                              <label>Date</label>
                              <input
                                type="text"
                                value={ed.date || ''}
                                onChange={(e) => handleEditorFieldChange(slot._id, 'date', e.target.value)}
                                placeholder="e.g. 23 Sep 2026"
                              />
                            </div>
                          </div>

                          <div className="se-grid-4" style={{ marginTop: '0.8rem' }}>
                            <div className="se-field">
                              <label>Slot Entry Fee (₹)</label>
                              <input
                                type="number"
                                value={ed.entryFee ?? 60}
                                onChange={(e) => handleEditorFieldChange(slot._id, 'entryFee', Number(e.target.value))}
                                min="0"
                              />
                            </div>
                            <div className="se-field">
                              <label>Total Slots / Max Teams</label>
                              <input
                                type="number"
                                value={ed.maxTeams ?? 19}
                                onChange={(e) => handleEditorFieldChange(slot._id, 'maxTeams', Number(e.target.value))}
                                min="1"
                              />
                            </div>
                            <div className="se-field">
                              <label>Map Rotation (comma separated)</label>
                              <input
                                type="text"
                                value={ed.maps || ''}
                                onChange={(e) => handleEditorFieldChange(slot._id, 'maps', e.target.value)}
                                placeholder="ERANGEL, RONDO, MIRAMAR"
                              />
                            </div>
                            <div className="se-field">
                              <label>Game Mode</label>
                              <input
                                type="text"
                                value={ed.mode || 'Squad TPP'}
                                onChange={(e) => handleEditorFieldChange(slot._id, 'mode', e.target.value)}
                                placeholder="Squad TPP"
                              />
                            </div>
                          </div>

                          {/* ── Schedule (Matches) ── */}
                          <div className="se-subpanel" style={{ marginTop: '1.2rem' }}>
                            <div className="se-subpanel-header">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#c084fc', fontWeight: '700', fontSize: '0.88rem' }}>
                                <Clock size={16} /> SCHEDULE MATCHES
                              </div>
                              <button
                                type="button"
                                className="se-pill-add-btn"
                                onClick={() => addEditorScheduleMatch(slot._id)}
                              >
                                + Add Match
                              </button>
                            </div>
                            <div className="se-items-row">
                              {(ed.scheduleMatches || []).map((match, mIdx) => (
                                <div key={mIdx} className="se-match-item-card">
                                  <input
                                    type="text"
                                    value={match.label || `MATCH ${mIdx + 1}`}
                                    onChange={(e) => handleEditorScheduleChange(slot._id, mIdx, 'label', e.target.value)}
                                    className="se-match-label-input"
                                    placeholder="MATCH 1"
                                  />
                                  <input
                                    type="text"
                                    value={match.time || ''}
                                    onChange={(e) => handleEditorScheduleChange(slot._id, mIdx, 'time', e.target.value)}
                                    className="se-match-time-input"
                                    placeholder="1:42 PM"
                                  />
                                  {(ed.scheduleMatches || []).length > 1 && (
                                    <button
                                      type="button"
                                      className="se-item-del-btn"
                                      onClick={() => removeEditorScheduleMatch(slot._id, mIdx)}
                                      title="Remove match"
                                    >
                                      <X size={14} />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* ── Prize Pool Distribution ── */}
                          <div className="se-subpanel" style={{ marginTop: '1rem' }}>
                            <div className="se-subpanel-header">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#facc15', fontWeight: '700', fontSize: '0.88rem' }}>
                                <Trophy size={16} /> PRIZE POOL DISTRIBUTION
                              </div>
                              <button
                                type="button"
                                className="se-pill-add-btn"
                                onClick={() => addEditorPrizeDistRow(slot._id)}
                              >
                                + Add Rank
                              </button>
                            </div>
                            <div className="se-items-row">
                              {(ed.prizeDistribution || []).map((prize, pIdx) => (
                                <div key={pIdx} className="se-prize-item-card">
                                  <input
                                    type="text"
                                    value={prize.rank || `#${pIdx + 1}`}
                                    onChange={(e) => handleEditorPrizeDistChange(slot._id, pIdx, 'rank', e.target.value)}
                                    className="se-prize-rank-input"
                                    placeholder="#1"
                                  />
                                  <input
                                    type="text"
                                    value={prize.prize || ''}
                                    onChange={(e) => handleEditorPrizeDistChange(slot._id, pIdx, 'prize', e.target.value)}
                                    className="se-prize-val-input"
                                    placeholder="₹400 / FREE"
                                  />
                                  {(ed.prizeDistribution || []).length > 1 && (
                                    <button
                                      type="button"
                                      className="se-item-del-btn"
                                      onClick={() => removeEditorPrizeDistRow(slot._id, pIdx)}
                                      title="Remove rank"
                                    >
                                      <X size={14} />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* ── Room Credentials & Links ── */}
                          <div className="se-credentials-box" style={{ marginTop: '1.2rem' }}>
                            <div className="se-grid-2">
                              <div className="se-field">
                                <label style={{ color: '#a78bfa', fontWeight: '700' }}>🔑 Room ID</label>
                                <input
                                  type="text"
                                  value={ed.roomId || ''}
                                  onChange={(e) => handleEditorFieldChange(slot._id, 'roomId', e.target.value)}
                                  placeholder="e.g. 84729103"
                                  style={{ borderColor: 'rgba(167, 139, 250, 0.4)', background: 'rgba(167, 139, 250, 0.05)' }}
                                />
                              </div>
                              <div className="se-field">
                                <label style={{ color: '#a78bfa', fontWeight: '700' }}>🔒 Room Password</label>
                                <input
                                  type="text"
                                  value={ed.roomPassword || ''}
                                  onChange={(e) => handleEditorFieldChange(slot._id, 'roomPassword', e.target.value)}
                                  placeholder="e.g. pass123"
                                  style={{ borderColor: 'rgba(167, 139, 250, 0.4)', background: 'rgba(167, 139, 250, 0.05)' }}
                                />
                              </div>
                            </div>
                            <div className="se-grid-2" style={{ marginTop: '0.8rem' }}>
                              <div className="se-field">
                                <label>ID / Password Note</label>
                                <input
                                  type="text"
                                  value={ed.note || ''}
                                  onChange={(e) => handleEditorFieldChange(slot._id, 'note', e.target.value)}
                                  placeholder="e.g. Will be provided 30 min before match"
                                />
                              </div>
                              <div className="se-field">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                                  WhatsApp Group Link (Paid users only)
                                </label>
                                <input
                                  type="url"
                                  value={ed.whatsappLink || ''}
                                  onChange={(e) => handleEditorFieldChange(slot._id, 'whatsappLink', e.target.value)}
                                  placeholder="https://chat.whatsapp.com/..."
                                />
                              </div>
                            </div>
                          </div>

                          {/* Save Button */}
                          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              className={`slot-editor-save-btn ${isSaved ? 'saved' : ''}`}
                              onClick={() => handleEditorSave(slot._id)}
                              disabled={isSaving}
                            >
                              {isSaving ? (
                                <>
                                  <div className="se-spinner" /> Saving Slot…
                                </>
                              ) : isSaved ? (
                                <>
                                  <CheckCircle size={16} /> Saved Successfully!
                                </>
                              ) : (
                                <>
                                  <Save size={16} /> Save Slot Changes
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
              ) : activeTab === 'announcements' ? (
                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Announcement Title</label>
                    <input
                      type="text"
                      value={formData.title || ''}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Scrim Schedule Update"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Content / Message</label>
                    <textarea
                      rows="4"
                      value={formData.content || ''}
                      onChange={e => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Write announcement message that will appear on homepage..."
                      required
                    />
                  </div>
                  <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Author</label>
                      <input
                        type="text"
                        value={formData.author || ''}
                        onChange={e => setFormData({ ...formData, author: e.target.value })}
                        placeholder="e.g. Rising Admin"
                      />
                    </div>
                    <div className="form-group">
                      <label>Status</label>
                      <select
                        value={formData.isActive ? 'active' : 'hidden'}
                        onChange={e => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                      >
                        <option value="active">Active (Visible on Homepage)</option>
                        <option value="hidden">Hidden</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : activeTab === 'matches' ? (
                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Match Name</label>
                    <input
                      type="text"
                      value={formData.matchName || ''}
                      onChange={e => setFormData({ ...formData, matchName: e.target.value })}
                      placeholder="e.g. Daily Scrims Slot #1"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      value={formData.date || ''}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Timing</label>
                    <input
                      type="text"
                      value={formData.timing || ''}
                      onChange={e => setFormData({ ...formData, timing: e.target.value })}
                      placeholder="e.g. 9:00 PM"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Mode</label>
                    <input
                      type="text"
                      value={formData.mode || ''}
                      onChange={e => setFormData({ ...formData, mode: e.target.value })}
                      placeholder="e.g. Squad TPP"
                    />
                  </div>
                  <div className="form-group">
                    <label>Maps (comma separated)</label>
                    <input
                      type="text"
                      value={formData.maps || ''}
                      onChange={e => setFormData({ ...formData, maps: e.target.value })}
                      placeholder="Erangel, Miramar"
                    />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={formData.status || 'UPCOMING'}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="UPCOMING">Upcoming</option>
                      <option value="LIVE">Live</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Total Teams</label>
                    <input
                      type="number"
                      value={formData.totalTeams || 20}
                      onChange={e => setFormData({ ...formData, totalTeams: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Entry Fee (₹)</label>
                    <input
                      type="number"
                      value={formData.entryFee || 0}
                      onChange={e => setFormData({ ...formData, entryFee: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Prize Pool (₹)</label>
                    <input
                      type="number"
                      value={formData.prizePool || 0}
                      onChange={e => setFormData({ ...formData, prizePool: Number(e.target.value) })}
                    />
                  </div>
                </div>
              ) : activeTab === 'slots' ? (
                <div className="new-slot-modern-modal">
                  <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label>Match Title</label>
                      <input
                        type="text"
                        value={formData.matchName || ''}
                        onChange={e => setFormData({ ...formData, matchName: e.target.value })}
                        placeholder="e.g. RISING 1-3 GRIND SCRIMS"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Category Tab</label>
                      <select
                        value={formData.category || 'SCRIMS'}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                        className="se-select"
                      >
                        <option value="SCRIMS">SCRIMS</option>
                        <option value="GRANDS">GRANDS</option>
                        <option value="WEEKLY WAR">WEEKLY WAR</option>
                        <option value="WEEKEND WAR">WEEKEND WAR</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Lobby Name</label>
                      <input
                        type="text"
                        value={formData.lobby || 'LOBBY 1'}
                        onChange={e => setFormData({ ...formData, lobby: e.target.value })}
                        placeholder="e.g. LOBBY 1, LOBBY 2"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Date</label>
                      <input
                        type="text"
                        value={formData.date || ''}
                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                        placeholder="e.g. 23 Sep 2026"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Entry Fee (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.entryFee ?? 60}
                        onChange={e => setFormData({ ...formData, entryFee: Number(e.target.value), price: Number(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Total Slots / Max Teams</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.maxTeams ?? 19}
                        onChange={e => setFormData({ ...formData, maxTeams: Number(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Map Rotation (comma separated)</label>
                      <input
                        type="text"
                        value={Array.isArray(formData.maps) ? formData.maps.join(', ') : (formData.maps || '')}
                        onChange={e => setFormData({ ...formData, maps: e.target.value })}
                        placeholder="ERANGEL, RONDO, MIRAMAR"
                      />
                    </div>
                  </div>

                  {/* Schedule Matches */}
                  <div className="se-subpanel" style={{ marginTop: '1.2rem' }}>
                    <div className="se-subpanel-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#c084fc', fontWeight: '700', fontSize: '0.88rem' }}>
                        <Clock size={16} /> SCHEDULE MATCHES
                      </div>
                      <button
                        type="button"
                        className="se-pill-add-btn"
                        onClick={addModalScheduleMatch}
                      >
                        + Add Match
                      </button>
                    </div>
                    <div className="se-items-row">
                      {(formData.scheduleMatches || []).map((m, mIdx) => (
                        <div key={mIdx} className="se-match-item-card">
                          <input
                            type="text"
                            value={m.label || `MATCH ${mIdx + 1}`}
                            onChange={e => handleModalScheduleChange(mIdx, 'label', e.target.value)}
                            className="se-match-label-input"
                            placeholder="MATCH 1"
                          />
                          <input
                            type="text"
                            value={m.time || ''}
                            onChange={e => handleModalScheduleChange(mIdx, 'time', e.target.value)}
                            className="se-match-time-input"
                            placeholder="1:42 PM"
                          />
                          {(formData.scheduleMatches || []).length > 1 && (
                            <button
                              type="button"
                              className="se-item-del-btn"
                              onClick={() => removeModalScheduleMatch(mIdx)}
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Prize Pool Distribution */}
                  <div className="se-subpanel" style={{ marginTop: '1rem' }}>
                    <div className="se-subpanel-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#facc15', fontWeight: '700', fontSize: '0.88rem' }}>
                        <Trophy size={16} /> PRIZE POOL DISTRIBUTION
                      </div>
                      <button
                        type="button"
                        className="se-pill-add-btn"
                        onClick={addModalPrizeDistRow}
                      >
                        + Add Rank
                      </button>
                    </div>
                    <div className="se-items-row">
                      {(formData.prizeDistribution || []).map((p, pIdx) => (
                        <div key={pIdx} className="se-prize-item-card">
                          <input
                            type="text"
                            value={p.rank || `#${pIdx + 1}`}
                            onChange={e => handleModalPrizeDistChange(pIdx, 'rank', e.target.value)}
                            className="se-prize-rank-input"
                            placeholder="#1"
                          />
                          <input
                            type="text"
                            value={p.prize || ''}
                            onChange={e => handleModalPrizeDistChange(pIdx, 'prize', e.target.value)}
                            className="se-prize-val-input"
                            placeholder="₹400 / FREE"
                          />
                          {(formData.prizeDistribution || []).length > 1 && (
                            <button
                              type="button"
                              className="se-item-del-btn"
                              onClick={() => removeModalPrizeDistRow(pIdx)}
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Credentials */}
                  <div className="se-credentials-box" style={{ marginTop: '1rem' }}>
                    <div className="se-grid-2">
                      <div className="se-field">
                        <label style={{ color: '#a78bfa', fontWeight: '700' }}>🔑 Room ID</label>
                        <input
                          type="text"
                          value={formData.roomId || ''}
                          onChange={e => setFormData({ ...formData, roomId: e.target.value })}
                          placeholder="e.g. 84729103"
                          style={{ borderColor: 'rgba(167, 139, 250, 0.4)', background: 'rgba(167, 139, 250, 0.05)' }}
                        />
                      </div>
                      <div className="se-field">
                        <label style={{ color: '#a78bfa', fontWeight: '700' }}>🔒 Room Password</label>
                        <input
                          type="text"
                          value={formData.roomPassword || ''}
                          onChange={e => setFormData({ ...formData, roomPassword: e.target.value })}
                          placeholder="e.g. pass123"
                          style={{ borderColor: 'rgba(167, 139, 250, 0.4)', background: 'rgba(167, 139, 250, 0.05)' }}
                        />
                      </div>
                    </div>
                    <div className="se-grid-2" style={{ marginTop: '0.8rem' }}>
                      <div className="se-field">
                        <label>ID / Password Note</label>
                        <input
                          type="text"
                          value={formData.note || ''}
                          onChange={e => setFormData({ ...formData, note: e.target.value })}
                          placeholder="e.g. Will be provided 30 min before match"
                        />
                      </div>
                      <div className="se-field">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                          WhatsApp Group Link
                        </label>
                        <input
                          type="url"
                          value={formData.whatsappLink || ''}
                          onChange={e => setFormData({ ...formData, whatsappLink: e.target.value })}
                          placeholder="https://chat.whatsapp.com/..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
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

      {/* ── RESULTS BUILDER MODAL ── */}
      {resultsModal && (
        <div className="modal-overlay fade-in" onClick={() => setResultsModal(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Award size={20} style={{ color: 'var(--purple-light)' }} />
                <h3>Record &amp; Publish Scrim Results</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setResultsModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveMatchResults}>
              <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label>Match / Scrim Name</label>
                  <input
                    type="text"
                    value={resultsFormData.matchName}
                    onChange={e => setResultsFormData({ ...resultsFormData, matchName: e.target.value })}
                    placeholder="e.g. Scrim #1 - Erangel"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={resultsFormData.date}
                    onChange={e => setResultsFormData({ ...resultsFormData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Timing</label>
                  <input
                    type="text"
                    value={resultsFormData.timing}
                    onChange={e => setResultsFormData({ ...resultsFormData, timing: e.target.value })}
                    placeholder="e.g. 9:00 PM"
                  />
                </div>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--purple-muted)', marginBottom: '0.5rem' }}>
                Enter Team Names and Kills below. Placement points and Total points are auto-calculated and synced to Leaderboard.
              </p>

              <div className="results-input-table-wrap" style={{ maxHeight: '350px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <table className="rankings-table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>Pos</th>
                      <th>Team Name</th>
                      <th style={{ width: '100px' }}>Tag</th>
                      <th style={{ width: '90px' }}>Kills</th>
                      <th style={{ width: '90px' }}>Place Pts</th>
                      <th style={{ width: '90px' }}>Total Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamResultsRows.map((row, idx) => (
                      <tr key={idx}>
                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>#{row.position}</td>
                        <td>
                          <input
                            type="text"
                            value={row.teamName}
                            placeholder={`Team for #${row.position}`}
                            onChange={e => handleTeamRowChange(idx, 'teamName', e.target.value)}
                            style={{ width: '100%', padding: '0.35rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px' }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={row.teamTag}
                            placeholder="TAG"
                            onChange={e => handleTeamRowChange(idx, 'teamTag', e.target.value)}
                            style={{ width: '100%', padding: '0.35rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px' }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            value={row.kills}
                            onChange={e => handleTeamRowChange(idx, 'kills', e.target.value)}
                            style={{ width: '100%', padding: '0.35rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px' }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            value={row.placementPoints}
                            onChange={e => handleTeamRowChange(idx, 'placementPoints', e.target.value)}
                            style={{ width: '100%', padding: '0.35rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px' }}
                          />
                        </td>
                        <td style={{ fontWeight: 'bold', color: '#10b981', textAlign: 'center' }}>
                          {row.totalPoints}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="modal-footer" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}>
                <button type="button" className="tab-btn cancel-btn" onClick={() => setResultsModal(false)}>Cancel</button>
                <button type="submit" className="action-btn" disabled={isSubmitting} style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
                  {isSubmitting ? 'Publishing...' : 'Publish Results & Sync Rankings'}
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
