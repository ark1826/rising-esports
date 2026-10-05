import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  Users, MapPin, Search, AlertTriangle, Check, RefreshCw, X,
  ChevronRight, Crosshair, Copy, CheckCheck, Grid, Columns, Shield, Sparkles
} from 'lucide-react';
import PaymentModal from '../components/PaymentModal';
import DropListView from '../components/DropListView';
import bannerImg from '../assets/slots_banner.jpg';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const CATEGORIES = ['SCRIMS', 'GRANDS', 'WEEKLY WAR', 'WEEKEND WAR', 'ALL'];

// Predefined drop locations for major BGMI scrim maps
const MAP_DROP_PRESETS = {
  ERANGEL: [
    'Pochinki',
    'School / Apartments',
    'Rozhok',
    'Georgopol (City & Crates)',
    'Military Base (Sosnovka)',
    'Yasnaya Polyana',
    'Novorepnoye',
    'Mylta / Mylta Power',
    'Severny',
    'Gatka',
    'Primorsk',
    'Lipovka',
    'Shelter / Prison',
    'Mansion',
    'Quarry / Ferry Pier',
    'Zharki',
    'Kameshki / Stalber',
    'Hospital',
    'Shooting Range',
    'Water City',
    'Farm'
  ],
  ERANGLE: [
    'Pochinki',
    'School / Apartments',
    'Rozhok',
    'Georgopol (City & Crates)',
    'Military Base (Sosnovka)',
    'Yasnaya Polyana',
    'Novorepnoye',
    'Mylta / Mylta Power',
    'Severny',
    'Gatka',
    'Primorsk',
    'Lipovka',
    'Shelter / Prison',
    'Mansion',
    'Quarry / Ferry Pier',
    'Zharki',
    'Kameshki / Stalber',
    'Hospital',
    'Shooting Range',
    'Water City',
    'Farm'
  ],
  MIRAMAR: [
    'Pecado',
    'Hacienda del Patron',
    'Los Leones',
    'San Martin',
    'El Pozo',
    'Chumacera',
    'Impala',
    'Monte Nuevo',
    'Campo Militar',
    'Valle del Mar',
    'Minas Generales',
    'Puerto Paraiso',
    'La Cobreria',
    'Tierra Robada',
    'Water Treatment',
    'Crater Fields'
  ],
  RONDO: [
    'Jadena City',
    'Neoox',
    'Stadium',
    'Yu Lin',
    'Tin Long Garden',
    'Mey Ran',
    'Dan Sang',
    'Bei Li',
    'Rin Jiang',
    'Lo Hua Xing',
    'Hung Shan',
    'Fang'
  ],
  SANHOK: [
    'Bootcamp',
    'Paradise Resort',
    'Ruins',
    'Camp Alpha',
    'Camp Bravo',
    'Camp Charlie',
    'Pai Nan',
    'Ha Tinh',
    'Sahmee',
    'Khai',
    'Cave'
  ],
  VIKENDI: [
    'Castle',
    'Villa',
    'Goroka',
    'Cosmodrome',
    'Dino Park',
    'Volnova',
    'Peshkova',
    'Podvosto',
    'Cement Factory'
  ]
};

const getMapDropOptions = (mapName) => {
  const norm = (mapName || '').toUpperCase().trim();
  if (norm.includes('ERANG')) return MAP_DROP_PRESETS.ERANGEL;
  if (norm.includes('MIRAM')) return MAP_DROP_PRESETS.MIRAMAR;
  if (norm.includes('ROND')) return MAP_DROP_PRESETS.RONDO;
  if (norm.includes('SANH')) return MAP_DROP_PRESETS.SANHOK;
  if (norm.includes('VIKEND')) return MAP_DROP_PRESETS.VIKENDI;
  return MAP_DROP_PRESETS.ERANGEL;
};

const getTeamDrop = (team, mapName) => {
  if (!team) return '';
  const drops = team.dropLocations || {};
  const normalizedKey = (mapName || '').toLowerCase().trim();
  if (drops[normalizedKey]) return drops[normalizedKey];
  if (normalizedKey.includes('erang') && drops.erangel) return drops.erangel;
  if (normalizedKey.includes('erang') && drops.erangle) return drops.erangle;
  if (normalizedKey.includes('miram') && drops.miramar) return drops.miramar;
  if (normalizedKey.includes('rond') && drops.rondo) return drops.rondo;
  if (normalizedKey.includes('sanh') && drops.sanhok) return drops.sanhok;
  if (normalizedKey.includes('vikend') && drops.vikendi) return drops.vikendi;
  // Also check direct user profile fields on team object
  if (normalizedKey.includes('erang') && (team.erangelDrop || team.erangleDrop)) return team.erangelDrop || team.erangleDrop;
  if (normalizedKey.includes('miram') && team.miramarDrop) return team.miramarDrop;
  if (normalizedKey.includes('rond') && team.rondoDrop) return team.rondoDrop;
  for (const [k, v] of Object.entries(drops)) {
    if (k.toLowerCase().includes(normalizedKey) || normalizedKey.includes(k.toLowerCase())) {
      if (v) return v;
    }
  }
  return '';
};

const resolveMaps = (slot) => {
  if (!slot) return ['ERANGEL', 'MIRAMAR', 'RONDO'];
  if (slot.maps && Array.isArray(slot.maps) && slot.maps.length > 0) {
    const flattened = slot.maps.flatMap((m) => {
      if (!m) return [];
      if (typeof m === 'string') {
        return m.split(/[\s,+/]+/).filter(Boolean);
      }
      return [String(m)];
    });
    if (flattened.length > 0) {
      const normalized = flattened.map(m => {
        const u = m.toUpperCase().trim();
        return u === 'ERANGLE' ? 'ERANGEL' : u;
      });
      return Array.from(new Set(normalized));
    }
  }
  if (slot.mapName) {
    const parts = slot.mapName.split(/[\s,+/]+/).filter(Boolean).map(m => {
      const u = m.toUpperCase().trim();
      return u === 'ERANGLE' ? 'ERANGEL' : u;
    });
    if (parts.length > 0) return Array.from(new Set(parts));
  }
  return ['ERANGEL', 'MIRAMAR', 'RONDO'];
};

const getTeamMonogram = (name, tag) => {
  if (tag && tag.trim()) {
    return tag.trim().substring(0, 4).toUpperCase();
  }
  if (!name) return 'TM';
  const clean = name.trim();
  const matchTeam = clean.match(/^team\s+(.+)$/i);
  if (matchTeam) {
    const after = matchTeam[1].trim();
    if (after.length <= 4) return after.toUpperCase();
    const parts = after.split(/\s+/);
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return after.substring(0, 3).toUpperCase();
  }
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].substring(0, Math.min(3, words[0].length)).toUpperCase();
  }
  // Handles names like "RACIST 4" -> "R4"
  if (words.length === 2 && (/^\d+$/.test(words[1]) || words[1].length <= 2)) {
    return (words[0][0] + words[1]).toUpperCase();
  }
  return (words[0][0] + (words[1] ? words[1][0] : '')).toUpperCase();
};

