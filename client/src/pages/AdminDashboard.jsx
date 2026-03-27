import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, LogOut, Trophy, Layout } from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('rankings');
  const [rankings, setRankings] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  const adminInfo = JSON.parse(localStorage.getItem('adminInfo'));
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const config = {
    headers: { Authorization: `Bearer ${adminInfo.token}` }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rankRes, slotRes] = await Promise.all([
        axios.get(`${apiUrl}/api/rankings`),
        axios.get(`${apiUrl}/api/slots`)
      ]);
      setRankings(rankRes.data);
      setSlots(slotRes.data);
    } catch (err) {
      console.error('Error fetching data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminInfo');
    window.location.href = '/admin/login';
  };

  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      setFormData(item);
    } else {
      setFormData(activeTab === 'rankings' 
        ? { rank: rankings.length + 1, teamName: '', teamTag: '', totalMatches: 0, finishes: 0, wwcd: 0, totalPoints: 0 }
        : { entryFee: 0, prizePool: [{ position: 1, amount: 0 }] }
      );
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await axios.put(`${apiUrl}/api/${activeTab}/${editingItem._id}`, formData, config);
      } else {
        await axios.post(`${apiUrl}/api/${activeTab}`, formData, config);
      }
      fetchData();
      setShowModal(false);
    } catch (err) {
      alert('Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this?')) {
      try {
        await axios.delete(`${apiUrl}/api/${activeTab}/${id}`, config);
        fetchData();
      } catch (err) {
        alert('Delete failed');
      }
    }
  };

  const removePrizeRow = (index) => {
    const newPrizes = formData.prizePool.filter((_, i) => i !== index);
    // Re-adjust positions
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

  return (
    <div className="admin-dashboard fade-in">
      <div className="admin-nav">
        <h1>Admin <span>Panel</span></h1>
        <button onClick={handleLogout} className="tab-btn" style={{display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent'}}>
          <LogOut size={18} /> Logout
        </button>
      </div>

      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'rankings' ? 'active' : ''}`}
          onClick={() => setActiveTab('rankings')}
        >
          <Trophy size={18} style={{marginRight: '8px'}} /> Rankings
        </button>
        <button 
          className={`tab-btn ${activeTab === 'slots' ? 'active' : ''}`}
          onClick={() => setActiveTab('slots')}
        >
          <Layout size={18} style={{marginRight: '8px'}} /> Today Slots
        </button>
      </div>

      <div className="admin-section">
        <div className="admin-header">
          <h2>Manage {activeTab === 'rankings' ? 'Rankings' : 'Slots'}</h2>
          <button className="action-btn" onClick={() => handleOpenModal()}>
            <Plus size={18} /> Add New
          </button>
        </div>

        {loading ? <p>Loading...</p> : (
          <div className="rankings-table-wrapper">
            <table className="rankings-table">
              <thead>
                {activeTab === 'rankings' ? (
                  <tr>
                    <th>Rank</th>
                    <th>Team</th>
                    <th>Points</th>
                    <th>Actions</th>
                  </tr>
                ) : (
                  <tr>
                    <th>Entry Fee</th>
                    <th>Prizes</th>
                    <th>Actions</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {activeTab === 'rankings' ? rankings.map(team => (
                  <tr key={team._id}>
                    <td>#{team.rank}</td>
                    <td>{team.teamName} [{team.teamTag}]</td>
                    <td>{team.totalPoints}</td>
                    <td>
                      <div style={{display: 'flex', gap: '0.5rem'}}>
                        <button className="action-btn edit-btn" onClick={() => handleOpenModal(team)}><Edit2 size={14}/></button>
                        <button className="action-btn delete-btn" onClick={() => handleDelete(team._id)}><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                )) : slots.map(slot => (
                  <tr key={slot._id}>
                    <td>Rs. {slot.entryFee}</td>
                    <td>{slot.prizePool.length} Positions</td>
                    <td>
                      <div style={{display: 'flex', gap: '0.5rem'}}>
                        <button className="action-btn edit-btn" onClick={() => handleOpenModal(slot)}><Edit2 size={14}/></button>
                        <button className="action-btn delete-btn" onClick={() => handleDelete(slot._id)}><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editingItem ? 'Edit' : 'Add'} {activeTab === 'rankings' ? 'Ranking' : 'Slot'}</h3>
            <form onSubmit={handleSubmit} style={{marginTop: '1.5rem'}}>
              {activeTab === 'rankings' ? (
                <>
                  <div className="form-grid" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                    <div className="form-group">
                      <label>Rank</label>
                      <input type="number" value={formData.rank} onChange={e => setFormData({...formData, rank: e.target.value})} required />
                    </div>
                    <div className="form-group">
                      <label>Team Name</label>
                      <input type="text" value={formData.teamName} onChange={e => setFormData({...formData, teamName: e.target.value})} required />
                    </div>
                    <div className="form-group">
                      <label>Team Tag</label>
                      <input type="text" value={formData.teamTag} onChange={e => setFormData({...formData, teamTag: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Total Matches</label>
                      <input type="number" value={formData.totalMatches} onChange={e => setFormData({...formData, totalMatches: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Finishes</label>
                      <input type="number" value={formData.finishes} onChange={e => setFormData({...formData, finishes: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>WWCD</label>
                      <input type="number" value={formData.wwcd} onChange={e => setFormData({...formData, wwcd: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Total Points</label>
                      <input type="number" value={formData.totalPoints} onChange={e => setFormData({...formData, totalPoints: e.target.value})} />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>Entry Fee (RS)</label>
                    <input type="number" value={formData.entryFee} onChange={e => setFormData({...formData, entryFee: e.target.value})} required />
                  </div>
                  <div className="prizes-list" style={{marginTop: '1rem'}}>
                    <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--purple-light)'}}>PRIZE POOL</label>
                    {formData.prizePool.map((prize, idx) => (
                      <div key={idx} style={{display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center'}}>
                        <span style={{fontSize: '0.8rem', color: 'var(--text-muted)', width: '30px'}}>#{prize.position}</span>
                        <input 
                          type="number" 
                          value={prize.amount} 
                          placeholder="Amount" 
                          onChange={e => handlePrizeChange(idx, 'amount', e.target.value)} 
                          required 
                          style={{flex: 1}}
                        />
                        {formData.prizePool.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => removePrizeRow(idx)}
                            style={{background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '5px'}}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={addPrizeRow} className="tab-btn" style={{fontSize: '0.7rem', padding: '0.4rem 1rem', marginTop: '0.5rem'}}>+ Add Position</button>
                  </div>
                </>
              )}
              <div className="modal-footer">
                <button type="button" className="tab-btn cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="tab-btn active">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
