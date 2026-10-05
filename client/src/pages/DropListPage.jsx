import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import DropListView from '../components/DropListView';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function DropListPage() {
  const { slotId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get('tab') === 'teams' ? 'teams' : 'drops';

  const [slot, setSlot] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadSlot() {
      try {
        setLoading(true);
        if (slotId) {
          try {
            const { data } = await axios.get(`${API_URL}/api/slots/${slotId}`);
            if (isMounted && data && data._id) {
              setSlot(data);
              return;
            }
          } catch {
            // fallback to listing all slots
          }
        }
        const { data } = await axios.get(`${API_URL}/api/slots`);
        if (!isMounted) return;

        if (Array.isArray(data) && data.length > 0) {
          if (slotId) {
            const found = data.find((s) => String(s._id) === String(slotId));
            setSlot(found || data[0]);
          } else {
            setSlot(data[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load slots for droplist', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSlot();
    return () => {
      isMounted = false;
    };
  }, [slotId]);

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚡</div>
          <div style={{ fontWeight: 800, letterSpacing: '1px' }}>LOADING SCRIM DROP LIST...</div>
        </div>
      </div>
    );
  }

  return (
    <DropListView
      slot={slot}
      isStandalonePage={true}
      initialTab={initialTab}
      onClose={() => navigate('/slots')}
    />
  );
}