const STICKER_PALETTES = [
  { bg: 'linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)', border: '#ef4444', text: '#fee2e2', glow: 'rgba(239, 68, 68, 0.45)' }, // Red like R4
  { bg: 'linear-gradient(135deg, #0369a1 0%, #0c4a6e 100%)', border: '#38bdf8', text: '#e0f2fe', glow: 'rgba(56, 189, 248, 0.45)' }, // Cyan/blue like DF
  { bg: 'linear-gradient(135deg, #6d28d9 0%, #4c1d95 100%)', border: '#c084fc', text: '#f3e8ff', glow: 'rgba(192, 132, 252, 0.45)' }, // Purple like Yodha
  { bg: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', border: '#818cf8', text: '#e0e7ff', glow: 'rgba(129, 140, 248, 0.45)' }, // Indigo like DNG
  { bg: 'linear-gradient(135deg, #b45309 0%, #78350f 100%)', border: '#f59e0b', text: '#fef3c7', glow: 'rgba(245, 158, 11, 0.45)' }, // Gold
  { bg: 'linear-gradient(135deg, #047857 0%, #064e3b 100%)', border: '#10b981', text: '#d1fae5', glow: 'rgba(16, 185, 129, 0.45)' }, // Emerald
  { bg: 'linear-gradient(135deg, #be185d 0%, #831843 100%)', border: '#f43f5e', text: '#ffe4e6', glow: 'rgba(244, 63, 94, 0.45)' }, // Crimson
  { bg: 'linear-gradient(135deg, #c2410c 0%, #7c2d12 100%)', border: '#ea580c', text: '#ffedd5', glow: 'rgba(234, 88, 12, 0.45)' }, // Orange
];

const renderTeamSticker = (team, idx, isMyTeam, size = 'normal') => {
  const pal = STICKER_PALETTES[idx % STICKER_PALETTES.length];
  const monogram = getTeamMonogram(team?.teamName, team?.teamTag);
  const isSmall = size === 'small';

  return (
    <div
      className={`ts-team-sticker ${isSmall ? 'small' : ''} ${isMyTeam ? 'my-team' : ''}`}
      style={{
        background: team?.teamLogo ? '#0d091a' : pal.bg,
        borderColor: isMyTeam ? '#c084fc' : (team?.teamLogo ? 'rgba(168, 85, 247, 0.6)' : pal.border),
        boxShadow: isMyTeam
          ? '0 0 16px rgba(192, 132, 252, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
          : `0 4px 12px ${pal.glow}, inset 0 1px 0 rgba(255, 255, 255, 0.25)`
      }}
      title={`${team?.teamName || 'Team'} (Slot #${idx + 1})`}
    >
      {team?.teamLogo ? (
        <img
          src={team.teamLogo}
          alt={team.teamName || 'Team Logo'}
          className="ts-team-sticker-img"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            if (e.currentTarget.nextSibling) {
              e.currentTarget.nextSibling.style.display = 'flex';
            }
          }}
        />
      ) : null}

      <div
        className="ts-team-sticker-fallback"
        style={{
          display: team?.teamLogo ? 'none' : 'flex',
          color: pal.text,
          fontWeight: 900,
          fontSize: isSmall ? '0.62rem' : (monogram.length > 3 ? '0.68rem' : '0.8rem'),
          letterSpacing: '0.4px',
          textTransform: 'uppercase'
        }}
      >
        {monogram}
      </div>

      <div className="ts-team-sticker-gloss" />
    </div>
  );
};

const getMapMeta = (mapName) => {
  const norm = (mapName || '').toUpperCase();
  if (norm.includes('ERANG')) {
    return {
      key: 'erangel',
      displayName: 'Erangel',
      icon: '🗺️',
      color: '#10b981',
      bgAlpha: 'rgba(16, 185, 129, 0.12)',
      borderAlpha: 'rgba(16, 185, 129, 0.4)',
    };
  }
  if (norm.includes('MIRAM')) {
    return {
      key: 'miramar',
      displayName: 'Miramar',
      icon: '🏜️',
      color: '#f59e0b',
      bgAlpha: 'rgba(245, 158, 11, 0.12)',
      borderAlpha: 'rgba(245, 158, 11, 0.4)',
    };
  }
  if (norm.includes('ROND')) {
    return {
      key: 'rondo',
      displayName: 'Rondo',
      icon: '🏙️',
      color: '#06b6d4',
      bgAlpha: 'rgba(6, 182, 212, 0.12)',
      borderAlpha: 'rgba(6, 182, 212, 0.4)',
    };
  }
  if (norm.includes('SANH')) {
    return {
      key: 'sanhok',
      displayName: 'Sanhok',
      icon: '🌴',
      color: '#10b981',
      bgAlpha: 'rgba(16, 185, 129, 0.12)',
      borderAlpha: 'rgba(16, 185, 129, 0.4)',
    };
  }
  if (norm.includes('VIKEND')) {
    return {
      key: 'vikendi',
      displayName: 'Vikendi',
      icon: '❄️',
      color: '#0ea5e9',
      bgAlpha: 'rgba(14, 165, 233, 0.12)',
      borderAlpha: 'rgba(14, 165, 233, 0.4)',
    };
  }
  const cleanName = (mapName || 'Map').charAt(0).toUpperCase() + (mapName || 'Map').slice(1).toLowerCase();
  return {
    key: (mapName || 'custom').toLowerCase(),
    displayName: cleanName,
    icon: '📍',
    color: '#8b5cf6',
    bgAlpha: 'rgba(139, 92, 246, 0.12)',
    borderAlpha: 'rgba(139, 92, 246, 0.4)',
  };
};

