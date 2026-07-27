import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import api from '../services/api';
import VitalsForm from '../components/VitalsForm';
import VitalsChart from '../components/VitalsChart';
import MedicineTracker from '../components/MedicineTracker';
import AdherenceChart from '../components/AdherenceChart';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

export default function ResidentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [resident, setResident] = useState(null);
  const [vitals, setVitals] = useState([]);
  const [status, setStatus] = useState('normal');
  const [savingStatus, setSavingStatus] = useState(false);

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    const res = await api.get(`/residents/${id}`);
    setResident(res.data.resident);
    setVitals((await api.get(`/vitals/${id}`)).data);

    const all = await api.get('/residents');
    const match = all.data.find((r) => String(r.id) === String(id));
    if (match) setStatus(match.status);
  };

  const changeStatus = async (newStatus) => {
    setSavingStatus(true);
    await api.patch(`/residents/${id}/status`, { status_override: newStatus });
    await fetchData();
    setSavingStatus(false);
  };

  const triggerFall = async () => {
    await api.post('/alerts/fall', { resident_id: id });
  };

  const deleteResident = async () => {
    if (!window.confirm(`Delete ${resident.name} and all their records (vitals, medicines, alerts)? This cannot be undone.`)) return;
    await api.delete(`/residents/${id}`);
    navigate('/staff');
  };

  const downloadSummary = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Health Summary — ${resident.name}`, 14, 20);
    doc.setFontSize(11);
    doc.text(`Age: ${resident.age}   Room: ${resident.room_no || 'N/A'}`, 14, 32);
    doc.text(`Conditions: ${resident.conditions || 'None recorded'}`, 14, 40);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 48);

    doc.setFontSize(13);
    doc.text('Recent Vitals', 14, 62);
    doc.setFontSize(10);
    let y = 70;
    vitals.slice(0, 5).forEach((v) => {
      doc.text(
        `${new Date(v.recorded_at).toLocaleString()} — HR ${v.heart_rate}, SpO2 ${v.spo2}%, Temp ${v.temperature}°F, BP ${v.bp_systolic}/${v.bp_diastolic}${v.is_anomaly ? '  [FLAGGED]' : ''}`,
        14, y
      );
      y += 8;
    });

    doc.save(`${resident.name.replace(/\s+/g, '_')}_health_summary.pdf`);
  };

  if (!resident) return <div className="page-loading">Loading...</div>;

  return (
    <div className="resident-detail">
      <button className="btn-back" onClick={() => navigate(-1)}>← Back</button>

      <div className="resident-header">
        <div className="resident-avatar large">{resident.name.charAt(0)}</div>
        <div>
          <div className="resident-title-row">
            <h2>{resident.name}</h2>
            <StatusBadge status={status} />
            {user.role === 'staff' && (
              <select
                className="status-select"
                value={resident.status_override || 'auto'}
                onChange={(e) => changeStatus(e.target.value)}
                disabled={savingStatus}
              >
                <option value="auto">Auto (based on alerts)</option>
                <option value="normal">Force: Normal</option>
                <option value="watch">Force: Watch</option>
                <option value="critical">Force: Critical</option>
              </select>
            )}
          </div>
          <p>Age {resident.age} · Room {resident.room_no} · {resident.conditions}</p>
          <p className="baseline-info">
            Baseline: HR {resident.baseline_hr} bpm · SpO2 {resident.baseline_spo2}% · Temp {resident.baseline_temp}°F · BP {resident.baseline_bp_sys}/{resident.baseline_bp_dia}
          </p>
          <Link to={`/resident/${id}/profile`} className="profile-tab-link">View personal info & family →</Link>
        </div>
      </div>

      <div className="action-bar">
        {user.role === 'staff' && (
          <button className="btn-warning" onClick={triggerFall}>Simulate Fall Detected</button>
        )}
        <button className="btn-secondary" onClick={downloadSummary}>Download Health Summary PDF</button>
        {user.role === 'staff' && (
          <button className="btn-warning" onClick={deleteResident}>Delete Resident</button>
        )}
      </div>

      <div className="detail-grid">
        <div className="detail-col">
          <div className="card">
            <h4>Vitals Trend</h4>
            <VitalsChart vitals={vitals} />
          </div>
          {user.role === 'staff' && <VitalsForm residentId={id} onLogged={fetchData} />}
        </div>

        <div className="detail-col">
          <MedicineTracker residentId={id} />
          <div className="card">
            <h4>Weekly Adherence</h4>
            <AdherenceChart residentId={id} />
          </div>
        </div>
      </div>
    </div>
  );
}