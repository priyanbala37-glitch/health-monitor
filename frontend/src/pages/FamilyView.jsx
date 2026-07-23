import { useEffect, useState } from 'react';
import api from '../services/api';
import ResidentCard from '../components/ResidentCard';

export default function FamilyView() {
  const [residents, setResidents] = useState([]);

  useEffect(() => {
    api.get('/residents').then((res) => setResidents(res.data));
  }, []);

  return (
    <div className="dashboard-layout">
      <div className="dashboard-main" style={{ width: '100%' }}>
        <div className="dashboard-header">
          <h2>Your Family Members</h2>
        </div>
        <p className="subtitle-note">
          View your loved one's health status, vitals trends, and medicine adherence in real time.
        </p>
        <div className="resident-grid">
          {residents.map((r) => (
            <ResidentCard key={r.id} resident={r} />
          ))}
          {residents.length === 0 && <p className="empty-state">No residents linked to your account yet.</p>}
        </div>
      </div>
    </div>
  );
}