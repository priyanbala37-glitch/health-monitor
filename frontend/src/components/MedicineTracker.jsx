import { useAuth } from '../context/AuthContext';
import { useEffect, useState, useRef } from 'react';
import api from '../services/api';

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${m} ${period}`;
}

function isOverdue(timeStr) {
  const now = new Date();
  const [h, m] = timeStr.split(':').map(Number);
  const scheduled = new Date();
  scheduled.setHours(h, m, 0, 0);
  return now > scheduled;
}

export default function MedicineTracker({ residentId }) {
  const [todayLog, setTodayLog] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [form, setForm] = useState({ med_name: '', dosage: '', time_of_day: '' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ med_name: '', dosage: '', time_of_day: '', frequency: 'daily' });
  const { user } = useAuth();
const role = user?.role;
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(intervalRef.current);
  }, [residentId]);

  const fetchData = async () => {
    const logRes = await api.get(`/medicines/${residentId}/today`);
    setTodayLog(logRes.data);
    const medRes = await api.get(`/medicines/${residentId}`);
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

  const startEdit = (med) => {
    setEditingId(med.id);
    setEditForm({
      med_name: med.med_name,
      dosage: med.dosage || '',
      time_of_day: med.time_of_day.slice(0, 5),
      frequency: med.frequency
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id) => {
    await api.patch(`/medicines/${id}`, editForm);
    setEditingId(null);
    fetchData();
  };

  const deleteMedicine = async (id) => {
    if (!window.confirm('Delete this medicine and its full log history? This cannot be undone.')) return;
    await api.delete(`/medicines/${id}`);
    fetchData();
  };

  const overdueItems = todayLog.filter((log) => log.status === 'pending' && isOverdue(log.time_of_day));

  return (
    <div className="medicine-tracker">
      <h4>Medicine Schedule</h4>

      {overdueItems.length > 0 && (
        <div className="overdue-banner">
          {overdueItems.length} dose{overdueItems.length > 1 ? 's' : ''} overdue and not yet marked:{' '}
          {overdueItems.map((i) => i.med_name).join(', ')}
        </div>
      )}

      {todayLog.length === 0 && <p className="empty-state">No medicines scheduled yet.</p>}

      {todayLog.map((log) => (
        <div
          key={log.log_id}
          className={`med-log-item status-${log.status} ${
            log.status === 'pending' && isOverdue(log.time_of_day) ? 'is-overdue' : ''
          }`}
        >
          <div>
            <strong>{log.med_name}</strong> ({log.dosage})
            <p>Scheduled: {formatTime(log.time_of_day)}</p>
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
        <>
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

          <div className="medicine-manage-list">
            <h5>Manage Medicines</h5>
            {medicines.length === 0 && <p className="empty-state">No medicines added yet.</p>}
            {medicines.map((med) => (
              <div key={med.id} className="medicine-manage-item">
                {editingId === med.id ? (
                  <div className="medicine-edit-row">
                    <input
                      value={editForm.med_name}
                      onChange={(e) => setEditForm({ ...editForm, med_name: e.target.value })}
                      placeholder="Medicine name"
                    />
                    <input
                      value={editForm.dosage}
                      onChange={(e) => setEditForm({ ...editForm, dosage: e.target.value })}
                      placeholder="Dosage"
                    />
                    <input
                      type="time"
                      value={editForm.time_of_day}
                      onChange={(e) => setEditForm({ ...editForm, time_of_day: e.target.value })}
                    />
                    <select
                      value={editForm.frequency}
                      onChange={(e) => setEditForm({ ...editForm, frequency: e.target.value })}
                    >
                      <option value="daily">Daily</option>
                      <option value="alternate">Alternate days</option>
                      <option value="weekly">Weekly</option>
                    </select>
                    <button className="btn-primary btn-sm" onClick={() => saveEdit(med.id)}>Save</button>
                    <button className="btn-secondary btn-sm" onClick={cancelEdit}>Cancel</button>
                  </div>
                ) : (
                  <>
                    <div>
                      <strong>{med.med_name}</strong> ({med.dosage || 'no dosage set'})
                      <p>{formatTime(med.time_of_day)} · {med.frequency}</p>
                    </div>
                    <div className="med-actions">
                      <button className="btn-secondary btn-sm" onClick={() => startEdit(med)}>Edit</button>
                      <button className="btn-warning btn-sm" onClick={() => deleteMedicine(med.id)}>Delete</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}