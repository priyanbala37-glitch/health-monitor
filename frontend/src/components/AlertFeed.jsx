import { useEffect, useState } from 'react';
import { AlertTriangle, HeartPulse, Pill, Radio } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';

const TypeIcon = ({ type }) => {
  if (type === 'fall') return <AlertTriangle size={15} />;
  if (type === 'missed_medicine') return <Pill size={15} />;
  return <HeartPulse size={15} />;
};

export default function AlertFeed({ onAlertsChange }) {
  const [alerts, setAlerts] = useState([]);
  const socket = useSocket();

  useEffect(() => { fetchAlerts(); }, []);
  useEffect(() => { onAlertsChange?.(alerts.length); }, [alerts]);

  useEffect(() => {
    if (!socket) return;
    socket.on('new_alert', (alert) => {
      setAlerts((prev) => [alert, ...prev]);
    });
    return () => socket.off('new_alert');
  }, [socket]);

  const fetchAlerts = async () => {
    const res = await api.get('/alerts');
    setAlerts(res.data);
  };

  const resolveAlert = async (id) => {
    await api.patch(`/alerts/${id}/resolve`);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="alert-feed">
      <h3><Radio size={17} /> Live Alerts {alerts.length > 0 && <span className="alert-count">{alerts.length}</span>}</h3>

      {alerts.length === 0 && <p className="empty-state">No active alerts. All residents stable.</p>}
      {alerts.map((alert) => (
        <div key={alert.id} className={`alert-item severity-${alert.severity}`}>
          <div className="alert-header">
            <strong className="alert-strong"><TypeIcon type={alert.type} /> {alert.resident_name}</strong>
            <span className={`badge badge-${alert.severity}`}>{alert.severity}</span>
          </div>
          <p>{alert.message}</p>
          <div className="alert-footer">
            <small>{new Date(alert.created_at).toLocaleString()}</small>
            <button onClick={() => resolveAlert(alert.id)} className="btn-resolve">Resolve</button>
          </div>
        </div>
      ))}
    </div>
  );
}