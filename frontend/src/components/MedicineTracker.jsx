import { useEffect, useState } from 'react';
import api from '../services/api';

export default function MedicineTracker({ residentId }) {
  const [todayLog, setTodayLog] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [form, setForm] = useState({ med_name: '', dosage: '', time_of_day: '' });
  const { role } = JSON.parse(sessionStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchData();
  }, [residentId]);

  const fetchData = async () => {
    const [logRes, medRes] = await Promise.all([
      api.get(`/medicines/${residentId}/today`),
      api.get(`/medicines/${residentId}`),
    ]);
    setTodayLog(logRes.data);
    setMedicines(medRes.data);
  };

  const markStatus = async (logId, status) => {
    await api.patch(`/medicines/log/${logId}`, { status });
    fetchData();
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    await api.post('/medicines', { resident_id: residentId, ...form });
    setForm({ med_name: '', dosage: '', time_of_day: '' });
    fetchData();
  };

  return (
    <div className="medicine-tracker">
      <h4>💊 Medicine Schedule</h4>

      {todayLog.length === 0 && medicines.length === 0 && (
        <p className="empty-state">No medicines scheduled yet.</p>
      )}

      {medicines.length > 0 && todayLog.length === 0 && (
        <p className="empty-state">
          Scheduled, but no log entries generated for today yet (log entries are created by the reminder scheduler — see note below).
        </p>
      )}

      {todayLog.map((log) => (
        <div key={log.log_id} className={`med-log-item status-${log.status}`}>
          <div>
            <strong>{log.med_name}</strong> ({log.dosage})
            <p>Scheduled: {log.time_of_day}</p>
          </div>
          <div className="med-actions">
            <span className={`badge badge-${log.status === 'taken' ? 'low' : log.status === 'missed' ? 'high' : 'medium'}`}>
              {log.status}
            </span>
            {log.status === 'pending' && (
              <>
                <button onClick={() => markStatus(log.log_id, 'taken')} className="btn-primary btn-sm">Mark Taken</button>
                <button onClick={() => markStatus(log.log_id, 'missed')} className="btn-warning btn-sm">Mark Missed</button>
              </>
            )}
          </div>
        </div>
      ))}

      {role === 'staff' && (
        <form onSubmit={handleAddMedicine} className="add-medicine-form">
          <h5>Add New Medicine</h5>
          <input
            placeholder="Medicine name"
            value={form.med_name}
            onChange={(e) => setForm({ ...form, med_name: e.target.value })}
            required
          />
          <input
            placeholder="Dosage (e.g. 500mg)"
            value={form.dosage}
            onChange={(e) => setForm({ ...form, dosage: e.target.value })}
          />
          <input
            type="time"
            value={form.time_of_day}
            onChange={(e) => setForm({ ...form, time_of_day: e.target.value })}
            required
          />
          <button type="submit" className="btn-secondary btn-sm">Add</button>
        </form>
      )}
    </div>
  );
}