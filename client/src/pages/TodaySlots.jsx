import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  Users, MapPin, Search, AlertTriangle, Check, RefreshCw, X,
  ChevronRight, Crosshair, Copy, CheckCheck, Grid, Columns, Shield, Sparkles, Calendar,
  ArrowLeft, Trophy, Clock, Info
} from 'lucide-react';
import PaymentModal from '../components/PaymentModal';
import DropListView from '../components/DropListView';
import bannerImg from '../assets/slots_banner.jpg';
import soldierBgImg from '../assets/droplist_bg_soldier.jpg';

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

  // Sub-navigation state for Screens 2, 3, 4, 5
  const [subPage, setSubPage] = useState('list'); // 'list' | 'details' | 'registered_teams' | 'drop_details'
  const [activeTournament, setActiveTournament] = useState(null);
  const [tourneyTab, setTourneyTab] = useState('overview'); // 'overview' | 'prizepool' | 'schedule' | 'map'

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

  // Sync category and slotId from query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cat = params.get('category');
    if (cat) {
      const c = cat.toUpperCase();
      if (c.includes('SCRIM')) setSelectedCategory('SCRIMS');
      else if (c.includes('WEEKLY')) setSelectedCategory('WEEKLY WAR');
      else if (c.includes('WEEKEND')) setSelectedCategory('WEEKEND WAR');
      else if (c.includes('GRAND')) setSelectedCategory('GRANDS');
      else setSelectedCategory(cat.toUpperCase());
    }
    const slotIdParam = params.get('slotId');
    if (slotIdParam && slots.length > 0) {
      const found = slots.find((s) => s._id === slotIdParam);
      if (found) {
        setActiveTournament(found);
        setSubPage('details');
      }
    }
  }, [location.search, slots]);

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
        const selCat = selectedCategory.toUpperCase();
        const matchesCat =
          (selCat.includes('SCRIM') && slotCat.includes('SCRIM')) ||
          (selCat.includes('WEEKLY') && slotCat.includes('WEEKLY')) ||
          (selCat.includes('WEEKEND') && slotCat.includes('WEEKEND')) ||
          (selCat.includes('GRAND') && slotCat.includes('GRAND')) ||
          slotCat === selCat;
        if (!matchesCat) {
          return false;
        }
      }

      // 2. Filter by slotTime or date
      if (slot.slotTime) {
        const d = new Date(slot.slotTime);
        if (!isNaN(d.getTime())) {
          const sYear = d.getFullYear();
          const sMonth = String(d.getMonth() + 1).padStart(2, '0');
          const sDay = String(d.getDate()).padStart(2, '0');
          const sIso = `${sYear}-${sMonth}-${sDay}`;
          return sIso === localIso;
        }
      }

      if (slot.date) {
        const slotDateStr = String(slot.date).trim();
        // Check ISO format YYYY-MM-DD
        if (slotDateStr.includes(localIso)) return true;

        // Check local date formatting e.g. 23 Sep 2026 or 28 Sep
        const formattedSel = formatDateDisplay(selectedDate).toLowerCase();
        if (slotDateStr.toLowerCase().includes(formattedSel)) return true;

        // If today is selected and slot is marked today, allow
        if (isTodaySelected && slotDateStr.toLowerCase().includes('today')) return true;

        // Slot date does not match selected date
        return false;
      }

      // If slot has neither slotTime nor date, only allow on today
      return isTodaySelected;
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
      { matchNumber: 1, label: 'MATCH 1', time: 'TBA' },
    ];
  };

  // Helper to resolve 3 Match Pillars with map and timing for Slot Box
  const resolveSlotMatches = (slot) => {
    const maps = resolveMaps(slot);
    const defaultMaps = ['ERANGEL', 'RONDO', 'MIRAMAR'];
    
    if (slot.scheduleMatches && Array.isArray(slot.scheduleMatches) && slot.scheduleMatches.length > 0) {
      return slot.scheduleMatches.slice(0, 3).map((m, idx) => ({
        map: (m.map || maps[idx] || defaultMaps[idx % defaultMaps.length]).toUpperCase(),
        time: m.time || m.label || slot.timing || '02:00 PM',
        matchNumber: m.matchNumber || idx + 1
      }));
    }

    const baseTime = slot.timing || '01:42 PM';
    const timeMatch = baseTime.match(/(\d+):?(\d*)\s*(AM|PM)?/i);
    let h = 1;
    let m = 42;
    let isPM = true;
    if (timeMatch) {
      h = parseInt(timeMatch[1], 10);
      m = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      if (timeMatch[3]) isPM = /pm/i.test(timeMatch[3]);
    }

    const calcTime = (addMin) => {
      let tot = (h % 12) * 60 + m + addMin;
      let newH = Math.floor(tot / 60) % 12;
      if (newH === 0) newH = 12;
      let newM = tot % 60;
      return `${newH}:${newM.toString().padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`;
    };

    return [
      { matchNumber: 1, map: (maps[0] || 'ERANGEL').toUpperCase(), time: calcTime(0) },
      { matchNumber: 2, map: (maps[1] || 'RONDO').toUpperCase(), time: calcTime(40) },
      { matchNumber: 3, map: (maps[2] || 'MIRAMAR').toUpperCase(), time: calcTime(80) },
    ];
  };

  // Helper to format scheduled date for slot
  const formatSlotScheduledDate = (slot) => {
    if (!slot) return '';
    if (slot.slotTime) {
      const d = new Date(slot.slotTime);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    }
    if (slot.date) {
      const parsed = new Date(slot.date);
      if (!isNaN(parsed.getTime()) && String(slot.date).includes('-')) {
        return parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      }
      return String(slot.date);
    }
    return 'Today';
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

      {/* ── Subpage: Tournament Details (Screen 3) ── */}
      {subPage === 'details' && activeTournament ? (
        <div className="tourney-details-view fade-in">
          {/* Header */}
          <div className="category-screen-header">
            <button
              type="button"
              className="category-back-btn"
              onClick={() => {
                setSubPage('list');
                setActiveTournament(null);
              }}
            >
              <ArrowLeft size={18} />
            </button>
            <h2 className="category-screen-title">Tournament Details</h2>
          </div>

          {/* Tabs row: Overview | Prize Pool | Schedule | Map */}
          <div className="tourney-tabs-row">
            {['overview', 'prizepool', 'schedule', 'map'].map((tab) => (
              <button
                key={tab}
                type="button"
                className={`tourney-tab-btn ${tourneyTab === tab ? 'active' : ''}`}
                onClick={() => setTourneyTab(tab)}
              >
                {tab === 'overview' ? 'Overview' : tab === 'prizepool' ? 'Prize Pool' : tab === 'schedule' ? 'Schedule' : 'Map'}
              </button>
            ))}
          </div>

          {/* Tab 1: Overview */}
          {tourneyTab === 'overview' && (
            <div>
              <div className="tourney-section-heading">Tournament Overview</div>
              <p className="tourney-overview-text">
                {activeTournament.description ||
                  'Daily grind scrims for all the passionate BGMI players. Compete, showcase your skills and win exciting rewards!'}
              </p>

              {/* 2x2 Stats Grid */}
              <div className="tourney-stats-grid">
                <div className="tourney-stat-card">
                  <div className="tourney-stat-icon"><Shield size={16} /></div>
                  <div>
                    <div className="tourney-stat-label">Entry Fee</div>
                    <div className="tourney-stat-value">₹{activeTournament.entryFee != null ? activeTournament.entryFee : 60}</div>
                  </div>
                </div>

                <div className="tourney-stat-card">
                  <div className="tourney-stat-icon"><Trophy size={16} /></div>
                  <div>
                    <div className="tourney-stat-label">Prize Pool</div>
                    <div className="tourney-stat-value">₹{(activeTournament.prizePoolTotal || (activeTournament.prizePool ? Number(String(activeTournament.prizePool).replace(/[^0-9]/g, '')) : 5000)).toLocaleString('en-IN')}</div>
                  </div>
                </div>

                <div className="tourney-stat-card">
                  <div className="tourney-stat-icon"><Users size={16} /></div>
                  <div>
                    <div className="tourney-stat-label">Teams</div>
                    <div className="tourney-stat-value">{activeTournament.bookedCount || 0} / {activeTournament.maxTeams || 20}</div>
                  </div>
                </div>

                <div className="tourney-stat-card">
                  <div className="tourney-stat-icon"><Crosshair size={16} /></div>
                  <div>
                    <div className="tourney-stat-label">Lobby</div>
                    <div className="tourney-stat-value">{activeTournament.lobby || '01'}</div>
                  </div>
                </div>

                <div className="tourney-stat-card" style={{ gridColumn: 'span 2' }}>
                  <div className="tourney-stat-icon"><Clock size={16} /></div>
                  <div>
                    <div className="tourney-stat-label">Start Time</div>
                    <div className="tourney-stat-value">{activeTournament.date || '10 Oct 2026'} • {activeTournament.timing || '02:00 PM'}</div>
                  </div>
                </div>
              </div>

              {/* Register CTA Button */}
              {myBookings[activeTournament._id]?.paymentStatus === 'paid' ? (
                <button
                  type="button"
                  className="tourney-register-cta-btn"
                  onClick={() => handleGetCredentials(activeTournament)}
                >
                  Room Credentials
                </button>
              ) : activeTournament.isSoldOut || (Number(activeTournament.maxTeams || 20) - Number(activeTournament.bookedCount || 0)) <= 0 ? (
                <button
                  type="button"
                  className="tourney-register-cta-btn"
                  style={{ opacity: 0.6, cursor: 'not-allowed', background: '#374151' }}
                  disabled
                >
                  Registration Closed
                </button>
              ) : (
                <button
                  type="button"
                  className="tourney-register-cta-btn"
                  onClick={() => openPaymentModal(activeTournament)}
                >
                  Register Now
                </button>
              )}

              {/* Registered Teams Preview */}
              <div className="tourney-reg-teams-header">
                <div className="tourney-section-heading" style={{ margin: 0 }}>Registered Teams</div>
                <button
                  type="button"
                  className="tourney-view-all-link"
                  onClick={() => setSubPage('registered_teams')}
                >
                  View All &gt;
                </button>
              </div>

              <div className="tourney-teams-list-wrap">
                {(activeTournament.bookedTeams && activeTournament.bookedTeams.length > 0
                  ? activeTournament.bookedTeams.slice(0, 3)
                  : [
                      { teamName: 'Team Apex', teamTag: 'RISING-1023' },
                      { teamName: 'Future Masters', teamTag: 'RISING-1042' },
                      { teamName: 'Rising Warriors', teamTag: 'RISING-1081' }
                    ]
                ).map((t, idx) => (
                  <div
                    key={idx}
                    className="tourney-team-row"
                    onClick={() => setSubPage('registered_teams')}
                  >
                    <div className="tourney-team-left">
                      <div
                        className="tourney-team-crest"
                        style={{ background: STICKER_PALETTES[idx % STICKER_PALETTES.length].bg }}
                      >
                        {getTeamMonogram(t.teamName, t.teamTag)}
                      </div>
                      <div>
                        <div className="tourney-team-name">{t.teamName}</div>
                        <div className="tourney-team-tag">{t.teamTag || `RISING-${1023 + idx * 19}`}</div>
                      </div>
                    </div>
                    <ChevronRight size={16} color="#94a3b8" />
                  </div>
                ))}
              </div>

              {/* Drop Details link card */}
              <div
                className="tourney-drop-card-btn"
                onClick={() => setSubPage('drop_details')}
              >
                <div className="tourney-drop-card-left">
                  <MapPin size={22} color="#a855f7" />
                  <div>
                    <div className="tourney-drop-card-title">Drop Details</div>
                    <div className="tourney-drop-card-sub">View team-wise drop locations</div>
                  </div>
                </div>
                <ChevronRight size={18} color="#94a3b8" />
              </div>
            </div>
          )}

          {/* Tab 2: Prize Pool */}
          {tourneyTab === 'prizepool' && (
            <div style={{ marginTop: '0.5rem' }}>
              <div className="ts-panel-label" style={{ marginBottom: '0.75rem' }}>PRIZE POOL BREAKDOWN</div>
              <div className="ts-prize-grid">
                {resolvePrizes(activeTournament).map((p, idx) => {
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
          )}

          {/* Tab 3: Schedule */}
          {tourneyTab === 'schedule' && (
            <div style={{ marginTop: '0.5rem' }}>
              <div className="ts-panel-label" style={{ marginBottom: '0.75rem' }}>MATCH SCHEDULE</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {resolveSchedule(activeTournament).map((s, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(22, 16, 44, 0.8)',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid rgba(139, 92, 246, 0.2)'
                    }}
                  >
                    <span style={{ fontWeight: 800, color: '#fff', fontSize: '0.85rem' }}>
                      {s.label || `MATCH ${s.matchNumber || idx + 1}`}
                    </span>
                    <span style={{ color: '#a78bfa', fontWeight: 700, fontSize: '0.8rem' }}>
                      {s.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Map */}
          {tourneyTab === 'map' && (
            <div style={{ marginTop: '0.5rem' }}>
              <div className="ts-panel-label" style={{ marginBottom: '0.75rem' }}>MAP ROTATION</div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {resolveMaps(activeTournament).map((mapName, idx) => (
                  <div
                    key={idx}
                    style={{
                      flex: '1 1 45%',
                      background: 'rgba(22, 16, 44, 0.8)',
                      padding: '1rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(139, 92, 246, 0.25)',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>🗺️</div>
                    <div style={{ fontWeight: 900, color: '#fff', fontSize: '0.9rem' }}>{mapName}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : subPage === 'registered_teams' && activeTournament ? (
        /* ── Subpage: Registered Teams (Screen 4) ── */
        <div className="fade-in">
          <div className="category-screen-header">
            <button
              type="button"
              className="category-back-btn"
              onClick={() => setSubPage('details')}
            >
              <ArrowLeft size={18} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 className="category-screen-title">Registered Teams</h2>
              <span
                style={{
                  fontSize: '0.72rem',
                  color: '#c084fc',
                  background: 'rgba(139, 92, 246, 0.2)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontWeight: 800
                }}
              >
                {(activeTournament.bookedTeams?.length || 0)}/{activeTournament.maxTeams || 20} Teams
              </span>
            </div>
          </div>

          <div className="tourney-teams-list-wrap">
            {(activeTournament.bookedTeams && activeTournament.bookedTeams.length > 0
              ? activeTournament.bookedTeams
              : [
                  { teamName: 'Team Apex', teamTag: 'RISING-1023' },
                  { teamName: 'Future Masters', teamTag: 'RISING-1042' },
                  { teamName: 'Rising Warriors', teamTag: 'RISING-1081' },
                  { teamName: 'Gods Reign', teamTag: 'RISING-1105' },
                  { teamName: 'Toxic Esports', teamTag: 'RISING-1148' },
                  { teamName: 'Blaze Gaming', teamTag: 'RISING-1176' },
                  { teamName: 'Shadow Squad', teamTag: 'RISING-1203' },
                  { teamName: 'Nova Esports', teamTag: 'RISING-1230' }
                ]
            ).map((t, idx) => (
              <div key={idx} className="tourney-team-row">
                <div className="tourney-team-left">
                  <div
                    className="tourney-team-crest"
                    style={{ background: STICKER_PALETTES[idx % STICKER_PALETTES.length].bg }}
                  >
                    {getTeamMonogram(t.teamName, t.teamTag)}
                  </div>
                  <div>
                    <div className="tourney-team-name">{t.teamName}</div>
                    <div className="tourney-team-tag">{t.teamTag || `RISING-${1023 + idx * 19}`}</div>
                  </div>
                </div>
                <ChevronRight size={16} color="#94a3b8" />
              </div>
            ))}
          </div>

          {/* Drop details link card */}
          <div
            className="tourney-drop-card-btn"
            onClick={() => setSubPage('drop_details')}
            style={{ marginTop: '1rem' }}
          >
            <div className="tourney-drop-card-left">
              <MapPin size={22} color="#a855f7" />
              <div>
                <div className="tourney-drop-card-title">Drop Details</div>
                <div className="tourney-drop-card-sub">View team-wise drop locations</div>
              </div>
            </div>
            <ChevronRight size={18} color="#94a3b8" />
          </div>
        </div>
      ) : subPage === 'drop_details' && activeTournament ? (
        /* ── Subpage: Drop Details (Screen 5) ── */
        <div className="fade-in">
          <div className="category-screen-header">
            <button
              type="button"
              className="category-back-btn"
              onClick={() => setSubPage('details')}
            >
              <ArrowLeft size={18} />
            </button>
            <h2 className="category-screen-title">Drop Details</h2>
          </div>

          {/* Mini map banner */}
          <div className="drop-details-map-hero">
            <div className="drop-details-map-thumb">
              <img src={soldierBgImg} alt="Map preview" />
            </div>
            <div>
              <div className="drop-details-match-label">Match 1</div>
              <div className="drop-details-map-name">{resolveMaps(activeTournament)[0] || 'Erangel'}</div>
            </div>
          </div>

          <div className="tourney-section-heading" style={{ marginBottom: '0.65rem' }}>Team Drop Locations</div>

          <table className="drop-details-table">
            <thead>
              <tr>
                <th style={{ width: '32px' }}>#</th>
                <th>Team</th>
                <th>Drop Location</th>
              </tr>
            </thead>
            <tbody>
              {(activeTournament.bookedTeams && activeTournament.bookedTeams.length > 0
                ? activeTournament.bookedTeams
                : [
                    { teamName: 'Team Apex', teamTag: 'R1023', drop: 'Pochinki' },
                    { teamName: 'Future Masters', teamTag: 'R1042', drop: 'School' },
                    { teamName: 'Rising Warriors', teamTag: 'R1081', drop: 'Rozhok' },
                    { teamName: 'Gods Reign', teamTag: 'R1105', drop: 'Georgopol' },
                    { teamName: 'Toxic Esports', teamTag: 'R1148', drop: 'Yasnaya' },
                    { teamName: 'Blaze Gaming', teamTag: 'R1176', drop: 'Prison' },
                    { teamName: 'Shadow Squad', teamTag: 'R1203', drop: 'Shooting Range' },
                    { teamName: 'Nova Esports', teamTag: 'R1230', drop: 'Novorepnoye' },
                    { teamName: 'Vortex Gaming', teamTag: 'R1255', drop: 'Lipovka' }
                  ]
              ).map((t, idx) => {
                const mapKey = (resolveMaps(activeTournament)[0] || 'ERANGEL');
                const dropLoc = t.drop || getTeamDrop(t, mapKey) || 'TBD';
                return (
                  <tr key={idx} className="drop-row">
                    <td style={{ color: '#c084fc', fontWeight: 900 }}>{idx + 1}</td>
                    <td className="team-col">
                      <div
                        className="tourney-team-crest"
                        style={{ width: '26px', height: '26px', fontSize: '0.65rem', background: STICKER_PALETTES[idx % STICKER_PALETTES.length].bg }}
                      >
                        {getTeamMonogram(t.teamName, t.teamTag)}
                      </div>
                      <span>{t.teamName}</span>
                    </td>
                    <td className="drop-col">{dropLoc}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* ── Subpage: Category List (Screens 2 & 7) ── */
        <>
          {/* Category Screen Header with Back Arrow */}
          <div className="category-screen-header">
            <button type="button" className="category-back-btn" onClick={() => navigate('/')}>
              <ArrowLeft size={18} />
            </button>
            <h2 className="category-screen-title">
              {selectedCategory === 'ALL' ? "Today's Slots" : selectedCategory}
            </h2>
          </div>

          {/* ── Main Tab Switcher (Available Slots vs My Registered Matches) ── */}
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              margin: '0.5rem 0 0.85rem',
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '4px',
              borderRadius: '12px',
              border: '1px solid rgba(139, 92, 246, 0.22)'
            }}
          >
            <button
              type="button"
              onClick={() => navigate('/slots')}
              style={{
                flex: 1,
                padding: '0.55rem 0.75rem',
                borderRadius: '9px',
                border: 'none',
                background: !isMyMatchesTab ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : 'transparent',
                color: '#fff',
                fontWeight: 800,
                fontSize: '0.8rem',
                letterSpacing: '0.5px',
                cursor: 'pointer',
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
                padding: '0.55rem 0.75rem',
                borderRadius: '9px',
                border: 'none',
                background: isMyMatchesTab ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : 'transparent',
                color: '#fff',
                fontWeight: 800,
                fontSize: '0.8rem',
                letterSpacing: '0.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                boxShadow: isMyMatchesTab ? '0 4px 14px rgba(124, 58, 237, 0.35)' : 'none'
              }}
            >
              <span>MY MATCHES</span>
              {Object.keys(myBookings).length > 0 && (
                <span
                  style={{
                    background: isMyMatchesTab ? 'rgba(255,255,255,0.25)' : '#7c3aed',
                    padding: '1px 6px',
                    borderRadius: '999px',
                    fontSize: '0.7rem',
                    fontWeight: 800
                  }}
                >
                  {Object.keys(myBookings).length}
                </span>
              )}
            </button>
          </div>

          {!isMyMatchesTab && (
            <>
              {/* Date Pills: [ Today ] [ Tomorrow ] */}
              <div className="cat-date-pills">
                <button
                  type="button"
                  className={`cat-date-pill ${isTodaySelected ? 'active' : ''}`}
                  onClick={resetToToday}
                >
                  Today
                </button>
                <button
                  type="button"
                  className={`cat-date-pill ${!isTodaySelected ? 'active' : ''}`}
                  onClick={() => {
                    const tom = new Date();
                    tom.setDate(tom.getDate() + 1);
                    setSelectedDate(tom);
                  }}
                >
                  Tomorrow
                </button>
              </div>

              {/* Date Picker Row */}
              <div className="cat-date-picker-row">
                <div className="cat-date-display">
                  <Calendar size={15} />
                  <span>{formatDateDisplay(selectedDate)}</span>
                </div>
                <label className="cat-date-calendar-btn" title="Pick date">
                  <Calendar size={18} />
                  <input
                    type="date"
                    style={{
                      position: 'absolute',
                      opacity: 0,
                      width: '100%',
                      height: '100%',
                      left: 0,
                      top: 0,
                      cursor: 'pointer'
                    }}
                    onChange={(e) => {
                      if (e.target.value) {
                        const parts = e.target.value.split('-');
                        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                        setSelectedDate(d);
                      }
                    }}
                  />
                </label>
              </div>

              {/* Category Pills */}
              <div className="ts-tabs-row" style={{ marginBottom: '1rem' }}>
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
                  ? 'Sign in to your account to view your registered matches.'
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

          const defaultPrizes = [
            { rank: '#1', prize: '₹400' },
            { rank: '#2', prize: '₹150' },
            { rank: '#3', prize: '₹100' },
            { rank: '#4', prize: '₹70' },
            { rank: '#5', prize: 'FREE' },
          ];
          const rawPrizes = resolvePrizes(slot);
          const displayPrizes = defaultPrizes.map((def, idx) => rawPrizes[idx] || def);
          const matchPillars = resolveSlotMatches(slot);

          return (
            <div key={slot._id} className="cat-slot-card-item">
              {/* Header Row: Title on Left, Lobby on Right */}
              <div className="cat-slot-header-row">
                <h3 className="cat-slot-card-title">{slot.matchName || 'RISING 1-3 GRIND SCRIMS'}</h3>
                <span className="cat-slot-lobby-badge">{slot.lobby || 'LOBBY 2'}</span>
              </div>

              {/* Row 1: 5-Pillar Prize Distribution Grid */}
              <div className="cat-slot-prize-grid">
                {displayPrizes.map((p, pIdx) => {
                  const isFirst = pIdx === 0;
                  const isFree = /free/i.test(p.prize);
                  return (
                    <div
                      key={pIdx}
                      className={`cat-slot-prize-chip ${isFirst ? 'highlight-first' : ''}`}
                    >
                      <span className="cat-slot-prize-rank">{p.rank}</span>
                      <span className={`cat-slot-prize-amount ${isFirst ? 'gold' : ''} ${isFree ? 'free' : ''}`}>
                        {p.prize}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Row 2: 3-Pillar Match Times Grid */}
              <div className="cat-slot-matches-grid">
                {matchPillars.map((m, mIdx) => (
                  <div key={mIdx} className="cat-slot-match-chip">
                    <span className="cat-slot-match-map">M{m.matchNumber || mIdx + 1}: {m.map}</span>
                    <span className="cat-slot-match-time">{m.time}</span>
                  </div>
                ))}
              </div>

              {/* Row 3: 3 Action Buttons (Drop Chart | Teams | Info) */}
              <div className="cat-slot-actions-row">
                <button
                  type="button"
                  className="cat-slot-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTeamsModalSlot(slot);
                    setTeamsModalTab('drops');
                  }}
                >
                  <MapPin size={14} color="#38bdf8" />
                  <span>Drop Chart</span>
                </button>

                <button
                  type="button"
                  className="cat-slot-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTeamsModalSlot(slot);
                    setTeamsModalTab('teams');
                  }}
                >
                  <Users size={14} color="#34d399" />
                  <span>Teams ({bookedSlots})</span>
                </button>

                <button
                  type="button"
                  className="cat-slot-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTournament(slot);
                    setSubPage('details');
                  }}
                >
                  <Info size={14} color="#c084fc" />
                  <span>Info</span>
                </button>
              </div>

              {/* Row 4: Bottom Banner / Registration CTA (Cyberpunk Purple Gradient) */}
              <div
                className="cat-slot-bottom-banner"
                onClick={() => {
                  if (isPaid && normalizedWaLink) {
                    window.open(normalizedWaLink, '_blank');
                  } else if (!isPaid && !isPending && !isSoldOut) {
                    openPaymentModal(slot);
                  }
                }}
              >
                <div className="cat-slot-pay-pill">
                  {isPaid ? (
                    <>✓ BOOKED</>
                  ) : isPending ? (
                    <>⏳ PENDING</>
                  ) : isSoldOut ? (
                    <>SLOTS FULL</>
                  ) : (
                    <>
                      <span style={{ fontSize: '1.05rem', lineHeight: 1 }}>🔥</span> PAY ₹{slot.entryFee != null ? slot.entryFee : 60}
                    </>
                  )}
                </div>
                <div className="cat-slot-slots-count-pill">
                  {bookedSlots}/{totalSlots} SLOTS
                </div>
              </div>
            </div>
          );
                  })
      )}
    </>
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