function TodaySlots() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myBookings, setMyBookings] = useState({});
  const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message: string }
  const [credentialsModal, setCredentialsModal] = useState(null); // { slot, data: null, loading: false, error: null }
  const [teamsModalSlot, setTeamsModalSlot] = useState(null); // slot object for registered teams / drops modal
  const [teamsModalTab, setTeamsModalTab] = useState('teams'); // 'teams' | 'drops'
  const [selectedDropMap, setSelectedDropMap] = useState('ERANGEL');
  const [dropViewMode, setDropViewMode] = useState('matrix'); // 'matrix' | 'columns'
  const [copiedDropSheet, setCopiedDropSheet] = useState(false);
  const [dropSearchQuery, setDropSearchQuery] = useState('');
  const [userDropSelectVal, setUserDropSelectVal] = useState('');
  const [userDropCustomVal, setUserDropCustomVal] = useState('');
  const [userMultiDrops, setUserMultiDrops] = useState({});
  const [userMultiDropsCustom, setUserMultiDropsCustom] = useState({});
  const [isSavingDrop, setIsSavingDrop] = useState(false);
  const [dropSaveSuccess, setDropSaveSuccess] = useState('');
  const [copiedField, setCopiedField] = useState(null);
  const [paymentModal, setPaymentModal] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);

  // Filter States
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [selectedCategory, setSelectedCategory] = useState('SCRIMS');

  const navigate = useNavigate();
  const location = useLocation();
  const isMyMatchesTab = new URLSearchParams(location.search).get('tab') === 'my';
  const getUserInfo = useCallback(() => {
    try {
      return JSON.parse(localStorage.getItem('userInfo') || 'null');
    } catch {
      return null;
    }
  }, []);
  const userInfo = getUserInfo();

  // ── Fetch slots ──
  const fetchSlots = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/slots`);
      setSlots(data || []);
    } catch (err) {
      console.error('Error fetching slots', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Modal & Drop Handlers ──
  const openTeamsModal = (slot, tab = 'teams') => {
    setTeamsModalSlot(slot);
    setTeamsModalTab(tab);
    const maps = resolveMaps(slot);
    const initialMap = maps[0] || 'ERANGEL';
    setSelectedDropMap(initialMap);
    setDropSearchQuery('');
    setDropSaveSuccess('');
    setCopiedDropSheet(false);

    // Pre-fill user drop state if logged-in user is booked
    const currentUsr = getUserInfo();
    const myTeam = (slot.bookedTeams || []).find(
      t => (currentUsr?._id && String(t.userId) === String(currentUsr._id)) ||
           (currentUsr?.teamName && t.teamName?.toLowerCase() === currentUsr.teamName?.toLowerCase())
    );

    const initialVals = {};
    const initialCustom = {};
    if (myTeam) {
      maps.forEach(m => {
        const k = m.toLowerCase().trim();
        let existing = getTeamDrop(myTeam, m);
        if (!existing && currentUsr) {
          if (k.includes('erang')) existing = currentUsr.erangelDrop || '';
          else if (k.includes('miram')) existing = currentUsr.miramarDrop || '';
          else if (k.includes('rond')) existing = currentUsr.rondoDrop || '';
        }
        const presets = getMapDropOptions(m);
        if (presets.includes(existing)) {
          initialVals[k] = existing;
          initialCustom[k] = '';
        } else if (existing) {
          initialVals[k] = 'Other';
          initialCustom[k] = existing;
        } else {
          initialVals[k] = '';
          initialCustom[k] = '';
        }
      });
      const initialDrop = getTeamDrop(myTeam, initialMap);
      const presetOptions = getMapDropOptions(initialMap);
      if (presetOptions.includes(initialDrop)) {
        setUserDropSelectVal(initialDrop);
        setUserDropCustomVal('');
      } else if (initialDrop) {
        setUserDropSelectVal('Other');
        setUserDropCustomVal(initialDrop);
      } else {
        setUserDropSelectVal('');
        setUserDropCustomVal('');
      }
    } else {
      maps.forEach(m => {
        const k = m.toLowerCase().trim();
        initialVals[k] = '';
        initialCustom[k] = '';
      });
      setUserDropSelectVal('');
      setUserDropCustomVal('');
    }
    setUserMultiDrops(initialVals);
    setUserMultiDropsCustom(initialCustom);
  };

  const handleSelectDropMap = (mapName) => {
    setSelectedDropMap(mapName);
    setDropSaveSuccess('');
    if (!teamsModalSlot) return;
    const currentUsr = getUserInfo();
    const myTeam = (teamsModalSlot.bookedTeams || []).find(
      t => (currentUsr?._id && String(t.userId) === String(currentUsr._id)) ||
           (currentUsr?.teamName && t.teamName?.toLowerCase() === currentUsr.teamName?.toLowerCase())
    );
    if (myTeam) {
      const existingDrop = getTeamDrop(myTeam, mapName);
      const presetOptions = getMapDropOptions(mapName);
      if (presetOptions.includes(existingDrop)) {
        setUserDropSelectVal(existingDrop);
        setUserDropCustomVal('');
      } else if (existingDrop) {
        setUserDropSelectVal('Other');
        setUserDropCustomVal(existingDrop);
      } else {
        setUserDropSelectVal('');
        setUserDropCustomVal('');
      }
    }
  };

  const handleSaveAllDrops = async () => {
    const currentUsr = getUserInfo();
    if (!currentUsr || !currentUsr.token) {
      navigate('/user/login', {
        state: { from: '/slots', message: 'Please login to set your drop locations.' }
      });
      return;
    }
    if (!teamsModalSlot) return;

    const maps = resolveMaps(teamsModalSlot);
    const payload = {};
    maps.forEach(m => {
      const k = m.toLowerCase().trim();
      const sel = userMultiDrops[k];
      const cust = userMultiDropsCustom[k];
      const val = sel === 'Other' ? (cust || '').trim() : (sel || '').trim();
      if (val) {
        payload[k] = val;
      }
    });

    if (Object.keys(payload).length === 0) {
      setNotification({ type: 'error', message: 'Please select at least one drop location.' });
      return;
    }

    setIsSavingDrop(true);
    try {
      await axios.put(
        `${API_URL}/api/slots/${teamsModalSlot._id}/my-drop`,
        { dropLocations: payload },
        { headers: { Authorization: `Bearer ${currentUsr.token}` } }
      );

      // Update in-memory teamsModalSlot bookedTeams
      setTeamsModalSlot(prev => {
        if (!prev) return prev;
        const updated = (prev.bookedTeams || []).map(t => {
          const isMe = (currentUsr._id && String(t.userId) === String(currentUsr._id)) ||
                       (currentUsr.teamName && t.teamName?.toLowerCase() === currentUsr.teamName?.toLowerCase());
          if (isMe) {
            return {
              ...t,
              dropLocations: {
                ...(t.dropLocations || {}),
                ...payload,
              }
            };
          }
          return t;
        });
        return { ...prev, bookedTeams: updated };
      });

      setDropSaveSuccess('Drop locations updated successfully!');
      setTimeout(() => setDropSaveSuccess(''), 3500);
      fetchSlots();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update drop locations',
      });
    } finally {
      setIsSavingDrop(false);
    }
  };

  const handleCopyDropSheet = () => {
    if (!teamsModalSlot) return;
    const maps = resolveMaps(teamsModalSlot);
    let text = `🔥 *${teamsModalSlot.matchName || 'RISING ESPORTS SCRIMS'}* - DROP LIST\n`;
    text += `⏰ ${teamsModalSlot.timing || (teamsModalSlot.date && String(teamsModalSlot.date).length > 2 ? teamsModalSlot.date : 'Today')} • ${teamsModalSlot.lobby || 'LOBBY 1'}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `SLOT | TEAM | ${maps.join(' | ')}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    (teamsModalSlot.bookedTeams || []).forEach((t, i) => {
      const drops = maps.map(m => getTeamDrop(t, m) || 'TBD').join(' | ');
      const tag = t.teamTag ? ` [${t.teamTag}]` : '';
      text += `#${String(i + 1).padStart(2, '0')} | ${t.teamName}${tag} | ${drops}\n`;
    });
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `👑 Powered by Rising Esports`;

    try {
      navigator.clipboard.writeText(text);
      setCopiedDropSheet(true);
      setTimeout(() => setCopiedDropSheet(false), 2500);
    } catch {
      setNotification({ type: 'error', message: 'Unable to copy to clipboard' });
    }
  };

  const handleSaveMyDrop = async () => {
    const currentUsr = getUserInfo();
    if (!currentUsr || !currentUsr.token) {
      navigate('/user/login', {
        state: { from: '/slots', message: 'Please login to set your drop location.' }
      });
      return;
    }
    const finalLocation = userDropSelectVal === 'Other' ? userDropCustomVal.trim() : userDropSelectVal.trim();
    if (!finalLocation) {
      setNotification({ type: 'error', message: 'Please select or enter your drop location.' });
      return;
    }

    setIsSavingDrop(true);
    try {
      await axios.put(
        `${API_URL}/api/slots/${teamsModalSlot._id}/my-drop`,
        {
          mapName: selectedDropMap,
          dropLocation: finalLocation,
        },
        { headers: { Authorization: `Bearer ${currentUsr.token}` } }
      );

      // Update in-memory teamsModalSlot bookedTeams
      setTeamsModalSlot(prev => {
        if (!prev) return prev;
        const mapKey = selectedDropMap.toLowerCase().trim();
        const updated = (prev.bookedTeams || []).map(t => {
          const isMe = (currentUsr._id && String(t.userId) === String(currentUsr._id)) ||
                       (currentUsr.teamName && t.teamName?.toLowerCase() === currentUsr.teamName?.toLowerCase());
          if (isMe) {
            return {
              ...t,
              dropLocations: {
                ...(t.dropLocations || {}),
                [mapKey]: finalLocation,
              }
            };
          }
          return t;
        });
        return { ...prev, bookedTeams: updated };
      });

      setDropSaveSuccess(`Saved "${finalLocation}" for ${selectedDropMap}!`);
      fetchSlots();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update drop location',
      });
    } finally {
      setIsSavingDrop(false);
    }
  };

  // ── Fetch current user bookings ──
  const fetchMyBookings = useCallback(async () => {
    const currentUsr = getUserInfo();
    if (!currentUsr || !currentUsr.token) return;
    try {
      const { data } = await axios.get(`${API_URL}/api/slots/my-bookings`, {
        headers: { Authorization: `Bearer ${currentUsr.token}` },
      });
      setMyBookings(data || {});
    } catch (err) {
      console.error('Error fetching user bookings', err);
    }
  }, [getUserInfo]);

  // ── Fetch wallet balance ──
  const fetchWalletBalance = useCallback(async () => {
    const currentUsr = getUserInfo();
    if (!currentUsr || !currentUsr.token) return;
    try {
      const { data } = await axios.get(`${API_URL}/api/wallet/balance`, {
        headers: { Authorization: `Bearer ${currentUsr.token}` },
      });
      setWalletBalance(data.balance || 0);
    } catch {}
  }, [getUserInfo]);

  useEffect(() => {
    fetchSlots();
    fetchMyBookings();
    fetchWalletBalance();
  }, [fetchSlots, fetchMyBookings, fetchWalletBalance]);

  // Auto-dismiss notifications after 6 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // ── Date Navigation Helpers ──
  const changeDate = (days) => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + days);
      return next;
    });
  };

  const resetToToday = () => {
    setSelectedDate(new Date());
  };

  const formatDateDisplay = (dateObj) => {
    return dateObj.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const isTodaySelected = useMemo(() => {
    const today = new Date();
    return (
      today.getFullYear() === selectedDate.getFullYear() &&
      today.getMonth() === selectedDate.getMonth() &&
      today.getDate() === selectedDate.getDate()
    );
  }, [selectedDate]);

  // ── Filtered Slots ──
  const filteredSlots = useMemo(() => {
    // If user is on "my" matches tab
    if (isMyMatchesTab) {
      return slots.filter((slot) => Boolean(myBookings[slot._id]));
    }

    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const localIso = `${year}-${month}-${day}`;

    return slots.filter((slot) => {
      // 1. Filter by category
      if (selectedCategory !== 'ALL') {
        const slotCat = (slot.category || 'SCRIMS').toUpperCase();
        if (slotCat !== selectedCategory.toUpperCase()) {
          return false;
        }
      }

      // 2. Filter by date if slot has a date specified
      if (slot.date) {
        const slotDateStr = String(slot.date).trim();
        // Check ISO format YYYY-MM-DD
        if (slotDateStr.includes(localIso)) return true;

        // Check local date formatting e.g. 23 Sep 2026 or 28 Sep
        const formattedSel = formatDateDisplay(selectedDate).toLowerCase();
        if (slotDateStr.toLowerCase().includes(formattedSel)) return true;

        // If today is selected and slot is marked today, allow
        if (isTodaySelected && slotDateStr.toLowerCase().includes('today')) return true;

        // If the slot has a specific ISO date that differs from selected date, exclude
        if (/^\d{4}-\d{2}-\d{2}$/.test(slotDateStr) && slotDateStr !== localIso) {
          return false;
        }
      }

      return true;
    });
  }, [slots, selectedCategory, selectedDate, isTodaySelected, isMyMatchesTab, myBookings]);

  // ── Open payment modal ──
  const openPaymentModal = (slot) => {
    const currentUsr = getUserInfo();
    if (!currentUsr || !currentUsr.token) {
      navigate('/user/login', {
        state: {
          from: '/slots',
          message: 'Please login or register to book a slot.',
        },
      });
      return;
    }

    const totalSlots = Number(slot.maxTeams) || 20;
    const bookedSlots = Math.max(0, Number(slot.bookedCount) || 0);
    const remainingSlots = Math.max(0, totalSlots - bookedSlots);

    if (slot.isSoldOut || remainingSlots <= 0) {
      setNotification({ type: 'error', message: 'This slot is already full / sold out.' });
      return;
    }

    const userBooking = myBookings[slot._id];
    if (userBooking?.paymentStatus === 'paid') {
      setNotification({ type: 'info', message: 'You have already booked and paid for this slot!' });
      return;
    }
    if (userBooking?.paymentStatus === 'pending' || userBooking?.paymentStatus === 'pending_verification') {
      setNotification({ type: 'info', message: 'Your payment is already submitted and awaiting admin verification.' });
      return;
    }

    setPaymentModal(slot);
  };

  const handlePaymentSuccess = ({ method }) => {
    setPaymentModal(null);
    if (method === 'wallet') {
      setNotification({ type: 'success', message: '✅ Slot booked successfully using wallet balance!' });
    } else {
      setNotification({ type: 'success', message: '⏳ Payment submitted! Awaiting admin verification.' });
    }
    fetchSlots();
    fetchMyBookings();
    fetchWalletBalance();
  };

  // ── Open Room Credentials Modal ──
  const handleOpenCredentials = async (slot) => {
    const currentUsr = getUserInfo();
    if (!currentUsr || !currentUsr.token) {
      navigate('/user/login', {
        state: {
          from: '/slots',
          message: 'Please login to access room credentials.',
        },
      });
      return;
    }

    setCredentialsModal({ slot, data: null, loading: true, error: null });

    try {
      const { data } = await axios.get(`${API_URL}/api/slots/${slot._id}/room-credentials`, {
        headers: { Authorization: `Bearer ${currentUsr.token}` },
      });
      setCredentialsModal({ slot, data, loading: false, error: null });
    } catch (err) {
      const errorData = err.response?.data;
      let errorMsg = errorData?.message || 'Unable to fetch room credentials.';
      if (errorData?.error === 'too_early') {
        const unlockTime = errorData.unlockAt
          ? new Date(errorData.unlockAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '30 minutes before the match';
        errorMsg = `Room credentials will be unlocked at ${unlockTime} (30 mins before match start).`;
      }
      setCredentialsModal({ slot, data: null, loading: false, error: errorMsg });
    }
  };

  const copyToClipboard = (text, field) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getResolvedCredentials = (data) => {
    let roomId = (data?.roomId && data.roomId.trim() !== 'TBA') ? data.roomId.trim() : '';
    let roomPassword = (data?.roomPassword && data.roomPassword.trim() !== 'TBA') ? data.roomPassword.trim() : '';
    let note = (data?.note || '').trim();

    if ((!roomId || !roomPassword) && note) {
      const idPassMatch = note.match(/(?:ID|Room\s*ID)[:\s]+([^\s,;]+)[\s,;]+(?:Pass|Password|PWD)[:\s]+([^\s,;]+)/i);
      if (idPassMatch) {
        if (!roomId) roomId = idPassMatch[1];
        if (!roomPassword) roomPassword = idPassMatch[2];
        note = note.replace(idPassMatch[0], '').trim();
      } else {
        const parts = note.split(/[\s,;/]+/).filter(Boolean);
        if (parts.length === 2 && !roomId && !roomPassword) {
          roomId = parts[0];
          roomPassword = parts[1];
          note = '';
        }
      }
    }

    return {
      roomId: roomId || 'TBA',
      roomPassword: roomPassword || 'TBA',
      note,
    };
  };

  // Helper to resolve Prize Distribution
  const resolvePrizes = (slot) => {
    if (slot.prizeDistribution && slot.prizeDistribution.length > 0) {
      return slot.prizeDistribution.map((p, idx) => ({
        rank: p.rank ? (String(p.rank).startsWith('#') ? p.rank : `#${p.rank}`) : `#${idx + 1}`,
        prize: p.prize || (p.amount !== undefined ? `₹${p.amount}` : '-'),
      }));
    }
    if (slot.prizePool && slot.prizePool.length > 0) {
      return slot.prizePool.map((p, idx) => ({
        rank: `#${p.position || p.rank || idx + 1}`,
        prize: p.amount !== undefined ? `₹${p.amount}` : (p.prize || '-'),
      }));
    }
    // Fallback default structure
    return [
      { rank: '#1', prize: '₹400' },
      { rank: '#2', prize: '₹150' },
      { rank: '#3', prize: '₹100' },
      { rank: '#4', prize: '₹70' },
      { rank: '#5', prize: 'FREE' },
    ];
  };

  // Helper to resolve Match Schedule
  const resolveSchedule = (slot) => {
    if (slot.scheduleMatches && slot.scheduleMatches.length > 0) {
      return slot.scheduleMatches;
    }
    if (slot.timing) {
      const parts = slot.timing.split(/[-–|]+/).map((s) => s.trim()).filter(Boolean);
      if (parts.length > 1) {
        return parts.map((timeStr, idx) => ({
          matchNumber: idx + 1,
          label: `MATCH ${idx + 1}`,
          time: /am|pm/i.test(timeStr) ? timeStr : `${timeStr} PM`,
        }));
      }
      return [{ matchNumber: 1, label: 'MATCH 1', time: slot.timing }];
    }
    return [
      { matchNumber: 1, label: 'MATCH 1', time: '1:42 PM' },
      { matchNumber: 2, label: 'MATCH 2', time: '2:22 PM' },
      { matchNumber: 3, label: 'MATCH 3', time: '3:02 PM' },
    ];
  };

  // Avatar color helper
  const avatarColors = ['coral', 'blue', 'emerald', 'purple'];

  return (
    <div className="ts-page-wrapper fade-in">
      {/* Toast Notification */}
      {notification && (
        <div className={`slot-toast-alert ${notification.type === 'success' ? 'toast-success' : notification.type === 'info' ? 'toast-info' : 'toast-error'}`}>
          <div className="toast-icon">
            {notification.type === 'success' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            ) : notification.type === 'info' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            )}
          </div>
          <span className="toast-text">{notification.message}</span>
          <button className="toast-close-btn" onClick={() => setNotification(null)}>×</button>
        </div>
      )}

      {/* ── Hero Banner (Matching Screenshot) ── */}
      <div className="ts-hero-banner">
        <div
          className="ts-hero-bg"
          style={{ backgroundImage: `url(${bannerImg})` }}
        />
        <div className="ts-hero-overlay" />
        <div className="ts-hero-content">
          <div className="ts-hero-left">
            <div className="ts-calendar-icon-box">
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
                <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
              </svg>
            </div>
            <div className="ts-hero-titles">
              <h4>TODAY'S</h4>
              <h1>SLOTS</h1>
              <p>Book your slot, participate in tournaments and climb the rankings!</p>
            </div>
          </div>
          <div className="ts-hero-badge">
            <div className="ts-hero-crest">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <span>RISING</span>
              <span style={{ color: '#fff', fontWeight: 900 }}>TOGETHER</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Tab Switcher (Available Slots vs My Registered Matches) ── */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        margin: '1.25rem 0 1rem',
        background: 'rgba(255, 255, 255, 0.04)',
        padding: '5px',
        borderRadius: '14px',
        border: '1px solid rgba(139, 92, 246, 0.25)'
      }}>
        <button
          type="button"
          onClick={() => navigate('/slots')}
          style={{
            flex: 1,
            padding: '0.65rem 0.75rem',
            borderRadius: '10px',
            border: 'none',
            background: !isMyMatchesTab ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : 'transparent',
            color: '#fff',
            fontWeight: 800,
            fontSize: '0.85rem',
            letterSpacing: '0.5px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: !isMyMatchesTab ? '0 4px 14px rgba(124, 58, 237, 0.35)' : 'none'
          }}
        >
          AVAILABLE SLOTS
        </button>
        <button
          type="button"
          onClick={() => navigate('/slots?tab=my')}
          style={{
            flex: 1,
            padding: '0.65rem 0.75rem',
            borderRadius: '10px',
            border: 'none',
            background: isMyMatchesTab ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : 'transparent',
            color: '#fff',
            fontWeight: 800,
            fontSize: '0.85rem',
            letterSpacing: '0.5px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            boxShadow: isMyMatchesTab ? '0 4px 14px rgba(124, 58, 237, 0.35)' : 'none'
          }}
        >
          <span>MY MATCHES</span>
          {Object.keys(myBookings).length > 0 && (
            <span style={{
              background: isMyMatchesTab ? 'rgba(255,255,255,0.25)' : '#7c3aed',
              padding: '1px 7px',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: 800
            }}>
              {Object.keys(myBookings).length}
            </span>
          )}
        </button>
      </div>

      {!isMyMatchesTab && (
        <>
          {/* ── Date Navigator Bar ── */}
          <div className="ts-date-bar">
            <button
              type="button"
              className="ts-date-arrow-btn"
              onClick={() => changeDate(-1)}
              aria-label="Previous day"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <div className="ts-date-info" onClick={resetToToday} title="Click to reset to today">
              <div className="ts-date-sub">{isTodaySelected ? 'TODAY' : 'SELECTED DATE'}</div>
              <div className="ts-date-main">{formatDateDisplay(selectedDate)}</div>
            </div>

            <button
              type="button"
              className="ts-date-arrow-btn"
              onClick={() => changeDate(1)}
              aria-label="Next day"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* ── Category Filter Tabs ── */}
          <div className="ts-tabs-row">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`ts-tab-pill ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── Available Slots Header ── */}
      <div className="ts-section-header">
        <div className="ts-section-title">
          <div className="ts-indicator-bar" />
          <h2>{isMyMatchesTab ? 'My Registered Matches' : 'Available Slots'}</h2>
        </div>
        <div className="ts-count-badge">
          {filteredSlots.length} {isMyMatchesTab ? 'BOOKED' : 'AVAILABLE'}
        </div>
      </div>

      {/* ── Content Grid / Loading / Empty State ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#a78bfa' }}>
          <div className="spinner" style={{ margin: '0 auto 1.5rem' }} />
          <p style={{ fontWeight: 700, letterSpacing: '1px' }}>LOADING SLOTS...</p>
        </div>
      ) : filteredSlots.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3.5rem 1.5rem',
          background: 'rgba(15, 12, 30, 0.6)',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          borderRadius: '18px',
          color: '#94a3b8'
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ stroke: '#8b5cf6', margin: '0 auto 1rem', opacity: 0.6 }}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          {isMyMatchesTab ? (
            <>
              <h3 style={{ color: '#fff', fontSize: '1.25rem', marginBottom: '0.4rem' }}>
                {!userInfo ? 'Please Log In' : 'No Bookings Found'}
              </h3>
              <p style={{ fontSize: '0.9rem', maxWidth: '380px', margin: '0 auto 1.25rem' }}>
                {!userInfo
                  ? 'Sign in to your account to view your registered matches, slot room IDs, and passwords.'
                  : 'You have not registered for any upcoming tournament or scrim slots yet.'}
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                {!userInfo ? (
                  <button
                    type="button"
                    onClick={() => navigate('/user/login', { state: { from: '/slots?tab=my' } })}
                    style={{
                      background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                      border: 'none',
                      color: '#ffffff',
                      padding: '0.6rem 1.5rem',
                      borderRadius: '8px',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    SIGN IN NOW
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate('/slots')}
                    style={{
                      background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                      border: 'none',
                      color: '#ffffff',
                      padding: '0.6rem 1.5rem',
                      borderRadius: '8px',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    EXPLORE SLOTS
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <h3 style={{ color: '#fff', fontSize: '1.25rem', marginBottom: '0.4rem' }}>No Slots Available</h3>
              <p style={{ fontSize: '0.9rem', maxWidth: '360px', margin: '0 auto 1.25rem' }}>
                There are no slots scheduled under <strong>{selectedCategory}</strong> for {formatDateDisplay(selectedDate)}.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                {selectedCategory !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('ALL')}
                    style={{
                      background: 'rgba(121, 40, 202, 0.25)',
                      border: '1px solid #7928ca',
                      color: '#c084fc',
                      padding: '0.5rem 1.25rem',
                      borderRadius: '8px',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    VIEW ALL CATEGORIES
                  </button>
                )}
                {!isTodaySelected && (
                  <button
                    type="button"
                    onClick={resetToToday}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#ffffff',
                      padding: '0.5rem 1.25rem',
                      borderRadius: '8px',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    GO TO TODAY
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        filteredSlots.map((slot) => {
          const totalSlots = Number(slot.maxTeams) || 20;
          const bookedSlots = Math.max(0, Number(slot.bookedCount) || 0);
          const remainingSlots = Math.max(0, totalSlots - bookedSlots);
          const userBooking = myBookings[slot._id];
          const isPaid = userBooking?.paymentStatus === 'paid';
          const isPending = userBooking?.paymentStatus === 'pending' || userBooking?.paymentStatus === 'pending_verification';
          const isSoldOut = Boolean(slot.isSoldOut || remainingSlots <= 0);

          const waRawLink = (userBooking?.whatsappLink || userBooking?.slotLink || '').trim();
          const normalizedWaLink = waRawLink ? (waRawLink.startsWith('http://') || waRawLink.startsWith('https://') ? waRawLink : `https://${waRawLink}`) : '';

          const prizes = resolvePrizes(slot);
          const schedule = resolveSchedule(slot);
          const maps = resolveMaps(slot);
          const bookedTeams = slot.bookedTeams || [];

          return (
            <div key={slot._id} className="ts-slot-card">
              {/* ── Top Header Row ── */}
              <div className="ts-card-top">
                <h3 className="ts-card-title">{slot.matchName || 'RISING 1-3 GRIND SCRIMS'}</h3>
                <span className="ts-lobby-badge">{slot.lobby || 'LOBBY 1'}</span>
              </div>

              {/* ── Box 1: Prize Pool Distribution ── */}
              <div className="ts-inner-panel">
                <div className="ts-panel-head">
                  <div className="ts-panel-label">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="6 9 12 15 18 9"/>
                      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                      <path d="M4 22h16"/>
                      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
                    </svg>
                    PRIZE POOL DISTRIBUTION
                  </div>
                </div>

                <div className="ts-prize-grid">
                  {prizes.map((p, idx) => {
                    const isGold = p.rank === '#1' || String(p.rank).includes('1') || idx === 0;
                    const isFree = String(p.prize).toUpperCase().includes('FREE');
                    return (
                      <div key={idx} className="ts-prize-card">
                        <div className="ts-prize-rank">{p.rank}</div>
                        <div className={`ts-prize-val ${isGold ? 'gold' : isFree ? 'free' : ''}`}>
                          {p.prize}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Box 2: Schedule ── */}
              <div className="ts-inner-panel">
                <div className="ts-panel-head">
                  <div className="ts-panel-label">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    SCHEDULE ({schedule.length} MATCH{schedule.length === 1 ? '' : 'ES'})
                  </div>
                  <div className="ts-slots-fraction">
                    SLOTS: {bookedSlots}/{totalSlots}
                  </div>
                </div>

                <div className="ts-schedule-grid">
                  {schedule.map((m, idx) => (
                    <div key={idx} className="ts-match-card">
                      <div className="ts-match-name">{m.label || `MATCH ${m.matchNumber || idx + 1}`}</div>
                      <div className="ts-match-clock">{m.time}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Box 3: Dual Action Options (Teams & Drop List) ── */}
              <div className="ts-card-dual-options">
                <button
                  type="button"
                  className="ts-dual-opt-btn teams-btn"
                  onClick={() => openTeamsModal(slot, 'teams')}
                  title="View registered teams"
                >
                  <div className="ts-dual-opt-content">
                    <div className="ts-avatars-cluster">
                      {bookedTeams.slice(0, 2).map((team, idx) => {
                        const initial = (team.teamName || 'T').charAt(0).toUpperCase();
                        const colorClass = avatarColors[idx % avatarColors.length];
                        return (
                          <div key={idx} className={`ts-avatar-dot ${colorClass}`}>
                            {initial}
                          </div>
                        );
                      })}
                      {bookedTeams.length > 2 && (
                        <div className="ts-avatar-dot more">
                          +{bookedTeams.length - 2}
                        </div>
                      )}
                      {bookedTeams.length === 0 && (
                        <div className="ts-avatar-dot purple">
                          0
                        </div>
                      )}
                    </div>
                    <div className="ts-dual-opt-text">
                      <span className="ts-dual-opt-title">Teams</span>
                      <span className="ts-dual-opt-count">({bookedSlots}/{totalSlots})</span>
                    </div>
                  </div>
                  <svg className="ts-dual-opt-arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>

                <button
                  type="button"
                  className="ts-dual-opt-btn drops-btn"
                  onClick={() => openTeamsModal(slot, 'drops')}
                  title="View map-wise drop locations"
                >
                  <div className="ts-dual-opt-content">
                    <div className="ts-drop-icon-badge">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                    </div>
                    <div className="ts-dual-opt-text">
                      <span className="ts-dual-opt-title">Drop List</span>
                      <span className="ts-dual-opt-sub">Map-Wise</span>
                    </div>
                  </div>
                  <svg className="ts-dual-opt-arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              </div>

              {/* ── Map Rotation ── */}
              <div className="ts-maps-block">
                <div className="ts-maps-title">MAP ROTATION</div>
                <div className="ts-maps-pills">
                  {maps.map((mapName, idx) => (
                    <span
                      key={idx}
                      className={`ts-map-badge ${idx === 0 ? 'active' : ''}`}
                    >
                      {mapName}
                    </span>
                  ))}
                </div>
              </div>

              {/* ── Booked Slot: WhatsApp Group Link Card ── */}
              {isPaid && (
                <div className="ts-booked-whatsapp-card">
                  <div className="ts-booked-wa-header">
                    <div className="ts-booked-wa-badge">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                      </svg>
                      <span>OFFICIAL MATCH WHATSAPP GROUP</span>
                    </div>
                    <span className="ts-booked-wa-tag">CONFIRMED SLOT</span>
                  </div>

                  {normalizedWaLink ? (
                    <div className="ts-booked-wa-body">
                      <div className="ts-booked-wa-link-row">
                        <span className="ts-booked-wa-url" title={waRawLink}>{waRawLink}</span>
                        <button
                          type="button"
                          className="ts-booked-wa-copy-btn"
                          onClick={() => copyToClipboard(waRawLink, `card_link_${slot._id}`)}
                          title="Copy WhatsApp Group Link"
                        >
                          {copiedField === `card_link_${slot._id}` ? 'COPIED!' : 'COPY LINK'}
                        </button>
                      </div>
                      <a
                        href={normalizedWaLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ts-booked-wa-join-btn"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                      </svg>
                      <span>JOIN OFFICIAL WHATSAPP GROUP ↗</span>
                    </a>
                  </div>
                ) : (
                  <div className="ts-booked-wa-pending">
                    <span className="ts-booked-wa-dot" />
                    <span>WhatsApp group link will be updated here by admin before the match starts.</span>
                  </div>
                )}
              </div>
            )}

            {/* ── Card Footer: Entry Fee & Book Action ── */}
            <div className="ts-card-bottom">
              <div className="ts-fee-col">
                <span className="ts-fee-label">SLOT ENTRY FEE</span>
                <span className="ts-fee-value">
                  {Number(slot.entryFee ?? slot.price ?? 0) === 0 ? 'FREE' : `₹${slot.entryFee ?? slot.price ?? 0}`}
                </span>
              </div>

              {isPaid ? (
                <div className="ts-paid-actions-wrap">
                  <button
                    type="button"
                    onClick={() => handleOpenCredentials(slot)}
                    className="ts-book-action-btn booked"
                    title="View room credentials & slot match link"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    ROOM CREDENTIALS 🔑
                  </button>
                  {normalizedWaLink && (
                    <a
                      href={normalizedWaLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ts-slot-whatsapp-btn"
                      title="Join Official Match WhatsApp Group"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                      </svg>
                      JOIN WHATSAPP ↗
                    </a>
                  )}
                </div>
                ) : isPending ? (
                  <button
                    type="button"
                    onClick={() => setNotification({
                      type: 'info',
                      message: '⏳ Payment submitted and pending admin verification. Room credentials will unlock as soon as approved!',
                    })}
                    className="ts-book-action-btn verifying"
                    title="Click for verification status"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    VERIFICATION PENDING ⏳
                  </button>
                ) : isSoldOut ? (
                  <div className="ts-soldout-actions-row">
                    <button
                      type="button"
                      disabled
                      className="ts-book-action-btn sold-out"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                      </svg>
                      SOLD OUT
                    </button>
                    <button
                      type="button"
                      className="ts-book-action-btn view-droplist-soldout"
                      onClick={() => openTeamsModal(slot, 'drops')}
                      title="View Drop List for this full slot"
                    >
                      <MapPin size={15} />
                      DROP LIST
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => openPaymentModal(slot)}
                    className="ts-book-action-btn"
                  >
                    BOOK SLOT
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}

      {/* ── Registered Teams & Drop List Modal (Matches Target Design Exactly) ── */}
      {teamsModalSlot && createPortal(
        <div className="ts-modal-overlay ts-droplist-modal-overlay" onClick={() => setTeamsModalSlot(null)}>
          <div className="ts-droplist-modal-content-wrap" onClick={(e) => e.stopPropagation()}>
            <DropListView
              slot={teamsModalSlot}
              onClose={() => setTeamsModalSlot(null)}
              isStandalonePage={false}
              initialTab={teamsModalTab || 'drops'}
            />
          </div>
        </div>,
        document.body
      )}

      {/* ── Room Credentials Modal ── */}
      {credentialsModal && (() => {
        const resolved = getResolvedCredentials(credentialsModal.data);
        const rawSlotLink = (credentialsModal.data?.customLink || credentialsModal.data?.slotLink || credentialsModal.data?.whatsappLink || '').trim();
        const normalizedSlotLink = rawSlotLink ? (rawSlotLink.startsWith('http://') || rawSlotLink.startsWith('https://') ? rawSlotLink : `https://${rawSlotLink}`) : '';
        const isWhatsApp = /whatsapp\.com|wa\.me/i.test(rawSlotLink);
        const isDiscord = /discord\.(gg|com)/i.test(rawSlotLink);

        return createPortal(
          <div className="credentials-modal-overlay" onClick={() => setCredentialsModal(null)}>
            <div className="credentials-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="credentials-modal-header">
                <div>
                  <h2>ROOM <span>CREDENTIALS</span></h2>
                  <p className="credentials-modal-sub">{credentialsModal.slot.matchName || 'Tournament Match'}</p>
                </div>
                <button className="modal-close-btn" onClick={() => setCredentialsModal(null)}>×</button>
              </div>

              <div className="credentials-modal-body">
                {credentialsModal.loading ? (
                  <div className="modal-loading">
                    <div className="spinner" />
                    <p>Fetching latest credentials from server...</p>
                  </div>
                ) : credentialsModal.error ? (
                  <div className="credentials-locked-state">
                    <div className="lock-icon-wrap">
                      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <h3>Credentials Protected</h3>
                    <p className="locked-message">{credentialsModal.error}</p>
                  </div>
                ) : (
                  <div className="credentials-unlocked-state">
                    {credentialsModal.data?.isScheduled && resolved.roomId === 'TBA' && (
                      <div style={{ marginBottom: '1.25rem', padding: '0.75rem', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.25)', borderRadius: '8px', color: '#fef08a', fontSize: '0.85rem' }}>
                        ℹ️ {credentialsModal.data.message}
                      </div>
                    )}

                    <div className="credentials-field">
                      <span className="field-label">ROOM ID</span>
                      <div className="field-box">
                        <span className="field-value">{resolved.roomId}</span>
                        {resolved.roomId !== 'TBA' && (
                          <button
                            type="button"
                            className="copy-field-btn"
                            onClick={() => copyToClipboard(resolved.roomId, 'roomId')}
                          >
                            {copiedField === 'roomId' ? 'COPIED!' : 'COPY'}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="credentials-field">
                      <span className="field-label">PASSWORD</span>
                      <div className="field-box">
                        <span className="field-value">{resolved.roomPassword}</span>
                        {resolved.roomPassword !== 'TBA' && (
                          <button
                            type="button"
                            className="copy-field-btn"
                            onClick={() => copyToClipboard(resolved.roomPassword, 'password')}
                          >
                            {copiedField === 'password' ? 'COPIED!' : 'COPY'}
                          </button>
                        )}
                      </div>
                    </div>

                    {resolved.note && (
                      <div style={{ marginTop: '1.25rem', padding: '0.75rem 1rem', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '8px', borderLeft: '3px solid var(--purple-primary)', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                        <strong style={{ color: '#fff', display: 'block', marginBottom: '0.2rem' }}>📌 Match Instructions / Note:</strong>
                        {resolved.note}
                      </div>
                    )}

                    {/* ── Slot Match Link (Uploaded by Admin) ── */}
                    {normalizedSlotLink ? (
                      <div className="credentials-match-link-card">
                        <div className="credentials-link-card-header">
                          <div className="credentials-link-card-badge">
                            <span className="credentials-link-indicator" />
                            {isWhatsApp ? 'OFFICIAL WHATSAPP GROUP' : isDiscord ? 'OFFICIAL DISCORD CHANNEL' : 'OFFICIAL MATCH LINK'}
                          </div>
                          <span className="credentials-link-note">Uploaded by Admin for this slot</span>
                        </div>

                        <div className="credentials-link-card-content">
                          <div className="credentials-link-url-wrapper">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                            </svg>
                            <span className="credentials-link-url-text" title={rawSlotLink}>{rawSlotLink}</span>
                            <button
                              type="button"
                              className="copy-field-btn credentials-link-copy"
                              onClick={() => copyToClipboard(rawSlotLink, 'slotLink')}
                            >
                              {copiedField === 'slotLink' ? 'COPIED!' : 'COPY'}
                            </button>
                          </div>

                          <a
                            href={normalizedSlotLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`credentials-join-link-btn ${isWhatsApp ? 'whatsapp-theme' : isDiscord ? 'discord-theme' : 'custom-theme'}`}
                          >
                            {isWhatsApp ? (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                JOIN OFFICIAL WHATSAPP GROUP ↗
                              </>
                            ) : isDiscord ? (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6h0a5 5 0 0 1 4 4.5v3.5a5 5 0 0 1-4 4.5h0M6 6h0A5 5 0 0 0 2 10.5v3.5A5 5 0 0 0 6 18.5h0"/><path d="M9 12h.01M15 12h.01"/><path d="M8 17a6 6 0 0 0 8 0"/></svg>
                                JOIN OFFICIAL DISCORD ↗
                              </>
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                                OPEN MATCH LINK ↗
                              </>
                            )}
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="credentials-no-link-box">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                        <span>No match link has been uploaded by the admin for this slot yet. Please check back before match start or use Room ID & Password above.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="credentials-modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  className="modal-refresh-btn"
                  onClick={() => handleOpenCredentials(credentialsModal.slot)}
                  disabled={credentialsModal.loading}
                  style={{
                    background: 'rgba(124, 58, 237, 0.15)',
                    border: '1px solid rgba(124, 58, 237, 0.4)',
                    color: 'var(--purple-light)',
                    padding: '0.6rem 1rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                  REFRESH
                </button>

                <button
                  type="button"
                  className="modal-done-btn"
                  onClick={() => setCredentialsModal(null)}
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}

      {/* ── Payment Modal ── */}
      {paymentModal && (
        <PaymentModal
          slot={paymentModal}
          userInfo={getUserInfo()}
          walletBalance={walletBalance}
          onClose={() => setPaymentModal(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}

export default TodaySlots;
