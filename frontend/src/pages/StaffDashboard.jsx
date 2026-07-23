import { useEffect, useState } from 'react';
import api from '../services/api';
import ResidentCard from '../components/ResidentCard';
import AlertFeed from '../components/AlertFeed';
import StatusSummaryBar from '../components/StatusSummaryBar';
import DashboardHero from '../components/DashboardHero';

export default function StaffDashboard() {
  const [residents, setResidents] = useState([]);
  const [alertCount, setAlertCount] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({
    name: '', age: '', gender: 'M', room_no: '', conditions: '', date_of_birth: '', hometown: ''
  });

  useEffect(() => {
    fetchResidents();
    fetchAlertCount();
  }, []);

  const fetchResidents = async () => {
    const res = await api.get('/residents');
    setResidents(res.data);
  };

  const fetchAlertCount = async () => {
    const res = await api.get('/alerts');
    setAlertCount(res.data.length);
  };

  const handleAddResident = async (e) => {
    e.preventDefault();
    await api.post('/residents', form);
    setForm({ name: '', age: '', gender: 'M', room_no: '', conditions: '', date_of_birth: '', hometown: '' });
    setShowForm(false);
    fetchResidents();
  };

  const filteredResidents = filter === 'all' ? residents : residents.filter((r) => r.status === filter);

  return (
    <div className="dashboard-layout">
        <DashboardHero residents={residents} />
      <div className="dashboard-main">
        <div className="dashboard-header">
          <h2>Resident Overview</h2>
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Add Resident'}
          </button>
        </div>

        <StatusSummaryBar residents={residents} activeAlertCount={alertCount} />

        {showForm && (
          <form onSubmit={handleAddResident} className="add-resident-form">
            <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <input placeholder="Age" type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} required />
            <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="O">Other</option>
            </select>
            <input placeholder="Room No." value={form.room_no} onChange={(e) => setForm({ ...form, room_no: e.target.value })} />
            <input placeholder="Conditions" value={form.conditions} onChange={(e) => setForm({ ...form, conditions: e.target.value })} />
            <label className="inline-label">
              Date of birth
              <input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
            </label>
            <input placeholder="Hometown" value={form.hometown} onChange={(e) => setForm({ ...form, hometown: e.target.value })} />
            <button type="submit" className="btn-secondary">Save Resident</button>
          </form>
        )}

        <div className="filter-tabs">
          {['all', 'normal', 'watch', 'critical'].map((f) => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? 'active' : ''} tab-${f}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="resident-grid">
          {filteredResidents.map((r) => (
            <ResidentCard key={r.id} resident={r} />
          ))}
          {filteredResidents.length === 0 && <p className="empty-state">No residents match this filter.</p>}
        </div>
      </div>

      <div className="dashboard-sidebar">
        <AlertFeed onAlertsChange={setAlertCount} />
      </div>
    </div>
  );
}