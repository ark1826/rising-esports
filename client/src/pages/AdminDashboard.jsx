import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  Plus,
  Edit2,
  Trash2,
  LogOut,
  Trophy,
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
  Award,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Filter,
  MapPin,
  Clock,
  Copy,
  Eye,
  EyeOff,
} from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('rankings');
  const [rankings, setRankings] = useState([]);
  const [slots, setSlots] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [bookings, setBookings] = useState([]);

  // ── Manage Slots scheduling & filter states ──
  const [slotSearch, setSlotSearch] = useState('');
  const [slotCategoryFilter, setSlotCategoryFilter] = useState('ALL');
  const [slotStatusFilter, setSlotStatusFilter] = useState('ALL');
  const [slotDateFilter, setSlotDateFilter] = useState('');
  const [announcements, setAnnouncements] = useState([]);
  const [matches, setMatches] = useState([]);
  const [matchResults, setMatchResults] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [walletSubTab, setWalletSubTab] = useState('deposits'); // 'deposits' | 'withdrawals' | 'all' | 'adjust'
  const [todaySlotsDate, setTodaySlotsDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [slotDropdownOpen, setSlotDropdownOpen] = useState(false);
  const slotDropdownRef = useRef(null);
  const [showAdvancedSlotFields, setShowAdvancedSlotFields] = useState(false);
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

  // ── Requirements Management State ──
  const [requirements, setRequirements] = useState([]);
  const [reqSearch, setReqSearch] = useState('');
  const [reqTypeFilter, setReqTypeFilter] = useState('ALL'); // 'ALL' | 'PLAYER' | 'TEAM'
  const [reqStatusFilter, setReqStatusFilter] = useState('ALL'); // 'ALL' | 'active' | 'inactive'
  const [viewReqModal, setViewReqModal] = useState({ open: false, item: null });

  // ── Result Photo Upload State ──
  const [showUploadResultPhotoModal, setShowUploadResultPhotoModal] = useState(false);
  const [uploadResultForm, setUploadResultForm] = useState({
    category: 'DAILY SCRIMS',
    matchName: 'RISING 03-05 PM GRIND SCRIMS - POINT TABLE',
    lobby: 'LOBBY 01',
    date: new Date().toISOString().split('T')[0],
    isBatchMode: true,
    items: [],
    manualUrl: '',
  });
  const [uploadingResultPhoto, setUploadingResultPhoto] = useState(false);
  const [previewPhotoModal, setPreviewPhotoModal] = useState({ open: false, url: '', title: '', allUrls: [], activeIndex: 0 });
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

  // ── Official Community WhatsApp Group state ──
  const [showOfficialWaModal, setShowOfficialWaModal] = useState(false);
  const [officialWaLink, setOfficialWaLink] = useState('https://chat.whatsapp.com/FLX8eM2APOFCyiK8ReWER6?mode=gi_t');
  const [savingOfficialWa, setSavingOfficialWa] = useState(false);
  const [officialWaSavedMsg, setOfficialWaSavedMsg] = useState(null);

  // ── Team Assignment & Multiple Teams state ──
  const [availableTeams, setAvailableTeams] = useState([]);
  const [teamAssignModal, setTeamAssignModal] = useState({ open: false, slot: null });
  const [assignTeamForm, setAssignTeamForm] = useState({ userId: '', dropLocation: '' });
  const [assigningTeam, setAssigningTeam] = useState(false);

  // ── Drop Details management state ──
  const [selectedDropSlotId, setSelectedDropSlotId] = useState('');
  const [dropDetailForm, setDropDetailForm] = useState({
    matchNumber: 1,
    matchLabel: 'MATCH 1',
    map: 'ERANGEL',
    teamId: '',
    teamName: '',
    dropLocation: ''
  });
  const [editingDropDetailId, setEditingDropDetailId] = useState(null);
  const [savingDropDetail, setSavingDropDetail] = useState(false);

  const tabsRef = useRef(null);

  useEffect(() => {
    if (tabsRef.current) {
      const activeEl = tabsRef.current.querySelector('.tab-btn.active');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [activeTab]);

  // Close slot creation dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (slotDropdownRef.current && !slotDropdownRef.current.contains(e.target)) {
        setSlotDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

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
      const [rankRes, slotRes, bookingRes, tourRes, annRes, matchRes, resultsRes, wthRes, depRes, allTxnRes, usersRes, teamsRes, reqsRes] = await Promise.all([
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
        axios.get(`${apiUrl}/api/slots/available-teams`, config).catch(() => ({ data: [] })),
        axios.get(`${apiUrl}/api/requirements/admin/all`, config).catch(() => ({ data: [] })),
      ]);
      setRankings(rankRes.data || []);
      const loadedSlots = slotRes.data || [];
      setSlots(loadedSlots);
      if (loadedSlots.length > 0 && !selectedDropSlotId) {
        setSelectedDropSlotId(loadedSlots[0]._id);
      }
      setTournaments(tourRes.data || []);
      setBookings(bookingRes.data || []);
      setAnnouncements(annRes.data || []);
      setMatches(matchRes.data || []);
      setMatchResults(resultsRes.data || []);
      setWithdrawals(wthRes.data || []);
      setDeposits(depRes.data || []);
      setAllTransactions(allTxnRes.data?.transactions || allTxnRes.data || []);
      setAllUsers(usersRes.data || []);
      setAvailableTeams(teamsRes.data || []);
      setRequirements(reqsRes.data || []);

      axios.get(`${apiUrl}/api/config/official-whatsapp`)
        .then(r => { if (r.data?.url) setOfficialWaLink(r.data.url); })
        .catch(() => {});
    } catch (err) {
      console.error('Error fetching data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRequirement = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this requirement? This will update the user active limit and remove it from public listing.')) {
      return;
    }
    try {
      await axios.delete(`${apiUrl}/api/requirements/admin/${id}`, config);
      alert('Requirement deleted successfully!');
      setRequirements(prev => prev.filter(r => r._id !== id));
      if (viewReqModal.open && viewReqModal.item?._id === id) {
        setViewReqModal({ open: false, item: null });
      }
    } catch (err) {
      alert('Failed to delete requirement: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleToggleRequirementStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const { data } = await axios.patch(`${apiUrl}/api/requirements/admin/${id}/status`, { status: nextStatus }, config);
      alert(data?.message || `Status updated to ${nextStatus}`);
      setRequirements(prev => prev.map(r => r._id === id ? { ...r, status: nextStatus } : r));
      if (viewReqModal.open && viewReqModal.item?._id === id) {
        setViewReqModal(prev => ({ ...prev, item: { ...prev.item, status: nextStatus } }));
      }
    } catch (err) {
      alert('Failed to update status: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleOpenUploadResultPhotoModal = (category = 'DAILY SCRIMS', match = null) => {
    const isDaily = category === 'DAILY SCRIMS';
    setUploadResultForm({
      category: category || 'DAILY SCRIMS',
      matchName: match
        ? match.matchName
        : (isDaily ? 'RISING 03-05 PM GRIND SCRIMS - POINT TABLE' : 'RISING WEEKLY WAR - POINT TABLE'),
      lobby: match ? (match.lobby || 'LOBBY 01') : 'LOBBY 01',
      date: match ? match.date : new Date().toISOString().split('T')[0],
      isBatchMode: true,
      items: [],
      manualUrl: '',
    });
    setShowUploadResultPhotoModal(true);
  };

  const handleResultPhotoFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      const defaultLobbies = ['LOBBY 01', 'LOBBY 02', 'LOBBY 03', 'LOBBY 04', 'LOBBY 05', 'LOBBY 06'];
      const newItems = selectedFiles.map((file, idx) => ({
        file,
        preview: URL.createObjectURL(file),
        lobby: defaultLobbies[idx % defaultLobbies.length],
        title: uploadResultForm.matchName || (uploadResultForm.category === 'DAILY SCRIMS' ? 'RISING SCRIM - POINT TABLE' : 'RISING WAR - POINT TABLE'),
      }));

      setUploadResultForm(prev => ({
        ...prev,
        items: newItems,
      }));
    }
  };

  const handleUpdateItemLobby = (index, newLobby) => {
    setUploadResultForm(prev => {
      const copy = [...prev.items];
      copy[index] = { ...copy[index], lobby: newLobby };
      return { ...prev, items: copy };
    });
  };

  const handleRemovePhotoItem = (index) => {
    setUploadResultForm(prev => {
      const copy = prev.items.filter((_, idx) => idx !== index);
      return { ...prev, items: copy };
    });
  };

  const handleUploadResultPhotoSubmit = async (e) => {
    e.preventDefault();
    if (!uploadResultForm.matchName.trim()) {
      alert('Please enter a match / scrim title.');
      return;
    }
    const hasFiles = uploadResultForm.items && uploadResultForm.items.length > 0;
    if (!hasFiles && !uploadResultForm.manualUrl.trim()) {
      alert('Please select at least one result photo or provide an image URL.');
      return;
    }

    setUploadingResultPhoto(true);
    try {
      const fd = new FormData();
      fd.append('category', uploadResultForm.category || 'DAILY SCRIMS');
      fd.append('matchName', uploadResultForm.matchName.trim());
      fd.append('lobby', uploadResultForm.lobby.trim());
      fd.append('date', uploadResultForm.date.trim());

      if (uploadResultForm.isBatchMode && uploadResultForm.items.length > 1) {
        fd.append('batch', 'true');
        const lobbies = uploadResultForm.items.map(it => it.lobby);
        const titles = uploadResultForm.items.map(it => it.title || uploadResultForm.matchName.trim());
        fd.append('batchLobbies', JSON.stringify(lobbies));
        fd.append('batchTitles', JSON.stringify(titles));
        uploadResultForm.items.forEach(it => {
          fd.append('resultImages', it.file);
        });
      } else if (hasFiles) {
        uploadResultForm.items.forEach(it => {
          fd.append('resultImages', it.file);
        });
      }

      if (uploadResultForm.manualUrl && uploadResultForm.manualUrl.trim()) {
        fd.append('imageUrl', uploadResultForm.manualUrl.trim());
      }

      await axios.post(`${apiUrl}/api/results/upload-photo`, fd, {
        headers: {
          Authorization: `Bearer ${adminInfo?.token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      alert('Point table result(s) published successfully!');
      setShowUploadResultPhotoModal(false);
      await fetchData();
    } catch (err) {
      alert('Failed to upload result photo: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploadingResultPhoto(false);
    }
  };

  const fetchAvailableTeams = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/slots/available-teams`, config);
      setAvailableTeams(res.data || []);
    } catch (err) {
      console.error('Failed to fetch available teams', err);
    }
  };

  const handleOpenTeamAssignModal = (slot) => {
    setTeamAssignModal({ open: true, slot });
    setAssignTeamForm({ userId: '', dropLocation: '' });
    fetchAvailableTeams();
  };

  const handleAssignTeamToSlot = async (e) => {
    if (e) e.preventDefault();
    if (!teamAssignModal.slot?._id || !assignTeamForm.userId) {
      alert('Please select a team to assign.');
      return;
    }
    setAssigningTeam(true);
    try {
      await axios.post(
        `${apiUrl}/api/slots/${teamAssignModal.slot._id}/teams`,
        {
          userId: assignTeamForm.userId,
          dropLocation: assignTeamForm.dropLocation.trim()
        },
        config
      );
      alert('Team successfully assigned to slot!');
      setTeamAssignModal({ open: false, slot: null });
      setAssignTeamForm({ userId: '', dropLocation: '' });
      await fetchData();
    } catch (err) {
      alert('Failed to assign team: ' + (err.response?.data?.message || err.message));
    } finally {
      setAssigningTeam(false);
    }
  };

  const handleRemoveTeamFromSlot = async (slotId, bookingId, teamName) => {
    if (!window.confirm(`Are you sure you want to remove team "${teamName || 'this team'}" from this slot?`)) {
      return;
    }
    try {
      await axios.delete(`${apiUrl}/api/slots/${slotId}/teams/${bookingId}`, config);
      alert('Team removed successfully!');
      await fetchData();
    } catch (err) {
      alert('Failed to remove team: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleTogglePublish = async (slotId, currentPublished) => {
    try {
      const { data } = await axios.patch(`${apiUrl}/api/slots/${slotId}/publish`, { isPublished: !currentPublished }, config);
      await fetchData();
      alert(data?.message || (currentPublished ? 'Unpublished (draft)' : 'Published to public'));
    } catch (err) {
      alert('Failed to update visibility: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDuplicateSlot = async (slotId) => {
    try {
      const { data } = await axios.post(`${apiUrl}/api/slots/${slotId}/duplicate`, {}, config);
      await fetchData();
      alert('Slot duplicated successfully as draft! You can now adjust its timing, lobby, and publish it.');
    } catch (err) {
      alert('Duplicate failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleSaveDropDetail = async (e) => {
    if (e) e.preventDefault();
    if (!selectedDropSlotId) {
      alert('Please select a slot.');
      return;
    }
    if (!dropDetailForm.teamId) {
      alert('Please select a team.');
      return;
    }
    if (!dropDetailForm.dropLocation || !dropDetailForm.dropLocation.trim()) {
      alert('Please enter a drop location.');
      return;
    }

    setSavingDropDetail(true);
    try {
      const teamObj = availableTeams.find(t => String(t._id) === String(dropDetailForm.teamId));
      await axios.put(
        `${apiUrl}/api/slots/${selectedDropSlotId}/drop-details`,
        {
          detailId: editingDropDetailId,
          matchNumber: Number(dropDetailForm.matchNumber) || 1,
          matchLabel: dropDetailForm.matchLabel || `MATCH ${dropDetailForm.matchNumber || 1}`,
          map: dropDetailForm.map || 'ERANGEL',
          teamId: dropDetailForm.teamId,
          teamName: teamObj?.teamName || dropDetailForm.teamName || '',
          teamTag: teamObj?.teamTag || '',
          teamLogo: teamObj?.teamLogo || '',
          registrationNumber: teamObj?.registrationNumber || null,
          dropLocation: dropDetailForm.dropLocation.trim()
        },
        config
      );
      alert('Drop detail saved and published successfully!');
      setEditingDropDetailId(null);
      setDropDetailForm(prev => ({
        ...prev,
        teamId: '',
        teamName: '',
        dropLocation: ''
      }));
      await fetchData();
    } catch (err) {
      alert('Failed to save drop detail: ' + (err.response?.data?.message || err.message));
    } finally {
      setSavingDropDetail(false);
    }
  };

  const handleDeleteDropDetail = async (slotId, detailId) => {
    if (!window.confirm('Are you sure you want to delete this published drop detail?')) return;
    try {
      await axios.delete(`${apiUrl}/api/slots/${slotId}/drop-details/${detailId}`, config);
      alert('Drop detail deleted.');
      await fetchData();
    } catch (err) {
      alert('Failed to delete drop detail: ' + (err.response?.data?.message || err.message));
    }
  };

  useEffect(() => {
    if (slots.length > 0) {
      const map = {};
      slots.forEach((s) => {
        const matches = Array.isArray(s.scheduleMatches) && s.scheduleMatches.length > 0
          ? s.scheduleMatches
          : (s.timing ? [{ matchNumber: 1, label: 'MATCH 1', time: s.timing }] : []);

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
          whatsappLink: s.whatsappLink || s.customLink || '',
          customLink: s.customLink || s.whatsappLink || '',
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

  // ────────────────────────── UNIFIED SLOT CREATION & PRESETS ──────────────────────────

  const formatDateForSlot = (dateObj) => {
    if (!dateObj || isNaN(new Date(dateObj).getTime())) {
      return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    const d = new Date(dateObj);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getUpcomingDayDate = (targetDayOfWeek) => {
    const now = new Date();
    const currentDay = now.getDay();
    let diff = targetDayOfWeek - currentDay;
    if (diff < 0) diff += 7;
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + diff);
    return targetDate;
  };

  const isSlotForDate = (slot, dateIsoStr) => {
    if (!slot) return false;
    if (!dateIsoStr) return true;

    if (slot.slotTime) {
      const d = new Date(slot.slotTime);
      if (!isNaN(d.getTime())) {
        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (iso === dateIsoStr) return true;
      }
    }

    const sDate = String(slot.date || '').trim();
    if (!sDate) return false;

    if (sDate.includes(dateIsoStr)) return true;

    const targetDate = new Date(dateIsoStr + 'T00:00:00');
    if (!isNaN(targetDate.getTime())) {
      const day = targetDate.getDate();
      const monthShort = targetDate.toLocaleDateString('en-US', { month: 'short' }).toLowerCase();
      const monthLong = targetDate.toLocaleDateString('en-US', { month: 'long' }).toLowerCase();
      const sLower = sDate.toLowerCase();

      if (sLower.includes(`${day} ${monthShort}`) || sLower.includes(`${day} ${monthLong}`)) {
        return true;
      }

      const parsed = new Date(sDate);
      if (!isNaN(parsed.getTime())) {
        const parsedIso = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
        if (parsedIso === dateIsoStr) return true;
      }
    }

    return false;
  };

  const generateSlotPreset = (type = 'today', baseDateIso) => {
    const todayDateObj = baseDateIso ? new Date(baseDateIso + 'T00:00:00') : new Date();
    const todayFormatted = !isNaN(todayDateObj.getTime())
      ? formatDateForSlot(todayDateObj)
      : formatDateForSlot(new Date());

    if (type === 'weekend' || type === 'WEEKEND WAR') {
      const upcomingSat = getUpcomingDayDate(6);
      return {
        presetType: 'weekend',
        category: 'WEEKEND WAR',
        lobby: 'LOBBY 1',
        matchName: 'RISING WEEKEND WAR #01',
        date: formatDateForSlot(upcomingSat),
        timing: '06:00 PM',
        mode: 'Squad TPP',
        entryFee: 100,
        price: 100,
        prizePoolTotal: 10000,
        maxTeams: 20,
        isPublished: true,
        registrationStatus: 'Open',
        registrationOpenTime: '',
        registrationCloseTime: '',
        description: 'Official Rising Weekend War. 4 intense maps, high points multiplier, and ₹10,000 cash pool.',
        rules: '1. Emulators/iPads strictly banned.\n2. 4 matches back to back.\n3. Official points table updated live.',
        maps: 'ERANGEL, MIRAMAR, SANHOK, RONDO',
        scheduleMatches: [
          { matchNumber: 1, label: 'MATCH 1', time: '06:00 PM', map: 'ERANGEL' },
          { matchNumber: 2, label: 'MATCH 2', time: '06:50 PM', map: 'MIRAMAR' },
          { matchNumber: 3, label: 'MATCH 3', time: '07:40 PM', map: 'SANHOK' },
          { matchNumber: 4, label: 'MATCH 4', time: '08:30 PM', map: 'RONDO' },
        ],
        prizeDistribution: [
          { rank: '#1', prize: '₹1,000' },
          { rank: '#2', prize: '₹500' },
          { rank: '#3', prize: '₹300' },
          { rank: '#4', prize: '₹200' },
          { rank: '#5', prize: '₹100' },
        ],
        roomId: '',
        roomPassword: '',
        note: 'Weekend War official rules apply. ID/Pass 20 min before match.',
        whatsappLink: '',
      };
    }

    if (type === 'weekly' || type === 'WEEKLY WAR') {
      const upcomingFri = getUpcomingDayDate(5);
      return {
        presetType: 'weekly',
        category: 'WEEKLY WAR',
        lobby: 'LOBBY 1',
        matchName: 'RISING WEEKLY WAR #01',
        date: formatDateForSlot(upcomingFri),
        timing: '08:00 PM',
        mode: 'Squad TPP',
        entryFee: 80,
        price: 80,
        prizePoolTotal: 7500,
        maxTeams: 20,
        isPublished: true,
        registrationStatus: 'Open',
        registrationOpenTime: '',
        registrationCloseTime: '',
        description: 'Weekly War tournament with weekly leaderboard points and cash rewards.',
        rules: '1. BGMI standard competitive rules.\n2. Teams must join their allocated slot numbers.',
        maps: 'ERANGEL, MIRAMAR, RONDO',
        scheduleMatches: [
          { matchNumber: 1, label: 'MATCH 1', time: '08:00 PM', map: 'ERANGEL' },
          { matchNumber: 2, label: 'MATCH 2', time: '08:50 PM', map: 'MIRAMAR' },
          { matchNumber: 3, label: 'MATCH 3', time: '09:40 PM', map: 'RONDO' },
        ],
        prizeDistribution: [
          { rank: '#1', prize: '₹750' },
          { rank: '#2', prize: '₹400' },
          { rank: '#3', prize: '₹250' },
          { rank: '#4', prize: '₹150' },
          { rank: '#5', prize: 'FREE' },
        ],
        roomId: '',
        roomPassword: '',
        note: 'ID / Pass will be provided 25 min before match',
        whatsappLink: '',
      };
    }

    if (type === 'grands' || type === 'GRANDS') {
      return {
        presetType: 'grands',
        category: 'GRANDS',
        lobby: 'LOBBY 1',
        matchName: 'RISING GRANDS FINALS',
        date: todayFormatted,
        timing: '07:00 PM',
        mode: 'Squad TPP',
        entryFee: 150,
        price: 150,
        prizePoolTotal: 25000,
        maxTeams: 20,
        isPublished: true,
        registrationStatus: 'Open',
        registrationOpenTime: '',
        registrationCloseTime: '',
        description: 'The pinnacle of Rising Esports: Grands Championship finals with official broadcast.',
        rules: '1. Official esports tournament handbook applies.\n2. Stream delay 180s.\n3. POV recording mandatory on request.',
        maps: 'ERANGEL, MIRAMAR, ERANGEL, MIRAMAR',
        scheduleMatches: [
          { matchNumber: 1, label: 'MATCH 1', time: '07:00 PM', map: 'ERANGEL' },
          { matchNumber: 2, label: 'MATCH 2', time: '07:50 PM', map: 'MIRAMAR' },
          { matchNumber: 3, label: 'MATCH 3', time: '08:40 PM', map: 'ERANGEL' },
          { matchNumber: 4, label: 'MATCH 4', time: '09:30 PM', map: 'MIRAMAR' },
        ],
        prizeDistribution: [
          { rank: '#1', prize: '₹2,500' },
          { rank: '#2', prize: '₹1,500' },
          { rank: '#3', prize: '₹1,000' },
          { rank: '#4', prize: '₹600' },
          { rank: '#5', prize: '₹400' },
        ],
        roomId: '',
        roomPassword: '',
        note: 'Official Grands lobby. ID/Pass 30 min before match.',
        whatsappLink: '',
      };
    }

    if (type === 'custom') {
      return {
        presetType: 'custom',
        category: 'SCRIMS',
        lobby: 'LOBBY 1',
        matchName: '',
        date: todayFormatted,
        timing: '02:00 PM',
        mode: 'Squad TPP',
        entryFee: 60,
        price: 60,
        prizePoolTotal: 5000,
        maxTeams: 20,
        isPublished: true,
        registrationStatus: 'Open',
        registrationOpenTime: '',
        registrationCloseTime: '',
        description: '',
        rules: '',
        maps: 'ERANGEL, RONDO, MIRAMAR',
        scheduleMatches: [
          { matchNumber: 1, label: 'MATCH 1', time: '02:00 PM', map: 'ERANGEL' },
        ],
        prizeDistribution: [
          { rank: '#1', prize: '₹400' },
          { rank: '#2', prize: '₹150' },
          { rank: '#3', prize: '₹100' },
        ],
        roomId: '',
        roomPassword: '',
        note: 'ID / Pass will be provided 30 min before match',
        whatsappLink: '',
      };
    }

    // Default: 'today' (SCRIMS)
    return {
      presetType: 'today',
      category: 'SCRIMS',
      lobby: 'LOBBY 1',
      matchName: 'RISING 1-3 GRIND SCRIMS',
      date: todayFormatted,
      timing: '02:00 PM',
      mode: 'Squad TPP',
      entryFee: 60,
      price: 60,
      prizePoolTotal: 5000,
      maxTeams: 19,
      isPublished: true,
      registrationStatus: 'Open',
      registrationOpenTime: '',
      registrationCloseTime: '',
      description: 'Daily grind scrims for all passionate BGMI players. Compete, showcase your skills and win rewards!',
      rules: '1. Emulators / iPads strictly prohibited.\n2. Match starts strictly on time.\n3. Points table updated after match finish.',
      maps: 'ERANGEL, RONDO, MIRAMAR',
      scheduleMatches: [
        { matchNumber: 1, label: 'MATCH 1', time: '02:00 PM', map: 'ERANGEL' },
        { matchNumber: 2, label: 'MATCH 2', time: '02:45 PM', map: 'MIRAMAR' },
        { matchNumber: 3, label: 'MATCH 3', time: '03:30 PM', map: 'RONDO' },
      ],
      prizeDistribution: [
        { rank: '#1', prize: '₹400' },
        { rank: '#2', prize: '₹150' },
        { rank: '#3', prize: '₹100' },
        { rank: '#4', prize: '₹70' },
        { rank: '#5', prize: 'FREE' },
      ],
      roomId: '',
      roomPassword: '',
      note: 'ID / Pass will be provided 30 min before match',
      whatsappLink: '',
    };
  };

  const handleOpenSlotModal = (presetOrItem = 'today') => {
    setShowAdvancedSlotFields(false);
    if (presetOrItem && typeof presetOrItem === 'object' && presetOrItem._id) {
      setEditingItem(presetOrItem);
      const item = presetOrItem;
      const matches = Array.isArray(item.scheduleMatches) && item.scheduleMatches.length > 0
        ? item.scheduleMatches
        : (item.timing ? [{ matchNumber: 1, label: 'MATCH 1', time: item.timing, map: 'ERANGEL' }] : []);

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
        prizePoolTotal: item.prizePoolTotal ?? 5000,
        maxTeams: item.maxTeams ?? 20,
        isPublished: item.isPublished !== false,
        registrationStatus: item.registrationStatus || 'Open',
        registrationOpenTime: item.registrationOpenTime || '',
        registrationCloseTime: item.registrationCloseTime || '',
        description: item.description || '',
        rules: item.rules || '',
        maps: Array.isArray(item.maps) ? item.maps.join(', ') : (item.maps || 'ERANGEL, RONDO, MIRAMAR'),
        scheduleMatches: matches,
        prizeDistribution: pDist,
        roomId: item.roomId || '',
        roomPassword: item.roomPassword || '',
        note: item.note || '',
        whatsappLink: item.whatsappLink || item.customLink || '',
        customLink: item.customLink || item.whatsappLink || '',
        presetType: item.category === 'WEEKEND WAR' ? 'weekend' : item.category === 'WEEKLY WAR' ? 'weekly' : item.category === 'GRANDS' ? 'grands' : 'today',
      });
      setShowModal(true);
    } else {
      setEditingItem(null);
      const presetKey = typeof presetOrItem === 'string' ? presetOrItem : 'today';
      const presetData = generateSlotPreset(presetKey, todaySlotsDate);
      setFormData(presetData);
      setShowModal(true);
    }
  };

  const handleSwitchSlotPreset = (newPresetKey) => {
    const currentCustom = {
      lobby: formData.lobby,
      roomId: formData.roomId,
      roomPassword: formData.roomPassword,
      whatsappLink: formData.whatsappLink,
    };
    const newPreset = generateSlotPreset(newPresetKey, todaySlotsDate);
    setFormData(prev => ({
      ...newPreset,
      lobby: currentCustom.lobby || newPreset.lobby,
      roomId: currentCustom.roomId || newPreset.roomId,
      roomPassword: currentCustom.roomPassword || newPreset.roomPassword,
      whatsappLink: currentCustom.whatsappLink || newPreset.whatsappLink,
    }));
  };

  const setModalPrizePreset = (preset) => {
    if (preset === 'top3') {
      setFormData(prev => ({
        ...prev,
        prizeDistribution: [
          { rank: '#1', prize: '₹400' },
          { rank: '#2', prize: '₹150' },
          { rank: '#3', prize: '₹100' },
        ],
      }));
    } else if (preset === 'top5') {
      setFormData(prev => ({
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
      setFormData(prev => ({
        ...prev,
        prizeDistribution: [
          { rank: '#1', prize: '₹500' },
        ],
      }));
    }
  };

  const renderUnifiedSlotCreateButton = () => (
    <button
      type="button"
      className="action-btn slot-create-primary-btn"
      onClick={() => handleOpenSlotModal('today')}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.45rem',
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        border: 'none',
        color: '#ffffff',
        fontWeight: '800',
        fontSize: '0.85rem',
        padding: '0.48rem 1.1rem',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
        cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
      title="Create Today Slot"
    >
      <Plus size={16} />
      <span>Create Slot</span>
    </button>
  );

  const handleOpenModal = (item = null) => {
    if (activeTab === 'slots' || activeTab === 'todayslots') {
      handleOpenSlotModal(item || 'today');
      return;
    }
    setEditingItem(item);
    if (item) {
      if (activeTab === 'announcements') {
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
      if (activeTab === 'slots' || activeTab === 'todayslots') {
        const slotTiming = (formData.timing || formData.scheduleMatches?.[0]?.time || '').trim();
        if (!slotTiming) {
          alert('Slot Timing is required (e.g. 2:00 PM)');
          setIsSubmitting(false);
          return;
        }
        const updatedMatches = (formData.scheduleMatches && formData.scheduleMatches.length > 0)
          ? formData.scheduleMatches.map((m, idx) => (idx === 0 ? { ...m, time: slotTiming } : m))
          : [{ matchNumber: 1, label: 'MATCH 1', time: slotTiming }];

        payload = {
          ...formData,
          category: formData.category || 'SCRIMS',
          lobby: formData.lobby || 'LOBBY 1',
          timing: slotTiming,
          price: Number(formData.price ?? formData.entryFee ?? 0),
          entryFee: Number(formData.entryFee ?? formData.price ?? 0),
          prizePoolTotal: Number(formData.prizePoolTotal || 0),
          maxTeams: Number(formData.maxTeams ?? 20),
          isPublished: formData.isPublished !== false,
          registrationStatus: formData.registrationStatus || 'Open',
          registrationOpenTime: formData.registrationOpenTime || '',
          registrationCloseTime: formData.registrationCloseTime || '',
          description: formData.description || '',
          rules: formData.rules || '',
          maps: typeof formData.maps === 'string'
            ? formData.maps.split(',').map(map => map.trim().toUpperCase()).filter(Boolean)
            : formData.maps || ['ERANGEL', 'RONDO', 'MIRAMAR'],
          scheduleMatches: updatedMatches,
          prizeDistribution: formData.prizeDistribution || [],
          customLink: formData.customLink || formData.whatsappLink || '',
          whatsappLink: formData.whatsappLink || formData.customLink || '',
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
      delete payload.heroImagePreview;

      let savedId;
      const resource = (activeTab === 'slots' || activeTab === 'todayslots') ? 'slots' : activeTab;
      if (editingItem) {
        await axios.put(`${apiUrl}/api/${resource}/${editingItem._id}`, payload, config);
        savedId = editingItem._id;
      } else {
        const res = await axios.post(`${apiUrl}/api/${resource}`, payload, config);
        savedId = res.data._id;
      }

      if ((activeTab === 'slots' || activeTab === 'todayslots') && formData.heroImageFile && savedId) {
        try {
          const fd = new FormData();
          fd.append('heroImage', formData.heroImageFile);
          await axios.post(`${apiUrl}/api/slots/${savedId}/upload-image`, fd, {
            headers: { Authorization: `Bearer ${adminInfo?.token}`, 'Content-Type': 'multipart/form-data' },
          });
        } catch (imgErr) {
          console.warn('Slot hero image upload failed:', imgErr.message);
        }
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
      const data = editorData[slotId] || {};
      const slotTiming = (data.timing || data.scheduleMatches?.[0]?.time || '').trim();
      const updatedMatches = (data.scheduleMatches && data.scheduleMatches.length > 0)
        ? data.scheduleMatches.map((m, idx) => (idx === 0 && slotTiming ? { ...m, time: slotTiming } : m))
        : (slotTiming ? [{ matchNumber: 1, label: 'MATCH 1', time: slotTiming }] : []);

      const payload = {
        ...data,
        category: data.category || 'SCRIMS',
        lobby: data.lobby || 'LOBBY 1',
        timing: slotTiming,
        entryFee: Number(data.entryFee ?? data.price ?? 0),
        price: Number(data.price ?? data.entryFee ?? 0),
        maxTeams: Number(data.maxTeams ?? 19),
        maps: typeof data.maps === 'string'
          ? data.maps.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
          : data.maps,
        scheduleMatches: updatedMatches,
        prizeDistribution: data.prizeDistribution || [],
        customLink: data.customLink || data.whatsappLink || '',
        whatsappLink: data.whatsappLink || data.customLink || '',
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

  // ── Save Official Community WhatsApp Group Link ──
  const handleSaveOfficialWa = async (e) => {
    if (e) e.preventDefault();
    if (!officialWaLink || !officialWaLink.trim()) {
      alert('Please enter a valid WhatsApp Group link');
      return;
    }
    setSavingOfficialWa(true);
    setOfficialWaSavedMsg(null);
    try {
      await axios.put(
        `${apiUrl}/api/config/official-whatsapp`,
        { url: officialWaLink.trim() },
        config
      );
      setOfficialWaSavedMsg('✅ Official WhatsApp Group link updated successfully!');
      setTimeout(() => {
        setOfficialWaSavedMsg(null);
        setShowOfficialWaModal(false);
      }, 1600);
    } catch (err) {
      alert('Failed to update link: ' + (err.response?.data?.message || err.message));
    } finally {
      setSavingOfficialWa(false);
    }
  };

  // ──────────────────────────── RENDER ────────────────────────────
  return (
    <div className="admin-dashboard fade-in">
      <div className="admin-nav">
        <h1>Admin <span>Panel</span></h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setShowOfficialWaModal(true)}
            className="tab-btn admin-official-wa-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'rgba(37, 211, 102, 0.14)',
              border: '1px solid rgba(37, 211, 102, 0.45)',
              color: '#4ade80',
              fontWeight: 700,
              padding: '0.45rem 0.9rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.82rem'
            }}
            title="Edit Official Community WhatsApp Group Link"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
            </svg>
            <span>Official WhatsApp Link</span>
          </button>
          <button onClick={handleLogout} className="tab-btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent' }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      {/* ── Mobile Quick Section Selector ── */}
      <div className="admin-mobile-tab-select-wrap">
        <label htmlFor="admin-mobile-tab-select" className="admin-mobile-tab-label">
          Quick Section Jump:
        </label>
        <div className="admin-mobile-select-wrapper">
          <select
            id="admin-mobile-tab-select"
            value={activeTab === 'withdrawals' || activeTab === 'transactions' ? 'wallet' : activeTab}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'official_wa') {
                setShowOfficialWaModal(true);
                return;
              }
              setActiveTab(val);
              if (val === 'wallet') setWalletSubTab('deposits');
            }}
            className="admin-mobile-tab-select"
          >
            <option value="todayslots">📅 Today Slots ({slots.filter(s => isSlotForDate(s, new Date().toISOString().split('T')[0])).length})</option>
            <option value="dropdetails">📍 Drop Details</option>
            <option value="slots">🎰 All Slots Editor ({slots.length})</option>
            <option value="official_wa">💬 Official WhatsApp Group Link</option>
            <option value="announcements">📢 Announcements ({announcements.length})</option>
            <option value="matches">⚔️ Matches ({matches.length})</option>
            <option value="results">🎖️ Results ({matchResults.length})</option>
            <option value="rankings">🏆 Rankings ({rankings.length})</option>
            <option value="wallet">
              💳 Wallet &amp; Txns {(deposits.filter(d => d.status === 'pending' || d.status === 'pending_verification').length + withdrawals.filter(w => w.status === 'pending').length) > 0 ? `(${deposits.filter(d => d.status === 'pending' || d.status === 'pending_verification').length + withdrawals.filter(w => w.status === 'pending').length} pending)` : ''}
            </option>
            <option value="payments">
              ✅ Slot Payments {bookings.filter(b => b.paymentStatus === 'pending_verification').length > 0 ? `(${bookings.filter(b => b.paymentStatus === 'pending_verification').length} pending)` : ''}
            </option>
            <option value="bookings">🛡️ Bookings ({bookings.length})</option>
            <option value="tournaments">🏆 Tournaments ({tournaments.length})</option>
          </select>
          <ChevronDown size={16} className="admin-mobile-select-icon" />
        </div>
      </div>

      <div className="admin-tabs" ref={tabsRef}>
        <button
          className={`tab-btn ${activeTab === 'todayslots' ? 'active' : ''}`}
          onClick={() => setActiveTab('todayslots')}
          style={{ background: activeTab === 'todayslots' ? 'rgba(16,185,129,0.15)' : '', borderColor: activeTab === 'todayslots' ? '#10b981' : '' }}
        >
          <Calendar size={18} style={{ marginRight: '8px', color: '#10b981' }} /> Today Slots
          {(() => {
            const todayIso = new Date().toISOString().split('T')[0];
            const todayCount = slots.filter(s => isSlotForDate(s, todayIso)).length;
            return todayCount > 0 ? (
              <span className="tab-counter-badge" style={{ background: '#10b981' }}>{todayCount}</span>
            ) : null;
          })()}
        </button>
        <button
          className={`tab-btn ${activeTab === 'dropdetails' ? 'active' : ''}`}
          onClick={() => setActiveTab('dropdetails')}
          style={{ background: activeTab === 'dropdetails' ? 'rgba(59,130,246,0.15)' : '', borderColor: activeTab === 'dropdetails' ? '#3b82f6' : '' }}
        >
          <MapPin size={18} style={{ marginRight: '8px', color: '#60a5fa' }} /> Drop Details
        </button>
        <button
          className={`tab-btn ${activeTab === 'slots' ? 'active' : ''}`}
          onClick={() => setActiveTab('slots')}
        >
          <LayoutList size={18} style={{ marginRight: '8px' }} /> Manage Slots
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
        <button
          className={`tab-btn ${activeTab === 'requirements' ? 'active' : ''}`}
          onClick={() => setActiveTab('requirements')}
        >
          <Users size={18} style={{ marginRight: '8px' }} /> Requirements
          {requirements.filter(r => r.status === 'active').length > 0 && (
            <span className="tab-counter-badge" style={{ background: '#7c3aed', color: '#fff' }}>
              {requirements.filter(r => r.status === 'active').length}
            </span>
          )}
        </button>
      </div>

      <div className="admin-section">
        <div className="admin-header">
          <h2>
            {activeTab === 'rankings' ? 'Manage Team Rankings'
              : activeTab === 'slots' ? 'Manage Slots'
              : activeTab === 'todayslots' ? `Today Slots — ${new Date(todaySlotsDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`
              : activeTab === 'dropdetails' ? 'Manage Drop Details'
              : activeTab === 'announcements' ? 'Manage Announcements'
              : activeTab === 'matches' ? 'Manage Scrims & Matches'
              : activeTab === 'results' ? 'Manage Scrim Results'
              : activeTab === 'requirements' ? 'Manage Recruitment Requirements'
              : (activeTab === 'wallet' || activeTab === 'withdrawals' || activeTab === 'transactions') ? 'Wallet & Transaction Management'
              : activeTab === 'tournaments' ? 'Manage Tournaments'
              : activeTab === 'payments' ? 'UPI Slot Payments Verification'
              : 'Manage Bookings'}
          </h2>

          {activeTab === 'payments' ? (
            <div className="admin-header-actions" style={{ display: 'flex', gap: '0.5rem' }}>
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
            <div className="admin-header-actions" style={{ display: 'flex', gap: '0.5rem' }}>
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
            <div className="admin-header-actions" style={{ display: 'flex', gap: '0.5rem' }}>
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
            <div className="admin-header-actions" style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <button
                className="action-btn"
                onClick={() => handleOpenUploadResultPhotoModal('DAILY SCRIMS')}
                style={{
                  background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)',
                  boxShadow: '0 2px 10px rgba(147, 51, 234, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                }}
              >
                <Upload size={16} /> Publish Daily Scrims
              </button>
              <button
                className="action-btn"
                onClick={() => handleOpenUploadResultPhotoModal('WEEKLY & WEEKEND WAR')}
                style={{
                  background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
                  boxShadow: '0 2px 10px rgba(245, 158, 11, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  color: '#ffffff',
                }}
              >
                <Trophy size={16} /> Publish Weekly / Weekend War
              </button>
            </div>
          ) : activeTab === 'announcements' ? (
            <div className="admin-header-actions">
              <button className="action-btn" onClick={() => handleOpenModal()}>
                <Plus size={18} /> New Announcement
              </button>
            </div>
          ) : activeTab === 'matches' ? (
            <div className="admin-header-actions">
              <button className="action-btn" onClick={() => handleOpenModal()}>
                <Plus size={18} /> Add Match
              </button>
            </div>
          ) : (activeTab === 'wallet' || activeTab === 'withdrawals' || activeTab === 'transactions') ? null
          : activeTab === 'todayslots' ? (
            <div className="admin-header-actions today-slots-toolbar" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Date:</label>
                <input
                  type="date"
                  value={todaySlotsDate}
                  onChange={(e) => setTodaySlotsDate(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(139,92,246,0.35)', borderRadius: '7px', color: '#fff', padding: '0.35rem 0.65rem', fontSize: '0.82rem', cursor: 'pointer' }}
                />
              </div>
              <button
                className="action-btn"
                style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid #10b981', color: '#10b981', fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                onClick={() => setTodaySlotsDate(new Date().toISOString().split('T')[0])}
              >
                Today
              </button>

              {/* Single unified button for creating Today Slots & other slots (Weekend War, Weekly War, Grands) */}
              {renderUnifiedSlotCreateButton()}

              <button
                className="action-btn slot-nav-quick-btn"
                onClick={() => setActiveTab('slots')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', padding: '0.35rem 0.75rem', background: 'rgba(139,92,246,0.18)', border: '1px solid rgba(139,92,246,0.4)', color: '#c084fc' }}
                title="Switch to Manage Slots editor"
              >
                <LayoutList size={14} /> All Slots ({slots.length})
              </button>

              <button
                className="action-btn"
                onClick={() => fetchData()}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', padding: '0.35rem 0.75rem', background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.5)' }}
              >
                <RefreshCw size={14} /> Refresh
              </button>
            </div>
          ) : activeTab === 'slots' ? (
            <div className="admin-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                className="action-btn slot-nav-quick-btn"
                onClick={() => setActiveTab('todayslots')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', padding: '0.35rem 0.75rem', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: '#34d399' }}
                title="Switch to Today's Match Operations"
              >
                <Calendar size={14} /> Today's Schedule ({slots.filter(s => isSlotForDate(s, new Date().toISOString().split('T')[0])).length})
              </button>

              {/* Single unified button for creating Today Slots & other slots (Weekend War, Weekly War, Grands) */}
              {renderUnifiedSlotCreateButton()}
            </div>
          ) : activeTab === 'tournaments' ? (
            <div className="admin-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ImageIcon size={14} /> Upload posters and publish event details
              </div>
              <button className="action-btn" onClick={() => handleOpenModal()}>
                <Plus size={18} /> Add Tournament
              </button>
            </div>
          ) : (
            <div className="admin-header-actions">
              <button className="action-btn" onClick={() => handleOpenModal()}>
                <Plus size={18} /> Add New
              </button>
            </div>
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
                                onClick={() => handleOpenUploadResultPhotoModal('DAILY SCRIMS', m)}
                                title="Publish result photo for this match"
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
                    <p>No match results published yet. Click "Publish Daily Scrims" or "Publish Weekly / Weekend War" to post result photos.</p>
                  </div>
                ) : (
                  <table className="rankings-table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Point Table / Match Name</th>
                        <th>Lobby</th>
                        <th>Date</th>
                        <th>Result Photo(s)</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matchResults.map(res => {
                        const photos = (res.imageUrls && res.imageUrls.length > 0)
                          ? res.imageUrls
                          : (res.imageUrl ? [res.imageUrl] : []);
                        const isWeekly = res.category === 'WEEKLY & WEEKEND WAR';

                        return (
                          <tr key={res._id}>
                            <td>
                              <span
                                style={{
                                  border: isWeekly ? '1px solid #f59e0b' : '1px solid #8b5cf6',
                                  color: isWeekly ? '#fbbf24' : '#c084fc',
                                  background: isWeekly ? 'rgba(245, 158, 11, 0.12)' : 'rgba(139, 92, 246, 0.12)',
                                  borderRadius: '12px',
                                  padding: '2px 8px',
                                  fontSize: '0.68rem',
                                  fontWeight: 800,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {isWeekly ? 'WEEKLY & WAR' : 'DAILY SCRIMS'}
                              </span>
                            </td>
                            <td><strong>{res.matchName}</strong></td>
                            <td>
                              <span
                                style={{
                                  border: '1px solid #1d4ed8',
                                  color: '#60a5fa',
                                  background: 'rgba(29, 78, 216, 0.22)',
                                  borderRadius: '6px',
                                  padding: '3px 10px',
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  letterSpacing: '0.5px',
                                  display: 'inline-block',
                                }}
                              >
                                {res.lobby || 'LOBBY 01'}
                              </span>
                            </td>
                            <td>{res.date} {res.timing ? `· ${res.timing}` : ''}</td>
                            <td>
                              {photos.length > 0 ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <img
                                    src={photos[0]}
                                    alt={res.matchName}
                                    style={{
                                      width: '50px',
                                      height: '34px',
                                      objectFit: 'cover',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      border: '1px solid rgba(59, 130, 246, 0.4)',
                                    }}
                                    onClick={() => setPreviewPhotoModal({ open: true, url: photos[0], title: res.matchName, allUrls: photos, activeIndex: 0 })}
                                    title="Click to preview result image"
                                  />
                                  <span style={{ fontSize: '0.7rem', color: '#60a5fa', fontWeight: 700 }}>
                                    {photos.length > 1 ? `${photos.length} Photos` : 'Attached'}
                                  </span>
                                </div>
                              ) : (
                                <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>No Image</span>
                              )}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {photos.length > 0 && (
                                  <button
                                    type="button"
                                    className="action-btn"
                                    style={{
                                      background: 'rgba(37, 99, 235, 0.2)',
                                      border: '1px solid rgba(59, 130, 246, 0.4)',
                                      color: '#60a5fa',
                                      padding: '4px 8px',
                                    }}
                                    onClick={() => setPreviewPhotoModal({ open: true, url: photos[0], title: res.matchName, allUrls: photos, activeIndex: 0 })}
                                    title="View photo(s)"
                                  >
                                    <Eye size={14} />
                                  </button>
                                )}
                                <button
                                  className="action-btn delete-btn"
                                  onClick={async () => {
                                    if (window.confirm(`Delete point table result "${res.matchName}"?`)) {
                                      try {
                                        await axios.delete(`${apiUrl}/api/results/${res._id}`, config);
                                        await fetchData();
                                      } catch (e) {
                                        alert('Failed: ' + e.message);
                                      }
                                    }
                                  }}
                                  title="Delete this result"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* ── REQUIREMENTS MANAGEMENT ── */}
            {activeTab === 'requirements' && (() => {
              const filteredList = requirements.filter((r) => {
                if (reqTypeFilter !== 'ALL' && r.type !== reqTypeFilter) return false;
                if (reqStatusFilter !== 'ALL' && r.status !== reqStatusFilter) return false;
                if (reqSearch.trim()) {
                  const q = reqSearch.toLowerCase();
                  const userName = (r.user?.teamName || '').toLowerCase();
                  const userPhone = (r.user?.phone || '').toLowerCase();
                  const role = (r.role || '').toLowerCase();
                  const device = (r.device || '').toLowerCase();
                  const contact = (r.contact || '').toLowerCase();
                  if (!userName.includes(q) && !userPhone.includes(q) && !role.includes(q) && !device.includes(q) && !contact.includes(q)) {
                    return false;
                  }
                }
                return true;
              });

              return (
                <div>
                  {/* Controls: Search & Filters */}
                  <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '0.6rem', flex: 1, minWidth: '240px' }}>
                      <input
                        type="text"
                        placeholder="Search by Team, Role, Device, Contact..."
                        value={reqSearch}
                        onChange={(e) => setReqSearch(e.target.value)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(168, 85, 247, 0.35)',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          color: '#fff',
                          fontSize: '0.82rem',
                          flex: 1,
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                      <select
                        value={reqTypeFilter}
                        onChange={(e) => setReqTypeFilter(e.target.value)}
                        style={{
                          background: '#160d2e',
                          border: '1px solid rgba(168, 85, 247, 0.35)',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          color: '#c4b5fd',
                          fontSize: '0.82rem',
                        }}
                      >
                        <option value="ALL">All Types</option>
                        <option value="PLAYER">Looking for Player</option>
                        <option value="TEAM">Looking for Team</option>
                      </select>

                      <select
                        value={reqStatusFilter}
                        onChange={(e) => setReqStatusFilter(e.target.value)}
                        style={{
                          background: '#160d2e',
                          border: '1px solid rgba(168, 85, 247, 0.35)',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          color: '#c4b5fd',
                          fontSize: '0.82rem',
                        }}
                      >
                        <option value="ALL">All Status</option>
                        <option value="active">Active Only</option>
                        <option value="inactive">Inactive Only</option>
                      </select>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="rankings-table-wrapper">
                    {filteredList.length === 0 ? (
                      <div className="empty-state" style={{ padding: '2.5rem', textAlign: 'center' }}>
                        <p style={{ color: '#a0a0c4' }}>No requirements found matching the criteria.</p>
                      </div>
                    ) : (
                      <table className="rankings-table">
                        <thead>
                          <tr>
                            <th>Type</th>
                            <th>User / Team</th>
                            <th>Role & Device</th>
                            <th>Timing / Availability</th>
                            <th>Age & Exp</th>
                            <th>Contact</th>
                            <th>Status</th>
                            <th>Published</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredList.map((req) => (
                            <tr key={req._id}>
                              <td>
                                <span
                                  style={{
                                    background: req.type === 'PLAYER' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(232, 121, 249, 0.2)',
                                    color: req.type === 'PLAYER' ? '#38bdf8' : '#e879f9',
                                    border: `1px solid ${req.type === 'PLAYER' ? 'rgba(56, 189, 248, 0.4)' : 'rgba(232, 121, 249, 0.4)'}`,
                                    borderRadius: '4px',
                                    padding: '2px 8px',
                                    fontSize: '0.7rem',
                                    fontWeight: 800,
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {req.type === 'PLAYER' ? 'PLAYER' : 'TEAM'}
                                </span>
                              </td>
                              <td>
                                <div style={{ fontWeight: 700, color: '#fff' }}>
                                  {req.user?.teamName || 'Competitive User'}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#a0a0c4' }}>
                                  {req.user?.phone || ''}
                                </div>
                              </td>
                              <td>
                                <div style={{ fontWeight: 700, color: '#c084fc' }}>{req.role}</div>
                                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{req.device}</div>
                              </td>
                              <td style={{ fontSize: '0.78rem', color: '#e2e8f0' }}>
                                {req.type === 'PLAYER' ? (req.availability || 'N/A') : (req.playingTime || 'N/A')}
                              </td>
                              <td style={{ fontSize: '0.78rem', color: '#e2e8f0' }}>
                                {req.age} yrs · {req.experience}
                              </td>
                              <td>
                                <span style={{ fontSize: '0.78rem', color: '#22c55e', fontWeight: 600 }}>
                                  {req.contact}
                                </span>
                              </td>
                              <td>
                                <span
                                  onClick={() => handleToggleRequirementStatus(req._id, req.status)}
                                  style={{
                                    background: req.status === 'active' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                    color: req.status === 'active' ? '#4ade80' : '#f87171',
                                    border: `1px solid ${req.status === 'active' ? '#22c55e' : '#ef4444'}`,
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                  }}
                                  title="Click to toggle status"
                                >
                                  {req.status === 'active' ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td style={{ fontSize: '0.72rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                                {req.createdAt ? new Date(req.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'N/A'}
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button
                                    type="button"
                                    className="action-btn"
                                    onClick={() => setViewReqModal({ open: true, item: req })}
                                    style={{ padding: '4px 8px', fontSize: '0.75rem', background: 'rgba(124, 58, 237, 0.2)', border: '1px solid rgba(168, 85, 247, 0.4)', color: '#c084fc' }}
                                    title="View full requirement details"
                                  >
                                    <Eye size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    className="action-btn delete-btn"
                                    onClick={() => handleDeleteRequirement(req._id)}
                                    title="Delete requirement"
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
                </div>
              );
            })()}

            {/* ── WALLET & TRANSACTIONS MANAGEMENT ── */}
            {(activeTab === 'transactions' || activeTab === 'wallet' || activeTab === 'withdrawals') && (
              <div>
                {/* Sub-Navigation Buttons */}
                <div className="wallet-subtabs-bar" style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.5rem', flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.8rem' }}>
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
                    <div className="wallet-filter-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
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
                    <div className="wallet-filter-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
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
                    <div className="wallet-search-filter-bar" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
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

                      <div className="form-grid adjust-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
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

            {/* ── TODAY SLOTS ADMIN PANEL ── */}
            {activeTab === 'todayslots' && (
              <div>
                {slots.filter(s => isSlotForDate(s, todaySlotsDate)).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-secondary)' }}>
                    <Calendar size={52} style={{ opacity: 0.25, display: 'block', margin: '0 auto 1rem' }} />
                    <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>No Slots for This Date</h3>
                    <p>Nothing scheduled for <strong style={{ color: '#a78bfa' }}>{todaySlotsDate}</strong>.</p>
                    <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'center', marginTop: '1.25rem' }}>
                      <button
                        className="action-btn"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          border: 'none',
                          color: '#ffffff',
                          fontWeight: '800',
                          fontSize: '0.9rem',
                          padding: '0.6rem 1.4rem',
                          borderRadius: '8px',
                          boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                          cursor: 'pointer',
                        }}
                        onClick={() => handleOpenSlotModal('today')}
                      >
                        <Plus size={18} /> Create Slot
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {(() => {
                      const todaySlots = slots.filter(s => isSlotForDate(s, todaySlotsDate));
                      const todayBookings = bookings.filter(b => todaySlots.some(sl => sl._id === (b.slotId && b.slotId._id ? b.slotId._id : b.slotId)));
                      return (
                        <>
                          <div className="today-slots-stats-grid" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
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
                                    <button
                                      className="action-btn edit-btn"
                                      style={{ padding: '0.28rem 0.6rem', fontSize: '0.73rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                      onClick={() => handleOpenSlotModal(slot)}
                                    >
                                      <Edit2 size={12} /> Edit
                                    </button>
                                    <button
                                      className="action-btn delete-btn"
                                      style={{ padding: '0.28rem 0.6rem', fontSize: '0.73rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                      onClick={() => handleDelete(slotId)}
                                    >
                                      <Trash2 size={12} /> Delete
                                    </button>
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
                                  <div className="slot-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.55rem' }}>
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
                                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '0.6rem' }}>Room Credentials &amp; Link</div>
                                    <div className="slot-room-cred-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                      <input type="text" value={ed.roomId || ''} onChange={e => handleEditorFieldChange(slotId, 'roomId', e.target.value)} placeholder="Room ID" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.22)', borderRadius: '6px', color: '#fff', padding: '0.38rem 0.55rem', fontSize: '0.8rem', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
                                      <input type="text" value={ed.roomPassword || ''} onChange={e => handleEditorFieldChange(slotId, 'roomPassword', e.target.value)} placeholder="Password" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.22)', borderRadius: '6px', color: '#fff', padding: '0.38rem 0.55rem', fontSize: '0.8rem', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
                                    </div>
                                    <input type="text" value={ed.note || ''} onChange={e => handleEditorFieldChange(slotId, 'note', e.target.value)} placeholder="Note / Instructions" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.22)', borderRadius: '6px', color: '#fff', padding: '0.38rem 0.55rem', fontSize: '0.8rem', outline: 'none', width: '100%', boxSizing: 'border-box', marginBottom: '0.5rem' }} />
                                    <div style={{ marginBottom: '0.6rem' }}>
                                      <label style={{ fontSize: '0.68rem', color: '#a78bfa', display: 'block', marginBottom: '0.2rem', fontWeight: '700' }}>
                                        🔗 Slot Link (WhatsApp / Discord / Custom URL)
                                      </label>
                                      <input
                                        type="url"
                                        value={ed.customLink || ed.whatsappLink || ''}
                                        onChange={e => {
                                          handleEditorFieldChange(slotId, 'customLink', e.target.value);
                                          handleEditorFieldChange(slotId, 'whatsappLink', e.target.value);
                                        }}
                                        placeholder="https://chat.whatsapp.com/... or Discord link"
                                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.22)', borderRadius: '6px', color: '#fff', padding: '0.38rem 0.55rem', fontSize: '0.8rem', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                                      />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                      <button className="action-btn" onClick={() => handleEditorSave(slotId)} disabled={editorSaving[slotId]} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.38rem 0.85rem', fontSize: '0.78rem', background: editorSaved[slotId] ? 'rgba(16,185,129,0.28)' : 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}>
                                        {editorSaved[slotId] ? <><CheckCircle size={12} /> Saved</> : editorSaving[slotId] ? 'Saving...' : <><Save size={12} /> Save</>}
                                      </button>
                                    </div>
                                  </div>

                                  {/* ── Registered Teams Section ── */}
                                  <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(139,92,246,0.22)', borderRadius: '10px', padding: '0.85rem 0.95rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#c084fc', fontWeight: '800', fontSize: '0.82rem', letterSpacing: '0.5px' }}>
                                        <Users size={16} /> REGISTERED TEAMS ({paidB.length} / {totalTeams})
                                      </div>
                                      <button
                                        type="button"
                                        className="action-btn"
                                        onClick={() => handleOpenTeamAssignModal(slot)}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '0.35rem',
                                          padding: '0.28rem 0.7rem',
                                          fontSize: '0.75rem',
                                          background: 'rgba(139,92,246,0.25)',
                                          border: '1px solid #8b5cf6',
                                          color: '#c084fc',
                                          fontWeight: '700',
                                          borderRadius: '6px'
                                        }}
                                      >
                                        <Plus size={13} /> Add Team
                                      </button>
                                    </div>

                                    {paidB.length === 0 ? (
                                      <div style={{ textAlign: 'center', padding: '1rem', color: '#64748b', fontSize: '0.8rem' }}>
                                        No confirmed teams assigned yet. Click <strong>"+ Add Team"</strong> to assign registered teams to this slot.
                                      </div>
                                    ) : (
                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '0.65rem' }}>
                                        {paidB.map((b, bIdx) => {
                                          const userObj = b.userId || {};
                                          const teamName = userObj.teamName || b.teamName || `Team #${bIdx + 1}`;
                                          const risingId = userObj.registrationNumber ? `#${userObj.registrationNumber}` : `#${bIdx + 1}`;
                                          const teamLogo = userObj.teamLogo;
                                          const teamDrops = Array.isArray(slot.dropDetails)
                                            ? slot.dropDetails.filter(d => String(d.teamId) === String(userObj._id) || d.teamName?.toLowerCase() === teamName.toLowerCase())
                                            : [];

                                          return (
                                            <div
                                              key={b._id}
                                              style={{
                                                background: 'rgba(15,12,30,0.7)',
                                                border: '1px solid rgba(139,92,246,0.25)',
                                                borderRadius: '8px',
                                                padding: '0.65rem 0.8rem',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '0.45rem',
                                                position: 'relative'
                                              }}
                                            >
                                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                                                  {teamLogo ? (
                                                    <img
                                                      src={teamLogo}
                                                      alt={teamName}
                                                      style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(139,92,246,0.4)' }}
                                                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                    />
                                                  ) : (
                                                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.75rem', color: '#fff' }}>
                                                      {teamName.charAt(0).toUpperCase()}
                                                    </div>
                                                  )}
                                                  <div>
                                                    <div style={{ fontWeight: '700', fontSize: '0.82rem', color: '#fff' }}>{teamName}</div>
                                                    <div style={{ fontSize: '0.68rem', color: '#c084fc', fontFamily: 'monospace' }}>
                                                      Rising ID: <strong>{risingId}</strong>
                                                    </div>
                                                  </div>
                                                </div>
                                                <button
                                                  type="button"
                                                  onClick={() => handleRemoveTeamFromSlot(slot._id, b._id, teamName)}
                                                  style={{
                                                    background: 'rgba(239,68,68,0.15)',
                                                    border: '1px solid rgba(239,68,68,0.3)',
                                                    borderRadius: '4px',
                                                    color: '#f87171',
                                                    padding: '0.2rem 0.45rem',
                                                    fontSize: '0.68rem',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '2px'
                                                  }}
                                                  title="Remove team from slot"
                                                >
                                                  <Trash2 size={11} /> Remove
                                                </button>
                                              </div>

                                              {/* Drop Locations Preview */}
                                              <div style={{ fontSize: '0.7rem', color: '#94a3b8', background: 'rgba(0,0,0,0.3)', borderRadius: '5px', padding: '0.3rem 0.5rem' }}>
                                                <div style={{ fontSize: '0.62rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '2px' }}>Drop Locations:</div>
                                                {teamDrops.length > 0 ? (
                                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                                                    {teamDrops.map((td, tdIdx) => (
                                                      <span key={tdIdx} style={{ background: 'rgba(59,130,246,0.18)', border: '1px solid rgba(59,130,246,0.35)', color: '#93c5fd', borderRadius: '3px', padding: '0.05rem 0.35rem', fontSize: '0.65rem' }}>
                                                        {td.matchLabel || `M${td.matchNumber}`}: {td.dropLocation}
                                                      </span>
                                                    ))}
                                                  </div>
                                                ) : (
                                                  <span style={{ color: '#64748b', fontStyle: 'italic' }}>
                                                    {b.dropLocations ? Object.entries(b.dropLocations).filter(([k,v]) => v && !k.startsWith('_')).map(([k,v]) => `${k.toUpperCase()}: ${v}`).join(' | ') : 'No drop assigned'}
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
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

            {/* ── DROP DETAILS MANAGEMENT ── */}
            {activeTab === 'dropdetails' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ background: 'linear-gradient(135deg,rgba(15,12,30,0.97),rgba(22,17,46,0.97))', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '16px', padding: '1.25rem 1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MapPin size={20} style={{ color: '#60a5fa' }} /> Match &amp; Team Drop Details
                      </h3>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                        Publish and update match-wise maps and team drop locations for each slot. Published details are visible immediately on the public website.
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <label style={{ fontSize: '0.78rem', color: '#c084fc', fontWeight: '700' }}>Select Slot:</label>
                      <select
                        value={selectedDropSlotId}
                        onChange={(e) => {
                          setSelectedDropSlotId(e.target.value);
                          setEditingDropDetailId(null);
                        }}
                        style={{
                          background: 'rgba(255,255,255,0.08)',
                          border: '1px solid rgba(139,92,246,0.4)',
                          borderRadius: '8px',
                          color: '#fff',
                          padding: '0.5rem 0.85rem',
                          fontSize: '0.84rem',
                          maxWidth: '360px',
                          outline: 'none'
                        }}
                      >
                        {slots.map(s => (
                          <option key={s._id} value={s._id}>
                            {s.date || 'No Date'} — {s.matchName || 'Match'} [{s.lobby || 'LOBBY 1'}] ({s.timing || 'TBA'})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {(() => {
                    const currentSlot = slots.find(s => s._id === selectedDropSlotId);
                    if (!currentSlot) {
                      return (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                          Please select a slot to manage drop details.
                        </div>
                      );
                    }

                    const slotMatches = Array.isArray(currentSlot.scheduleMatches) && currentSlot.scheduleMatches.length > 0
                      ? currentSlot.scheduleMatches
                      : [
                          { matchNumber: 1, label: 'MATCH 1', map: 'ERANGEL' },
                          { matchNumber: 2, label: 'MATCH 2', map: 'RONDO' },
                          { matchNumber: 3, label: 'MATCH 3', map: 'MIRAMAR' },
                        ];

                    const slotBookings = bookings.filter(b => {
                      const bid = b.slotId && b.slotId._id ? b.slotId._id : b.slotId;
                      return bid === currentSlot._id && b.paymentStatus === 'paid';
                    });

                    const publishedDrops = Array.isArray(currentSlot.dropDetails) ? currentSlot.dropDetails : [];

                    return (
                      <>
                        {/* Slot Summary Banner */}
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '0.85rem 1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#fff' }}>{currentSlot.matchName}</span>
                            <span style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)', borderRadius: '5px', padding: '0.1rem 0.5rem', fontSize: '0.7rem', color: '#c084fc', fontWeight: '700' }}>{currentSlot.category || 'SCRIMS'}</span>
                            <span style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '5px', padding: '0.1rem 0.5rem', fontSize: '0.7rem', color: '#10b981', fontWeight: '700' }}>{currentSlot.lobby || 'LOBBY 1'}</span>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>📅 {currentSlot.date || 'TBA'}</span>
                            <span style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: '700' }}>⏰ {currentSlot.timing || 'TBA'}</span>
                            <span style={{ fontSize: '0.8rem', color: '#60a5fa' }}>👥 {slotBookings.length} confirmed teams</span>
                          </div>
                          <a
                            href={`/drop-list?slotId=${currentSlot._id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: '0.78rem', color: '#60a5fa', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: '700' }}
                          >
                            Public Drop Details Page →
                          </a>
                        </div>

                        {/* Add / Edit Drop Detail Form */}
                        <form onSubmit={handleSaveDropDetail} style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#93c5fd', marginBottom: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Edit2 size={15} /> {editingDropDetailId ? 'Edit Drop Detail' : 'Add / Publish Team Drop Detail'}
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.9rem', marginBottom: '1rem' }}>
                            <div>
                              <label style={{ fontSize: '0.74rem', color: '#cbd5e1', display: 'block', marginBottom: '0.35rem', fontWeight: '600' }}>
                                Select Match *
                              </label>
                              <select
                                value={dropDetailForm.matchNumber}
                                onChange={(e) => {
                                  const num = Number(e.target.value);
                                  const mObj = slotMatches.find(m => m.matchNumber === num);
                                  setDropDetailForm(p => ({
                                    ...p,
                                    matchNumber: num,
                                    matchLabel: mObj?.label || `MATCH ${num}`,
                                    map: mObj?.map || p.map || 'ERANGEL'
                                  }));
                                }}
                                style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '8px', color: '#fff', padding: '0.55rem 0.7rem', fontSize: '0.84rem' }}
                              >
                                {slotMatches.map(m => (
                                  <option key={m.matchNumber} value={m.matchNumber}>
                                    {m.label || `MATCH ${m.matchNumber}`} {m.time ? `(${m.time})` : ''}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label style={{ fontSize: '0.74rem', color: '#cbd5e1', display: 'block', marginBottom: '0.35rem', fontWeight: '600' }}>
                                Map *
                              </label>
                              <select
                                value={dropDetailForm.map}
                                onChange={(e) => setDropDetailForm(p => ({ ...p, map: e.target.value }))}
                                style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '8px', color: '#fff', padding: '0.55rem 0.7rem', fontSize: '0.84rem' }}
                              >
                                <option value="ERANGEL">ERANGEL</option>
                                <option value="MIRAMAR">MIRAMAR</option>
                                <option value="RONDO">RONDO</option>
                                <option value="SANHOK">SANHOK</option>
                                <option value="VIKENDI">VIKENDI</option>
                              </select>
                            </div>

                            <div>
                              <label style={{ fontSize: '0.74rem', color: '#cbd5e1', display: 'block', marginBottom: '0.35rem', fontWeight: '600' }}>
                                Registered Team *
                              </label>
                              <select
                                value={dropDetailForm.teamId}
                                onChange={(e) => {
                                  const tId = e.target.value;
                                  const teamObj = availableTeams.find(t => String(t._id) === String(tId));
                                  setDropDetailForm(p => ({
                                    ...p,
                                    teamId: tId,
                                    teamName: teamObj?.teamName || '',
                                    dropLocation: p.dropLocation || (teamObj?.dropLocations?.erangel || '')
                                  }));
                                }}
                                required
                                style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '8px', color: '#fff', padding: '0.55rem 0.7rem', fontSize: '0.84rem' }}
                              >
                                <option value="">-- Select Registered Team --</option>
                                {availableTeams.map(t => (
                                  <option key={t._id} value={t._id}>
                                    {t.teamName} (Rising ID: #{t.registrationNumber || 'N/A'})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label style={{ fontSize: '0.74rem', color: '#cbd5e1', display: 'block', marginBottom: '0.35rem', fontWeight: '600' }}>
                                Drop Location *
                              </label>
                              <input
                                type="text"
                                value={dropDetailForm.dropLocation}
                                onChange={(e) => setDropDetailForm(p => ({ ...p, dropLocation: e.target.value }))}
                                placeholder="e.g. Pochinki, Pecado, School"
                                required
                                style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '8px', color: '#fff', padding: '0.55rem 0.7rem', fontSize: '0.84rem' }}
                              />
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Quick suggestions:</span>
                            {['Pochinki', 'School', 'Military Base', 'Rozhok', 'Yasnaya', 'Georgopol', 'Pecado', 'Hacienda', 'Bootcamp'].map(loc => (
                              <button
                                key={loc}
                                type="button"
                                onClick={() => setDropDetailForm(p => ({ ...p, dropLocation: loc }))}
                                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '4px', color: '#e2e8f0', fontSize: '0.68rem', padding: '0.15rem 0.45rem', cursor: 'pointer' }}
                              >
                                {loc}
                              </button>
                            ))}
                          </div>

                          <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
                            {editingDropDetailId && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingDropDetailId(null);
                                  setDropDetailForm(p => ({ ...p, teamId: '', teamName: '', dropLocation: '' }));
                                }}
                                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#94a3b8', padding: '0.5rem 1rem', fontSize: '0.82rem', cursor: 'pointer' }}
                              >
                                Cancel
                              </button>
                            )}
                            <button
                              type="submit"
                              disabled={savingDropDetail}
                              style={{ background: savingDropDetail ? 'rgba(59,130,246,0.4)' : 'linear-gradient(135deg,#3b82f6,#2563eb)', border: 'none', borderRadius: '8px', color: '#fff', padding: '0.5rem 1.3rem', fontSize: '0.82rem', fontWeight: '700', cursor: savingDropDetail ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                            >
                              <Save size={14} /> {savingDropDetail ? 'Saving...' : (editingDropDetailId ? 'Update Drop Detail' : 'Save & Publish Drop Detail')}
                            </button>
                          </div>
                        </form>

                        {/* Published Drop Details List */}
                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#fff', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span>Published Drop Details ({publishedDrops.length})</span>
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Live synchronized with website</span>
                          </div>

                          {publishedDrops.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2.5rem', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', color: '#64748b' }}>
                              <MapPin size={36} style={{ opacity: 0.3, display: 'block', margin: '0 auto 0.75rem' }} />
                              <p style={{ margin: 0, fontSize: '0.88rem' }}>No drop details published yet for this slot.</p>
                              <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem' }}>Use the form above to select a match, map, registered team, and drop location.</p>
                            </div>
                          ) : (
                            <div style={{ overflowX: 'auto', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px' }}>
                              <table className="rankings-table" style={{ margin: 0 }}>
                                <thead>
                                  <tr>
                                    <th>Match &amp; Map</th>
                                    <th>Team Details</th>
                                    <th>Rising ID</th>
                                    <th>Drop Location</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {publishedDrops.map((detail) => (
                                    <tr key={detail._id}>
                                      <td>
                                        <span style={{ background: 'rgba(59,130,246,0.18)', border: '1px solid rgba(59,130,246,0.4)', borderRadius: '5px', padding: '0.15rem 0.5rem', fontSize: '0.72rem', fontWeight: '700', color: '#93c5fd' }}>
                                          {detail.matchLabel || `MATCH ${detail.matchNumber}`}
                                        </span>
                                        <span style={{ marginLeft: '0.4rem', fontSize: '0.75rem', color: '#a78bfa', fontWeight: '600' }}>
                                          ({detail.map || 'ERANGEL'})
                                        </span>
                                      </td>
                                      <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                          {detail.teamLogo ? (
                                            <img
                                              src={detail.teamLogo}
                                              alt={detail.teamName}
                                              style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover' }}
                                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                            />
                                          ) : (
                                            <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.72rem', color: '#fff' }}>
                                              {(detail.teamName || 'T').charAt(0).toUpperCase()}
                                            </div>
                                          )}
                                          <div>
                                            <div style={{ fontWeight: '700', fontSize: '0.84rem', color: '#fff' }}>{detail.teamName}</div>
                                            {detail.teamTag && <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>[{detail.teamTag}]</span>}
                                          </div>
                                        </div>
                                      </td>
                                      <td>
                                        <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#c084fc', fontSize: '0.82rem' }}>
                                          {detail.registrationNumber ? `#${detail.registrationNumber}` : '—'}
                                        </span>
                                      </td>
                                      <td>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '5px', padding: '0.18rem 0.55rem', fontSize: '0.78rem', color: '#6ee7b7', fontWeight: '700' }}>
                                          <MapPin size={12} /> {detail.dropLocation}
                                        </span>
                                      </td>
                                      <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                                          <button
                                            type="button"
                                            className="action-btn edit-btn"
                                            style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem' }}
                                            onClick={() => {
                                              setEditingDropDetailId(detail._id);
                                              setDropDetailForm({
                                                matchNumber: detail.matchNumber || 1,
                                                matchLabel: detail.matchLabel || `MATCH ${detail.matchNumber || 1}`,
                                                map: detail.map || 'ERANGEL',
                                                teamId: detail.teamId || '',
                                                teamName: detail.teamName || '',
                                                dropLocation: detail.dropLocation || ''
                                              });
                                            }}
                                          >
                                            <Edit2 size={11} /> Edit
                                          </button>
                                          <button
                                            type="button"
                                            className="action-btn delete-btn"
                                            style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem' }}
                                            onClick={() => handleDeleteDropDetail(currentSlot._id, detail._id)}
                                          >
                                            <Trash2 size={11} /> Delete
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* ── Assign Team to Slot Modal ── */}
            {teamAssignModal.open && (
              <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                <div style={{ width: '100%', maxWidth: '520px', background: 'linear-gradient(160deg,#13131f,#0e0e1a)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '20px', padding: '1.75rem', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <Users size={18} style={{ color: '#c084fc' }} /> Add Team to Slot
                      </h3>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                        {teamAssignModal.slot?.matchName} ({teamAssignModal.slot?.lobby || 'LOBBY 1'}) — {teamAssignModal.slot?.timing || ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTeamAssignModal({ open: false, slot: null })}
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50%', width: '32px', height: '32px', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <form onSubmit={handleAssignTeamToSlot}>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ fontSize: '0.78rem', color: '#cbd5e1', display: 'block', marginBottom: '0.4rem', fontWeight: '600' }}>
                        Select Team from Registered Database *
                      </label>
                      <select
                        value={assignTeamForm.userId}
                        onChange={(e) => {
                          const uId = e.target.value;
                          const selTeam = availableTeams.find(t => String(t._id) === String(uId));
                          const defaultDrop = selTeam?.dropLocations?.erangel || '';
                          setAssignTeamForm(p => ({ ...p, userId: uId, dropLocation: p.dropLocation || defaultDrop }));
                        }}
                        required
                        style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(139,92,246,0.35)', borderRadius: '8px', color: '#fff', padding: '0.65rem 0.75rem', fontSize: '0.88rem', outline: 'none' }}
                      >
                        <option value="">-- Choose a registered team --</option>
                        {availableTeams.map(team => (
                          <option key={team._id} value={team._id}>
                            {team.teamName} {team.teamTag ? `[${team.teamTag}]` : ''} — Rising ID: #{team.registrationNumber || 'N/A'} {team.phone ? `(${team.phone})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ marginBottom: '1.25rem' }}>
                      <label style={{ fontSize: '0.78rem', color: '#cbd5e1', display: 'block', marginBottom: '0.4rem', fontWeight: '600' }}>
                        Initial Drop Location (Optional)
                      </label>
                      <input
                        type="text"
                        value={assignTeamForm.dropLocation}
                        onChange={(e) => setAssignTeamForm(p => ({ ...p, dropLocation: e.target.value }))}
                        placeholder="e.g. Pochinki, School, Pecado"
                        style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(139,92,246,0.35)', borderRadius: '8px', color: '#fff', padding: '0.65rem 0.75rem', fontSize: '0.88rem', outline: 'none' }}
                      />
                      <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                        Assigning a team adds a confirmed paid booking record and updates the slot's registered team count automatically.
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => setTeamAssignModal({ open: false, slot: null })}
                        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#94a3b8', padding: '0.6rem 1.25rem', cursor: 'pointer', fontSize: '0.88rem' }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={assigningTeam}
                        style={{ background: assigningTeam ? 'rgba(124,58,237,0.4)' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', border: 'none', borderRadius: '8px', color: '#fff', padding: '0.6rem 1.4rem', cursor: assigningTeam ? 'not-allowed' : 'pointer', fontSize: '0.88rem', fontWeight: '700' }}
                      >
                        {assigningTeam ? 'Assigning...' : 'Assign Team to Slot'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}


            {/* ── SLOT EDITOR ── */}
            {activeTab === 'slots' && (() => {
              const filteredSlotsList = slots.filter(slot => {
                if (slotCategoryFilter !== 'ALL') {
                  const sCat = (slot.category || 'SCRIMS').toUpperCase();
                  if (sCat !== slotCategoryFilter.toUpperCase()) return false;
                }
                if (slotStatusFilter !== 'ALL') {
                  if (slotStatusFilter === 'published' && slot.isPublished === false) return false;
                  if (slotStatusFilter === 'draft' && slot.isPublished !== false) return false;
                  if (['Open', 'Upcoming', 'Closed', 'Full', 'Ongoing', 'Completed', 'Cancelled'].includes(slotStatusFilter)) {
                    if ((slot.registrationStatus || 'Open').toLowerCase() !== slotStatusFilter.toLowerCase()) return false;
                  }
                }
                if (slotDateFilter && slotDateFilter.trim()) {
                  const q = slotDateFilter.trim().toLowerCase();
                  const dStr = (slot.date || '').toLowerCase();
                  if (!dStr.includes(q)) return false;
                }
                if (slotSearch && slotSearch.trim()) {
                  const q = slotSearch.trim().toLowerCase();
                  const mName = (slot.matchName || '').toLowerCase();
                  const lobby = (slot.lobby || '').toLowerCase();
                  if (!mName.includes(q) && !lobby.includes(q)) return false;
                }
                return true;
              });

              return (
                <div className="manage-slots-scheduling-wrap">
                  {/* ── Scheduling Filter Toolbar ── */}
                  <div style={{
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    marginBottom: '1.25rem',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(139,92,246,0.2)',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1, minWidth: '200px' }}>
                      <Search size={16} style={{ color: '#a855f7' }} />
                      <input
                        type="text"
                        value={slotSearch}
                        onChange={e => setSlotSearch(e.target.value)}
                        placeholder="Search tournament title or lobby..."
                        style={{
                          width: '100%',
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '6px',
                          color: '#fff',
                          padding: '0.45rem 0.65rem',
                          fontSize: '0.82rem'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Filter size={15} style={{ color: '#c084fc' }} />
                      <select
                        value={slotCategoryFilter}
                        onChange={e => setSlotCategoryFilter(e.target.value)}
                        style={{
                          background: '#15102a',
                          border: '1px solid rgba(139,92,246,0.3)',
                          borderRadius: '6px',
                          color: '#fff',
                          padding: '0.45rem 0.65rem',
                          fontSize: '0.82rem'
                        }}
                      >
                        <option value="ALL">All Categories</option>
                        <option value="SCRIMS">Daily Scrims (SCRIMS)</option>
                        <option value="WEEKLY WAR">Weekly War</option>
                        <option value="WEEKEND WAR">Weekend War</option>
                        <option value="GRANDS">Grands</option>
                      </select>
                    </div>
                    <div>
                      <select
                        value={slotStatusFilter}
                        onChange={e => setSlotStatusFilter(e.target.value)}
                        style={{
                          background: '#15102a',
                          border: '1px solid rgba(139,92,246,0.3)',
                          borderRadius: '6px',
                          color: '#fff',
                          padding: '0.45rem 0.65rem',
                          fontSize: '0.82rem'
                        }}
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="published">Published Only</option>
                        <option value="draft">Drafts Only</option>
                        <option value="Open">Open</option>
                        <option value="Full">Full</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                    <div>
                      <input
                        type="text"
                        value={slotDateFilter}
                        onChange={e => setSlotDateFilter(e.target.value)}
                        placeholder="Filter date e.g. 10 Oct"
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '6px',
                          color: '#fff',
                          padding: '0.45rem 0.65rem',
                          fontSize: '0.82rem',
                          width: '140px'
                        }}
                      />
                    </div>
                    {(slotSearch || slotCategoryFilter !== 'ALL' || slotStatusFilter !== 'ALL' || slotDateFilter) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSlotSearch('');
                          setSlotCategoryFilter('ALL');
                          setSlotStatusFilter('ALL');
                          setSlotDateFilter('');
                        }}
                        style={{
                          background: 'rgba(239,68,68,0.15)',
                          border: '1px solid rgba(239,68,68,0.4)',
                          color: '#f87171',
                          borderRadius: '6px',
                          padding: '0.45rem 0.75rem',
                          fontSize: '0.78rem',
                          cursor: 'pointer'
                        }}
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>

                  <div className="slot-editor-grid">
                    {filteredSlotsList.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        <Calendar size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                        <p>No slots found matching the selected filters. Click "Add New Slot" above to schedule a new tournament.</p>
                      </div>
                    ) : (
                      filteredSlotsList.map((slot) => {
                        const ed = editorData[slot._id] || {};
                        const isSaving = editorSaving[slot._id];
                        const isSaved = editorSaved[slot._id];

                        return (
                          <div key={slot._id} className="slot-editor-card slot-editor-modern">
                            {/* Card Header */}
                            <div className="slot-editor-card-header">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                                <div className="slot-editor-card-title">
                                  {ed.matchName || slot.matchName || 'Unnamed Slot'}
                                </div>
                                <span className="se-category-pill">{ed.category || 'SCRIMS'}</span>
                                <span className="se-lobby-pill">{ed.lobby || 'LOBBY 1'}</span>
                                <span style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  background: slot.isPublished !== false ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                  border: `1px solid ${slot.isPublished !== false ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                                  color: slot.isPublished !== false ? '#34d399' : '#fbbf24',
                                }}>
                                  {slot.isPublished !== false ? '● Published' : '○ Draft'}
                                </span>
                                <span style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  background: 'rgba(192, 132, 252, 0.12)',
                                  border: '1px solid rgba(192, 132, 252, 0.3)',
                                  color: '#c084fc',
                                }}>
                                  {slot.registrationStatus || 'Open'}
                                </span>
                                <span style={{
                                  fontSize: '0.72rem',
                                  color: '#94a3b8',
                                  fontWeight: 600,
                                }}>
                                  Teams: {slot.bookedCount || 0}/{slot.maxTeams || 20}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {isSaved && (
                                  <div className="slot-editor-saved-badge">
                                    <CheckCircle size={14} /> Saved!
                                  </div>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleTogglePublish(slot._id, slot.isPublished !== false)}
                                  style={{
                                    padding: '0.35rem 0.65rem',
                                    borderRadius: '6px',
                                    border: slot.isPublished !== false ? '1px solid #f59e0b' : '1px solid #10b981',
                                    color: slot.isPublished !== false ? '#f59e0b' : '#10b981',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    fontSize: '0.78rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.3rem'
                                  }}
                                  title={slot.isPublished !== false ? 'Unpublish (make draft)' : 'Publish to public'}
                                >
                                  {slot.isPublished !== false ? <EyeOff size={14} /> : <Eye size={14} />}
                                  {slot.isPublished !== false ? 'Unpublish' : 'Publish'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDuplicateSlot(slot._id)}
                                  style={{
                                    padding: '0.35rem 0.65rem',
                                    borderRadius: '6px',
                                    border: '1px solid #8b5cf6',
                                    color: '#a78bfa',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    fontSize: '0.78rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.3rem'
                                  }}
                                  title="Duplicate / Copy Schedule"
                                >
                                  <Copy size={14} /> Copy
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenSlotModal(slot)}
                                  style={{
                                    padding: '0.35rem 0.65rem',
                                    borderRadius: '6px',
                                    border: '1px solid #38bdf8',
                                    color: '#38bdf8',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    fontSize: '0.78rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.3rem'
                                  }}
                                  title="Edit in full modal"
                                >
                                  <Edit2 size={14} /> Edit Full
                                </button>
                                <button
                                  type="button"
                                  className="action-btn delete-btn"
                                  onClick={() => handleDelete(slot._id)}
                                  style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid #ef4444', color: '#ef4444', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem' }}
                                  title="Delete Slot"
                                >
                                  <Trash2 size={14} /> Delete
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
                            <div className="se-field">
                              <label>Slot Timing</label>
                              <input
                                type="text"
                                value={ed.timing || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  handleEditorFieldChange(slot._id, 'timing', val);
                                  if (ed.scheduleMatches && ed.scheduleMatches.length > 0) {
                                    handleEditorScheduleChange(slot._id, 0, 'time', val);
                                  }
                                }}
                                placeholder="e.g. 2:00 PM"
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
                                    placeholder="e.g. 2:00 PM"
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
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#a78bfa', fontWeight: '700' }}>
                                  🔗 Slot / Match Link (WhatsApp / Discord / Custom URL)
                                </label>
                                <input
                                  type="url"
                                  value={ed.customLink || ed.whatsappLink || ''}
                                  onChange={(e) => {
                                    handleEditorFieldChange(slot._id, 'customLink', e.target.value);
                                    handleEditorFieldChange(slot._id, 'whatsappLink', e.target.value);
                                  }}
                                  placeholder="https://chat.whatsapp.com/... or https://discord.gg/..."
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
                </div>
              );
            })()}
          </>
        )}
      </div>

      {/* ── MODAL ── */}
      {showModal && (
        <div className="modal-overlay">
          <div className={`modal ${(activeTab === 'slots' || activeTab === 'todayslots') ? 'slot-modal' : ''}`}>
            <h3>{editingItem ? 'Edit' : 'Add'} {activeTab === 'rankings' ? 'Ranking' : activeTab === 'tournaments' ? 'Tournament' : (activeTab === 'todayslots' ? "Today's Slot" : 'Slot')}</h3>
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
              ) : (activeTab === 'slots' || activeTab === 'todayslots') ? (
                <div className="new-slot-modern-modal">
                  {/* Quick Preset Selector */}
                  <div className="modal-slot-preset-bar">
                    <span className="mspb-label">⚡ Slot Preset:</span>
                    <button
                      type="button"
                      className={`modal-preset-chip ${(formData.category === 'SCRIMS' && isSlotForDate(formData, formatDateForSlot(new Date()))) ? 'active' : ''}`}
                      onClick={() => handleSwitchSlotPreset('today')}
                    >
                      📅 Today's Scrims
                    </button>
                    <button
                      type="button"
                      className={`modal-preset-chip ${formData.category === 'WEEKEND WAR' ? 'active' : ''}`}
                      onClick={() => handleSwitchSlotPreset('weekend')}
                    >
                      🏆 Weekend War
                    </button>
                    <button
                      type="button"
                      className={`modal-preset-chip ${formData.category === 'WEEKLY WAR' ? 'active' : ''}`}
                      onClick={() => handleSwitchSlotPreset('weekly')}
                    >
                      ⚔️ Weekly War
                    </button>
                    <button
                      type="button"
                      className={`modal-preset-chip ${formData.category === 'GRANDS' ? 'active' : ''}`}
                      onClick={() => handleSwitchSlotPreset('grands')}
                    >
                      👑 Grands
                    </button>
                    <button
                      type="button"
                      className="modal-preset-chip"
                      onClick={() => handleSwitchSlotPreset('custom')}
                    >
                      ✨ Custom
                    </button>
                  </div>

                  <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ margin: 0 }}>Match / Tournament Title *</label>
                        <span style={{ fontSize: '0.72rem', color: '#a855f7' }}>⚡ 1-Click Fill</span>
                      </div>
                      <input
                        type="text"
                        value={formData.matchName || ''}
                        onChange={e => setFormData({ ...formData, matchName: e.target.value })}
                        placeholder="e.g. RISING 1-3 GRIND SCRIMS"
                        required
                      />
                      <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                        {[
                          { label: '01-03 PM Scrim', name: 'RMC 01-03 PM GRIND SCRIMS', time: '01:00 PM' },
                          { label: '03-05 PM Scrim', name: 'RMC 03-05 PM GRIND SCRIMS', time: '03:00 PM' },
                          { label: '07-09 PM Scrim', name: 'RMC 07-09 PM GRIND SCRIMS', time: '07:00 PM' },
                          { label: '09-11 PM Scrim', name: 'RMC 09-11 PM GRIND SCRIMS', time: '09:00 PM' },
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                matchName: preset.name,
                                timing: preset.time,
                                scheduleMatches: [
                                  { label: 'MATCH 1 (ERANGEL)', time: preset.time },
                                  { label: 'MATCH 2 (RONDO)', time: '02:00 PM' },
                                  { label: 'MATCH 3 (MIRAMAR)', time: '03:00 PM' }
                                ]
                              }));
                            }}
                            style={{
                              background: 'rgba(124, 58, 237, 0.15)',
                              border: '1px solid rgba(124, 58, 237, 0.35)',
                              color: '#c084fc',
                              fontSize: '0.72rem',
                              padding: '2px 8px',
                              borderRadius: '5px',
                              cursor: 'pointer'
                            }}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Category *</label>
                      <select
                        value={formData.category || 'SCRIMS'}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                        className="se-select"
                      >
                        <option value="SCRIMS">Daily Scrims (SCRIMS)</option>
                        <option value="WEEKLY WAR">Weekly War</option>
                        <option value="WEEKEND WAR">Weekend War</option>
                        <option value="GRANDS">Grands</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Lobby Name *</label>
                      <input
                        type="text"
                        value={formData.lobby || 'LOBBY 1'}
                        onChange={e => setFormData({ ...formData, lobby: e.target.value })}
                        placeholder="e.g. LOBBY 01, LOBBY 02"
                        required
                      />
                      <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.35rem' }}>
                        {['LOBBY 1', 'LOBBY 2', 'LOBBY 3'].map(l => (
                          <button
                            key={l}
                            type="button"
                            onClick={() => setFormData({ ...formData, lobby: l })}
                            style={{
                              background: formData.lobby === l ? 'rgba(124, 58, 237, 0.4)' : 'rgba(255, 255, 255, 0.05)',
                              border: `1px solid ${formData.lobby === l ? '#a855f7' : 'rgba(255, 255, 255, 0.1)'}`,
                              color: formData.lobby === l ? '#fff' : '#94a3b8',
                              fontSize: '0.72rem',
                              padding: '2px 8px',
                              borderRadius: '5px',
                              cursor: 'pointer'
                            }}
                          >
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="form-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ margin: 0 }}>Scheduled Date *</label>
                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, date: formatDateForSlot(new Date()) }))}
                            style={{
                              background: 'rgba(168, 85, 247, 0.15)',
                              border: '1px solid rgba(168, 85, 247, 0.4)',
                              color: '#c084fc',
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              padding: '1px 7px',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                            title="Set date to today"
                          >
                            📅 Today
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const tm = new Date();
                              tm.setDate(tm.getDate() + 1);
                              setFormData(prev => ({ ...prev, date: formatDateForSlot(tm) }));
                            }}
                            style={{
                              background: 'rgba(255, 255, 255, 0.06)',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              color: '#94a3b8',
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              padding: '1px 7px',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                            title="Set date to tomorrow"
                          >
                            Tomorrow
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={formData.date || ''}
                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                        placeholder="e.g. 10 Oct 2026"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Slot Timing * (Asia/Kolkata IST)</label>
                      <input
                        type="text"
                        value={formData.timing || ''}
                        onChange={e => {
                          const val = e.target.value;
                          setFormData(prev => {
                            const sm = [...(prev.scheduleMatches || [])];
                            if (sm.length > 0) sm[0] = { ...sm[0], time: val };
                            return { ...prev, timing: val, scheduleMatches: sm };
                          });
                        }}
                        placeholder="e.g. 02:00 PM"
                        required
                      />
                      <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                        {['01:00 PM', '03:00 PM', '07:00 PM', '09:00 PM'].map(t => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => {
                              setFormData(prev => {
                                const sm = [...(prev.scheduleMatches || [])];
                                if (sm.length > 0) sm[0] = { ...sm[0], time: t };
                                return { ...prev, timing: t, scheduleMatches: sm };
                              });
                            }}
                            style={{
                              background: formData.timing === t ? 'rgba(124, 58, 237, 0.4)' : 'rgba(255, 255, 255, 0.05)',
                              border: `1px solid ${formData.timing === t ? '#a855f7' : 'rgba(255, 255, 255, 0.1)'}`,
                              color: formData.timing === t ? '#fff' : '#94a3b8',
                              fontSize: '0.72rem',
                              padding: '2px 8px',
                              borderRadius: '5px',
                              cursor: 'pointer'
                            }}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Entry Fee (₹) *</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.entryFee ?? 60}
                        onChange={e => setFormData({ ...formData, entryFee: Number(e.target.value), price: Number(e.target.value) })}
                        required
                      />
                      <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.35rem' }}>
                        {[0, 60, 100, 150].map(fee => (
                          <button
                            key={fee}
                            type="button"
                            onClick={() => setFormData({ ...formData, entryFee: fee, price: fee })}
                            style={{
                              background: (formData.entryFee ?? 60) === fee ? 'rgba(124, 58, 237, 0.4)' : 'rgba(255, 255, 255, 0.05)',
                              border: `1px solid ${(formData.entryFee ?? 60) === fee ? '#a855f7' : 'rgba(255, 255, 255, 0.1)'}`,
                              color: (formData.entryFee ?? 60) === fee ? '#fff' : '#94a3b8',
                              fontSize: '0.72rem',
                              padding: '2px 8px',
                              borderRadius: '5px',
                              cursor: 'pointer'
                            }}
                          >
                            {fee === 0 ? 'Free' : `₹${fee}`}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Total Prize Pool (₹) *</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.prizePoolTotal ?? 5000}
                        onChange={e => setFormData({ ...formData, prizePoolTotal: Number(e.target.value) })}
                        placeholder="e.g. 5000"
                        required
                      />
                      <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.35rem' }}>
                        {[500, 1000, 5000, 10000].map(pz => (
                          <button
                            key={pz}
                            type="button"
                            onClick={() => setFormData({ ...formData, prizePoolTotal: pz })}
                            style={{
                              background: (formData.prizePoolTotal ?? 5000) === pz ? 'rgba(124, 58, 237, 0.4)' : 'rgba(255, 255, 255, 0.05)',
                              border: `1px solid ${(formData.prizePoolTotal ?? 5000) === pz ? '#a855f7' : 'rgba(255, 255, 255, 0.1)'}`,
                              color: (formData.prizePoolTotal ?? 5000) === pz ? '#fff' : '#94a3b8',
                              fontSize: '0.72rem',
                              padding: '2px 8px',
                              borderRadius: '5px',
                              cursor: 'pointer'
                            }}
                          >
                            ₹{pz}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label>Total Slots / Max Teams *</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.maxTeams ?? 20}
                        onChange={e => setFormData({ ...formData, maxTeams: Number(e.target.value) })}
                        required
                      />
                      <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.35rem' }}>
                        {[19, 20, 25].map(st => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setFormData({ ...formData, maxTeams: st })}
                            style={{
                              background: (formData.maxTeams ?? 20) === st ? 'rgba(124, 58, 237, 0.4)' : 'rgba(255, 255, 255, 0.05)',
                              border: `1px solid ${(formData.maxTeams ?? 20) === st ? '#a855f7' : 'rgba(255, 255, 255, 0.1)'}`,
                              color: (formData.maxTeams ?? 20) === st ? '#fff' : '#94a3b8',
                              fontSize: '0.72rem',
                              padding: '2px 8px',
                              borderRadius: '5px',
                              cursor: 'pointer'
                            }}
                          >
                            {st} Teams
                          </button>
                        ))}
                      </div>
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
                            placeholder="e.g. 2:00 PM"
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Presets:</span>
                        <button
                          type="button"
                          className="se-pill-add-btn"
                          style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                          onClick={() => setModalPrizePreset('top3')}
                        >
                          Top 3
                        </button>
                        <button
                          type="button"
                          className="se-pill-add-btn"
                          style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                          onClick={() => setModalPrizePreset('top5')}
                        >
                          Top 5
                        </button>
                        <button
                          type="button"
                          className="se-pill-add-btn"
                          style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                          onClick={() => setModalPrizePreset('firstOnly')}
                        >
                          #1 Only
                        </button>
                        <button
                          type="button"
                          className="se-pill-add-btn"
                          onClick={addModalPrizeDistRow}
                        >
                          + Add Rank
                        </button>
                      </div>
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

                  {/* Collapsible Advanced Settings for Admin / Client */}
                  <div style={{ marginTop: '1.2rem', borderRadius: '10px', border: '1px solid rgba(168, 85, 247, 0.3)', background: 'rgba(18, 14, 38, 0.7)', overflow: 'hidden' }}>
                    <button
                      type="button"
                      onClick={() => setShowAdvancedSlotFields(!showAdvancedSlotFields)}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        background: 'rgba(124, 58, 237, 0.15)',
                        border: 'none',
                        color: '#c084fc',
                        fontWeight: '700',
                        fontSize: '0.86rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        ⚙️ Advanced &amp; Optional Settings (Room ID, Password, Rules, Poster, WhatsApp)
                      </span>
                      <span>{showAdvancedSlotFields ? '▲ Hide' : '▼ Show (Optional)'}</span>
                    </button>
                    {showAdvancedSlotFields && (
                      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* Credentials */}
                        <div className="se-credentials-box" style={{ margin: 0 }}>
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

                        {/* Status & Visibility */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div className="form-group">
                            <label>Registration Status</label>
                            <select
                              value={formData.registrationStatus || 'Open'}
                              onChange={e => setFormData({ ...formData, registrationStatus: e.target.value })}
                              className="se-select"
                            >
                              <option value="Open">Registration Open</option>
                              <option value="Upcoming">Upcoming</option>
                              <option value="Closed">Registration Closed</option>
                              <option value="Full">Lobby Full</option>
                              <option value="Ongoing">Ongoing / Live</option>
                              <option value="Completed">Completed</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Tournament Visibility</label>
                            <select
                              value={formData.isPublished !== false ? 'published' : 'draft'}
                              onChange={e => setFormData({ ...formData, isPublished: e.target.value === 'published' })}
                              className="se-select"
                            >
                              <option value="published">Published (Visible to Players)</option>
                              <option value="draft">Draft (Hidden from Public)</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Registration Opens At (Optional)</label>
                            <input
                              type="text"
                              value={formData.registrationOpenTime || ''}
                              onChange={e => setFormData({ ...formData, registrationOpenTime: e.target.value })}
                              placeholder="e.g. 10:00 AM 10 Oct 2026"
                            />
                          </div>
                          <div className="form-group">
                            <label>Registration Closes At (Optional)</label>
                            <input
                              type="text"
                              value={formData.registrationCloseTime || ''}
                              onChange={e => setFormData({ ...formData, registrationCloseTime: e.target.value })}
                              placeholder="e.g. 01:30 PM 10 Oct 2026"
                            />
                          </div>
                          <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label>Map Rotation (comma separated)</label>
                            <input
                              type="text"
                              value={Array.isArray(formData.maps) ? formData.maps.join(', ') : (formData.maps || '')}
                              onChange={e => setFormData({ ...formData, maps: e.target.value })}
                              placeholder="ERANGEL, RONDO, MIRAMAR"
                            />
                          </div>
                        </div>

                        {/* Poster / Banner */}
                        <div className="form-group">
                          <label>Tournament Poster / Banner Image</label>
                          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            {(formData.heroImage || formData.heroImagePreview) && (
                              <img
                                src={formData.heroImagePreview || formData.heroImage}
                                alt="Preview"
                                style={{ width: '80px', height: '50px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #a855f7' }}
                              />
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setFormData({
                                    ...formData,
                                    heroImageFile: file,
                                    heroImagePreview: URL.createObjectURL(file),
                                  });
                                }
                              }}
                              style={{ flex: 1, padding: '0.4rem', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}
                            />
                          </div>
                        </div>

                        {/* Overview & Rules */}
                        <div className="form-group">
                          <label>Tournament Overview / Description</label>
                          <textarea
                            rows={2}
                            value={formData.description || ''}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Daily grind scrims for all the passionate BGMI players. Compete, showcase your skills and win exciting rewards!"
                            style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '8px', color: '#fff', padding: '0.65rem' }}
                          />
                        </div>
                        <div className="form-group">
                          <label>Rules &amp; Instructions</label>
                          <textarea
                            rows={2}
                            value={formData.rules || ''}
                            onChange={e => setFormData({ ...formData, rules: e.target.value })}
                            placeholder="1. Emulators/iPads strictly prohibited. 2. Match starts on time. 3. Respect lobby slots."
                            style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '8px', color: '#fff', padding: '0.65rem' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
              <div className="modal-footer">
                <button type="button" className="tab-btn cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="tab-btn active" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : (formData._id ? 'Update Slot' : '🚀 Create Slot')}
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
              <div className="form-grid results-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
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

              <div className="results-input-table-wrap" style={{ maxHeight: '350px', overflowY: 'auto', overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
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

      {/* ── OFFICIAL COMMUNITY WHATSAPP GROUP LINK MODAL ── */}
      {showOfficialWaModal && (
        <div className="modal-overlay fade-in" onClick={() => setShowOfficialWaModal(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '560px' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(37, 211, 102, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#25D366'
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                  </svg>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>Official WhatsApp Group Link</h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Controls the &quot;Official WhatsApp Group / Join Now&quot; banner &amp; footer link
                  </p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowOfficialWaModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveOfficialWa}>
              <div style={{ padding: '1.25rem 0' }}>
                <div style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '8px',
                  background: 'rgba(37, 211, 102, 0.08)',
                  border: '1px solid rgba(37, 211, 102, 0.25)',
                  marginBottom: '1.2rem',
                  fontSize: '0.82rem',
                  color: '#d1fae5',
                  lineHeight: '1.45'
                }}>
                  📢 Users clicking <strong>&quot;Join Now&quot;</strong> on the homepage community banner or footer WhatsApp icon will be automatically redirected to this group for Room ID, passwords, and tournament updates.
                </div>

                <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>
                    Official WhatsApp Group Invite Link:
                  </label>
                  <input
                    type="url"
                    value={officialWaLink}
                    onChange={(e) => setOfficialWaLink(e.target.value)}
                    placeholder="https://chat.whatsapp.com/..."
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.9rem',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.9rem',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>

                {/* Direct Action Link & Test Button */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px dashed var(--border-color)',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    <span>Want to test the redirection?</span>
                  </div>
                  <a
                    href={officialWaLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.4rem 0.85rem',
                      borderRadius: '6px',
                      background: 'rgba(37, 211, 102, 0.18)',
                      border: '1px solid #25D366',
                      color: '#4ade80',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      textDecoration: 'none'
                    }}
                  >
                    <span>Test &amp; Open Group</span>
                    <ArrowUpRight size={14} />
                  </a>
                </div>

                {officialWaSavedMsg && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: '#34d399',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    textAlign: 'center'
                  }}>
                    {officialWaSavedMsg}
                  </div>
                )}
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="tab-btn cancel-btn"
                  onClick={() => setShowOfficialWaModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="action-btn"
                  disabled={savingOfficialWa}
                  style={{
                    background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    color: '#fff',
                    fontWeight: 600
                  }}
                >
                  {savingOfficialWa ? (
                    <>
                      <RefreshCw size={15} className="spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save size={15} />
                      <span>Save &amp; Update Link</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── VIEW REQUIREMENT DETAILS MODAL ── */}
      {viewReqModal.open && viewReqModal.item && (
        <div className="modal-overlay" onClick={() => setViewReqModal({ open: false, item: null })}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '520px', width: '100%', background: '#0e0a1f', border: '1px solid rgba(168, 85, 247, 0.5)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(168, 85, 247, 0.25)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    background: viewReqModal.item.type === 'PLAYER' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(232, 121, 249, 0.2)',
                    color: viewReqModal.item.type === 'PLAYER' ? '#38bdf8' : '#e879f9',
                    border: `1px solid ${viewReqModal.item.type === 'PLAYER' ? '#38bdf8' : '#e879f9'}`,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                  }}
                >
                  {viewReqModal.item.type === 'PLAYER' ? 'LOOKING FOR PLAYER' : 'LOOKING FOR TEAM'}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  ID: {viewReqModal.item._id.slice(-6)}
                </span>
              </div>
              <button
                type="button"
                className="header-icon-btn"
                onClick={() => setViewReqModal({ open: false, item: null })}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.82rem', maxHeight: '70vh', overflowY: 'auto' }}>
              <div>
                <div style={{ color: '#a0a0c4', fontSize: '0.72rem' }}>Publisher:</div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>
                  {viewReqModal.item.user?.teamName || 'Competitive User'}
                  {viewReqModal.item.user?.registrationNumber && ` (Rising #${viewReqModal.item.user.registrationNumber})`}
                </div>
                <div style={{ color: '#c084fc', fontSize: '0.75rem' }}>
                  Phone: {viewReqModal.item.user?.phone || 'N/A'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                <div>
                  <span style={{ color: '#a0a0c4', fontSize: '0.7rem' }}>Role:</span>
                  <div style={{ color: '#fff', fontWeight: 700 }}>{viewReqModal.item.role}</div>
                </div>
                <div>
                  <span style={{ color: '#a0a0c4', fontSize: '0.7rem' }}>Device:</span>
                  <div style={{ color: '#fff', fontWeight: 700 }}>{viewReqModal.item.device}</div>
                </div>
                <div>
                  <span style={{ color: '#a0a0c4', fontSize: '0.7rem' }}>Age:</span>
                  <div style={{ color: '#fff' }}>{viewReqModal.item.age} years</div>
                </div>
                <div>
                  <span style={{ color: '#a0a0c4', fontSize: '0.7rem' }}>Experience:</span>
                  <div style={{ color: '#fff' }}>{viewReqModal.item.experience}</div>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: '#a0a0c4', fontSize: '0.7rem' }}>
                    {viewReqModal.item.type === 'PLAYER' ? 'Availability:' : 'Playing Time:'}
                  </span>
                  <div style={{ color: '#e2e8f0', fontWeight: 600 }}>
                    {viewReqModal.item.type === 'PLAYER' ? viewReqModal.item.availability : viewReqModal.item.playingTime}
                  </div>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: '#a0a0c4', fontSize: '0.7rem' }}>Contact Detail:</span>
                  <div style={{ color: '#22c55e', fontWeight: 700 }}>{viewReqModal.item.contact}</div>
                </div>
              </div>

              {viewReqModal.item.achievements && (
                <div>
                  <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.75rem' }}>Achievements:</div>
                  <div style={{ color: '#e2e8f0', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px', marginTop: '2px', whiteSpace: 'pre-wrap' }}>
                    {viewReqModal.item.achievements}
                  </div>
                </div>
              )}

              {viewReqModal.item.additionalInfo && (
                <div>
                  <div style={{ color: '#c4b5fd', fontWeight: 700, fontSize: '0.75rem' }}>Additional Info:</div>
                  <div style={{ color: '#cbd5e1', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px', marginTop: '2px', whiteSpace: 'pre-wrap' }}>
                    {viewReqModal.item.additionalInfo}
                  </div>
                </div>
              )}

              {viewReqModal.item.clips && (
                <div>
                  <div style={{ color: '#e879f9', fontWeight: 700, fontSize: '0.75rem' }}>Clips URL:</div>
                  <a
                    href={viewReqModal.item.clips.startsWith('http') ? viewReqModal.item.clips : `https://${viewReqModal.item.clips}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#38bdf8', wordBreak: 'break-all', display: 'inline-block', marginTop: '2px' }}
                  >
                    {viewReqModal.item.clips} ↗
                  </a>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Status: <strong style={{ color: viewReqModal.item.status === 'active' ? '#4ade80' : '#f87171' }}>{viewReqModal.item.status}</strong>
                </span>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleToggleRequirementStatus(viewReqModal.item._id, viewReqModal.item.status)}
                    style={{
                      background: 'rgba(124, 58, 237, 0.2)',
                      border: '1px solid rgba(168, 85, 247, 0.4)',
                      borderRadius: '6px',
                      padding: '5px 10px',
                      color: '#c084fc',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    Toggle Status
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteRequirement(viewReqModal.item._id)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid rgba(239, 68, 68, 0.5)',
                      borderRadius: '6px',
                      padding: '5px 10px',
                      color: '#f87171',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── UPLOAD RESULT PHOTO MODAL (Daily Scrims & Weekly/Weekend War) ── */}
      {showUploadResultPhotoModal && (
        <div className="modal-overlay" onClick={() => setShowUploadResultPhotoModal(false)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '580px', width: '100%', background: '#090a14', border: '1.5px solid rgba(139, 92, 246, 0.45)', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(139, 92, 246, 0.25)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Upload size={18} style={{ color: '#c084fc' }} />
                <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1rem', fontWeight: 800 }}>
                  Publish Match Result Photo
                </h3>
              </div>
              <button
                type="button"
                className="header-icon-btn"
                onClick={() => setShowUploadResultPhotoModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUploadResultPhotoSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {/* 1. Category Switcher (Two Options: Daily Scrims vs Weekly & Weekend War) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#c084fc', fontWeight: 800, marginBottom: '5px' }}>
                  Select Result Category *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadResultForm(prev => ({
                        ...prev,
                        category: 'DAILY SCRIMS',
                        matchName: 'RISING 03-05 PM GRIND SCRIMS - POINT TABLE',
                      }));
                    }}
                    style={{
                      background: uploadResultForm.category === 'DAILY SCRIMS'
                        ? 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)'
                        : 'rgba(255, 255, 255, 0.04)',
                      border: `1.5px solid ${uploadResultForm.category === 'DAILY SCRIMS' ? '#c084fc' : 'rgba(139, 92, 246, 0.2)'}`,
                      color: '#ffffff',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    ⚡ DAILY SCRIMS
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUploadResultForm(prev => ({
                        ...prev,
                        category: 'WEEKLY & WEEKEND WAR',
                        matchName: 'RISING WEEKLY WAR - POINT TABLE',
                      }));
                    }}
                    style={{
                      background: uploadResultForm.category === 'WEEKLY & WEEKEND WAR'
                        ? 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)'
                        : 'rgba(255, 255, 255, 0.04)',
                      border: `1.5px solid ${uploadResultForm.category === 'WEEKLY & WEEKEND WAR' ? '#fbbf24' : 'rgba(245, 158, 11, 0.2)'}`,
                      color: '#ffffff',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    🏆 WEEKLY &amp; WEEKEND WAR
                  </button>
                </div>
              </div>

              {/* Quick Title Presets */}
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, marginBottom: '4px' }}>
                  Quick Preset Titles:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '4px' }}>
                  {(uploadResultForm.category === 'DAILY SCRIMS'
                    ? [
                        'RISING 01-03 PM GRIND SCRIMS - POINT TABLE',
                        'RISING 03-05 PM GRIND SCRIMS - POINT TABLE',
                        'RISING 07-09 PM GRIND SCRIMS - POINT TABLE',
                        'RISING 09-11 PM GRIND SCRIMS - POINT TABLE',
                      ]
                    : [
                        'RISING WEEKLY WAR - POINT TABLE',
                        'RISING WEEKEND WAR - POINT TABLE',
                        'RISING GRANDS FINALS - POINT TABLE',
                      ]
                  ).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setUploadResultForm(prev => ({ ...prev, matchName: preset }))}
                      style={{
                        background: uploadResultForm.matchName === preset ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${uploadResultForm.matchName === preset ? '#c084fc' : 'rgba(255, 255, 255, 0.15)'}`,
                        color: uploadResultForm.matchName === preset ? '#ffffff' : '#c4b5fd',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {preset.replace(' - POINT TABLE', '')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title / Scrim Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: '#e2e8f0', fontWeight: 700, marginBottom: '3px' }}>
                  Match / Point Table Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RISING 03-05 PM GRIND SCRIMS - POINT TABLE"
                  value={uploadResultForm.matchName}
                  onChange={(e) => setUploadResultForm(prev => ({ ...prev, matchName: e.target.value }))}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(139, 92, 246, 0.4)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    color: '#fff',
                    fontSize: '0.82rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Date & Default Lobby (2 columns) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#e2e8f0', fontWeight: 700, marginBottom: '3px' }}>
                    Default Lobby *
                  </label>
                  <select
                    value={uploadResultForm.lobby}
                    onChange={(e) => setUploadResultForm(prev => ({ ...prev, lobby: e.target.value }))}
                    style={{
                      width: '100%',
                      background: '#100e1f',
                      border: '1px solid rgba(139, 92, 246, 0.4)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      color: '#60a5fa',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="LOBBY 01">LOBBY 01</option>
                    <option value="LOBBY 02">LOBBY 02</option>
                    <option value="LOBBY 03">LOBBY 03</option>
                    <option value="LOBBY 04">LOBBY 04</option>
                    <option value="LOBBY 05">LOBBY 05</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#e2e8f0', fontWeight: 700, marginBottom: '3px' }}>
                    Result Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={uploadResultForm.date}
                    onChange={(e) => setUploadResultForm(prev => ({ ...prev, date: e.target.value }))}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(139, 92, 246, 0.4)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      color: '#fff',
                      fontSize: '0.82rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Image File Selector (Multiple Files Allowed) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: '#c084fc', fontWeight: 800, marginBottom: '3px' }}>
                  Select Result Photo(s) * (Single or Multiple)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleResultPhotoFileChange}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px dashed rgba(168, 85, 247, 0.5)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    color: '#c084fc',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                  }}
                />
                <span style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px', display: 'block' }}>
                  Tip: Hold Ctrl/Shift to pick multiple photos (e.g. Lobby 01 + Lobby 02, or Match 1 + Match 2)
                </span>
              </div>

              {/* Multiple Uploaded Photos Cards */}
              {uploadResultForm.items && uploadResultForm.items.length > 0 && (
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(139, 92, 246, 0.25)', borderRadius: '10px', padding: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f3e8ff' }}>
                      Selected Photos ({uploadResultForm.items.length}):
                    </span>

                    {uploadResultForm.items.length > 1 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.68rem', color: '#c084fc' }}>Batch Lobbies:</span>
                        <input
                          type="checkbox"
                          checked={uploadResultForm.isBatchMode}
                          onChange={(e) => setUploadResultForm(prev => ({ ...prev, isBatchMode: e.target.checked }))}
                          id="batch-mode-toggle"
                          style={{ cursor: 'pointer' }}
                        />
                        <label htmlFor="batch-mode-toggle" style={{ fontSize: '0.68rem', color: '#94a3b8', cursor: 'pointer' }}>
                          Publish separate lobby results
                        </label>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                    {uploadResultForm.items.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          background: 'rgba(0, 0, 0, 0.4)',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                        }}
                      >
                        <img
                          src={item.preview}
                          alt={`Upload preview ${idx + 1}`}
                          style={{ width: '45px', height: '32px', objectFit: 'cover', borderRadius: '4px' }}
                        />
                        <span style={{ fontSize: '0.72rem', color: '#ffffff', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.file.name}
                        </span>

                        {uploadResultForm.isBatchMode && uploadResultForm.items.length > 1 && (
                          <select
                            value={item.lobby}
                            onChange={(e) => handleUpdateItemLobby(idx, e.target.value)}
                            style={{
                              background: '#120e26',
                              border: '1px solid #1d4ed8',
                              color: '#60a5fa',
                              borderRadius: '4px',
                              padding: '2px 6px',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                            }}
                          >
                            <option value="LOBBY 01">LOBBY 01</option>
                            <option value="LOBBY 02">LOBBY 02</option>
                            <option value="LOBBY 03">LOBBY 03</option>
                            <option value="LOBBY 04">LOBBY 04</option>
                            <option value="LOBBY 05">LOBBY 05</option>
                          </select>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemovePhotoItem(idx)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '2px 4px',
                          }}
                          title="Remove photo"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Optional Manual URL input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.68rem', color: '#94a3b8', marginBottom: '2px' }}>
                  Or paste direct image URL (optional fallback):
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={uploadResultForm.manualUrl}
                  onChange={(e) => setUploadResultForm(prev => ({ ...prev, manualUrl: e.target.value }))}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '6px',
                    padding: '6px 8px',
                    color: '#fff',
                    fontSize: '0.75rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="tab-btn cancel-btn"
                  onClick={() => setShowUploadResultPhotoModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingResultPhoto}
                  style={{
                    background: uploadResultForm.category === 'WEEKLY & WEEKEND WAR'
                      ? 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)'
                      : 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 18px',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: uploadingResultPhoto ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 10px rgba(139, 92, 246, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {uploadingResultPhoto ? (
                    <>
                      <RefreshCw size={14} className="spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={14} />
                      <span>
                        Publish {uploadResultForm.items.length > 1 ? `(${uploadResultForm.items.length}) Results` : 'Result'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── PREVIEW PHOTO LIGHTBOX MODAL ── */}
      {previewPhotoModal.open && (
        <div className="modal-overlay" onClick={() => setPreviewPhotoModal({ open: false, url: '', title: '', allUrls: [], activeIndex: 0 })}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '680px', width: '100%', background: '#070810', border: '1.5px solid rgba(139, 92, 246, 0.5)', padding: '1.1rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h4 style={{ margin: 0, color: '#ffffff', fontSize: '0.92rem', fontWeight: 800 }}>
                {previewPhotoModal.title}
              </h4>
              <button
                type="button"
                className="header-icon-btn"
                onClick={() => setPreviewPhotoModal({ open: false, url: '', title: '', allUrls: [], activeIndex: 0 })}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Photo switcher pills if multiple photos exist */}
            {previewPhotoModal.allUrls && previewPhotoModal.allUrls.length > 1 && (
              <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', overflowX: 'auto' }}>
                {previewPhotoModal.allUrls.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPreviewPhotoModal(prev => ({ ...prev, url: imgUrl, activeIndex: idx }))}
                    style={{
                      background: (previewPhotoModal.activeIndex || 0) === idx ? '#7c3aed' : 'rgba(255, 255, 255, 0.08)',
                      border: `1px solid ${(previewPhotoModal.activeIndex || 0) === idx ? '#c084fc' : 'rgba(255, 255, 255, 0.15)'}`,
                      color: '#ffffff',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Photo {idx + 1}
                  </button>
                ))}
              </div>
            )}

            <div style={{ textAlign: 'center' }}>
              <img
                src={previewPhotoModal.url}
                alt="Result Point Table"
                style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '8px' }}
              />
              <div style={{ marginTop: '0.75rem' }}>
                <a
                  href={previewPhotoModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(124, 58, 237, 0.25)',
                    border: '1px solid #a855f7',
                    color: '#c084fc',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  <ExternalLink size={14} />
                  <span>Open Full Size</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
